import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "./testRunner"

it("It prints a warning, and doesn't crash when you have resolvers which exist but are not on the parent", async () => {
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

export const Game: GameResolvers = {
    someRandomThing: () => "hello"
};

`

	const { vfs } = getDTSFilesForRun({ sdl, services, prismaSchema })

	expect(vfs.get("/types/games.d.ts")!).toContain("// This field does not exist in the generated schema.graphql\n")
})
