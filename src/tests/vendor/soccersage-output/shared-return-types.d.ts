import type { Game as PGame, Prediction as PPrediction, Season as PSeason, Team as PTeam, User as PUser } from "@prisma/client";

// You may very reasonably ask yourself, 'what is this file?' and why do I need it.

// Roughly, this file ensures that when a resolver wants to return a type - that
// type will match a prisma model. This is useful because you can trivially extend
// the type in the SDL and not have to worry about type mis-matches because the thing
// you returned does not include those functions.

// This gets particularly useful when you want to return a union type, an interface, 
// or a model where the prisma model is nested pretty deeply (connections, for example.)
export interface CreateGameInput {
  __typename?: "CreateGameInput";
  awayTeamId: number;
  awayTeamScore?: number | null;
  homeTeamId: number;
  homeTeamScore?: number | null;
  isCompleted?: boolean | null;
  seasonId: number;
  startDateTime: DateTime;
}

export interface CreatePredictionInput {
  __typename?: "CreatePredictionInput";
  gameId: number;
  prediction: string;
  seasonId: number;
  teamId?: number | null;
  userId: number;
}

export interface CreateSeasonInput {
  __typename?: "CreateSeasonInput";
  endDate: DateTime;
  name: string;
  startDate: DateTime;
}

export interface CreateTeamInput {
  __typename?: "CreateTeamInput";
  logoUrl?: string | null;
  name: string;
}

export interface CreateUserInput {
  __typename?: "CreateUserInput";
  email: string;
  hashedPassword: string;
  resetToken?: string | null;
  resetTokenExpiresAt?: DateTime | null;
  roles: string;
  salt: string;
  username: string;
}

export interface Mutation {
  __typename?: "Mutation";
  createGame: PGame;
  createPrediction: PPrediction;
  createSeason: PSeason;
  createTeam: PTeam;
  createUser: PUser;
  deleteGame: PGame;
  deletePrediction: PPrediction;
  deleteSeason: PSeason;
  deleteTeam: PTeam;
  deleteUser: PUser;
  resetPassword: PUser;
  sendResetPasswordEmail?: SuccessInput | null;
  updateGame: PGame;
  updatePrediction: PPrediction;
  updateSeason: PSeason;
  updateTeam: PTeam;
  updateUser: PUser;
}

export interface Query {
  __typename?: "Query";
  game?: PGame | null;
  games: PGame[];
  myPredictions: PPrediction[];
  prediction?: PPrediction | null;
  predictions: PPrediction[];
  redwood?: Redwood | null;
  season?: PSeason | null;
  seasons: PSeason[];
  standings?: StandingsResult | null;
  team?: PTeam | null;
  teams: PTeam[];
  upcomingGames: PGame[];
  user?: PUser | null;
  users: PUser[];
}

export interface Redwood {
  __typename?: "Redwood";
  currentUser?: JSON | null;
  prismaVersion?: string | null;
  version?: string | null;
}

export interface StandingsData {
  __typename?: "StandingsData";
  email: string;
  score: number;
  userId: string;
  username: string;
}

export interface StandingsResult {
  __typename?: "StandingsResult";
  userIdRankings: StandingsData[];
}

export interface SuccessInput {
  __typename?: "SuccessInput";
  message?: string | null;
  success?: boolean | null;
}

export interface UpdateGameInput {
  __typename?: "UpdateGameInput";
  awayTeamId?: number | null;
  awayTeamScore?: number | null;
  homeTeamId?: number | null;
  homeTeamScore?: number | null;
  isCompleted?: boolean | null;
  seasonId?: number | null;
  startDateTime?: DateTime | null;
}

export interface UpdatePredictionInput {
  __typename?: "UpdatePredictionInput";
  gameId?: number | null;
  prediction?: string | null;
  teamId?: number | null;
  userId?: number | null;
}

export interface UpdateSeasonInput {
  __typename?: "UpdateSeasonInput";
  endDate?: DateTime | null;
  name?: string | null;
  startDate?: DateTime | null;
}

export interface UpdateTeamInput {
  __typename?: "UpdateTeamInput";
  logoUrl?: string | null;
  name?: string | null;
}

export interface UpdateUserInput {
  __typename?: "UpdateUserInput";
  email?: string | null;
  hashedPassword?: string | null;
  resetToken?: string | null;
  resetTokenExpiresAt?: DateTime | null;
  roles?: string | null;
  salt?: string | null;
  username?: string | null;
}

type DateTime = any;
type JSON = any;
export type Game = PGame;
export type Prediction = PPrediction;
export type Season = PSeason;
export type Team = PTeam;
export type User = PUser;
