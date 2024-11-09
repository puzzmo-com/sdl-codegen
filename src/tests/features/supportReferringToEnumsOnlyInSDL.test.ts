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
		"import type { Game as PGame } from \\"@prisma/client\\";
		import type { GraphQLResolveInfo } from \\"graphql\\";

		import type { RedwoodGraphQLContext } from \\"@redwoodjs/graphql-server/dist/types\\";

		import type { Game as RTGame } from \\"./shared-return-types\\";
		import type { GameType, Query } from \\"./shared-schema-types\\";

		/** SDL: allGames(type: GameType!): [Game!]! */
		export interface AllGamesResolver {
		  (
		    args?: { type: GameType },
		    obj?: {
		      root: Query;
		      context: RedwoodGraphQLContext;
		      info: GraphQLResolveInfo;
		    }
		  ): RTGame[] | Promise<RTGame[]> | (() => Promise<RTGame[]>);
		}

		export interface GameTypeResolvers {}

		type GameAsParent = PGame;
		"
	`)

	expect(vfsMap.get("/types/shared-schema-types.d.ts"))!.toMatchInlineSnapshot(`
		"export interface Game {
		    __typename?: \\"Game\\";
		    id: number;
		    games: Game[];
		}

		export interface Query {
		    __typename?: \\"Query\\";
		    allGames: Game[];
		}

		export type GameType = \\"FOOTBALL\\" | \\"BASKETBALL\\";

		export interface Mutation {
		    __typename?: \\"Mutation\\";
		    __?: string| null;
		}
		"
	`)
})
