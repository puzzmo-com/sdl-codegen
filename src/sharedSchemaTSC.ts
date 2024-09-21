/// The main schema for objects and inputs

import * as graphql from "graphql"
import ts from "typescript"

import { AppContext } from "./context.js"
import { typeMapper } from "./typeMap.js"

export function createSharedExternalSchemaFileViaTSC(context: AppContext) {
	const gql = context.gql
	const types = gql.getTypeMap()
	const knownPrimitives = ["String", "Boolean", "Int"]

	const { prisma, fieldFacts } = context
	const mapper = typeMapper(context, {})

	const statements = [] as ts.Statement[]

	console.time("")

	Object.keys(types).forEach((name) => {
		if (name.startsWith("__")) {
			return
		}

		if (knownPrimitives.includes(name)) {
			return
		}

		const type = types[name]
		const pType = prisma.get(name)

		if (graphql.isObjectType(type) || graphql.isInterfaceType(type) || graphql.isInputObjectType(type)) {
			// This is slower than it could be, use the add many at once api
			const docs = []
			if (pType?.leadingComments) {
				docs.push(pType.leadingComments)
			}

			if (type.description) {
				docs.push(type.description)
			}

			const properties = [
				ts.factory.createPropertySignature(
					undefined,
					"__typename",
					ts.factory.createToken(ts.SyntaxKind.QuestionToken),
					ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(type.name))
				),
			]

			Object.entries(type.getFields()).forEach(([fieldName, obj]: [string, graphql.GraphQLField<object, object>]) => {
				const docs = []
				const prismaField = pType?.properties.get(fieldName)
				const type = obj.type as graphql.GraphQLType

				if (prismaField?.leadingComments.length) {
					docs.push(prismaField.leadingComments.trim())
				}

				// if (obj.description) docs.push(obj.description);
				const hasResolverImplementation = fieldFacts.get(name)?.[fieldName]?.hasResolverImplementation
				const isOptionalInSDL = !graphql.isNonNullType(type)
				const doesNotExistInPrisma = false // !prismaField;

				const hasQuestionToken = hasResolverImplementation ?? (isOptionalInSDL || doesNotExistInPrisma)
				const mappedType = mapper.map(type, { preferNullOverUndefined: true })
				if (mappedType) {
					properties.push(
						ts.factory.createPropertySignature(
							undefined,
							fieldName,
							hasQuestionToken ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
							ts.factory.createTypeReferenceNode(mappedType)
						)
					)
				}
			})

			const interfaceD = ts.factory.createInterfaceDeclaration(
				[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
				ts.factory.createIdentifier(name),
				undefined,
				undefined,
				properties
			)

			statements.push(interfaceD)
		}

		if (graphql.isEnumType(type)) {
			const values = type.getValues().map((m) => (m as { value: string }).value)
			const typeKind = `"${values.join('" | "')}"`

			statements.push(ts.factory.createTypeAliasDeclaration(undefined, type.name, [], ts.factory.createTypeReferenceNode(typeKind)))
		}

		if (graphql.isUnionType(type)) {
			const types = type.getTypes().map((t) => t.name)
			const typeKind = types.join(" | ")
			statements.push(
				ts.factory.createTypeAliasDeclaration(
					[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
					type.name,
					[],
					ts.factory.createTypeReferenceNode(typeKind)
				)
			)
		}
	})

	const { scalars } = mapper.getReferencedGraphQLThingsInMapping()
	if (scalars.length) {
		statements.push(
			ts.factory.createTypeAliasDeclaration(
				[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
				"Scalars",
				[],
				ts.factory.createTypeReferenceNode(`{ ${scalars.join(", ")} }`)
			)
		)
	}

	const sourceFile = ts.factory.createSourceFile(statements, ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None)
	const printer = ts.createPrinter({})
	const result = printer.printNode(ts.EmitHint.Unspecified, sourceFile, sourceFile)

	const fullPath = context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedFilename)

	const prior = context.sys.readFile(fullPath)
	if (prior !== result) context.sys.writeFile(fullPath, result)
}

export async function createSharedReturnPositionSchemaFileViaTSC(context: AppContext) {
	const { gql, prisma, fieldFacts } = context
	const types = gql.getTypeMap()
	const mapper = typeMapper(context, { preferPrismaModels: true })

	const typesToImport = [] as string[]
	const knownPrimitives = ["String", "Boolean", "Int"]

	const statements = [] as ts.Statement[]

	// statements.push(
	// ts.factory.createJSDocComment(`
	// // // You may very reasonably ask yourself, 'what is this file?' and why do I need it.

	// // // Roughly, this file ensures that when a resolver wants to return a type - that
	// // // type will match a prisma model. This is useful because you can trivially extend
	// // // the type in the SDL and not have to worry about type mis-matches because the thing
	// // // you returned does not include those functions.

	// // // This gets particularly valuable when you want to return a union type, an interface,
	// // // or a model where the prisma model is nested pretty deeply (GraphQL connections, for example.)

	// // `)
	// )

	Object.keys(types).forEach((name) => {
		if (name.startsWith("__")) {
			return
		}

		if (knownPrimitives.includes(name)) {
			return
		}

		const type = types[name]
		const pType = prisma.get(name)

		if (graphql.isObjectType(type) || graphql.isInterfaceType(type) || graphql.isInputObjectType(type)) {
			// Return straight away if we have a matching type in the prisma schema
			// as we dont need it
			if (pType) {
				typesToImport.push(name)
				return
			}

			const properties = [
				ts.factory.createPropertySignature(
					undefined,
					"__typename",
					ts.factory.createToken(ts.SyntaxKind.QuestionToken),
					ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(type.name))
				),
			]

			Object.entries(type.getFields()).forEach(([fieldName, obj]: [string, graphql.GraphQLField<object, object>]) => {
				const hasResolverImplementation = fieldFacts.get(name)?.[fieldName]?.hasResolverImplementation
				const isOptionalInSDL = !graphql.isNonNullType(obj.type)
				const doesNotExistInPrisma = false // !prismaField;
				const hasQuestionToken = hasResolverImplementation ?? (isOptionalInSDL || doesNotExistInPrisma)

				const mappedType = mapper.map(type, { preferNullOverUndefined: true })
				if (mappedType) {
					properties.push(
						ts.factory.createPropertySignature(
							undefined,
							fieldName,
							hasQuestionToken ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
							ts.factory.createTypeReferenceNode(mappedType)
						)
					)
				}
			})

			const interfaceD = ts.factory.createInterfaceDeclaration(
				[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
				ts.factory.createIdentifier(name),
				undefined,
				undefined,
				properties
			)

			statements.push(interfaceD)
		}

		if (graphql.isEnumType(type)) {
			const values = type.getValues().map((m) => (m as { value: string }).value)
			const typeKind = `"${values.join('" | "')}"`

			statements.push(ts.factory.createTypeAliasDeclaration(undefined, type.name, [], ts.factory.createTypeReferenceNode(typeKind)))
		}

		if (graphql.isUnionType(type)) {
			const types = type.getTypes().map((t) => t.name)
			const typeKind = types.join(" | ")
			statements.push(
				ts.factory.createTypeAliasDeclaration(
					[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
					type.name,
					[],
					ts.factory.createTypeReferenceNode(typeKind)
				)
			)
		}
	})

	const { scalars, prisma: prismaModels } = mapper.getReferencedGraphQLThingsInMapping()
	if (scalars.length) {
		statements.push(
			ts.factory.createTypeAliasDeclaration(
				[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
				"Scalars",
				[],
				ts.factory.createTypeReferenceNode(`{ ${scalars.join(", ")} }`)
			)
		)
	}

	const allPrismaModels = [...new Set([...prismaModels, ...typesToImport])].sort()
	if (allPrismaModels.length) {
		statements.push(
			ts.factory.createImportDeclaration(
				undefined,
				ts.factory.createImportClause(
					false,
					undefined,
					ts.factory.createNamedImports(
						allPrismaModels.map((p) =>
							ts.factory.createImportSpecifier(true, ts.factory.createIdentifier(p), ts.factory.createIdentifier(`P${p}`))
						)
					)
				),
				ts.factory.createStringLiteral(`@prisma/client`)
			)
		)

		statements.push(
			ts.factory.createTypeAliasDeclaration(
				[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
				"PrismaModels",
				[],
				ts.factory.createTypeReferenceNode(allPrismaModels.map((p) => `P${p}`).join(" | "))
			)
		)

		for (const pModels of allPrismaModels) {
			statements.push(
				ts.factory.createTypeAliasDeclaration(
					[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
					`P${pModels}`,
					[],
					ts.factory.createTypeReferenceNode(pModels)
				)
			)
		}
	}

	const sourceFile = ts.factory.createSourceFile(statements, ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None)
	const printer = ts.createPrinter({})
	const result = printer.printNode(ts.EmitHint.Unspecified, sourceFile, sourceFile)

	const fullPath = context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedInternalFilename)

	const prior = context.sys.readFile(fullPath)
	if (prior !== result) context.sys.writeFile(fullPath, result)
}
