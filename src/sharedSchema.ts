/// The main schema for objects and inputs

import * as graphql from "graphql"
import * as tsMorph from "ts-morph"

import { AppContext } from "./context.js"
import { formatDTS } from "./formatDTS.js"
import { createSharedExternalSchemaFileViaTSC, createSharedReturnPositionSchemaFileViaTSC } from "./sharedSchemaTSC.js"
import { typeMapper } from "./typeMap.js"
import { makeStep } from "./utils.js"

export const createSharedSchemaFiles = async (context: AppContext, verbose: boolean) => {
	const step = makeStep(verbose)

	await step("Creating shared schema files via tsc", () => createSharedExternalSchemaFileViaTSC(context))
	await step("Creating shared return position schema files via tsc", () => createSharedReturnPositionSchemaFileViaTSC(context))

	return [
		context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedFilename),
		context.join(context.pathSettings.typesFolderRoot, context.pathSettings.sharedInternalFilename),
	]
}
