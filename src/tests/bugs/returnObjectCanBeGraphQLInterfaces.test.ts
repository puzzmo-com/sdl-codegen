import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("The retunr type can be a graphql interface", () => {
	const prismaSchema = prisma`
	model Game {
		id Int @id @default(autoincrement())
	}
`

	const sdl = graphql`
		type Game {
			id: Int!
			puzzle: Node!
		}

		interface Node {
			id: ID!
		}
	`

	const gamesService = `
import { db } from "src/lib/db";

export const Game = {
  puzzle: () => {}
};
`

	const { vfsMap } = getDTSFilesForRun({ sdl, gamesService, prismaSchema })
	const dts = vfsMap.get("/types/games.d.ts")!
	expect(dts.trim()).toMatchInlineSnapshot(`
		"import type { Game as PGame } from \\"@prisma/client\\";
		import type { GraphQLResolveInfo } from \\"graphql\\";

		import type { RedwoodGraphQLContext } from \\"@redwoodjs/graphql-server/dist/types\\";

		import type { Node as RTNode } from \\"./shared-return-types\\";
		import type { Node } from \\"./shared-schema-types\\";

		export interface GameTypeResolvers {
		  /** SDL: puzzle: Node! */
		  puzzle: (
		    args?: undefined,
		    obj?: {
		      root: GameAsParent;
		      context: RedwoodGraphQLContext;
		      info: GraphQLResolveInfo;
		    }
		  ) => RTNode | Promise<RTNode> | (() => Promise<RTNode>);
		}

		type GameAsParent = PGame & {
		  puzzle: () => RTNode | Promise<RTNode> | (() => Promise<RTNode>);
		};"
	`)
})
