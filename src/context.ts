import * as graphql from "graphql"
import * as tsMorph from "ts-morph"
import { System } from "typescript"

import { PrismaMap } from "./prismaModeller.js"
import { CodeFacts,FieldFacts } from "./typeFacts.js"

export interface AppContext {
	basename: (path: string) => string
	fieldFacts: Map<string, FieldFacts>,
	gql: graphql.GraphQLSchema,
	join: (...paths: string[]) => string,
	prisma: PrismaMap,
	serviceFacts: Map<string, CodeFacts>,
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
