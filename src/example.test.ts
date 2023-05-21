import { expect, it } from "vitest"

it("toUpperCase", () => {
	const result = "foobas"
	expect(result).toMatchInlineSnapshot('"foobas"')
})
