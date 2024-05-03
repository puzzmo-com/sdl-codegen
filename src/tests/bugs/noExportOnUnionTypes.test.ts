import { expect, it } from "vitest"

import { getDTSFilesForRun, graphql, prisma } from "../testRunner.js"

it("It allows you to add a generic parameter", () => {
	const prismaSchema = prisma``

	const sdl = graphql`
		type Puzzle {
			completionRecommendations: [CompletionRecommendationItem!]!
		}

		type CompletionPuzzleRecommendation {
			reason: String!
		}

		type CompletionSeriesPuzzleRecommendation {
			direction: Int!
			reason: String!
		}

		type CompletionRecommendation {
			id: String!
		}

		union CompletionRecommendationItem = CompletionRecommendation | CompletionPuzzleRecommendation
	`

	const { vfsMap } = getDTSFilesForRun({ sdl, prismaSchema, createSharedTypes: true })
	expect(vfsMap.get("/types/shared-schema-types.d.ts"))!.toMatchInlineSnapshot(`
		"export interface Puzzle {
		  __typename?: \\"Puzzle\\";
		  completionRecommendations:
		    | CompletionRecommendation
		    | CompletionPuzzleRecommendation[];
		}

		export interface CompletionPuzzleRecommendation {
		  __typename?: \\"CompletionPuzzleRecommendation\\";
		  reason: string;
		}

		export interface CompletionSeriesPuzzleRecommendation {
		  __typename?: \\"CompletionSeriesPuzzleRecommendation\\";
		  direction: number;
		  reason: string;
		}

		export interface CompletionRecommendation {
		  __typename?: \\"CompletionRecommendation\\";
		  id: string;
		}

		export interface Query {
		  __typename?: \\"Query\\";
		  _?: string | null;
		}

		export interface Mutation {
		  __typename?: \\"Mutation\\";
		  __?: string | null;
		}
		"
	`)
})
