import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("generates a union type for a gql union", async () => {
	const prismaSchema = prisma`
model Game {
    id            Int          @id @default(autoincrement())
}
`

	const sdl = graphql`
		type Game {
			id: Int!
		}
		type Puzzle {
			id: Int!
		}

		union Gameish = Game | Puzzle

		type Query {
			gameObj: Gameish
			gameArr: [Gameish!]!
		}
	`

	const gamesService = `
import { db } from "src/lib/db";

export const gameObj = {}

export const Game = {
  id: "",
};
`

	const { vfsMap } = await getDTSFilesForRun({ sdl, gamesService, prismaSchema, generateShared: true })
	const dts = vfsMap.get("/types/shared-schema-types.d.ts")!
	expect(dts.trim()).toMatchInlineSnapshot(`
		"interface Game {
		  __typename?: \\"Game\\";
		  id?: number;
		}
		interface Puzzle {
		  __typename?: \\"Puzzle\\";
		  id: number;
		}
		type Gameish = Game | Puzzle;
		interface Query {
		  __typename?: \\"Query\\";
		  gameObj?: Game| null | Puzzle| null| null;
		  gameArr: (Game | Puzzle)[];
		}
		interface Mutation {
		  __typename?: \\"Mutation\\";
		  __?: string| null;
		}"
	`)
})
