import * as graphql from "graphql"
import * as tsMorph from "ts-morph"
import ts, { SourceFile, Statement } from "typescript"

import { TypeMapper } from "./typeMap.js"

export const varStartsWithUppercase = (v: tsMorph.VariableDeclaration) => v.getName()[0].startsWith(v.getName()[0].toUpperCase())
export const nameDoesNotStartsWithUnderscore = (v: tsMorph.VariableDeclaration) => !v.getName()[0].startsWith("_")

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export const variableDeclarationIsAsync = (vd: tsMorph.VariableDeclaration) => {
	const res = !!vd.getFirstChildByKind(tsMorph.SyntaxKind.AsyncKeyword)
	return res
}

export const inlineArgsForField = (field: graphql.GraphQLField<unknown, unknown>, config: { mapper: TypeMapper["map"] }) => {
	return field.args.length
		? // Always use an args obj
		  `{${field.args
				.map((f) => {
					const type = config.mapper(f.type, {})
					if (!type) throw new Error(`No type for ${f.name} on ${field.name}!`)

					const q = type.includes("undefined") ? "?" : ""
					const displayType = type.replace("| undefined", "")
					return `${f.name}${q}: ${displayType}`
				})
				.join(", ")}}`
		: undefined
}

export const createAndReferOrInlineArgsForField = (
	field: graphql.GraphQLField<unknown, unknown>,
	config: {
		mapper: TypeMapper["map"]
		name: string
		noSeparateType?: true
		statements: Statement[]
	}
) => {
	const inlineArgs = inlineArgsForField(field, config)
	if (!inlineArgs) return undefined
	if (inlineArgs.length < 120) return inlineArgs

	const interfaceD = ts.factory.createInterfaceDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		ts.factory.createIdentifier(`${config.name}Args`),
		undefined,
		undefined,
		field.args.map((f) => {
			const type = config.mapper(f.type, {})
			if (!type) throw new Error(`No type for ${f.name} on ${field.name}!`)

			return ts.factory.createPropertySignature(undefined, f.name, undefined, ts.factory.createTypeReferenceNode(type))
		})
	)

	config.statements.push(interfaceD)

	return `${config.name}Args`
}

export const makeStep = (verbose: boolean) => async (msg: string, fn: () => Promise<unknown> | Promise<void> | void) => {
	if (!verbose) return fn()
	console.log("[sdl-codegen] " + msg)
	console.time("[sdl-codegen] " + msg)
	await fn()
	console.timeEnd("[sdl-codegen] " + msg)
}
