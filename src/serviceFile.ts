/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import * as graphql from "graphql"

import { AppContext } from "./context.js"
import { formatDTS } from "./formatDTS.js"
import { getCodeFactsForJSTSFileAtPath } from "./serviceFile.codefacts.js"
import { CodeFacts, ModelResolverFacts, ResolverFuncFact } from "./typeFacts.js"
import { TypeMapper, typeMapper } from "./typeMap.js"
import { capitalizeFirstLetter, createAndReferOrInlineArgsForField, inlineArgsForField } from "./utils.js"

export const lookAtServiceFile = async (file: string, context: AppContext) => {
	const { gql, prisma, pathSettings: settings, codeFacts: serviceFacts, fieldFacts } = context

	if (!gql) throw new Error(`No schema when wanting to look at service file: ${file}`)
	if (!prisma) throw new Error(`No prisma schema when wanting to look at service file: ${file}`)

	// This isn't good enough, needs to be relative to api/src/services
	const fileKey = file.replace(settings.apiServicesPath, "")

	const thisFact: CodeFacts = {}

	const filename = context.basename(file)

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

	// The file we'll be creating in-memory throughout this fn
	const fileDTS = context.tsProject.createSourceFile(`source/${fileKey}.d.ts`, "", { overwrite: true })

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
				addDefinitionsForTopLevelResolvers(parentName, v)
			} else {
				// Add warning about unused resolver
				fileDTS.addStatements(`\n// ${v.name} does not exist on Query or Mutation`)
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
	if (aliases.length) {
		fileDTS.addTypeAliases(
			aliases.map((s) => ({
				name: s,
				type: "any",
			}))
		)
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
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: "@prisma/client",
			namedImports: validPrismaObjs.map((p) => `${p} as P${p}`),
		})
	}

	if (fileDTS.getText().includes("GraphQLResolveInfo")) {
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: "graphql",
			namedImports: ["GraphQLResolveInfo"],
		})
	}

	if (fileDTS.getText().includes("RedwoodGraphQLContext")) {
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: "@redwoodjs/graphql-server/dist/types",
			namedImports: ["RedwoodGraphQLContext"],
		})
	}

	if (sharedInternalGraphQLObjectsReferenced.types.length || extraSharedFileImportReferences.size) {
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: `./${settings.sharedInternalFilename.replace(".d.ts", "")}`,
			namedImports: [
				...sharedInternalGraphQLObjectsReferenced.types.map((t) => `${t} as RT${t}`),
				...[...extraSharedFileImportReferences.values()].map((t) => ("name" in t && t.name ? `${t.import} as ${t.name}` : t.import)),
			],
		})
	}

	if (sharedGraphQLObjectsReferencedTypes.length) {
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: `./${settings.sharedFilename.replace(".d.ts", "")}`,
			namedImports: sharedGraphQLObjectsReferencedTypes,
		})
	}

	serviceFacts.set(fileKey, thisFact)

	const dtsFilename = filename.endsWith(".ts") ? filename.replace(".ts", ".d.ts") : filename.replace(".js", ".d.ts")
	const dtsFilepath = context.join(context.pathSettings.typesFolderRoot, dtsFilename)

	// Some manual formatting tweaks so we align with Redwood's setup more
	const dts = fileDTS
		.getText()
		.replace(`from "graphql";`, `from "graphql";\n`)
		.replace(`from "@redwoodjs/graphql-server/dist/types";`, `from "@redwoodjs/graphql-server/dist/types";\n`)

	const shouldWriteDTS = !!dts.trim().length
	if (!shouldWriteDTS) return

	const formatted = await formatDTS(dtsFilepath, dts)

	// Don't make a file write if the content is the same
	const priorContent = context.sys.readFile(dtsFilename)
	if (priorContent === formatted) return

	context.sys.writeFile(dtsFilepath, formatted)
	return dtsFilepath

	function addDefinitionsForTopLevelResolvers(parentName: string, config: ResolverFuncFact) {
		const { name } = config
		let field = queryType.getFields()[name]
		if (!field) {
			field = mutationType.getFields()[name]
		}

		const interfaceDeclaration = fileDTS.addInterface({
			name: `${capitalizeFirstLetter(config.name)}Resolver`,
			isExported: true,
			docs: field.astNode
				? ["SDL: " + graphql.print(field.astNode)]
				: ["@deprecated: Could not find this field in the schema for Mutation or Query"],
		})

		const args = createAndReferOrInlineArgsForField(field, {
			name: interfaceDeclaration.getName(),
			file: fileDTS,
			mapper: externalMapper.map,
		})

		if (parentName === queryType.name) knownSpecialCasesForGraphQL.add(queryType.name)
		if (parentName === mutationType.name) knownSpecialCasesForGraphQL.add(mutationType.name)

		const argsParam = args ?? "object"
		const qForInfos = config.infoParamType === "just_root_destructured" ? "?" : ""
		const returnType = returnTypeForResolver(returnTypeMapper, field, config)

		interfaceDeclaration.addCallSignature({
			parameters: [
				{ name: "args", type: argsParam, hasQuestionToken: config.funcArgCount < 1 },
				{
					name: "obj",
					type: `{ root: ${parentName}, context${qForInfos}: RedwoodGraphQLContext, info${qForInfos}: GraphQLResolveInfo }`,
					hasQuestionToken: config.funcArgCount < 2,
				},
			],
			returnType,
		})
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
			fileDTS.addStatements(`\n// ${modelName} does not exist in the schema`)
			return
		}

		if (!graphql.isObjectType(gqlType)) {
			throw new Error(`In your schema ${modelName} is not an object, which we can only make resolver types for`)
		}

		const fields = gqlType.getFields()

		// See:   https://github.com/redwoodjs/redwood/pull/6228#issue-1342966511
		// For more ideas

		const hasGenerics = modelFacts.hasGenericArg

		// This is what they would have to write
		const resolverInterface = fileDTS.addInterface({
			name: `${modelName}TypeResolvers`,
			typeParameters: hasGenerics ? ["Extended"] : [],
			isExported: true,
		})

		// Handle extending classes in the runtime which only exist in SDL
		const parentIsPrisma = prisma.has(modelName)
		if (!parentIsPrisma) extraSharedFileImportReferences.add({ name: `S${modelName}`, import: modelName })
		const suffix = parentIsPrisma ? "P" : "S"

		// The parent type for the resolvers
		fileDTS.addTypeAlias({
			name: `${modelName}AsParent`,
			typeParameters: hasGenerics ? ["Extended"] : [],
			type: `${suffix}${modelName} ${createParentAdditionallyDefinedFunctions()} ${hasGenerics ? " & Extended" : ""}`,
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

				const docs = field.astNode ? [`SDL: ${graphql.print(field.astNode)}`] : []
				// For speed we should switch this out to addProperties eventually
				resolverInterface.addProperty({
					name: fieldName,
					leadingTrivia: "\n",
					docs,
					type: resolver.isFunc || resolver.isUnknown ? `(${innerArgs}) => ${returnType ?? "any"}` : returnType,
				})
			} else {
				resolverInterface.addCallSignature({
					docs: [` @deprecated: SDL ${modelName}.${resolver.name} does not exist in your schema`],
				})
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
