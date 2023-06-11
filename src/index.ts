import { getSchema as getPrismaSchema } from "@mrleebo/prisma-ast"
import * as graphql from "graphql"
import { Project } from "ts-morph"
import typescript from "typescript"

import { AppContext } from "./context.js"
import { PrismaMap, prismaModeller } from "./prismaModeller.js"
import { lookAtServiceFile } from "./serviceFile.js"
import { createSharedSchemaFiles } from "./sharedSchema.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"
import { RedwoodPaths } from "./types.js"

export * from "./main.js"
export * from "./types.js"

import { basename, join } from "node:path"

/** The API specifically for Redwood */
export function runFullCodegen(preset: "redwood", config: { paths: RedwoodPaths }): { paths: string[] }
export function runFullCodegen(preset: string, config: unknown): { paths: string[] }
export function runFullCodegen(preset: string, config: unknown): { paths: string[] } {
	if (preset !== "redwood") throw new Error("Only Redwood codegen is supported at this time")

	const appContext = getAppContext(config as { paths: RedwoodPaths })
	const filepaths = [] as string[]

	// TODO: Maybe Redwood has an API for this? Its grabbing all the services?
	const serviceFiles = appContext.sys.readDirectory(appContext.pathSettings.apiServicesPath)
	const serviceFilesToLookAt = serviceFiles.filter(removeNoneServiceFiles)

	// Create the two shared schema files
	const sharedDTSes = createSharedSchemaFiles(appContext)
	filepaths.push(...sharedDTSes)

	for (const path of serviceFilesToLookAt) {
		const dts = lookAtServiceFile(path, appContext)
		if (dts) filepaths.push(dts)
	}

	return {
		paths: filepaths,
	}
}

/**
 * Might want more ways to hint to the codegen about what needs to happen, so making this an
 * object early to allow for expansion.
 */
interface PartialConfig {
	changedFile: string
}

/** This version of the codegen is for watch modes! */

export function runPartialCodegen(partialConfig: PartialConfig, preset: "redwood", config: { paths: RedwoodPaths }): { paths: string[] }
export function runPartialCodegen(partialConfig: PartialConfig, preset: string, config: unknown): { paths: string[] }
export function runPartialCodegen(partialConfig: PartialConfig, preset: string, config: unknown): { paths: string[] } {
	if (preset !== "redwood") throw new Error("Only Redwood codegen is supported at this time")

	const filepaths = [] as string[]
	const appContext = getAppContext(config as { paths: RedwoodPaths })

	const isServiceFile = partialConfig.changedFile.startsWith(appContext.pathSettings.apiServicesPath)
	const isSDLFile = partialConfig.changedFile.includes(".sdl.")

	const needsFullRun = isSDLFile
	if (isServiceFile) {
		const dts = lookAtServiceFile(partialConfig.changedFile, appContext)
		if (dts) filepaths.push(dts)
	} else if (needsFullRun) {
		// Create the two shared schema files
		const sharedDTSes = createSharedSchemaFiles(appContext)
		filepaths.push(...sharedDTSes)

		// Add the schemas
		const serviceFiles = appContext.sys.readDirectory(appContext.pathSettings.apiServicesPath)
		const serviceFilesToLookAt = serviceFiles.filter(removeNoneServiceFiles)

		// This needs to go first, as it sets up fieldFacts
		for (const path of serviceFilesToLookAt) {
			const dts = lookAtServiceFile(path, appContext)
			if (dts) filepaths.push(dts)
		}
	}

	return { paths: [] }
}

function getAppContext(config: { paths: RedwoodPaths }): AppContext {
	const paths = (config as { paths: RedwoodPaths }).paths
	const sys = typescript.sys

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

	return appContext
}

function removeNoneServiceFiles(file: string) {
	if (file.endsWith(".test.ts")) return false
	if (file.endsWith("scenarios.ts")) return false
	return file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js")
}
