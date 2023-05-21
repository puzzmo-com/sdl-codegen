export const schema = gql`
    type Game {
        id: Int!
        homeTeamId: Int!
        awayTeamId: Int!
        seasonId: Int!
        homeTeamScore: Int
        awayTeamScore: Int
        isCompleted: Boolean!
        predictions: [Prediction]!
        homeTeam: Team!
        awayTeam: Team!
        season: Season!
        startDateTime: DateTime!

        # This does not exist in prisma, and would
        # screw up a return type of db.game in many places
        teamsWhoPredictedHomeWin: [Team!]!
    }

    type Query {
        games: [Game!]! @skipAuth
        upcomingGames: [Game!]! @skipAuth
        game(id: Int!): Game @requireAuth
    }

    input CreateGameInput {
        homeTeamId: Int!
        awayTeamId: Int!
        seasonId: Int!
        startDateTime: DateTime!
        homeTeamScore: Int
        awayTeamScore: Int
        isCompleted: Boolean
    }

    input UpdateGameInput {
        homeTeamId: Int
        awayTeamId: Int
        homeTeamScore: Int
        awayTeamScore: Int
        seasonId: Int
        isCompleted: Boolean
        startDateTime: DateTime
    }

    type Mutation {
        createGame(input: CreateGameInput!): Game! @requireAuth
        updateGame(id: Int!, input: UpdateGameInput!): Game! @requireAuth
        deleteGame(id: Int!): Game! @requireAuth
    }
`;
