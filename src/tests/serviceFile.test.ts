import { readFileSync } from "fs"
import { expect, it } from "vitest"

import { getCodeFactsForJSTSFileAtPath, lookAtServiceFile } from "../serviceFile"
import { getDTSFilesForRun } from "./testRunner"

it("reads a service file", () => {
	const { appContext, vfsMap } = getDTSFilesForRun({})

	vfsMap.set(
		"/api/src/services/example.ts",
		`
export const game = () => {}
export function game2() {}
    `
	)

	expect(vfsMap.has("/types/example.d.ts")).toBeFalsy()
	lookAtServiceFile("/api/src/services/example.ts", appContext)

	expect(vfsMap.has("/types/example.d.ts")).toBeTruthy()
})

it("generates useful service facts from a (truncated) real file", () => {
	const { appContext, vfsMap } = getDTSFilesForRun({})

	vfsMap.set("/api/src/services/userProfile.ts", readFileSync("./src/tests/vendor/puzzmo/one-offs/userProfiles.ts", "utf8"))

	const facts = getCodeFactsForJSTSFileAtPath("/api/src/services/userProfile.ts", appContext)
	expect(facts).toMatchInlineSnapshot(`
		{
		  "UserProfile": {
		    "hasGenericArg": false,
		    "resolvers": Map {
		      "id" => {
		        "funcArgCount": 2,
		        "isAsync": false,
		        "isFunc": true,
		        "isObjLiteral": false,
		        "isUnknown": false,
		        "name": "id",
		      },
		      "user" => {
		        "funcArgCount": 2,
		        "isAsync": false,
		        "isFunc": true,
		        "isObjLiteral": false,
		        "isUnknown": false,
		        "name": "user",
		      },
		    },
		    "typeName": "UserProfile",
		  },
		  "maybe_query_mutation": {
		    "hasGenericArg": false,
		    "resolvers": Map {
		      "updateUserProfile" => {
		        "funcArgCount": 1,
		        "isAsync": false,
		        "isFunc": true,
		        "isObjLiteral": false,
		        "isUnknown": false,
		        "name": "updateUserProfile",
		      },
		      "addLeaderboardToUserProfile" => {
		        "funcArgCount": 1,
		        "isAsync": true,
		        "isFunc": true,
		        "isObjLiteral": false,
		        "isUnknown": false,
		        "name": "addLeaderboardToUserProfile",
		      },
		      "removeLeaderboardFromUserProfile" => {
		        "funcArgCount": 1,
		        "isAsync": true,
		        "isFunc": true,
		        "isObjLiteral": false,
		        "isUnknown": false,
		        "name": "removeLeaderboardFromUserProfile",
		      },
		      "deleteUserProfile" => {
		        "funcArgCount": 1,
		        "isAsync": false,
		        "isFunc": true,
		        "isObjLiteral": false,
		        "isUnknown": false,
		        "name": "deleteUserProfile",
		      },
		    },
		    "typeName": "maybe_query_mutation",
		  },
		}
	`)
})
