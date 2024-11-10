import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("uses a rn to promise when we see an async tag", async () => {
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
			summarySyncBlock: String!
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
  summarySyncBlock: () => {
  	return ""
  },
  summaryAsync: async () => ""
};
`

	const { vfsMap } = await getDTSFilesForRun({ sdl, gamesService, prismaSchema })
	const dts = vfsMap.get("/types/games.d.ts")!
	expect(dts.trim()).toMatchInlineSnapshot(`
		"interface GameSyncResolver {
		  (args?: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>), obj?: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>)): RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>);
		}
		interface GameAsyncResolver {
		  (args?: Promise<RTGame| null>, obj?: Promise<RTGame| null>): Promise<RTGame| null>;
		}
		interface GameAsync1ArgResolver {
		  (args: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>), obj?: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>)): RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>);
		}
		interface GameAsync2ArgResolver {
		  (args: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>), obj: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>)): RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>);
		}
		interface GameObjResolver {
		  (args?: RTGame| null, obj?: RTGame| null): RTGame| null;
		}
		interface GameTypeResolvers<Extended> {
		  /*SDL: summary: String!*/
		  summary: string;
		  /*SDL: summarySync: String!*/
		  summarySync: (args?: undefined, obj?: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string;
		  /*SDL: summarySyncBlock: String!*/
		  summarySyncBlock: (args?: undefined, obj?: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);
		  /*SDL: summaryAsync: String!*/
		  summaryAsync: (args?: undefined, obj?: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Promise<string>;
		}
		type GameAsParent<Extended> = PGame & {summary: () => string, 
		summarySync: () => string, 
		summarySyncBlock: () => string | Promise<string> | (() => Promise<string>), 
		summaryAsync: () => Promise<string>}  & Extended;
		import { Game as PGame } from \\"@prisma/client\\";
		import { GraphQLResolveInfo } from \\"graphql\\";
		import { RedwoodGraphQLContext } from \\"@redwoodjs/graphql-server/dist/types\\";
		import { Game as RTGame } from \\"./shared-return-types\\";
		import { Query } from \\"./shared-schema-types\\";"
	`)
})
