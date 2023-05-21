export const schema = gql`
    type Prediction {
        id: Int!
        userId: Int!
        gameId: Int!
        teamId: Int
        prediction: String!
        team: Team
        game: Game!
        user: User
    }

    type StandingsData {
        userId: String!
        username: String!
        email: String!
        score: Int!
    }

    type StandingsResult {
        userIdRankings: [StandingsData!]!
    }

    type Query {
        predictions: [Prediction!]! @requireAuth
        myPredictions: [Prediction!]! @requireAuth
        prediction(id: Int!): Prediction @requireAuth
        standings(seasonId: Int!): StandingsResult @skipAuth
    }

    input CreatePredictionInput {
        userId: Int!
        gameId: Int!
        seasonId: Int!
        teamId: Int
        prediction: String!
    }

    input UpdatePredictionInput {
        userId: Int
        gameId: Int
        teamId: Int
        prediction: String
    }

    type Mutation {
        createPrediction(input: CreatePredictionInput!): Prediction!
            @requireAuth
        updatePrediction(id: Int!, input: UpdatePredictionInput!): Prediction!
            @requireAuth
        deletePrediction(id: Int!): Prediction! @requireAuth
    }
`;
