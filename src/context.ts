import * as graphql from "graphql"
import * as tsMorph from "ts-morph"
import { System } from "typescript"

import { PrismaMap } from "./prismaModeller.js"
import { FieldFacts, ServiceFacts } from "./typeFacts.js"

export interface AppContext {
	basename: (path: string) => string
	serviceFacts: Map<string, ServiceFacts>
	fieldFacts: Map<string, FieldFacts>
	gql: graphql.GraphQLSchema
	join: (...paths: string[]) => string
	prisma: PrismaMap
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
