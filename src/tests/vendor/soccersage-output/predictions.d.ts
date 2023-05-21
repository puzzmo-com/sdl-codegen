import type { CreatePredictionInput, UpdatePredictionInput } from "./shared-schema-types";
import type { StandingsResult as RTStandingsResult, Prediction as RTPrediction, User as RTUser, Team as RTTeam, Game as RTGame } from "./shared-return-types";
import type { User as PUser, Team as PTeam, Game as PGame, Prediction as PPrediction } from "@prisma/client";
import type { GraphQLResolveInfo } from "graphql";
import type { RedwoodGraphQLContext } from "@redwoodjs/graphql-server/dist/functions/types";

/** SDL: standings(seasonId: Int!): StandingsResult */
export interface StandingsResolver {
  (args: { seasonId: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): Promise<RTStandingsResult | null>;
}

/** SDL: predictions: [Prediction!]! */
export interface PredictionsResolver {
  (args?: object, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTPrediction[] | Promise<RTPrediction[]> | (() => Promise<RTPrediction[]>);
}

/** SDL: myPredictions: [Prediction!]! */
export interface MyPredictionsResolver {
  (args: object, obj: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTPrediction[] | Promise<RTPrediction[]> | (() => Promise<RTPrediction[]>);
}

/** SDL: prediction(id: Int!): Prediction */
export interface PredictionResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTPrediction | null | Promise<RTPrediction | null> | (() => Promise<RTPrediction | null>);
}

/** SDL: createPrediction(input: CreatePredictionInput!): Prediction! */
export interface CreatePredictionResolver {
  (args: { input: CreatePredictionInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTPrediction | Promise<RTPrediction> | (() => Promise<RTPrediction>);
}

/** SDL: updatePrediction(id: Int!, input: UpdatePredictionInput!): Prediction! */
export interface UpdatePredictionResolver {
  (args: { id: number, input: UpdatePredictionInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTPrediction | Promise<RTPrediction> | (() => Promise<RTPrediction>);
}

/** SDL: deletePrediction(id: Int!): Prediction! */
export interface DeletePredictionResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTPrediction | Promise<RTPrediction> | (() => Promise<RTPrediction>);
}

type PredictionAsParent = PPrediction & {
  id: () => Promise<number>,
  teamId: () => Promise<number | undefined>,
  gameId: () => Promise<number>,
  userId: () => Promise<number>,
  prediction: () => Promise<string>,
  user: () => Promise<PUser | undefined>,
  team: () => Promise<PTeam | undefined>,
  game: () => Promise<PGame>
};

export interface PredictionTypeResolvers {

  /** SDL: id: Int! */
  id: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => number | Promise<number> | (() => Promise<number>);

  /** SDL: teamId: Int */
  teamId: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => number | null | Promise<number | null> | (() => Promise<number | null>);

  /** SDL: gameId: Int! */
  gameId: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => number | Promise<number> | (() => Promise<number>);

  /** SDL: userId: Int! */
  userId: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => number | Promise<number> | (() => Promise<number>);

  /** SDL: prediction: String! */
  prediction: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: user: User */
  user: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => RTUser | null | Promise<RTUser | null> | (() => Promise<RTUser | null>);

  /** SDL: team: Team */
  team: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => RTTeam | null | Promise<RTTeam | null> | (() => Promise<RTTeam | null>);

  /** SDL: game: Game! */
  game: (args: undefined, obj: { root: PredictionAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => RTGame | Promise<RTGame> | (() => Promise<RTGame>);
}
