import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("It adds a reference to the graphql enums you use", async () => {
	const prismaSchema = prisma`
model Game {
    id            Int          @id @default(autoincrement())
}
`

	const sdl = graphql`
		type Game {
			id: Int!
			games(type: GameType!): [Game!]!
		}

		type Query {
			allGames(type: GameType!): [Game!]!
		}

		enum GameType {
			FOOTBALL
			BASKETBALL
		}
	`

	const services = `
import { db } from "src/lib/db";

export const allGames = () => {}

export const Game: GameResolvers = {};
`

	const { vfsMap } = await getDTSFilesForRun({ sdl, gamesService: services, prismaSchema, generateShared: true })

	// We are expecting to see import type GameType from "./shared-schema-types"

	expect(vfsMap.get("/types/games.d.ts")).toMatchInlineSnapshot(`
		"interface AllGamesResolver {
		  (args?: RTGame[] | Promise<RTGame[]> | (() => Promise<RTGame[]>), obj?: RTGame[] | Promise<RTGame[]> | (() => Promise<RTGame[]>)): RTGame[] | Promise<RTGame[]> | (() => Promise<RTGame[]>);
		}
		interface GameTypeResolvers {}
		type GameAsParent = PGame  ;
		import { Game as PGame } from \\"@prisma/client\\";
		import { Game as RTGame } from \\"./shared-return-types\\";
		import { GameType, Query } from \\"./shared-schema-types\\";"
	`)

	expect(vfsMap.get("/types/shared-schema-types.d.ts"))!.toMatchInlineSnapshot(`
		"interface Game {
		  __typename?: \\"Game\\";
		  id: number;
		  games: Game[];
		}
		interface Query {
		  __typename?: \\"Query\\";
		  allGames: Game[];
		}
		type GameType = \\"FOOTBALL\\" | \\"BASKETBALL\\";
		interface Mutation {
		  __typename?: \\"Mutation\\";
		  __?: string| null;
		}"
	`)
})
