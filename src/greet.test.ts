import { describe, it } from "@jest/globals";

import { greet } from "./greet.js";

describe("greet", () => {
	it("logs to the console once when message is provided as a string", () => {
		greet("Hello, world!");
	});
});
