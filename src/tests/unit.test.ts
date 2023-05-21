import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "./testRunner"

it("general test of flow", async () => {
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
			homeTeamId: Int!
			awayTeamId: Int!
		}

		type Query {
			games: [Game!]!
		}

		type Mutation {
			createGame: Game!
		}
	`

	const services = `
import { db } from "src/lib/db";

export const Game = {};
`

	const { vfs } = getDTSFilesForRun({ sdl, services, prismaSchema })

	expect(vfs.get("/types/games.d.ts")).toContain(
		`
import type { Game as PGame } from "@prisma/client";\n
type GameAsParent = PGame & {};

export interface GameTypeResolvers {
}
`.trim()
	)
})
