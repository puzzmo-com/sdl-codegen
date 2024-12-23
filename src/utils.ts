import * as graphql from "graphql"
import * as tsMorph from "ts-morph"

import { TSBuilder } from "./tsBuilder.js"
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
		dts: TSBuilder
		mapper: TypeMapper["map"]
		name: string
		noSeparateType?: true
	}
) => {
	const inlineArgs = inlineArgsForField(field, config)
	if (!inlineArgs) return undefined
	if (inlineArgs.length < 120) return inlineArgs

	const dts = config.dts
	dts.rootScope.addInterface(
		`${config.name}Args`,
		field.args.map((a) => ({
			name: a.name,
			type: config.mapper(a.type, {})!,
			optional: false,
		}))
	)

	return `${config.name}Args`
}

export const makeStep = (verbose: boolean) => async (msg: string, fn: () => Promise<unknown> | Promise<void> | void) => {
	if (!verbose) return fn()
	console.log("[sdl-codegen] " + msg)
	console.time("[sdl-codegen] " + msg)
	await fn()
	console.timeEnd("[sdl-codegen] " + msg)
}
