<h1 align="center">SDL Codegen</h1>

<p align="center">GraphQL .d.ts file generation for SDL-first projects</p>

This project is for creating the `.d.ts` files for codebases where you have SDL like:

```graphql
export const schema = gql`
    type Game {
        id: ID!
        homeTeamID: Int!
        awayTeamID: Int!
        homeTeamScore: Int!
        awayTeamScore: Int!
    }

    type Query {
        games: [Game!]! @skipAuth
        upcomingGames: [Game!]! @skipAuth
        game(id: ID!): Game @requireAuth
    }
`
```

Then separately, you write functions like:

```ts
export const games = () => db.game.findMany({ orderBy: { startDateTime: "asc" } })

export const upcomingGames = () => db.game.findMany({ isCompleted: false, startDateTime: { gt: new Date() } })

export const game = ({ id }) => db.game.findUnique({ where: { id } })
```

This repo will create `.d.ts` files which very accurately, and very concisely represent the runtime for these functions. It's goal is to take all of the possible logic which might happen in the TypeScript type system, and pre-bake that into the output of the .d.ts files.

You could think of it as a smaller, more singular focused version of the mature and well-featured [graphql-codgen](https://the-guild.dev/graphql/codegen).

## Vision

This repo provides the APIs for building a codegen for framework authors, and the goal is not to provide a CLI for a generalized use-case.

**Step one** is here (which is a CLi you can use): https://github.com/orta/redwood-codegen-api-types/tree/main#how-to-use-this-in-a-redwood-project

**Step two** is to take the above and to start making it more generalized, but to still make it work well with RedwoodJS. **We are currently here.**

**Step three** will be to make Redwood just a config option, Prisma support be some sort of plugin/option, and welcome folks who want to use this for other projects.

## Pipeline

This app is architected as a pipeline of sorts. Here's the rough stages:

- Get inputs: GraphQL schema, the source files to represent, Prisma dmmf and dts output config
- Parse inputs: Parse the GraphQL schema, parse source files into facts about the code, parse the Prisma dmmf
- Centralize data: Keep a central store of all of these things, and have specific updaters so that a watcher can be built.
- Generate outputs: Generate .d.ts files for the files we want to generate them for

It's still a bit of a work in progress to have these discrete steps, but it's getting there.

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).

Thanks!

## Deployment

Make a commit like: `git commit --allow-empty -m "feat: Prepare for release"`
