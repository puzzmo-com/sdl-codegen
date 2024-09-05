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

export * from "./types.js"

import { basename, join } from "node:path"

interface SDLCodeGenReturn {
	// Optional way to start up a watcher mode for the codegen
	createWatcher: () => { fileChanged: (path: string) => void }
	// Paths which were added/changed during the run
	paths: string[]
}

/** The API specifically for the Redwood preset */
export async function runFullCodegen(preset: "redwood", config: { paths: RedwoodPaths; verbose?: true }): Promise<SDLCodeGenReturn>

export async function runFullCodegen(preset: string, config: unknown): Promise<SDLCodeGenReturn>

export async function runFullCodegen(preset: string, config: unknown): Promise<SDLCodeGenReturn> {
	if (preset !== "redwood") throw new Error("Only Redwood codegen is supported at this time")
	const verbose = (config as { verbose?: true }).verbose
	const startTime = Date.now()

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

	// All changed files
	const filepaths = [] as string[]

	// Create the two shared schema files
	const sharedDTSes = await createSharedSchemaFiles(appContext)
	filepaths.push(...sharedDTSes)

	let knownServiceFiles: string[] = []
	const createDTSFilesForAllServices = async () => {
		// TODO: Maybe Redwood has an API for this? Its grabbing all the services
		const serviceFiles = appContext.sys.readDirectory(appContext.pathSettings.apiServicesPath)
		knownServiceFiles = serviceFiles.filter(isRedwoodServiceFile)
		for (const path of knownServiceFiles) {
			const dts = await lookAtServiceFile(path, appContext)
			if (dts) filepaths.push(dts)
		}
	}

	// Initial run
	await createDTSFilesForAllServices()
	const endTime = Date.now()
	const timeTaken = endTime - startTime

	if (verbose) console.log(`[sdl-codegen]: Full run took ${timeTaken}ms`)

	const createWatcher = () => {
		return {
			fileChanged: async (path: string) => {
				if (path === appContext.pathSettings.graphQLSchemaPath) {
					if (verbose) console.log("[sdl-codegen] SDL Schema changed")
					getGraphQLSDLFromFile(appContext.pathSettings)
					await createSharedSchemaFiles(appContext)
					await createDTSFilesForAllServices()
				} else if (path === appContext.pathSettings.prismaDSLPath) {
					if (verbose) console.log("[sdl-codegen] Prisma schema changed")
					getPrismaSchemaFromFile(appContext.pathSettings)
					await createDTSFilesForAllServices()
				} else if (isRedwoodServiceFile(path)) {
					if (knownServiceFiles.includes(path)) {
						if (verbose) console.log("[sdl-codegen] New service file")
						await createDTSFilesForAllServices()
					} else {
						if (verbose) console.log("[sdl-codegen] Service file changed")
						await lookAtServiceFile(path, appContext)
					}
				}
			},
		}
	}

	return {
		paths: filepaths,
		createWatcher,
	}
}

const isRedwoodServiceFile = (file: string) => {
	if (file.endsWith(".test.ts") || file.endsWith(".test.js")) return false
	if (file.endsWith("scenarios.ts") || file.endsWith("scenarios.js")) return false
	return file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js")
}
