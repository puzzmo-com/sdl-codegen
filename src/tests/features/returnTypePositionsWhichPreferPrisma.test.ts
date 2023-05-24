import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner"

it("supports a return position where a prisma object can be given, if the extra fn are defined as resolvers", () => {
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

	const { vfsMap } = getDTSFilesForRun({ sdl, gamesService: services, prismaSchema })
	const dts = vfsMap.get("/types/games.d.ts")!

	expect(dts.trimStart()).toMatchInlineSnapshot(
		`
		"import type { Game as RTGame } from \\"./shared-return-types\\";
		import type { Game as PGame } from \\"@prisma/client\\";
		import type { GraphQLResolveInfo } from \\"graphql\\";
		import type { RedwoodGraphQLContext } from \\"@redwoodjs/graphql-server/dist/functions/types\\";

		/** SDL: game: Game */
		export interface GameResolver {
		  (args?: object, obj?: { root: undefined, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | null | Promise<RTGame | null> | (() => Promise<RTGame | null>);
		}

		type GameAsParent = PGame & { summary: () => Promise<string> };

		export interface GameTypeResolvers {

		  /** SDL: summary: String! */
		  summary: (args: undefined, obj: { root: GameAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);
		}
		"
	`
	)
})
