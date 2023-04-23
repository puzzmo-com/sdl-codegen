<h1 align="center">SDL Codegen</h1>

<p align="center">GraphQL .d.ts file generation for SDL-first projects</p>

## Goals

The core idea is to have a codegen tool that can generate `.d.ts` files from GraphQL SDL files. This is useful for projects that use GraphQL SDL files as their source of truth, but still want to have type safety in their codebase. This project won't happen overnight.

**Step one** is here: https://github.com/orta/redwood-codegen-api-types/tree/main#how-to-use-this-in-a-redwood-project

**Step two** is to take the above and to start making it more generalized, but to still make it work well with RedwoodJS.

**Step three** will be to make Redwood just a config option.

## Pipeline

This app will be architected to be a pipeline of sorts. Here's the rough stages:

- Get inputs: GraphQL schema, files which we want to make .d.ts files for, Prisma dmmf and config
- Parse inputs: Parse the GraphQL schema, parse the files, parse the Prisma dmmf
- Generate outputs: Generate .d.ts files for the files we want to generate them for

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks! 💖

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.joshuakgoldberg.com"><img src="https://avatars.githubusercontent.com/u/3335181?v=4?s=100" width="100px;" alt="Josh Goldberg"/><br /><sub><b>Josh Goldberg</b></sub></a><br /><a href="#tool-JoshuaKGoldberg" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->
