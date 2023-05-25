import * as graphql from "graphql"
import * as tsMorph from "ts-morph"
import { FormatCodeSettings, System } from "typescript"

import { PrismaMap } from "./prismaModeller.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"

export interface AppContext {
	/** POSIX-y fn not built into System */
	basename: (path: string) => string
	/** "service" should be code here */
	codeFacts: Map<string, CodeFacts>
	/** A global set of facts about resolvers focused from the GQL side  */
	fieldFacts: Map<string, FieldFacts>
	/** When we emit .d.ts files, it runs the ts formatter over the file first - you can override the default settings  */
	formatCodeSettings?: FormatCodeSettings
	/** So you can override the formatter */
	gql: graphql.GraphQLSchema
	/** POSXIY- fn not built into System */
	join: (...paths: string[]) => string
	/** Where to find particular files */
	pathSettings: {
		apiServicesPath: string
		graphQLSchemaPath: string
		prismaDSLPath: string
		root: string
		sharedFilename: string
		sharedInternalFilename: string
		typesFolderRoot: string
	}

	/** A map of prisma models */
	prisma: PrismaMap
	/** An implementation of the TypeScript system, this can be grabbed pretty
	 * easily from the typescript import, or you can use your own like tsvfs in browsers.
	 */
	sys: System
	/** ts-morph is used to abstract over the typescript compiler API, this project file
	 * is a slightly augmented version of the typescript Project api.
	 */
	tsProject: tsMorph.Project
}
