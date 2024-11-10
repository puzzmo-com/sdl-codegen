/// The main schema for objects and inputs

import { BlockStatement } from "@babel/types"
import t from "@babel/types"
import * as graphql from "graphql"
import * as tsMorph from "ts-morph"

import { AppContext } from "./context.js"
import { formatDTS } from "./formatDTS.js"
import { builder } from "./tsBuilder.js"
import { typeMapper } from "./typeMap.js"
import { makeStep } from "./utils.js"

export const createSharedSchemaFiles = async (context: AppContext, verbose: boolean) => {
	const step = makeStep(verbose)
	await step("Creating shared schema files", () => createSharedExternalSchemaFile(context))
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

	const priorFile = ""
	const dts = builder(priorFile, {})

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

			dts.rootScope.addInterface(
				type.name,
				[
					{
						name: "__typename",
						type: `"${type.name}"`,
						optional: true,
					},
					...Object.entries(type.getFields()).map(([fieldName, obj]: [string, graphql.GraphQLField<object, object>]) => {
						const prismaField = pType?.properties.get(fieldName)
						const type = obj.type as graphql.GraphQLType

						// if (obj.description) docs.push(obj.description);
						const hasResolverImplementation = fieldFacts.get(name)?.[fieldName]?.hasResolverImplementation
						const isOptionalInSDL = !graphql.isNonNullType(type)
						const doesNotExistInPrisma = false // !prismaField;

						const field = {
							name: fieldName,
							type: mapper.map(type, { preferNullOverUndefined: true })!,
							docs: prismaField?.leadingComments.trim(),
							optional: hasResolverImplementation ?? (isOptionalInSDL || doesNotExistInPrisma),
						}
						return field
					}),
				],
				{ exported: true, docs: docs.join(" ") }
			)
		}

		if (graphql.isEnumType(type)) {
			const union =
				'"' +
				type
					.getValues()
					.map((m) => (m as { value: string }).value)
					.join('" | "') +
				'"'
			dts.rootScope.addTypeAlias(type.name, t.tsTypeReference(t.identifier(union)), { exported: true })
		}

		if (graphql.isUnionType(type)) {
			const union = type
				.getTypes()
				.map((m) => m.name)
				.join(" | ")
			dts.rootScope.addTypeAlias(type.name, t.tsTypeReference(t.identifier(union)), { exported: true })
		}
	})

	const { scalars } = mapper.getReferencedGraphQLThingsInMapping()
	for (const s of scalars) {
		dts.rootScope.addTypeAlias(s, t.tsAnyKeyword())
	}

	const text = dts.getResult()
	const fullPath = context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedFilename)
	const prior = context.sys.readFile(fullPath)
	if (prior !== text) context.sys.writeFile(fullPath, text)
}

async function createSharedReturnPositionSchemaFile(context: AppContext) {
	const { gql, prisma, fieldFacts } = context
	const types = gql.getTypeMap()
	const mapper = typeMapper(context, { preferPrismaModels: true })

	const typesToImport = [] as string[]
	const knownPrimitives = ["String", "Boolean", "Int"]

	const dts = builder("", {})

	dts.rootScope.addLeadingComment(`// You may very reasonably ask yourself, 'what is this file?' and why do I need it.

// Roughly, this file ensures that when a resolver wants to return a type - that
// type will match a prisma model. This is useful because you can trivially extend
// the type in the SDL and not have to worry about type mis-matches because the thing
// you returned does not include those functions.

// This gets particularly valuable when you want to return a union type, an interface, 
// or a model where the prisma model is nested pretty deeply (GraphQL connections, for example.)
`)

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

			dts.rootScope.addInterface(
				type.name,
				[
					{
						name: "__typename",
						type: `"${type.name}"`,
						optional: true,
					},
					...Object.entries(type.getFields()).map(([fieldName, obj]: [string, graphql.GraphQLField<object, object>]) => {
						const hasResolverImplementation = fieldFacts.get(name)?.[fieldName]?.hasResolverImplementation
						const isOptionalInSDL = !graphql.isNonNullType(obj.type)
						const doesNotExistInPrisma = false // !prismaField;

						const field = {
							name: fieldName,
							type: mapper.map(obj.type, { preferNullOverUndefined: true })!,
							optional: hasResolverImplementation ?? (isOptionalInSDL || doesNotExistInPrisma),
						}
						return field
					}),
				],
				{ exported: true }
			)
		}

		if (graphql.isEnumType(type)) {
			const union =
				'"' +
				type
					.getValues()
					.map((m) => (m as { value: string }).value)
					.join('" | "') +
				'"'
			dts.rootScope.addTypeAlias(type.name, t.tsTypeReference(t.identifier(union)), { exported: true })
		}

		if (graphql.isUnionType(type)) {
			const union = type
				.getTypes()
				.map((m) => m.name)
				.join(" | ")
			dts.rootScope.addTypeAlias(type.name, t.tsTypeReference(t.identifier(union)), { exported: true })
		}
	})

	const { scalars, prisma: prismaModels } = mapper.getReferencedGraphQLThingsInMapping()
	for (const s of scalars) {
		dts.rootScope.addTypeAlias(s, t.tsAnyKeyword())
	}

	const allPrismaModels = [...new Set([...prismaModels, ...typesToImport])].sort()
	if (allPrismaModels.length) {
		dts.setImport("@prisma/client", { subImports: allPrismaModels.map((p) => `${p} as P${p}`) })

		for (const p of allPrismaModels) {
			dts.rootScope.addTypeAlias(p, t.tsTypeReference(t.identifier(`P${p}`)))
		}
	}

	const text = dts.getResult()
	const fullPath = context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedInternalFilename)
	const prior = context.sys.readFile(fullPath)
	if (prior !== text) context.sys.writeFile(fullPath, text)
}
