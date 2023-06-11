// https://prettier.io/docs/en/api.html

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prettier: any | null = null
try {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	prettier = await import("prettier")
} catch (er) {
	console.error(er)
	prettier = null
}

export const getPrettierConfig = (path: string): unknown => {
	if (!prettier) return {}

	// I confirmed that this lookup hits caches in Redwood
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	const opts = prettier.default.resolveConfig.sync(path) ?? {}
	return opts
}

export const formatDTS = (path: string, content: string, config: unknown): string => {
	if (!prettier) return content
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	return prettier.default.format(content, { ...(config as object), filepath: path }) as string
}
