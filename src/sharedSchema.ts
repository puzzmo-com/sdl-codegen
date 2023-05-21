/// The main schema for objects and inputs

import * as graphql from "graphql"
import * as tsMorph from "ts-morph"

import { AppContext } from "./context.js"
import { typeMapper } from "./typeMap.js"

export const createSharedSchemaFiles = (context: AppContext) => {
	createSharedExternalSchemaFile(context)
	createSharedReturnPositionSchemaFile(context)
}

function createSharedExternalSchemaFile(context: AppContext) {
	const gql = context.gql
	const types = gql.getTypeMap()
	const knownPrimitives = ["String", "Boolean", "Int"]

	const { prisma, fieldFacts } = context
	const mapper = typeMapper(context, {})

	const externalTSFile = context.tsProject.createSourceFile(`/source/${context.settings.sharedFilename}`, "")

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

			externalTSFile.addInterface({
				name: type.name,
				isExported: true,
				docs: [],
				properties: [
					{
						name: "__typename",
						type: `"${type.name}"`,
						hasQuestionToken: true,
					},
					...Object.entries(type.getFields()).map(([fieldName, obj]) => {
						const docs = []
						const prismaField = pType?.properties.get(fieldName)

						if (prismaField?.leadingComments.length) {
							docs.push(prismaField.leadingComments.trim())
						}

						// if (obj.description) docs.push(obj.description);
						const hasResolverImplementation = fieldFacts.get(name)?.[fieldName]?.hasResolverImplementation
						const isOptionalInSDL = !graphql.isNonNullType(obj.type)
						const doesNotExistInPrisma = false // !prismaField;

						const field: tsMorph.OptionalKind<tsMorph.PropertySignatureStructure> = {
							name: fieldName,
							type: mapper.map(obj.type, { preferNullOverUndefined: true }),
							docs,
							hasQuestionToken: hasResolverImplementation || isOptionalInSDL || doesNotExistInPrisma,
						}
						return field
					}),
				],
			})
		}

		if (graphql.isEnumType(type)) {
			externalTSFile.addTypeAlias({
				name: type.name,
				type:
					'"' +
					type
						.getValues()
						.map((m) => m.value)
						.join('" | "') +
					'"',
			})
		}
	})

	const { scalars } = mapper.getReferencedGraphQLThingsInMapping()
	if (scalars.length) {
		externalTSFile.addTypeAliases(
			scalars.map((s) => ({
				name: s,
				type: "any",
			}))
		)
	}

	externalTSFile.formatText({ indentSize: 2 })

	context.sys.writeFile(context.join(context.settings.typesFolderRoot, context.settings.sharedFilename), externalTSFile.getText())
}

function createSharedReturnPositionSchemaFile(context: AppContext) {
	const { gql, prisma, fieldFacts } = context
	const types = gql.getTypeMap()
	const mapper = typeMapper(context, { preferPrismaModels: true })

	const typesToImport = [] as string[]
	const knownPrimitives = ["String", "Boolean", "Int"]

	const externalTSFile = context.tsProject.createSourceFile(
		`/source/${context.settings.sharedInternalFilename}`,
		`
// You may very reasonably ask yourself, 'what is this file?' and why do I need it.

// Roughly, this file ensures that when a resolver wants to return a type - that
// type will match a prisma model. This is useful because you can trivially extend
// the type in the SDL and not have to worry about type mis-matches because the thing
// you returned does not include those functions.

// This gets particularly valuable when you want to return a union type, an interface, 
// or a model where the prisma model is nested pretty deeply (GraphQL connections, for example.)
`
	)

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

			externalTSFile.addInterface({
				name: type.name,
				isExported: true,
				docs: [],
				properties: [
					{
						name: "__typename",
						type: `"${type.name}"`,
						hasQuestionToken: true,
					},
					...Object.entries(type.getFields()).map(([fieldName, obj]) => {
						const hasResolverImplementation = fieldFacts.get(name)?.[fieldName]?.hasResolverImplementation
						const isOptionalInSDL = !graphql.isNonNullType(obj.type)
						const doesNotExistInPrisma = false // !prismaField;

						const field: tsMorph.OptionalKind<tsMorph.PropertySignatureStructure> = {
							name: fieldName,
							type: mapper.map(obj.type, { preferNullOverUndefined: true }),
							hasQuestionToken: hasResolverImplementation || isOptionalInSDL || doesNotExistInPrisma,
						}
						return field
					}),
				],
			})
		}

		if (graphql.isEnumType(type)) {
			externalTSFile.addTypeAlias({
				name: type.name,
				type:
					'"' +
					type
						.getValues()
						.map((m) => m.value)
						.join('" | "') +
					'"',
			})
		}
	})

	const { scalars, prisma: prismaModels } = mapper.getReferencedGraphQLThingsInMapping()
	if (scalars.length) {
		externalTSFile.addTypeAliases(
			scalars.map((s) => ({
				name: s,
				type: "any",
			}))
		)
	}

	const allPrismaModels = [...new Set([...prismaModels, ...typesToImport])].sort()
	if (allPrismaModels.length) {
		externalTSFile.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: `@prisma/client`,
			namedImports: allPrismaModels.map((p) => `${p} as P${p}`),
		})

		allPrismaModels.forEach((p) => {
			externalTSFile.addTypeAlias({
				isExported: true,
				name: p,
				type: `P${p}`,
			})
		})
	}

	externalTSFile.formatText({ indentSize: 2 })

	const filePath = context.join(context.settings.typesFolderRoot, context.settings.sharedInternalFilename)
	context.sys.writeFile(filePath, externalTSFile.getText())
}
