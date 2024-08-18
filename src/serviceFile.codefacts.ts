import * as tsMorph from "ts-morph"

import { AppContext } from "./context.js"
import { CodeFacts, ModelResolverFacts, ResolverFuncFact } from "./typeFacts.js"
import { varStartsWithUppercase } from "./utils.js"

export const getCodeFactsForJSTSFileAtPath = (file: string, context: AppContext) => {
	const { pathSettings: settings } = context
	const fileKey = file.replace(settings.apiServicesPath, "")

	// const priorFacts = serviceInfo.get(fileKey)
	const fileFact: CodeFacts = {}

	const fileContents = context.sys.readFile(file)
	const referenceFileSourceFile = context.tsProject.createSourceFile(`/source/${fileKey}`, fileContents, { overwrite: true })
	const vars = referenceFileSourceFile.getVariableDeclarations().filter((v) => v.isExported())

	const resolverContainers = vars.filter(varStartsWithUppercase)

	const queryOrMutationResolvers = vars.filter((v) => !varStartsWithUppercase(v))
	queryOrMutationResolvers.forEach((v) => {
		const parent = "maybe_query_mutation"
		const facts = getResolverInformationForDeclaration(v.getInitializer())

		// Start making facts about the services
		const fact: ModelResolverFacts = fileFact[parent] ?? {
			typeName: parent,
			resolvers: new Map(),
			hasGenericArg: false,
		}
		fact.resolvers.set(v.getName(), { name: v.getName(), ...facts })
		fileFact[parent] = fact
	})

	// Next all the capital consts
	resolverContainers.forEach((c) => {
		addCustomTypeResolvers(c)
	})

	return fileFact

	function addCustomTypeResolvers(variableDeclaration: tsMorph.VariableDeclaration) {
		const declarations = variableDeclaration.getVariableStatementOrThrow().getDeclarations()

		declarations.forEach((d) => {
			const name = d.getName()
			// only do it if the first letter is a capital
			if (!name.match(/^[A-Z]/)) return

			const type = d.getType()
			const hasGenericArg = type.getText().includes("<")

			// Start making facts about the services
			const fact: ModelResolverFacts = fileFact[name] ?? {
				typeName: name,
				resolvers: new Map(),
				hasGenericArg,
			}

			// Grab the const Thing = { ... }
			const obj = d.getFirstDescendantByKind(tsMorph.SyntaxKind.ObjectLiteralExpression)
			if (!obj) {
				throw new Error(`Could not find an object literal ( e.g. a { } ) in ${d.getName()}`)
			}

			obj.getProperties().forEach((p) => {
				if (p.isKind(tsMorph.SyntaxKind.SpreadAssignment)) {
					return
				}

				if (p.isKind(tsMorph.SyntaxKind.PropertyAssignment) && p.hasInitializer()) {
					const name = p.getName()
					fact.resolvers.set(name, { name, ...getResolverInformationForDeclaration(p.getInitializerOrThrow()) })
				}

				if (p.isKind(tsMorph.SyntaxKind.FunctionDeclaration) && p.getName()) {
					const name = p.getName()
					// @ts-expect-error - lets let this go for now
					fact.resolvers.set(name, { name, ...getResolverInformationForDeclaration(p) })
				}
			})

			fileFact[d.getName()] = fact
		})
	}
}

const getResolverInformationForDeclaration = (initialiser: tsMorph.Expression | undefined): Omit<ResolverFuncFact, "name"> => {
	// Who knows what folks could do, lets not crash
	if (!initialiser) {
		return {
			funcArgCount: 0,
			isFunc: false,
			isAsync: false,
			isUnknown: true,
			isObjLiteral: false,
		}
	}

	// resolver is a fn
	if (initialiser.isKind(tsMorph.SyntaxKind.ArrowFunction) || initialiser.isKind(tsMorph.SyntaxKind.FunctionExpression)) {
		// Look to see if the 2nd param is just `{ root }` - which is a super common pattern in the Puzzmo codebase
		const params = initialiser.getParameters()
		let infoParamType: "all" | "just_root_destructured" = "all"

		if (params[1]?.getNameNode().isKind(tsMorph.SyntaxKind.ObjectBindingPattern)) {
			const extractsInParams = params[1].getNameNode().getChildrenOfKind(tsMorph.SyntaxKind.BindingElement)
			const extracted = extractsInParams.map((e) => e.getName())
			if (extracted.length === 1 && extracted[0] === "root") {
				infoParamType = "just_root_destructured"
			}
		}

		let isObjLiteral = false
		if (initialiser.isKind(tsMorph.SyntaxKind.ArrowFunction)) {
			const isSingleLiner = initialiser.getStatements().length === 0
			if (isSingleLiner) isObjLiteral = isLiteral(initialiser.getBody())
		}

		return {
			funcArgCount: params.length,
			isFunc: true,
			isAsync: initialiser.isAsync(),
			isUnknown: false,
			isObjLiteral,
			infoParamType,
		}
	}

	// resolver is a raw obj
	if (isLiteral(initialiser)) {
		return {
			funcArgCount: 0,
			isFunc: false,
			isAsync: false,
			isUnknown: false,
			isObjLiteral: true,
		}
	}

	// who knows
	return {
		funcArgCount: 0,
		isFunc: false,
		isAsync: false,
		isUnknown: true,
		isObjLiteral: false,
	}
}

const isLiteral = (node: tsMorph.Node) =>
	node.isKind(tsMorph.SyntaxKind.ObjectLiteralExpression) ||
	node.isKind(tsMorph.SyntaxKind.StringLiteral) ||
	node.isKind(tsMorph.SyntaxKind.TemplateExpression) ||
	node.isKind(tsMorph.SyntaxKind.NumericLiteral) ||
	node.isKind(tsMorph.SyntaxKind.TrueKeyword) ||
	node.isKind(tsMorph.SyntaxKind.FalseKeyword) ||
	node.isKind(tsMorph.SyntaxKind.NullKeyword) ||
	node.isKind(tsMorph.SyntaxKind.UndefinedKeyword)
