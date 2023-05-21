import type {
    Game,
    MutationResolvers,
    Prediction as PredictionType,
    PredictionResolvers,
    QueryResolvers,
    User,
} from 'types/graphql';

import { getFirstUserFromContext } from 'src/lib/auth';
import { db } from 'src/lib/db';

type PartialGame = Omit<
    Game,
    'homeTeam' | 'awayTeam' | 'predictions' | 'season'
>;
type PartialUser = Omit<User, 'predictions' | 'resetTokenExpiresAt'>;

type PartialPrediction = Omit<PredictionType, 'game' | 'user'> & {
    game: PartialGame;
    user: PartialUser;
};

//TODO: Re-use these functions from the PredictionCard
const getWinningTeamId = (game: PartialGame) => {
    if (game.homeTeamScore > game.awayTeamScore) {
        return game.homeTeamId;
    } else if (game.awayTeamScore > game.homeTeamScore) {
        return game.awayTeamId;
    }

    return null;
};

const getPredictionStatus = (
    prediction: PartialPrediction
): 'incomplete' | 'correct' | 'incorrect' => {
    if (!prediction.game.isCompleted) {
        return 'incomplete';
    }

    const winningTeamId = getWinningTeamId(prediction.game);

    return winningTeamId === prediction.teamId ? 'correct' : 'incorrect';
};

export const standings: QueryResolvers['standings'] = async ({ seasonId }) => {
    // TODO: This logic finds all predictions, and includes the associated game for each prediction.
    // While this works with small amounts of data, this will not scale very well, due to the
    // re-retrieval of game data for each prediction.
    // Other options to consider if/when more users join:
    // 1. - Query for all predictions in a season and all games in a season concurrently.
    //   a. - This is still not as performant as possible, but would reduce duplicate data and retain live standings.
    // 2. - Store standings in a separate schema, and have a CRON job that updates them once an hour.
    //   a. - This would allow for a much more performant solution, but would remove the ability to have live standings.
    const predictions = await db.prediction.findMany({
        where: { seasonId },
        include: {
            game: true,
            user: true,
        },
    });

    const userPredictionMap = predictions.reduce<{
        [key: string]: PartialPrediction[];
    }>((acc, prediction) => {
        if (acc[prediction.userId]) {
            acc[prediction.userId].push(prediction);
        } else {
            acc[prediction.userId] = [prediction];
        }

        return acc;
    }, {});

    // TODO: Define the exact scoring algorithm that we would like to use
    const userIdRankings = Object.entries(userPredictionMap).map(
        ([userId, predictions]) => {
            const { email, username } = predictions[0].user;
            const score = predictions.reduce<number>((acc, prediction) => {
                const predictionStatus = getPredictionStatus(prediction);
                switch (predictionStatus) {
                    case 'correct':
                        return acc + 1;
                    default:
                        return acc;
                }
            }, 0);

            return {
                email,
                username,
                userId,
                score,
            };
        }
    );

    return {
        userIdRankings,
    };
};

export const predictions: QueryResolvers['predictions'] = () => {
    return db.prediction.findMany();
};

export const myPredictions: QueryResolvers['myPredictions'] = (
    _temp,
    { context }
) => {
    const user = getFirstUserFromContext(context);
    return db.prediction.findMany({
        where: { userId: user.id },
    });
};

export const prediction: QueryResolvers['prediction'] = ({ id }) => {
    return db.prediction.findUnique({
        where: { id },
    });
};

export const createPrediction: MutationResolvers['createPrediction'] = ({
    input,
}) => {
    return db.prediction.create({
        data: input,
    });
};

export const updatePrediction: MutationResolvers['updatePrediction'] = ({
    id,
    input,
}) => {
    return db.prediction.update({
        data: input,
        where: { id },
    });
};

export const deletePrediction: MutationResolvers['deletePrediction'] = ({
    id,
}) => {
    return db.prediction.delete({
        where: { id },
    });
};

export const Prediction: PredictionResolvers = {
    id: (_obj, { root }) => root.id,
    teamId: (_obj, { root }) => root.teamId,
    gameId: (_obj, { root }) => root.gameId,
    userId: (_obj, { root }) => root.userId,
    prediction: (_obj, { root }) => root.prediction,
    user: (_obj, { root }) =>
        db.user.findUnique({ where: { id: root.userId } }),
    team: (_obj, { root }) =>
        db.prediction.findUnique({ where: { id: root.id } }).team(),
    game: (_obj, { root }) =>
        db.prediction.findUnique({ where: { id: root.id } }).game(),
};
