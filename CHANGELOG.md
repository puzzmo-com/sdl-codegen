# Changelog

### 1.1.0

- Adds a watcher function to the return value of`createWatcher` which allows tools to be able to hook in and let SDL Codegen only re-generate what's needed.

- Adds a `verbose` flag which offers some timing logs, and watcher logs.

- Service file d.ts, and shared schema .d.ts' do not write to the file if the content hasn't changed to avoid triggering watchers.

- Better handling of modern prettier versions

- Improvements to codegen when using GraphQL types and interfaces in parent or return positions

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
