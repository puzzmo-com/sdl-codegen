## Changelog

### 3.0.0

- Lol, yep, another major. Performance wise, we were not where I wanted us to be. We used to use ts-morph to create the `.d.ts` files but now we're using the TypeScript compiler aPI directly. This converts a ~8s built to under a second, but the slowest part of the process is ended up being the prettier formatting.

  So, I'm bailing on supporting a formatting pass in the code-gen'd files. This is _to some extent_ a breaking change, so I'm calling it a major.

### 2.0.0

- Redwood uses prettier 3, and prettier 3 removes the sync API. This means we now have to operate entirely async. This is a breaking change from the sdl-codegen API, as you need to await the exposed public fns.
- There is a verbose option which provides info on the timings of the codegen.
- Big watch mode improvements

### 1.1.2

Pulled back this a lot because its over-reaching:

- When a resolver is simply a fn to a literal, narrow to that exact type in the codegen (instead of keeping the optional promise type)

### 1.1.0

- Adds a watcher function to the return value of`createWatcher` which allows tools to be able to hook in and let SDL Codegen only re-generate what's needed.

- Adds a `verbose` flag which offers some timing logs, and watcher logs.

- Service file d.ts, and shared schema .d.ts' do not write to the file if the content hasn't changed to avoid triggering watchers.

- Better handling of modern prettier versions

- Improvements to codegen when using GraphQL types and interfaces in parent or return positions

- ~~When a resolver is simply a fn to a literal, narrow to that exact type in the codegen (instead of keeping the optional promise type)~~

### 1.0.2

- Better prettier detection (and fallback) for the generated files, re #14

### 1.0

- No changes

### 0.0.14

- Exports the types for GraphQL unions

### 0.0.13

- Adds support for generating unions in the shared file
- Fixes the references to enums in sdl args

### 0.0.10

- Service files do not trigger eslint warnings in (my) app OOTB
- Adds support for running prettier in the generated files.
- Fixes paths for the graphql types which come from `@redwoodjs/graphql-server`
- Does not create empty service .d.ts files
