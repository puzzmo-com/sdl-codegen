import { getSchema as getPrismaSchema } from "@mrleebo/prisma-ast"
import * as graphql from "graphql"
import { Project } from "ts-morph"
import { sys } from "typescript"

import { AppContext } from "./context.js"
import { PrismaMap, prismaModeller } from "./prismaModeller.js"
import { lookAtServiceFile } from "./serviceFile.js"
import { createSharedSchemaFiles } from "./sharedSchema.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"
import { RedwoodPaths } from "./types.js"

export * from "./main.js"
export * from "./types.js"

import { basename, join } from "path"

/** The API specifically for Redwood */
export function runFullCodegen(preset: "redwood", config: { paths: RedwoodPaths }): { paths: string[] }

export function runFullCodegen(preset: string, config: unknown): { paths: string[] }

export function runFullCodegen(preset: string, config: unknown): { paths: string[] } {
	if (preset !== "redwood") throw new Error("Only Redwood codegen is supported at this time")
	const paths = (config as { paths: RedwoodPaths }).paths

	const pathSettings: AppContext["pathSettings"] = {
		root: paths.base,
		apiServicesPath: paths.api.services,
		prismaDSLPath: paths.api.dbSchema,
		graphQLSchemaPath: paths.generated.schema,
		sharedFilename: "shared-schema-types.d.ts",
		sharedInternalFilename: "shared-return-types.d.ts",
		typesFolderRoot: paths.api.types,
	}

	const project = new Project({ useInMemoryFileSystem: true })

	let gqlSchema: graphql.GraphQLSchema | undefined
	const getGraphQLSDLFromFile = (settings: AppContext["pathSettings"]) => {
		const schema = sys.readFile(settings.graphQLSchemaPath)
		if (!schema) throw new Error("No schema found at " + settings.graphQLSchemaPath)
		gqlSchema = graphql.buildSchema(schema)
	}

	let prismaSchema: PrismaMap = new Map()
	const getPrismaSchemaFromFile = (settings: AppContext["pathSettings"]) => {
		const prismaSchemaText = sys.readFile(settings.prismaDSLPath)
		if (!prismaSchemaText) throw new Error("No prisma file found at " + settings.prismaDSLPath)
		const prismaSchemaBlocks = getPrismaSchema(prismaSchemaText)
		prismaSchema = prismaModeller(prismaSchemaBlocks)
	}

	getGraphQLSDLFromFile(pathSettings)
	getPrismaSchemaFromFile(pathSettings)

	if (!gqlSchema) throw new Error("No GraphQL Schema was created during setup")

	const appContext: AppContext = {
		gql: gqlSchema,
		prisma: prismaSchema,
		tsProject: project,
		codeFacts: new Map<string, CodeFacts>(),
		fieldFacts: new Map<string, FieldFacts>(),
		pathSettings,
		sys,
		join,
		basename,
	}

	// TODO: Maybe Redwood has an API for this? Its grabbing all the services
	const serviceFilesToLookAt = [] as string[]
	for (const dirEntry of sys.readDirectory(appContext.pathSettings.apiServicesPath)) {
		// These are generally the folders
		if (sys.directoryExists(dirEntry)) {
			const folderPath = join(appContext.pathSettings.apiServicesPath, dirEntry)
			// And these are the files in them
			for (const subdirEntry of sys.readDirectory(folderPath)) {
				const folderPath = join(appContext.pathSettings.apiServicesPath, dirEntry)
				if (
					sys.fileExists(folderPath) &&
					subdirEntry.endsWith(".ts") &&
					!subdirEntry.includes(".test.ts") &&
					!subdirEntry.includes("scenarios.ts")
				) {
					serviceFilesToLookAt.push(join(folderPath, subdirEntry))
				}
			}
		}
	}

	const filepaths = [] as string[]

	// Create the two shared schema files
	const sharedDTSes = createSharedSchemaFiles(appContext)
	filepaths.push(...sharedDTSes)

	// This needs to go first, as it sets up fieldFacts
	for (const path of serviceFilesToLookAt) {
		const dts = lookAtServiceFile(path, appContext)
		filepaths.push(dts)
	}

	return {
		paths: filepaths,
	}
}
