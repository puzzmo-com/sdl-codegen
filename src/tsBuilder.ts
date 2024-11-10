// @eslint-disable-file

import generator from "@babel/generator"
import parser from "@babel/parser"
import traverse from "@babel/traverse"
import t, { BlockStatement, ExpressionStatement, Node, Statement, TSType, TSTypeAliasDeclaration, TypeAlias } from "@babel/types"

export const builder = (priorSource: string, opts: {}) => {
	const sourceFile = parser.parse(priorSource, { sourceType: "module", plugins: ["jsx", "typescript"] })

	const setImport = (source: string, opts: { mainImport?: string; subImports?: string[] }) => {
		const imports = sourceFile.program.body.filter((s) => s.type === "ImportDeclaration")

		const existing = imports.find((i) => i.source.value === source)
		if (!existing) {
			const imports = [] as (t.ImportSpecifier | t.ImportDefaultSpecifier)[]
			if (opts.mainImport) {
				imports.push(t.importDefaultSpecifier(t.identifier(opts.mainImport)))
			}

			if (opts.subImports) {
				imports.push(...opts.subImports.map((si) => t.importSpecifier(t.identifier(si), t.identifier(si))))
			}

			const importDeclaration = t.importDeclaration(imports, t.stringLiteral(source))
			sourceFile.program.body.push(importDeclaration)
			return
		}

		if (!existing.specifiers.find((f) => f.type === "ImportDefaultSpecifier") && opts.mainImport) {
			existing.specifiers.push(t.importDefaultSpecifier(t.identifier(opts.mainImport)))
		}

		if (opts.subImports) {
			const existingImports = existing.specifiers.map((e) => e.local.name)
			const newImports = opts.subImports.filter((si) => !existingImports.includes(si))

			if (newImports.length) {
				existing.specifiers.push(...newImports.map((si) => t.importSpecifier(t.identifier(si), t.identifier(si))))
			}
		}
	}

	const setTypeViaTemplate = (template: string) => {
		const type = parser.parse(template, { sourceType: "module", plugins: ["jsx", "typescript"] })

		const typeDeclaration = type.program.body.find((s) => s.type === "TSTypeAliasDeclaration")
		if (!typeDeclaration) throw new Error("No type declaration found in template: " + template)

		const oldTypeDeclaration = sourceFile.program.body.find(
			(s) => s.type === "TSTypeAliasDeclaration" && s.id.name === typeDeclaration.id.name
		)
		if (!oldTypeDeclaration) {
			sourceFile.program.body.push(typeDeclaration)
			return
		}

		if (!t.isTSTypeAliasDeclaration(oldTypeDeclaration)) throw new Error("Expected TSTypeAliasDeclaration")

		const newAnnotion = typeDeclaration.typeAnnotation

		// is literal primitive
		if (newAnnotion.type.endsWith("LiteralTypeAnnotation")) {
			oldTypeDeclaration.typeAnnotation = newAnnotion
			return
		}

		if (t.isTSTypeLiteral(newAnnotion) && t.isTSTypeLiteral(oldTypeDeclaration.typeAnnotation)) {
			for (const field of newAnnotion.members) {
				const matchingOnOld = oldTypeDeclaration.typeAnnotation.members.find((mm) => {
					if (!t.isTSPropertySignature(mm) || !t.isTSPropertySignature(field)) return false
					if (!t.isIdentifier(mm.key) || !t.isIdentifier(field.key)) return false
					return mm.key.name === field.key.name
				})

				if (matchingOnOld) {
					matchingOnOld.typeAnnotation = field.typeAnnotation
				} else {
					oldTypeDeclaration.typeAnnotation.members.push(field)
				}
			}

			return
		}

		throw new Error(`Unsupported type annotation: ${newAnnotion.type} - ${generator(newAnnotion).code}`)
	}

	const createScope = (name: string, statements: Statement[]) => {
		const addFunction = (name: string) => {
			let functionNode = statements.find(
				(s) => t.isVariableDeclaration(s) && t.isIdentifier(s.declarations[0].id) && s.declarations[0].id.name === name
			)

			if (!functionNode) {
				functionNode = t.variableDeclaration("const", [
					t.variableDeclarator(t.identifier(name), t.arrowFunctionExpression([], t.blockStatement([]))),
				])
				statements.push(functionNode)
			}

			const arrowFn = functionNode.declarations[0].init as t.ArrowFunctionExpression
			if (!t.isArrowFunctionExpression(arrowFn)) throw new Error("Expected ArrowFunctionExpression")

			return {
				node: arrowFn,
				addParam: (name: string, type: string) => {
					const param = t.identifier(name)

					const fromParse = getTypeLevelAST(type)
					param.typeAnnotation = t.tsTypeAnnotation(fromParse)

					const exists = arrowFn.params.find((p) => p.type === "Identifier" && p.name === name)
					if (!exists) arrowFn.params.push(param)
					else exists.typeAnnotation = param.typeAnnotation
				},

				scope: createScope(name, (arrowFn.body as BlockStatement).body),
			}
		}

		const addVariableDeclaration = (name: string, add: (prior: t.Expression | undefined) => t.Expression) => {
			const prior = statements.find(
				(b) => t.isVariableDeclaration(b) && t.isIdentifier(b.declarations[0].id) && b.declarations[0].id.name === name
			)

			if (prior && t.isVariableDeclaration(prior) && t.isVariableDeclarator(prior.declarations[0]) && prior.declarations[0].init) {
				prior.declarations[0].init = add(prior.declarations[0].init)
				return
			}

			const declaration = t.variableDeclaration("const", [t.variableDeclarator(t.identifier(name), add(undefined))])
			statements.push(declaration)
		}

		const addTypeAlias = (name: string, type: TSType, exported?: boolean) => {
			const prior = statements.find(
				(s) =>
					(t.isTSTypeAliasDeclaration(s) && s.id.name === name) ||
					(t.isExportNamedDeclaration(s) && t.isTSTypeAliasDeclaration(s.declaration) && s.declaration.id.name === name)
			)
			if (prior) return

			const alias = t.tsTypeAliasDeclaration(t.identifier(name), null, type)
			statements.push(exported ? t.exportNamedDeclaration(alias) : alias)
		}

		const addInterface = (name: string, fields: { docs?: string; name: string; optional: boolean; type: string }[], exported?: boolean) => {
			const prior = statements.find(
				(s) =>
					(t.isTSInterfaceDeclaration(s) && s.id.name === name) ||
					(t.isExportNamedDeclaration(s) && t.isTSInterfaceDeclaration(s.declaration) && s.declaration.id.name === name)
			)

			if (prior) return

			const body = t.tsInterfaceBody(
				fields.map((f) => {
					const prop = t.tsPropertySignature(t.identifier(f.name), t.tsTypeAnnotation(t.tsTypeReference(t.identifier(f.type))))
					prop.optional = f.optional
					return prop
				})
			)

			const alias = t.tsInterfaceDeclaration(t.identifier(name), null, null, body)
			statements.push(exported ? t.exportNamedDeclaration(alias) : alias)
		}

		return {
			addFunction,
			addVariableDeclaration,
			addTypeAlias,
			addInterface,
		}
	}

	const updateGraphQLTemplateTag = (expression: t.Expression, path: string, modelFields: string[]) => {
		if (path !== ".") throw new Error("Only support updating the root of the graphql tag ATM")
		traverse(
			expression,
			{
				TaggedTemplateExpression(path) {
					const { tag, quasi } = path.node
					if (t.isIdentifier(tag) && tag.name === "graphql") {
						// This is the graphql query
						const query = quasi.quasis[0].value.raw
						const inner = query.match(/\{(.*)\}/)?.[1]

						path.replaceWithSourceString(`graphql\`${query.replace(inner, `${inner}, ${modelFields.join(", ")}`)}\``)
						path.stop()
					}
				},
			},
			// Uh oh, not really sure what a Scope object does here
			{} as any
		)
		return expression
	}

	const parseStatement = (code: string) =>
		parser.parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] }).program.body[0] as ExpressionStatement

	const getResult = () => {
		return generator(sourceFile.program, {}).code
	}

	const rootScope = createScope("root", sourceFile.program.body)
	return { setImport, getResult, setTypeViaTemplate, parseStatement, updateGraphQLTemplateTag, rootScope }
}

/** Parses something as though it is in type-space and extracts the subset of the AST that the string represents  */
const getTypeLevelAST = (type: string) => {
	const typeAST = parser.parse(`type A = ${type}`, { sourceType: "module", plugins: ["jsx", "typescript"] })
	const typeDeclaration = typeAST.program.body.find((s) => s.type === "TSTypeAliasDeclaration")
	if (!typeDeclaration) throw new Error("No type declaration found in template: " + type)
	return typeDeclaration.typeAnnotation
}
