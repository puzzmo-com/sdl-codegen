export type FieldFacts = Record<string, FieldFact>

export interface FieldFact {
	hasResolverImplementation?: true
	// isPrismaBacked?: true;
}

// The data-model for the service file which contains the SDL matched functions

/** A representation of the code inside the source file's  */
export type CodeFacts = Record<string, ModelResolverFacts | undefined>

export interface ModelResolverFacts {
	/** Should we type the type as a generic with an override  */
	hasGenericArg: boolean
	/** Individual resolvers found for this model */
	resolvers: Map<string, ResolverFuncFact>
	/** The name (or lack of) for the GraphQL type which we are mapping  */
	typeName: string | "maybe_query_mutation"
}

export interface ResolverFuncFact {
	/** How many args are defined? */
	funcArgCount: number
	/** Is it declared as an async fn */
	isAsync: boolean
	/** is 'function abc() {}' */
	isFunc: boolean
	/** is 'const ABC = {}' */
	isObjLiteral: boolean
	/** We don't know what declaration is */
	isUnknown: boolean
	/** The name of the fn */
	name: string
}
