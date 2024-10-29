/// The main schema for objects and inputs

import * as graphql from "graphql"
import * as tsMorph from "ts-morph"

import { AppContext } from "./context.js"
import { formatDTS } from "./formatDTS.js"
import { createSharedExternalSchemaFileViaStructure } from "./sharedSchemaStructures.js"
import { createSharedExternalSchemaFileViaTSC } from "./sharedSchemaTSC.js"
import { typeMapper } from "./typeMap.js"
import { makeStep } from "./utils.js"

export const createSharedSchemaFiles = async (context: AppContext, verbose: boolean) => {
	const step = makeStep(verbose)

	await step("Creating shared schema files", () => createSharedExternalSchemaFile(context))
	await step("Creating shared schema files via tsc", () => createSharedExternalSchemaFileViaTSC(context))
	await step("Creating shared schema files via structure", () => createSharedExternalSchemaFileViaStructure(context))

	await step("Creating shared return position schema files", () => createSharedReturnPositionSchemaFile(context))

	return [
		context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedFilename),
		context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedInternalFilename),
	]
}

function createSharedExternalSchemaFile(context: AppContext) {
	const gql = context.gql
	const types = gql.getTypeMap()
	const knownPrimitives = ["String", "Boolean", "Int"]

	const { prisma, fieldFacts } = context
	const mapper = typeMapper(context, {})

	const externalTSFile = context.tsProject.createSourceFile(`/source/${context.pathSettings.sharedFilename}`, "")

	const interfaces = [] as tsMorph.InterfaceDeclarationStructure[]
	const typeAliases = [] as tsMorph.TypeAliasDeclarationStructure[]

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

			interfaces.push({
				kind: tsMorph.StructureKind.Interface,
				name: type.name,
				isExported: true,
				docs: [],
				properties: [
					{
						name: "__typename",
						type: `"${type.name}"`,
						hasQuestionToken: true,
					},
					...Object.entries(type.getFields()).map(([fieldName, obj]: [string, graphql.GraphQLField<object, object>]) => {
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

						const field: tsMorph.OptionalKind<tsMorph.PropertySignatureStructure> = {
							name: fieldName,
							type: mapper.map(type, { preferNullOverUndefined: true }),
							docs,
							hasQuestionToken: hasResolverImplementation ?? (isOptionalInSDL || doesNotExistInPrisma),
						}
						return field
					}),
				],
			})
		}

		if (graphql.isEnumType(type)) {
			typeAliases.push({
				name: type.name,
				isExported: true,
				kind: tsMorph.StructureKind.TypeAlias,
				type:
					'"' +
					type
						.getValues()
						.map((m) => (m as { value: string }).value)
						.join('" | "') +
					'"',
			})
		}

		if (graphql.isUnionType(type)) {
			typeAliases.push({
				name: type.name,
				isExported: true,
				kind: tsMorph.StructureKind.TypeAlias,
				type: type
					.getTypes()
					.map((m) => m.name)
					.join(" | "),
			})
		}
	})

	context.tsProject.forgetNodesCreatedInBlock(() => {
		externalTSFile.addInterfaces(interfaces)
	})

	context.tsProject.forgetNodesCreatedInBlock(() => {
		externalTSFile.addTypeAliases(typeAliases)
	})

	const { scalars } = mapper.getReferencedGraphQLThingsInMapping()
	if (scalars.length) externalTSFile.addTypeAliases(scalars.map((s) => ({ name: s, type: "any" })))

	const fullPath = context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedFilename)
	const text = externalTSFile.getText()

	const prior = context.sys.readFile(fullPath)
	if (prior !== text) context.sys.writeFile(fullPath, text)
}

async function createSharedReturnPositionSchemaFile(context: AppContext) {
	const { gql, prisma, fieldFacts } = context
	const types = gql.getTypeMap()
	const mapper = typeMapper(context, { preferPrismaModels: true })

	const typesToImport = [] as string[]
	const knownPrimitives = ["String", "Boolean", "Int"]

	const externalTSFile = context.tsProject.createSourceFile(
		`/source/${context.pathSettings.sharedInternalFilename}`,
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

	const interfaces = [] as tsMorph.InterfaceDeclarationStructure[]
	const typeAliases = [] as tsMorph.TypeAliasDeclarationStructure[]

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

			interfaces.push({
				name: type.name,
				kind: tsMorph.StructureKind.Interface,
				isExported: true,
				docs: [],
				properties: [
					{
						name: "__typename",
						type: `"${type.name}"`,
						hasQuestionToken: true,
					},
					...Object.entries(type.getFields()).map(([fieldName, obj]: [string, graphql.GraphQLField<object, object>]) => {
						const hasResolverImplementation = fieldFacts.get(name)?.[fieldName]?.hasResolverImplementation
						const isOptionalInSDL = !graphql.isNonNullType(obj.type)
						const doesNotExistInPrisma = false // !prismaField;

						const field: tsMorph.OptionalKind<tsMorph.PropertySignatureStructure> = {
							name: fieldName,
							type: mapper.map(obj.type, { preferNullOverUndefined: true }),
							hasQuestionToken: hasResolverImplementation ?? (isOptionalInSDL || doesNotExistInPrisma),
						}
						return field
					}),
				],
			})
		}

		if (graphql.isEnumType(type)) {
			typeAliases.push({
				name: type.name,
				isExported: true,
				kind: tsMorph.StructureKind.TypeAlias,
				type:
					'"' +
					type
						.getValues()
						.map((m) => (m as { value: string }).value)
						.join('" | "') +
					'"',
			})
		}

		if (graphql.isUnionType(type)) {
			typeAliases.push({
				name: type.name,
				kind: tsMorph.StructureKind.TypeAlias,
				isExported: true,
				type: type
					.getTypes()
					.map((m) => m.name)
					.join(" | "),
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

		externalTSFile.addTypeAliases(
			allPrismaModels.map((p) => ({
				isExported: true,
				name: p,
				type: `P${p}`,
			}))
		)
	}

	externalTSFile.addInterfaces(interfaces)
	externalTSFile.addTypeAliases(typeAliases)

	const fullPath = context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedInternalFilename)
	const formatted = await formatDTS(fullPath, externalTSFile.getText())

	const prior = context.sys.readFile(fullPath)
	if (prior !== formatted) context.sys.writeFile(fullPath, formatted)
}
