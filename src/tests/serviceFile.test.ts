import { expect, it } from "vitest"

import { lookAtServiceFile } from "../serviceFile"
import { getDTSFilesForRun } from "./testRunner"

it("reads a service file", () => {
	const { appContext, vfsMap } = getDTSFilesForRun({})

	vfsMap.set(
		"/api/src/services/example.ts",
		`export const game = () => {}
         export function game2() {}
    `
	)

	expect(vfsMap.has("/types/example.d.ts")).toBeFalsy()
	lookAtServiceFile("/api/src/services/example.ts", appContext)

	expect(vfsMap.has("/types/example.d.ts")).toBeTruthy()

	// Should include facts about the file
	expect([...appContext.serviceFacts.keys()]).toMatchInlineSnapshot(`
		[
		  "/example.ts",
		]
	`)

	// Eventually this should include game2 also
	const facts = appContext.serviceFacts.get("/example.ts")!
	expect(Object.keys(facts).join(" | ")).toMatchInlineSnapshot('"game"')

	// Generates some useful facts
	expect(facts.game).toMatchInlineSnapshot(`
		{
		  "resolvers": Map {
		    "game" => {
		      "funcArgCount": 0,
		      "isAsync": false,
		      "isFunc": true,
		      "isObjLiteral": false,
		      "isUnknown": false,
		      "name": "game",
		      "parentName": "__unincluded",
		    },
		  },
		  "typeName": "__unincluded",
		}
	`)
})
