import { expect, it } from "vitest"

import { lookAtServiceFile } from "../serviceFile"
import { getDTSFilesForRun } from "./testRunner"

it("reads a service file", () => {
	const { appContext, vfsMap } = getDTSFilesForRun({})

	vfsMap.set(
		"/api/src/services/example.ts",
		`export const game = () => {}
         export function game2() {};
    `
	)

	expect(vfsMap.has("/types/example.d.ts")).toBeFalsy()
	lookAtServiceFile("/api/src/services/example.ts", appContext)

	expect(vfsMap.has("/types/example.d.ts")).toBeTruthy()
})
