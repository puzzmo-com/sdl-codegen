import * as graphql from "graphql"
import * as tsMorph from "ts-morph"
import { FormatCodeSettings, System } from "typescript"

import { PrismaMap } from "./prismaModeller.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"

export interface AppContext {
	/** POSIX fn for the runtime */
	basename: (path: string) => string
	/** A global set of facts about resolvers focused from the GQL side  */
	fieldFacts: Map<string, FieldFacts>
	/** So you can override the formatter */
	formatting?: FormatCodeSettings
	gql: graphql.GraphQLSchema
	/** POSIX fn for the runtime */
	join: (...paths: string[]) => string
	prisma: PrismaMap
	/** "service" should be code here */
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
