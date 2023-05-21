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

export interface Game {
  __typename?: "Game";
  awayTeam?: Team;
  awayTeamId: number;
  awayTeamScore?: number | null;
  homeTeam?: Team;
  homeTeamId: number;
  homeTeamScore?: number | null;
  id: number;
  isCompleted: boolean;
  predictions?: Array<Prediction>;
  season?: Season;
  seasonId: number;
  startDateTime: DateTime;
}

export interface Mutation {
  __typename?: "Mutation";
  createGame: Game;
  createPrediction: Prediction;
  createSeason: Season;
  createTeam: Team;
  createUser: User;
  deleteGame: Game;
  deletePrediction: Prediction;
  deleteSeason: Season;
  deleteTeam: Team;
  deleteUser: User;
  resetPassword: User;
  sendResetPasswordEmail?: SuccessInput | null;
  updateGame: Game;
  updatePrediction: Prediction;
  updateSeason: Season;
  updateTeam: Team;
  updateUser: User;
}

export interface Prediction {
  __typename?: "Prediction";
  game?: Game;
  gameId?: number;
  id?: number;
  prediction?: string;
  team?: Team | null;
  teamId?: number | null;
  user?: User | null;
  userId?: number;
}

export interface Query {
  __typename?: "Query";
  game?: Game | null;
  games: Game[];
  myPredictions: Prediction[];
  prediction?: Prediction | null;
  predictions: Prediction[];
  redwood?: Redwood | null;
  season?: Season | null;
  seasons: Season[];
  standings?: StandingsResult | null;
  team?: Team | null;
  teams: Team[];
  upcomingGames: Game[];
  user?: User | null;
  users: User[];
}

export interface Redwood {
  __typename?: "Redwood";
  currentUser?: JSON | null;
  prismaVersion?: string | null;
  version?: string | null;
}

export interface Season {
  __typename?: "Season";
  Prediction?: Array<Prediction>;
  endDate?: DateTime;
  id?: number;
  name?: string;
  startDate?: DateTime;
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

export interface Team {
  __typename?: "Team";
  Prediction?: Array<Prediction>;
  awayTeamGames?: Array<Game>;
  homeTeamGames?: Array<Game>;
  id?: number;
  logoUrl?: string | null;
  name?: string;
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

export interface User {
  __typename?: "User";
  email?: string;
  hashedPassword?: string;
  id?: number;
  predictions?: Array<Prediction>;
  resetToken?: string | null;
  resetTokenExpiresAt?: DateTime | null;
  roles?: string;
  salt?: string;
  username?: string;
}

type DateTime = any;
type JSON = any;
