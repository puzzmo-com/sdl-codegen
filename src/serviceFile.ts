import * as graphql from "graphql"
import * as tsMorph from "ts-morph"

import { AppContext } from "./context.js"
import { getCodeFactsForJSTSFileAtPath } from "./serviceFile.codefacts.js"
import { CodeFacts, FieldFacts, ModelResolverFacts, ResolverFuncFact } from "./typeFacts.js"
import { typeMapper } from "./typeMap.js"
import { capitalizeFirstLetter, createAndReferOrInlineArgsForField, inlineArgsForField } from "./utils.js"

export const lookAtServiceFile = (file: string, context: AppContext) => {
	const { gql, prisma, settings, serviceFacts } = context

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!gql) throw new Error(`No schema when wanting to look at service file: ${file}`)
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!prisma) throw new Error(`No prisma schema when wanting to look at service file: ${file}`)

	// This isn't good enough, needs to be relative to api/src/services
	const fileKey = file.replace(settings.apiServicesPath, "")

	// const priorFacts = serviceInfo.get(fileKey)
	const thisFact: CodeFacts = {}

	const filename = context.basename(file)

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const queryType = gql.getQueryType()!
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!queryType) throw new Error("No query type")

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const mutationType = gql.getMutationType()!
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!mutationType) throw new Error("No mutation type")

	const externalMapper = typeMapper(context, { preferPrismaModels: true })
	const returnTypeMapper = typeMapper(context, {})

	const fileFacts = getCodeFactsForJSTSFileAtPath(file, context)

	const extraPrismaReferences = new Set<string>()

	const fileDTS = context.tsProject.createSourceFile(`source/${fileKey}.d.ts`, "", { overwrite: true })

	const rootResolvers = fileFacts.maybe_query_mutation?.resolvers

	// Add the root function declarations
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
	Object.keys(fileFacts).forEach((modelName) => {
		if (modelName === "maybe_query_mutation") return

		const facts = fileFacts.modelName
		if (!facts) return
		addDefinitionsForTopLevelResolvers(facts.typeName, facts)
	})

	// Next all the capital consts
	// resolverContainers.forEach((c) => {
	// 	addCustomTypeResolvers(c, {})
	// })

	const sharedGraphQLObjectsReferenced = externalMapper.getReferencedGraphQLThingsInMapping()
	if (sharedGraphQLObjectsReferenced.types.length) {
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: `./${settings.sharedFilename.replace(".d.ts", "")}`,
			namedImports: sharedGraphQLObjectsReferenced.types,
		})
	}

	const sharedInternalGraphQLObjectsReferenced = returnTypeMapper.getReferencedGraphQLThingsInMapping()
	if (sharedInternalGraphQLObjectsReferenced.types.length) {
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: `./${settings.sharedInternalFilename.replace(".d.ts", "")}`,
			namedImports: sharedInternalGraphQLObjectsReferenced.types.map((t) => `${t} as RT${t}`),
		})
	}

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

	if (prismases.length) {
		fileDTS.addImportDeclaration({
			isTypeOnly: true,
			moduleSpecifier: "@prisma/client",
			namedImports: prismases.map((p) => `${p} as P${p}`),
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
			moduleSpecifier: "@redwoodjs/graphql-server/dist/functions/types",
			namedImports: ["RedwoodGraphQLContext"],
		})
	}

	serviceFacts.set(fileKey, thisFact)

	const dtsFilename = filename.endsWith(".ts") ? filename.replace(".ts", ".d.ts") : filename.replace(".js", ".d.ts")

	fileDTS.formatText({ indentSize: 2 })
	context.sys.writeFile(context.join(context.settings.typesFolderRoot, dtsFilename), fileDTS.getText())
	return

	function addDefinitionsForTopLevelResolvers(parentName: string, config: ResolverFuncFact) {
		const { name } = config
		let field = queryType.getFields()[name]
		if (!field) {
			field = mutationType.getFields()[name]
		}

		const interfaceDeclaration = fileDTS.addInterface({
			name: `${capitalizeFirstLetter(parentName)}Resolver`,
			isExported: true,
			docs: ["SDL: " + graphql.print(field.astNode!)],
		})

		const args = createAndReferOrInlineArgsForField(field, {
			name: interfaceDeclaration.getName(),
			file: fileDTS,
			mapper: externalMapper.map,
		})

		const argsParam = args ?? "object"

		const tType = returnTypeMapper.map(field.type, { preferNullOverUndefined: true, typenamePrefix: "RT" })

		let returnType = tType
		const all = `${tType} | Promise<${tType}> | (() => Promise<${tType}>)`

		if (config.isFunc && config.isAsync) returnType = `Promise<${tType}>`
		else if (config.isFunc) returnType = all
		else if (config.isObjLiteral) returnType = tType
		else if (config.isUnknown) returnType = all

		interfaceDeclaration.addCallSignature({
			parameters: [
				{ name: "args", type: argsParam, hasQuestionToken: config.funcArgCount < 1 },
				{
					name: "obj",
					type: `{ root: ${parentName}, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }`,
					hasQuestionToken: config.funcArgCount < 2,
				},
			],
			returnType,
		})
	}

	function addCustomTypeResolvers(config: ModelResolverFacts) {
		const modelName  = config.typeName
		// config.resolvers.forEach((resolver) => {
			// const { name } = resolver
			// only do it if the first letter is a capital

			// Make an interface

			// Account: MergePrismaWithSdlTypes<PrismaAccount, MakeRelationsOptional<Account, AllMappedModels>, AllMappedModels>;
			const gqlType = gql.getType(modelName)
			if (!gqlType) {
				// throw new Error(`Could not find a GraphQL type named ${d.getName()}`);
				fileDTS.addStatements(`\n// ${d.getName()} does not exist in the schema`)
				return
			}

			if (!graphql.isObjectType(gqlType)) {
				throw new Error(`In your schema ${d.getName()} is not an object, which we can only make resolver types for`)
			}

			const fields = gqlType.getFields()

			extraPrismaReferences.add(name)

			// See:   https://github.com/redwoodjs/redwood/pull/6228#issue-1342966511
			// For more ideas

			const fieldFromASTKey = (key: (typeof keys)[number]) => {
				const existsInGraphQLSchema = fields[key.name]
				const type = existsInGraphQLSchema ? fields[key.name].type : new graphql.GraphQLScalarType({ name: "JSON" })
				if (!existsInGraphQLSchema) {
					console.warn(
						`The service file ${filename} has a field ${key.name} on ${name} that does not exist in the generated schema.graphql`
					)
				}

				const prefix = !existsInGraphQLSchema ? "\n// This field does not exist in the generated schema.graphql\n" : ""
				return `${prefix}${key.name}: () => Promise<${externalMapper.map(type, {})}>`
			}

			fileDTS.addTypeAlias({
				name: `${name}AsParent`,
				typeParameters: hasGenericArgs ? ["Extended"] : [],
				type: `P${name} & { ${keys.map(fieldFromASTKey).join(", \n") + `} ` + (hasGenericArgs ? " & Extended" : "")}`,
			})

			const resolverInterface = fileDTS.addInterface({
				name: `${name}TypeResolvers`,
				typeParameters: hasGenericArgs ? ["Extended"] : [],
				isExported: true,
			})

			keys.forEach((key) => {
				const { name: fieldName, info } = key
				const field = fields[fieldName]
				if (field) {
					if (fieldFacts[fieldName]) fieldFacts[fieldName].hasResolverImplementation = true
					else fieldFacts[fieldName] = { hasResolverImplementation: true }

					const argsType = inlineArgsForField(field, { mapper: externalMapper.map })
					const param = hasGenericArgs ? "<Extended>" : ""

					const firstQ = info.funcArgCount < 1 ? "?" : ""
					const secondQ = info.funcArgCount < 2 ? "?" : ""
					const innerArgs = `args${firstQ}: ${argsType}, obj${secondQ}: { root: ${name}AsParent${param}, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }`

					const tType = returnTypeMapper.map(field.type, { preferNullOverUndefined: true, typenamePrefix: "RT" })

					let returnType = tType
					const all = `=> ${tType} | Promise<${tType}> | (() => Promise<${tType}>)`

					if (info.isFunc && info.isAsync) returnType = ` => Promise<${tType}>`
					else if (info.isFunc) returnType = all
					else if (info.isObjLiteral) returnType = tType
					else if (info.isUnknown) returnType = all

					resolverInterface.addProperty({
						name: fieldName,
						leadingTrivia: "\n",
						docs: ["SDL: " + graphql.print(field.astNode!)],
						type: info.isFunc || info.isUnknown ? `(${innerArgs}) ${returnType}` : returnType,
					})
				} else {
					resolverInterface.addCallSignature({
						docs: [` @deprecated: SDL ${d.getName()}.${fieldName} does not exist in your schema`],
					})
				}
			})

			context.fieldFacts.set(d.getName(), fieldFacts)
		})
	}
}
