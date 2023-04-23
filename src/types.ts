import { System } from "typescript"

export interface SDLCodeGenOptions {
	/** We'll use the one which comes with TypeScript if one isn't given */
	system?: System
}
