import { Property as PrismaProperty, Schema as PrismaSchemaBlocks } from "@mrleebo/prisma-ast"

interface Model {
	leadingComments: string
	properties: Map<
		string,
		{
			leadingComments: string
			property: PrismaProperty
		}
	>
}

export type PrismaMap = ReadonlyMap<string, Model>

export const prismaModeller = (schema: PrismaSchemaBlocks) => {
	const types = new Map<string, Model>()

	let leadingComments: string[] = []
	schema.list.forEach((b) => {
		if (b.type === "comment") {
			leadingComments.push(b.text.replace("/// ", "").replace("// ", ""))
		}

		if (b.type === "model") {
			const properties = new Map<
				string,
				{
					leadingComments: string
					property: PrismaProperty
				}
			>()

			let leadingFieldComments: string[] = []
			// Loop through all the properties and keep track of the
			// comments before them
			b.properties.forEach((p) => {
				if (p.type === "comment") {
					leadingFieldComments.push(p.text.replace("/// ", "").replace("// ", ""))
				} else if (p.type === "break") {
					leadingFieldComments.push("")
				} else if (p.type === "attribute" || p.type === "field") {
					properties.set(p.name, {
						leadingComments: leadingFieldComments.join("\n"),
						property: p,
					})
					leadingFieldComments = []
				}
			})

			types.set(b.name, {
				properties,
				leadingComments: leadingComments.join("\n"),
			})

			leadingComments = []
		}
	})

	return types
}
