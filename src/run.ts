// TODO: Remove?
import { basename, join } from "node:path"

import { getSchema as getPrismaSchema } from "@mrleebo/prisma-ast"
import * as graphql from "graphql"
import { Project } from "ts-morph"
import * as typescript from "typescript"

import { AppContext } from "./context.js"
import { PrismaMap, prismaModeller } from "./prismaModeller.js"
import { lookAtServiceFile } from "./serviceFile.js"
import { createSharedSchemaFiles } from "./sharedSchema.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"

export function run(
	appRoot: string,
	typesRoot: string,
	config: { deleteOldGraphQLDTS?: boolean; runESLint?: boolean; sys?: typescript.System } = {}
) {
	const sys = config.sys ?? typescript.sys
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

	const settings: AppContext["pathSettings"] = {
		root: appRoot,
		graphQLSchemaPath: join(appRoot, ".redwood", "schema.graphql"),
		apiServicesPath: join(appRoot, "api", "src", "services"),
		prismaDSLPath: join(appRoot, "api", "db", "schema.prisma"),
		sharedFilename: "shared-schema-types.d.ts",
		sharedInternalFilename: "shared-return-types.d.ts",
		typesFolderRoot: typesRoot,
	}

	getGraphQLSDLFromFile(settings)
	getPrismaSchemaFromFile(settings)

	if (!gqlSchema) throw new Error("No GraphQL Schema was created during setup")

	const appContext: AppContext = {
		gql: gqlSchema,
		prisma: prismaSchema,
		tsProject: project,
		codeFacts: new Map<string, CodeFacts>(),
		fieldFacts: new Map<string, FieldFacts>(),
		pathSettings: settings,
		sys,
		join,
		basename,
	}

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

	// empty the types folder
	for (const dirEntry of sys.readDirectory(appContext.pathSettings.typesFolderRoot)) {
		const fileToDelete = join(appContext.pathSettings.typesFolderRoot, dirEntry)
		if (sys.deleteFile && sys.fileExists(fileToDelete)) {
			sys.deleteFile(fileToDelete)
		}
	}

	// This needs to go first, as it sets up fieldFacts
	for (const path of serviceFilesToLookAt) {
		lookAtServiceFile(path, appContext)
	}

	createSharedSchemaFiles(appContext)
	// console.log(`Updated`, typesRoot)

	if (config.runESLint) {
		// console.log("Running ESLint...")
		// const process = Deno.run({
		// 	cwd: appRoot,
		// 	cmd: ["yarn", "eslint", "--fix", "--ext", ".d.ts", appContext.settings.typesFolderRoot],
		// 	stdin: "inherit",
		// 	stdout: "inherit",
		// })
		// await process.status()
	}

	if (sys.deleteFile && config.deleteOldGraphQLDTS) {
		console.log("Deleting old graphql.d.ts")
		sys.deleteFile(join(appRoot, "api", "src", "graphql.d.ts"))
	}
}
