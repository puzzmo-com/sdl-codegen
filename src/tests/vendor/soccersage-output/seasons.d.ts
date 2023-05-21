import type { CreateSeasonInput, UpdateSeasonInput } from "./shared-schema-types";
import type { Season as RTSeason, Prediction as RTPrediction } from "./shared-return-types";
import type { Prediction as PPrediction, Season as PSeason } from "@prisma/client";
import type { GraphQLResolveInfo } from "graphql";
import type { RedwoodGraphQLContext } from "@redwoodjs/graphql-server/dist/functions/types";

/** SDL: seasons: [Season!]! */
export interface SeasonsResolver {
  (args?: object, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTSeason[] | Promise<RTSeason[]> | (() => Promise<RTSeason[]>);
}

/** SDL: season(id: Int!): Season */
export interface SeasonResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTSeason | null | Promise<RTSeason | null> | (() => Promise<RTSeason | null>);
}

/** SDL: createSeason(input: CreateSeasonInput!): Season! */
export interface CreateSeasonResolver {
  (args: { input: CreateSeasonInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTSeason | Promise<RTSeason> | (() => Promise<RTSeason>);
}

/** SDL: updateSeason(id: Int!, input: UpdateSeasonInput!): Season! */
export interface UpdateSeasonResolver {
  (args: { id: number, input: UpdateSeasonInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTSeason | Promise<RTSeason> | (() => Promise<RTSeason>);
}

/** SDL: deleteSeason(id: Int!): Season! */
export interface DeleteSeasonResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTSeason | Promise<RTSeason> | (() => Promise<RTSeason>);
}

type SeasonAsParent = PSeason & {
  id: () => Promise<number>,
  name: () => Promise<string>,
  startDate: () => Promise<DateTime>,
  endDate: () => Promise<DateTime>,
  Prediction: () => Promise<Array<PPrediction>>
};

export interface SeasonTypeResolvers {

  /** SDL: id: Int! */
  id: (args: undefined, obj: { root: SeasonAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => number | Promise<number> | (() => Promise<number>);

  /** SDL: name: String! */
  name: (args: undefined, obj: { root: SeasonAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: startDate: DateTime! */
  startDate: (args: undefined, obj: { root: SeasonAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => DateTime | Promise<DateTime> | (() => Promise<DateTime>);

  /** SDL: endDate: DateTime! */
  endDate: (args: undefined, obj: { root: SeasonAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => DateTime | Promise<DateTime> | (() => Promise<DateTime>);

  /** SDL: Prediction: [Prediction]! */
  Prediction: (args: undefined, obj: { root: SeasonAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Array<RTPrediction> | Promise<Array<RTPrediction>> | (() => Promise<Array<RTPrediction>>);
}

type DateTime = any;
