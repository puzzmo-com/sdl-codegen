// https://prettier.io/docs/en/api.html

let hasPrettierInstalled = false
try {
	hasPrettierInstalled = !!require.resolve("prettier")
} catch (error) {}

export const formatDTS = async (path: string, content: string): Promise<string> => {
	if (!hasPrettierInstalled) return content

	try {
		const prettier = await import("prettier")
		if (!prettier) return content
		return prettier.format(content, { filepath: path })
	} catch (error) {
		return content
	}
}
