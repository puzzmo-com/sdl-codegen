import type { CreateTeamInput, UpdateTeamInput } from "./shared-schema-types";
import type { Team as RTTeam, Prediction as RTPrediction, Game as RTGame } from "./shared-return-types";
import type { Prediction as PPrediction, Game as PGame, Team as PTeam } from "@prisma/client";
import type { GraphQLResolveInfo } from "graphql";
import type { RedwoodGraphQLContext } from "@redwoodjs/graphql-server/dist/functions/types";

/** SDL: teams: [Team!]! */
export interface TeamsResolver {
  (args?: object, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTTeam[] | Promise<RTTeam[]> | (() => Promise<RTTeam[]>);
}

/** SDL: team(id: Int!): Team */
export interface TeamResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTTeam | null | Promise<RTTeam | null> | (() => Promise<RTTeam | null>);
}

/** SDL: createTeam(input: CreateTeamInput!): Team! */
export interface CreateTeamResolver {
  (args: { input: CreateTeamInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTTeam | Promise<RTTeam> | (() => Promise<RTTeam>);
}

/** SDL: updateTeam(id: Int!, input: UpdateTeamInput!): Team! */
export interface UpdateTeamResolver {
  (args: { id: number, input: UpdateTeamInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTTeam | Promise<RTTeam> | (() => Promise<RTTeam>);
}

/** SDL: deleteTeam(id: Int!): Team! */
export interface DeleteTeamResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTTeam | Promise<RTTeam> | (() => Promise<RTTeam>);
}

type TeamAsParent = PTeam & {
  id: () => Promise<number>,
  name: () => Promise<string>,
  logoUrl: () => Promise<string | undefined>,
  Prediction: () => Promise<Array<PPrediction>>,
  homeTeamGames: () => Promise<Array<PGame>>,
  awayTeamGames: () => Promise<Array<PGame>>
};

export interface TeamTypeResolvers {

  /** SDL: id: Int! */
  id: (args: undefined, obj: { root: TeamAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => number | Promise<number> | (() => Promise<number>);

  /** SDL: name: String! */
  name: (args: undefined, obj: { root: TeamAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: logoUrl: String */
  logoUrl: (args: undefined, obj: { root: TeamAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | null | Promise<string | null> | (() => Promise<string | null>);

  /** SDL: Prediction: [Prediction]! */
  Prediction: (args: undefined, obj: { root: TeamAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Array<RTPrediction> | Promise<Array<RTPrediction>> | (() => Promise<Array<RTPrediction>>);

  /** SDL: homeTeamGames: [Game]! */
  homeTeamGames: (args: undefined, obj: { root: TeamAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Array<RTGame> | Promise<Array<RTGame>> | (() => Promise<Array<RTGame>>);

  /** SDL: awayTeamGames: [Game]! */
  awayTeamGames: (args: undefined, obj: { root: TeamAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Array<RTGame> | Promise<Array<RTGame>> | (() => Promise<Array<RTGame>>);
}
