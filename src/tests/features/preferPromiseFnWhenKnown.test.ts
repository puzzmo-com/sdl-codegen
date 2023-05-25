import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner"

it("uses a rn to promise when we see an async tag", () => {
	const prismaSchema = prisma`
model Game {
    id            Int          @id @default(autoincrement())
    homeTeamID    Int
    awayTeamID    Int
}
`

	const sdl = graphql`
		type Game {
			id: Int!
			homeTeamID: Int!
			awayTeamID: Int!

			summarySync: String!
			summaryAsync: String!
			summary: String!
		}

		type Query {
			gameObj: Game
			gameSync: Game
			gameAsync: Game
			gameAsync1Arg: Game
			gameAsync2Arg: Game
		}
	`

	const gamesService = `
import { db } from "src/lib/db";

export const gameSync = () => {}
export const gameAsync = async () => {}
export const gameAsync1Arg = (arg) => {}
export const gameAsync2Arg = (arg, obj) => {}
export const gameObj = {}

export const Game = {
  summary: "",
  summarySync: () => "",
  summaryAsync: async () => ""
};
`

	const { vfsMap } = getDTSFilesForRun({ sdl, gamesService, prismaSchema })
	const dts = vfsMap.get("/types/games.d.ts")!
	expect(dts.trim()).toMatchInlineSnapshot(`
		"import type { Query } from \\"./shared-schema-types\\";
		import type { Game as RTGame } from \\"./shared-return-types\\";
		import type { Game as PGame } from \\"@prisma/client\\";
		import type { GraphQLResolveInfo } from \\"graphql\\";
		import type { RedwoodGraphQLContext } from \\"@redwoodjs/graphql-server/dist/functions/types\\";

		/** SDL: gameSync: Game */
		export interface GameSyncResolver {
		  (args?: object, obj?: { root: Query, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | null | Promise<RTGame | null> | (() => Promise<RTGame | null>);
		}

		/** SDL: gameAsync: Game */
		export interface GameAsyncResolver {
		  (args?: object, obj?: { root: Query, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): Promise<RTGame | null>;
		}

		/** SDL: gameAsync1Arg: Game */
		export interface GameAsync1ArgResolver {
		  (args: object, obj?: { root: Query, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | null | Promise<RTGame | null> | (() => Promise<RTGame | null>);
		}

		/** SDL: gameAsync2Arg: Game */
		export interface GameAsync2ArgResolver {
		  (args: object, obj: { root: Query, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | null | Promise<RTGame | null> | (() => Promise<RTGame | null>);
		}

		/** SDL: gameObj: Game */
		export interface GameObjResolver {
		  (args?: object, obj?: { root: Query, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | null;
		}

		export interface GameTypeResolvers<Extended> {

		  /** SDL: summary: String! */
		  summary: string;

		  /** SDL: summarySync: String! */
		  summarySync: (args?: undefined, obj?: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

		  /** SDL: summaryAsync: String! */
		  summaryAsync: (args?: undefined, obj?: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Promise<string>;
		}

		type GameAsParent<Extended> = PGame & {
		  summary: () => string,
		  summarySync: () => string | Promise<string> | (() => Promise<string>),
		  summaryAsync: () => Promise<string>
		} & Extended;"
	`)
})
