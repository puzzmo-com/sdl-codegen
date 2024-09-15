import { existsSync } from "node:fs"
import { join, resolve } from "node:path"

import { createSystem } from "@typescript/vfs"
import { describe, expect, it } from "vitest"

import { runFullCodegen } from "../index"

it("Passes", () => expect(true).toBe(true))

const hasAccessToPuzzmo = existsSync("../app/package.json")
const desc = hasAccessToPuzzmo ? describe : describe.skip

desc("Puzzmo", () => {
	it("Runs the entire puzzmo codebase fast", async () => {
		const puzzmoAPIWD = resolve(process.cwd() + "/..../../../app/apps/api.puzzmo.com")
		const vfsMap = new Map<string, string>()
		const vfs = createSystem(vfsMap)

		// Replicates a Redwood project config object
		const paths = {
			base: puzzmoAPIWD,
			api: {
				base: puzzmoAPIWD,
				config: "-",
				dbSchema: join(puzzmoAPIWD, "prisma", "schema.prisma"),
				directives: join(puzzmoAPIWD, "src", "directives"),
				graphql: join(puzzmoAPIWD, "src", "functions", "graphql.ts"),
				lib: join(puzzmoAPIWD, "src", "lib"),
				models: "-",
				services: join(puzzmoAPIWD, "src", "services"),
				src: join(puzzmoAPIWD, "src"),
				types: join(puzzmoAPIWD, "types"),
			},
			generated: {
				schema: join(puzzmoAPIWD, "..", "..", "api-schema.graphql"),
			},
			web: {},
			scripts: "-",
		}

		const results = await runFullCodegen("redwood", { paths, verbose: true, sys: vfs })
		console.log(results)
	})
})
