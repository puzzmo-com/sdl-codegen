import type { CreateGameInput, UpdateGameInput } from "./shared-schema-types";
import type { Game as RTGame, Prediction as RTPrediction, Team as RTTeam, Season as RTSeason } from "./shared-return-types";
import type { Prediction as PPrediction, Team as PTeam, Season as PSeason, Game as PGame } from "@prisma/client";
import type { GraphQLResolveInfo } from "graphql";
import type { RedwoodGraphQLContext } from "@redwoodjs/graphql-server/dist/functions/types";

/** SDL: games: [Game!]! */
export interface GamesResolver {
  (args: object, obj: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame[] | Promise<RTGame[]> | (() => Promise<RTGame[]>);
}

/** SDL: upcomingGames: [Game!]! */
export interface UpcomingGamesResolver {
  (args?: object, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame[] | Promise<RTGame[]> | (() => Promise<RTGame[]>);
}

/** SDL: game(id: Int!): Game */
export interface GameResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | null | Promise<RTGame | null> | (() => Promise<RTGame | null>);
}

/** SDL: createGame(input: CreateGameInput!): Game! */
export interface CreateGameResolver {
  (args: { input: CreateGameInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | Promise<RTGame> | (() => Promise<RTGame>);
}

/** SDL: updateGame(id: Int!, input: UpdateGameInput!): Game! */
export interface UpdateGameResolver {
  (args: { id: number, input: UpdateGameInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTGame | Promise<RTGame> | (() => Promise<RTGame>);
}

/** SDL: deleteGame(id: Int!): Game! */
export interface DeleteGameResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): Promise<RTGame>;
}

type GameAsParent<Extended> = PGame & {
  predictions: () => Promise<Array<PPrediction>>,
  homeTeam: () => Promise<PTeam>,
  awayTeam: () => Promise<PTeam>,
  season: () => Promise<PSeason>
} & Extended;

export interface GameTypeResolvers<Extended> {

  /** SDL: predictions: [Prediction]! */
  predictions: (args: undefined, obj: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Array<RTPrediction> | Promise<Array<RTPrediction>> | (() => Promise<Array<RTPrediction>>);

  /** SDL: homeTeam: Team! */
  homeTeam: (args: undefined, obj: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => RTTeam | Promise<RTTeam> | (() => Promise<RTTeam>);

  /** SDL: awayTeam: Team! */
  awayTeam: (args: undefined, obj: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => RTTeam | Promise<RTTeam> | (() => Promise<RTTeam>);

  /** SDL: season: Season! */
  season: (args: undefined, obj: { root: GameAsParent<Extended>, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => RTSeason | Promise<RTSeason> | (() => Promise<RTSeason>);
}
