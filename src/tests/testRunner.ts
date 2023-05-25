import { getSchema as getPrismaSchema } from "@mrleebo/prisma-ast"
import { createSystem } from "@typescript/vfs"
import { buildSchema } from "graphql"
import { basename, join } from "path"
import { Project } from "ts-morph"

import { AppContext } from "../context.js"
import { prismaModeller } from "../prismaModeller.js"
import { lookAtServiceFile } from "../serviceFile.js"
import type { CodeFacts, FieldFacts } from "../typeFacts.js"

interface Run {
	gamesService?: string
	prismaSchema?: string
	sdl?: string
}

export function getDTSFilesForRun(run: Run) {
	const prisma = getPrismaSchema(run.prismaSchema ?? "")
	let gqlSDL = run.sdl ?? ""
	if (!gqlSDL.includes("type Query")) gqlSDL += "type Query { _: String }\n"
	if (!gqlSDL.includes("type Mutation")) gqlSDL += "type Mutation { __: String }"

	const schema = buildSchema(gqlSDL)
	const project = new Project({ useInMemoryFileSystem: true })

	const vfsMap = new Map<string, string>()

	const vfs = createSystem(vfsMap)

	const appContext: AppContext = {
		gql: schema,
		prisma: prismaModeller(prisma),
		tsProject: project,
		fieldFacts: new Map<string, FieldFacts>(),
		codeFacts: new Map<string, CodeFacts>(),
		pathSettings: {
			root: "/",
			graphQLSchemaPath: "/.redwood/schema.graphql",
			apiServicesPath: "/api/src/services",
			prismaDSLPath: "/api/db/schema.prisma",
			sharedFilename: "shared-schema-types.d.ts",
			sharedInternalFilename: "shared-return-types.d.ts",
			typesFolderRoot: "/types",
		},
		sys: vfs,
		basename,
		join,
	}

	if (run.gamesService) {
		vfsMap.set("/api/src/services/games.ts", run.gamesService)
		lookAtServiceFile("/api/src/services/games.ts", appContext)
	}

	return {
		vfsMap,
		appContext,
	}
}

export const graphql = (strings: TemplateStringsArray): string => strings[0]
export const prisma = (strings: TemplateStringsArray): string => strings[0]
