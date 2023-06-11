import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("It allows you to add a generic parameter", () => {
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
	`

	const services = `
import { db } from "src/lib/db";

export const Game: GameResolvers<{ type: string }> = {};
`

	const { vfsMap } = getDTSFilesForRun({ sdl, gamesService: services, prismaSchema })

	expect(vfsMap.get("/types/games.d.ts")!).toContain("interface GameTypeResolvers<Extended>")

	expect(vfsMap.get("/types/games.d.ts")!).toContain("GameAsParent<Extended> = PGame & Extended")

	expect(vfsMap.get("/types/games.d.ts"))!.toMatchInlineSnapshot(`
		"import type { Game as PGame } from \\"@prisma/client\\";

		export interface GameTypeResolvers<Extended> {}

		type GameAsParent<Extended> = PGame & Extended;
		"
	`)
})
