// https://prettier.io/docs/en/api.html

let hasPrettierInstalled = false
try {
	hasPrettierInstalled = !!require.resolve("prettier")
} catch (error) {}

import * as prettier from "@prettier/sync"

export const getPrettierConfig = (path: string): unknown => {
	if (!hasPrettierInstalled) return {}

	if (!prettier?.default?.resolveConfig) return {}
	if (typeof prettier.default.resolveConfig !== "function") return {}

	// I confirmed that this lookup hits caches in RedwoodJS
	return prettier.default.resolveConfig(path) ?? {}
}

export const formatDTS = (path: string, content: string, config: unknown): string => {
	if (!hasPrettierInstalled) return content

	if (!prettier?.default?.format) return content
	if (typeof prettier.default.format !== "function") return content

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	return prettier.default.format(content, { ...(config as object), filepath: path }) as string
}
