// https://prettier.io/docs/en/api.html

let hasPrettierInstalled = false
let prettier = null
try {
	hasPrettierInstalled = !!require.resolve("prettier")
	prettier = require("prettier")
} catch (error) {}

export const formatDTS = async (path: string, content: string): Promise<string> => {
	if (!hasPrettierInstalled) return content

	try {
		if (!prettier) return content
		return prettier.format(content, { filepath: path })
	} catch (error) {
		return content
	}
}
