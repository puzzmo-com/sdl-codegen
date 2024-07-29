/* eslint-disable */
// https://prettier.io/docs/en/api.html

let prettier: any | null = null
try {
	prettier = await import("prettier")
} catch (er) {
	console.error(er)
	prettier = null
}

export const getPrettierConfig = (path: string): unknown => {
	if (!prettier?.default?.resolveConfig) return {}
	if (typeof prettier.default.resolveConfig !== "function") return {}

	// I confirmed that this lookup hits caches in RedwoodJS
	const opts = prettier.default.resolveConfig.sync(path) ?? {}
	return opts
}

export const formatDTS = (path: string, content: string, config: unknown): string => {
	if (!prettier?.default?.format) return content
	if (typeof prettier.default.format !== "function") return content

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	return prettier.default.format(content, { ...(config as object), filepath: path }) as string
}

/* eslint-enable */
