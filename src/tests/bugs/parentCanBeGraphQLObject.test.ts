import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("Uses GraphQL objects when prisma objects are not available for resolver parents", async () => {
	const prismaSchema = prisma`
	model Game {
		id Int @id @default(autoincrement())
	}
`

	const sdl = graphql`
		type Game {
			id: Int!
		}

		type Puzzle {
			id: Int!
		}
	`

	const gamesService = `
import { db } from "src/lib/db";

export const Puzzle = {
  id: "",
};
`

	const { vfsMap } = await getDTSFilesForRun({ sdl, gamesService, prismaSchema })
	const dts = vfsMap.get("/types/games.d.ts")!
	expect(dts.trim()).toMatchInlineSnapshot(`
		"import type { Puzzle as SPuzzle } from \\"./shared-return-types\\";

		export interface PuzzleTypeResolvers {
		  /** SDL: id: Int! */
		  id: number;
		}

		type PuzzleAsParent = SPuzzle & { id: () => number };"
	`)
})
