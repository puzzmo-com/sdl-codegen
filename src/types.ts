import type { System } from "typescript"

export interface SDLCodeGenOptions {
	/** We'll use the one which comes with TypeScript if one isn't given */
	system?: System
}

// These are directly ported from Redwood at
// packages/project-config/src/paths.ts

interface NodeTargetPaths {
	base: string
	config: string
	dataMigrations: string
	db: string
	dbSchema: string
	directives: string
	dist: string
	functions: string
	generators: string
	graphql: string
	lib: string
	models: string
	services: string
	src: string
	types: string
}

export interface RedwoodPaths {
	api: NodeTargetPaths
	base: string
	generated: {
		base: string
		prebuild: string
		schema: string
		types: {
			includes: string
			mirror: string
		}
	}
	scripts: string
	web: any
}
