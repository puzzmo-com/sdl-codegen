import * as graphql from "graphql"
import * as tsMorph from "ts-morph"
import { System } from "typescript"

import { PrismaMap } from "./prismaModeller.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"

export interface AppContext {
	/** POSIX-y fn not built into System */
	basename: (path: string) => string
	/** Per GraphQL types */
	fieldFacts: Map<string, FieldFacts>
	/** An in-memory version of the main GraphQL instance */
	gql: graphql.GraphQLSchema
	/** POSXIY- fn not built into System */
	join: (...paths: string[]) => string
	prisma: PrismaMap
	serviceFacts: Map<string, CodeFacts>
	settings: {
		apiServicesPath: string
		graphQLSchemaPath: string
		prismaDSLPath: string
		root: string
		sharedFilename: string
		sharedInternalFilename: string
		typesFolderRoot: string
	}
	sys: System

	tsProject: tsMorph.Project
}
