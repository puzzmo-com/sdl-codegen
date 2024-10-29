/// The main schema for objects and inputs

import * as graphql from "graphql"
import * as tsMorph from "ts-morph"

import { AppContext } from "./context.js"
import { typeMapper } from "./typeMap.js"

export function createSharedExternalSchemaFileViaStructure(context: AppContext) {
	const { gql, prisma, fieldFacts } = context
	const types = gql.getTypeMap()
	const mapper = typeMapper(context, { preferPrismaModels: true })

	const typesToImport = [] as string[]
	const knownPrimitives = ["String", "Boolean", "Int"]

	const externalTSFile = context.tsProject.createSourceFile(
		`/source/a/${context.pathSettings.sharedInternalFilename}`,
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

	const statements = [] as tsMorph.StatementStructures[]

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

			statements.push({
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
			statements.push({
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
			statements.push({
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
		statements.push(
			...scalars.map(
				(s) =>
					({
						kind: tsMorph.StructureKind.TypeAlias,
						name: s,
						type: "any",
					} as const)
			)
		)
	}

	const allPrismaModels = [...new Set([...prismaModels, ...typesToImport])].sort()
	if (allPrismaModels.length) {
		statements.push({
			kind: tsMorph.StructureKind.ImportDeclaration,
			moduleSpecifier: `@prisma/client`,
			namedImports: allPrismaModels.map((p) => `${p} as P${p}`),
		})

		statements.push(
			...allPrismaModels.map(
				(p) =>
					({
						kind: tsMorph.StructureKind.TypeAlias,
						name: p,
						type: `P${p}`,
					} as const)
			)
		)
	}

	const fullPath = context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedInternalFilename)
	externalTSFile.set({ statements })
	const text = externalTSFile.getText()

	// console.log(sourceFileStructure.statements)
	// console.log(text)
	// const formatted = await formatDTS(fullPath, externalTSFile)

	const prior = context.sys.readFile(fullPath)
	if (prior !== text) context.sys.writeFile(fullPath, text)
}
