/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import * as _t from "@babel/types"
import * as graphql from "graphql"

import { AppContext } from "./context.js"
import { getCodeFactsForJSTSFileAtPath } from "./serviceFile.codefacts.js"
import { builder, TSBuilder } from "./tsBuilder.js"
import { CodeFacts, ModelResolverFacts, ResolverFuncFact } from "./typeFacts.js"
import { TypeMapper, typeMapper } from "./typeMap.js"
import { capitalizeFirstLetter, createAndReferOrInlineArgsForField, inlineArgsForField } from "./utils.js"

const t = (_t as any).default || _t

export const lookAtServiceFile = async (file: string, context: AppContext) => {
	const { gql, prisma, pathSettings: settings, codeFacts: serviceFacts, fieldFacts } = context

	if (!gql) throw new Error(`No schema when wanting to look at service file: ${file}`)
	if (!prisma) throw new Error(`No prisma schema when wanting to look at service file: ${file}`)

	// This isn't good enough, needs to be relative to api/src/services
	const fileKey = file.replace(settings.apiServicesPath, "")

	const thisFact: CodeFacts = {}

	const filename = context.basename(file)
	const dts = builder("", {})

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const queryType = gql.getQueryType()!
	if (!queryType) throw new Error("No query type")

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const mutationType = gql.getMutationType()!
	if (!mutationType) throw new Error("No mutation type")

	const externalMapper = typeMapper(context, { preferPrismaModels: true })
	const returnTypeMapper = typeMapper(context, {})

	// The description of the source file
	const fileFacts = getCodeFactsForJSTSFileAtPath(file, context)
	if (Object.keys(fileFacts).length === 0) return

	// Tracks prospective prisma models which are used in the file
	const extraPrismaReferences = new Set<string>()
	const extraSharedFileImportReferences = new Set<{ import: string; name?: string }>()

	// Basically if a top level resolver reference Query or Mutation
	const knownSpecialCasesForGraphQL = new Set<string>()

	// Add the root function declarations
	const rootResolvers = fileFacts.maybe_query_mutation?.resolvers
	if (rootResolvers)
		rootResolvers.forEach((v) => {
			const isQuery = v.name in queryType.getFields()
			const isMutation = v.name in mutationType.getFields()
			const parentName = isQuery ? queryType.name : isMutation ? mutationType.name : undefined
			if (parentName) {
				addDefinitionsForTopLevelResolvers(parentName, v, dts)
			} else {
				// Add warning about unused resolver
				dts.rootScope.addInterface(v.name, [], { exported: true, docs: "This resolver does not exist on Query or Mutation" })
			}
		})

	// Add the root function declarations
	Object.values(fileFacts).forEach((model) => {
		if (!model) return
		const skip = ["maybe_query_mutation", queryType.name, mutationType.name]
		if (skip.includes(model.typeName)) return

		addCustomTypeModel(model)
	})

	// Set up the module imports at the top
	const sharedGraphQLObjectsReferenced = externalMapper.getReferencedGraphQLThingsInMapping()
	const sharedGraphQLObjectsReferencedTypes = [...sharedGraphQLObjectsReferenced.types, ...knownSpecialCasesForGraphQL]
	const sharedInternalGraphQLObjectsReferenced = returnTypeMapper.getReferencedGraphQLThingsInMapping()

	const aliases = [...new Set([...sharedGraphQLObjectsReferenced.scalars, ...sharedInternalGraphQLObjectsReferenced.scalars])]

	for (const alias of aliases) {
		dts.rootScope.addTypeAlias(alias, "any")
	}

	const prismases = [
		...new Set([
			...sharedGraphQLObjectsReferenced.prisma,
			...sharedInternalGraphQLObjectsReferenced.prisma,
			...extraPrismaReferences.values(),
		]),
	]

	const validPrismaObjs = prismases.filter((p) => prisma.has(p))
	if (validPrismaObjs.length) {
		dts.setImport("@prisma/client", { subImports: validPrismaObjs.map((p) => `${p} as P${p}`) })
	}

	const initialResult = dts.getResult()
	if (initialResult.includes("GraphQLResolveInfo")) {
		dts.setImport("graphql", { subImports: ["GraphQLResolveInfo"] })
	}

	if (initialResult.includes("RedwoodGraphQLContext")) {
		dts.setImport("@redwoodjs/graphql-server/dist/types", { subImports: ["RedwoodGraphQLContext"] })
	}

	if (sharedInternalGraphQLObjectsReferenced.types.length || extraSharedFileImportReferences.size) {
		const source = `./${settings.sharedInternalFilename.replace(".d.ts", "")}`
		dts.setImport(source, {
			subImports: [
				...sharedInternalGraphQLObjectsReferenced.types.map((t) => `${t} as RT${t}`),
				...[...extraSharedFileImportReferences.values()].map((t) => ("name" in t && t.name ? `${t.import} as ${t.name}` : t.import)),
			],
		})
	}

	if (sharedGraphQLObjectsReferencedTypes.length) {
		const source = `./${settings.sharedFilename.replace(".d.ts", "")}`
		dts.setImport(source, { subImports: sharedGraphQLObjectsReferencedTypes })
	}

	serviceFacts.set(fileKey, thisFact)

	const dtsFilename = filename.endsWith(".ts") ? filename.replace(".ts", ".d.ts") : filename.replace(".js", ".d.ts")
	const dtsFilepath = context.join(context.pathSettings.typesFolderRoot, dtsFilename)

	// Some manual formatting tweaks so we align with Redwood's setup more
	const final = dts.getResult()

	const shouldWriteDTS = !!final.trim().length
	if (!shouldWriteDTS) return

	const formatted = final // await formatDTS(dtsFilepath, dts)

	// Don't make a file write if the content is the same
	const priorContent = context.sys.readFile(dtsFilename)
	if (priorContent === formatted) return

	context.sys.writeFile(dtsFilepath, formatted)
	return dtsFilepath

	function addDefinitionsForTopLevelResolvers(parentName: string, config: ResolverFuncFact, dts: TSBuilder) {
		const { name } = config
		let field = queryType.getFields()[name]
		if (!field) {
			field = mutationType.getFields()[name]
		}

		const nodeDocs = field.astNode
			? ["SDL: " + graphql.print(field.astNode)]
			: ["@deprecated: Could not find this field in the schema for Mutation or Query"]
		const interfaceName = `${capitalizeFirstLetter(config.name)}Resolver`

		const args = createAndReferOrInlineArgsForField(field, {
			name: interfaceName,
			dts,
			mapper: externalMapper.map,
		})

		if (parentName === queryType.name) knownSpecialCasesForGraphQL.add(queryType.name)
		if (parentName === mutationType.name) knownSpecialCasesForGraphQL.add(mutationType.name)

		const argsParam = args ?? "object"
		const qForInfos = config.infoParamType === "just_root_destructured" ? "?" : ""
		const returnType = returnTypeForResolver(returnTypeMapper, field, config)

		dts.rootScope.addInterface(
			interfaceName,
			[
				{
					type: "call-signature",
					optional: config.funcArgCount < 1,
					returnType,
					params: [
						{ name: "args", type: argsParam, optional: config.funcArgCount < 1 },
						{
							name: "obj",
							type: `{ root: ${parentName}, context${qForInfos}: RedwoodGraphQLContext, info${qForInfos}: GraphQLResolveInfo }`,
							optional: config.funcArgCount < 2,
						},
					],
				},
			],
			{
				exported: true,
				docs: nodeDocs.join(" "),
			}
		)
	}

	/** Ideally, we want to be able to write the type for just the object  */
	function addCustomTypeModel(modelFacts: ModelResolverFacts) {
		const modelName = modelFacts.typeName
		extraPrismaReferences.add(modelName)

		// Make an interface, this is the version we are replacing from graphql-codegen:
		// Account: MergePrismaWithSdlTypes<PrismaAccount, MakeRelationsOptional<Account, AllMappedModels>, AllMappedModels>;
		const gqlType = gql.getType(modelName)
		if (!gqlType) {
			// throw new Error(`Could not find a GraphQL type named ${d.getName()}`);
			// fileDTS.addStatements(`\n// ${modelName} does not exist in the schema`)
			return
		}

		if (!graphql.isObjectType(gqlType)) {
			throw new Error(`In your schema ${modelName} is not an object, which we can only make resolver types for`)
		}

		const fields = gqlType.getFields()

		// See:   https://github.com/redwoodjs/redwood/pull/6228#issue-1342966511
		// For more ideas

		const hasGenerics = modelFacts.hasGenericArg

		const resolverInterface = dts.rootScope.addInterface(`${modelName}TypeResolvers`, [], {
			exported: true,
			generics: hasGenerics ? [{ name: "Extended" }] : [],
		})

		// Handle extending classes in the runtime which only exist in SDL
		const parentIsPrisma = prisma.has(modelName)
		if (!parentIsPrisma) extraSharedFileImportReferences.add({ name: `S${modelName}`, import: modelName })
		const suffix = parentIsPrisma ? "P" : "S"

		const parentTypeString = `${suffix}${modelName} ${createParentAdditionallyDefinedFunctions()} ${hasGenerics ? " & Extended" : ""}`

		/**
        type CurrentUserAccountAsParent<Extended> = SCurrentUserAccount & {
            users: () => PUser[] | Promise<PUser[]> | (() => Promise<PUser[]>);
            registeredPublishingPartner: () => Promise<PPublishingPartner | null>;
            subIsViaGift: () => boolean | Promise<boolean> | (() => Promise<boolean>);
        }
        */

		dts.rootScope.addTypeAlias(`${modelName}AsParent`, t.tsTypeReference(t.identifier(parentTypeString)), {
			generics: hasGenerics ? [{ name: "Extended" }] : [],
		})
		const modelFieldFacts = fieldFacts.get(modelName) ?? {}

		// Loop through the resolvers, adding the fields which have resolvers implemented in the source file
		modelFacts.resolvers.forEach((resolver) => {
			const field = fields[resolver.name]
			if (field) {
				const fieldName = resolver.name
				if (modelFieldFacts[fieldName]) modelFieldFacts[fieldName].hasResolverImplementation = true
				else modelFieldFacts[fieldName] = { hasResolverImplementation: true }

				const argsType = inlineArgsForField(field, { mapper: externalMapper.map }) ?? "undefined"
				const param = hasGenerics ? "<Extended>" : ""

				const firstQ = resolver.funcArgCount < 1 ? "?" : ""
				const secondQ = resolver.funcArgCount < 2 ? "?" : ""
				const qForInfos = resolver.infoParamType === "just_root_destructured" ? "?" : ""

				const innerArgs = `args${firstQ}: ${argsType}, obj${secondQ}: { root: ${modelName}AsParent${param}, context${qForInfos}: RedwoodGraphQLContext, info${qForInfos}: GraphQLResolveInfo }`
				const returnType = returnTypeForResolver(returnTypeMapper, field, resolver)
				const args = resolver.isFunc || resolver.isUnknown ? `(${innerArgs}) => ${returnType ?? "any"}` : returnType

				const docs = field.astNode ? `SDL: ${graphql.print(field.astNode)}` : ""
				const property = t.tsPropertySignature(t.identifier(fieldName), t.tsTypeAnnotation(t.tsTypeReference(t.identifier(args))))
				t.addComment(property, "leading", " " + docs)

				resolverInterface.body.body.push(property)
			} else {
				resolverInterface.body.body.push(
					t.tsPropertySignature(t.identifier(resolver.name), t.tsTypeAnnotation(t.tsTypeReference(t.identifier("void"))))
				)
			}
		})

		function createParentAdditionallyDefinedFunctions() {
			const fns: string[] = []
			modelFacts.resolvers.forEach((resolver) => {
				const existsInGraphQLSchema = fields[resolver.name]
				if (!existsInGraphQLSchema) {
					console.warn(
						`The service file ${filename} has a field ${resolver.name} on ${modelName} that does not exist in the generated schema.graphql`
					)
				}

				const prefix = !existsInGraphQLSchema ? "\n// This field does not exist in the generated schema.graphql\n" : ""
				const returnType = returnTypeForResolver(externalMapper, existsInGraphQLSchema, resolver)
				// fns.push(`${prefix}${resolver.name}: () => Promise<${externalMapper.map(type, {})}>`)
				fns.push(`${prefix}${resolver.name}: () => ${returnType}`)
			})

			if (fns.length < 1) return ""
			return "& {" + fns.join(", \n") + "}"
		}

		fieldFacts.set(modelName, modelFieldFacts)
	}
}

function returnTypeForResolver(mapper: TypeMapper, field: graphql.GraphQLField<unknown, unknown> | undefined, resolver: ResolverFuncFact) {
	if (!field) return "void"

	const tType = mapper.map(field.type, { preferNullOverUndefined: true, typenamePrefix: "RT" }) ?? "void"

	let returnType = tType
	const all = `${tType} | Promise<${tType}> | (() => Promise<${tType}>)`

	if (resolver.isFunc && resolver.isAsync) returnType = `Promise<${tType}>`
	else if (resolver.isFunc && resolver.isObjLiteral) returnType = tType
	else if (resolver.isFunc) returnType = all
	else if (resolver.isObjLiteral) returnType = tType
	else if (resolver.isUnknown) returnType = all

	return returnType
}
/* eslint-enable @typescript-eslint/no-unnecessary-condition */
