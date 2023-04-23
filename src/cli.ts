// import { parse, path } from "./deps.ts";
// import { run } from "./run.ts";

// const args = parse(Deno.args, {
//   boolean: [
//     "eslint-fix",
//     "rm-default-api-types",
//   ],
// });
// const params = args._;

// let appRoot = Deno.cwd();
// if (params.length > 0) {
//   appRoot = path.join(Deno.cwd(), params[0] as string);
// }

// let types = path.join(appRoot, "api/src/lib/types");
// if (params.length > 1) {
//   types = path.join(Deno.cwd(), params[1] as string);
// }

// run(appRoot, types, {
//   runESLint: !!args["eslint-fix"],
//   deleteOldGraphQLDTS: !!args["rm-default-api-types"],
// });
