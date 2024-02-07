import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("generates a union type for a gql union", () => {
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
		}
	`

	const gamesService = `
import { db } from "src/lib/db";

export const gameObj = {}

export const Game = {
  id: "",
};
`

	const { vfsMap } = getDTSFilesForRun({ sdl, gamesService, prismaSchema, generateShared: true })
	const dts = vfsMap.get("/types/shared-schema-types.d.ts")!
	expect(dts.trim()).toMatchInlineSnapshot(`
		"export interface Game {
		  __typename?: \\"Game\\";
		  id?: number;
		}

		export interface Puzzle {
		  __typename?: \\"Puzzle\\";
		  id: number;
		}

		type Gameish = Game | Puzzle;

		export interface Query {
		  __typename?: \\"Query\\";
		  gameObj?: Game | null | Puzzle | null | null;
		}

		export interface Mutation {
		  __typename?: \\"Mutation\\";
		  __?: string | null;
		}"
	`)
})
