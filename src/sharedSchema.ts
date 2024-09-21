/// The main schema for objects and inputs

import { AppContext } from "./context.js"
import { createSharedExternalSchemaFileViaTSC, createSharedReturnPositionSchemaFileViaTSC } from "./sharedSchemaTSC.js"
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
