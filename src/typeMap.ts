import * as graphql from "graphql"

import { AppContext } from "./context.js"

export type TypeMapper = ReturnType<typeof typeMapper>

export const typeMapper = (context: AppContext, config: { preferPrismaModels?: true }) => {
	const referencedGraphQLTypes = new Set<string>()
	const referencedPrismaModels = new Set<string>()
	const customScalars = new Set<string>()

	const clear = () => {
		referencedGraphQLTypes.clear()
		customScalars.clear()
		referencedPrismaModels.clear()
	}

	const getReferencedGraphQLThingsInMapping = () => {
		return {
			types: [...referencedGraphQLTypes.keys()],
			scalars: [...customScalars.keys()],
			prisma: [...referencedPrismaModels.keys()],
		}
	}

	const map = (
		type: graphql.GraphQLType,
		mapConfig: {
			parentWasNotNull?: true
			preferNullOverUndefined?: true
			typenamePrefix?: string
		}
	): string | undefined => {
		const prefix = mapConfig.typenamePrefix ?? ""

		// The AST for GQL uses a parent node to indicate the !, we need the opposite
		// for TS which uses '| undefined' after.
		if (graphql.isNonNullType(type)) {
			return map(type.ofType, { parentWasNotNull: true, ...mapConfig })
		}

		// So we can add the | undefined
		const getInner = () => {
			if (graphql.isListType(type)) {
				const typeStr = map(type.ofType, mapConfig)!
				if (graphql.isNonNullType(type.ofType)) {
					return `${typeStr}[]`
				} else {
					return `Array<${typeStr}>`
				}
			}

			if (graphql.isScalarType(type)) {
				switch (type.toString()) {
					case "Int":
						return "number"
					case "Float":
						return "number"
					case "String":
						return "string"
					case "Boolean":
						return "boolean"
				}

				customScalars.add(type.name)
				return type.name
			}

			if (graphql.isObjectType(type)) {
				if (config.preferPrismaModels && context.prisma.has(type.name)) {
					referencedPrismaModels.add(type.name)
					return "P" + type.name
				} else {
					// GraphQL only type
					referencedGraphQLTypes.add(type.name)
					return prefix + type.name
				}
			}

			if (graphql.isInterfaceType(type)) {
				return prefix + type.name
			}

			if (graphql.isUnionType(type)) {
				const types = type.getTypes()
				return types.map((t) => map(t, mapConfig)).join(" | ")
			}

			if (graphql.isEnumType(type)) {
				return prefix + type.name
			}

			if (graphql.isInputObjectType(type)) {
				referencedGraphQLTypes.add(type.name)

				return prefix + type.name
			}

			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			throw new Error(`Unknown type ${type} - ${JSON.stringify(type, null, 2)}`)
		}

		const suffix = mapConfig.parentWasNotNull ? "" : mapConfig.preferNullOverUndefined ? "| null" : " | undefined"
		return getInner() + suffix
	}

	return { map, clear, getReferencedGraphQLThingsInMapping }
}
