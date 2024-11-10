import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("supports a return position where a prisma object can be given, if the extra fn are defined as resolvers", async () => {
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

			# This is new, and _not_ on the prisma model
			summary: String!
		}

		type Query {
			game: Game
		}
	`

	const services = `
import { db } from "src/lib/db";

export const game = () => {}

export const Game = {
  summary: (_obj, { root }) => ""
};
`

	const { vfsMap } = await getDTSFilesForRun({ sdl, gamesService: services, prismaSchema })
	const dts = vfsMap.get("/types/games.d.ts")!

	expect(dts.trimStart()).toMatchInlineSnapshot(
		`
		"interface GameResolver {
		  (args?: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>), obj?: RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>)): RTGame| null | Promise<RTGame| null> | (() => Promise<RTGame| null>);
		}
		interface GameTypeResolvers {
		  /*SDL: summary: String!*/
		  summary: (args: undefined, obj: { root: GameAsParent, context?: RedwoodGraphQLContext, info?: GraphQLResolveInfo }) => string;
		}
		type GameAsParent = PGame & {summary: () => string} ;
		import { Game as PGame } from \\"@prisma/client\\";
		import { GraphQLResolveInfo } from \\"graphql\\";
		import { RedwoodGraphQLContext } from \\"@redwoodjs/graphql-server/dist/types\\";
		import { Game as RTGame } from \\"./shared-return-types\\";
		import { Query } from \\"./shared-schema-types\\";"
	`
	)
})
