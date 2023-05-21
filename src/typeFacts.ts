export type FieldFacts = Record<string, FieldFact>

export interface FieldFact {
	hasResolverImplementation?: true
	// isPrismaBacked?: true;
}

// The data-model for the service file which contains the SDL matched functions

/** A representation of the file itself, containing either  */
export type ServiceFacts = Record<string, ModelResolverFacts | NotInGQLSchemaResolverFacts>

export interface NotInGQLSchemaResolverFacts {
	typeName: "__unincluded"
	resolvers: Map<string, RootResolverFact>
}

export interface ModelResolverFacts {
	typeName: string
	resolvers: Map<string, RootResolverFact>
}

export interface RootResolverFact {
	resolverName: string
}
