import * as graphql from "graphql"
import * as tsMorph from "ts-morph"
import { FormatCodeSettings, System } from "typescript"

import { PrismaMap } from "./prismaModeller.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"

export interface AppContext {
	basename: (path: string) => string
	/** POSIX fn for the runtime */
	fieldFacts: Map<string, FieldFacts>
	/** So you can override the formatter */
	formatting?: FormatCodeSettings
	gql: graphql.GraphQLSchema
	/** POXIS fn for the runtime */
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
