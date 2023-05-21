export const schema = gql`
    type Team {
        id: Int!
        name: String!
        logoUrl: String
        Prediction: [Prediction]!
        homeTeamGames: [Game]!
        awayTeamGames: [Game]!
    }

    type Query {
        teams: [Team!]! @requireAuth
        team(id: Int!): Team @requireAuth
    }

    input CreateTeamInput {
        name: String!
        logoUrl: String
    }

    input UpdateTeamInput {
        name: String
        logoUrl: String
    }

    type Mutation {
        createTeam(input: CreateTeamInput!): Team! @requireAuth
        updateTeam(id: Int!, input: UpdateTeamInput!): Team! @requireAuth
        deleteTeam(id: Int!): Team! @requireAuth
    }
`;
