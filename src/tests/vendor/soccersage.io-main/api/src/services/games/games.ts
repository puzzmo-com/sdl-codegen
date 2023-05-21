import type {
  CreateGameResolver,
  DeleteGameResolver,
  GameResolver,
  GamesResolver,
  UpcomingGamesResolver,
  UpdateGameResolver,
} from "../../../../../soccersage-output/games.d.ts";

import { db } from "src/lib/db";

export const games: GamesResolver = (args, obj) => {
  return db.game.findMany({
    orderBy: {
      startDateTime: "asc",
    },
  });
};

export const upcomingGames: UpcomingGamesResolver = () => {
  return db.game.findMany({
    where: { isCompleted: false, startDateTime: { gt: new Date() } },
  });
};

export const game: GameResolver = ({ id }) => {
  return db.game.findUnique({
    where: { id },
  });
};

export const createGame: CreateGameResolver = ({ input }) => {
  return db.game.create({
    data: input,
  });
};

export const updateGame: UpdateGameResolver = ({ id, input }) => {
  return db.game.update({
    data: input,
    where: { id },
  });
};

export const deleteGame: DeleteGameResolver = async ({ id }) => {
  await db.prediction.deleteMany({
    where: { gameId: id },
  });

  return db.game.delete({
    where: { id },
  });
};

export const Game: GameResolvers<{ predictions?: any[] }> = {
  predictions: (_obj, { root }) => db.game.findUnique({ where: { id: root.id } }).predictions(),
  homeTeam: (_obj, { root }) => db.game.findUnique({ where: { id: root.id } }).homeTeam(),
  awayTeam: (_obj, { root }) => db.game.findUnique({ where: { id: root.id } }).awayTeam(),
  season: (_obj, { root }) => db.game.findUnique({ where: { id: root.id } }).season(),
};
