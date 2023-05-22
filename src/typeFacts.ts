export type FieldFacts = Record<string, FieldFact>

export interface FieldFact {
	hasResolverImplementation?: true
	// isPrismaBacked?: true;
}

// The data-model for the service file which contains the SDL matched functions

/** A representation of the code inside the source file's  */
export type CodeFacts = Record<string, ModelResolverFacts>

export interface ModelResolverFacts {
	resolvers: Map<string, RootResolverFact>,
	typeName: string
}

export interface RootResolverFact {
	/** How many args are defined? */
	funcArgCount: number,
	/** Is it declared as an async fn */
	isAsync: boolean,
	/** is 'function abc() {}' */
	isFunc: boolean,
	/** is 'const abc = () => ...' */
	isObjLiteral: boolean,
	/** We don't know what declaration is */
	isUnknown: boolean,
	/** The name of the fn */
	name: string
}
