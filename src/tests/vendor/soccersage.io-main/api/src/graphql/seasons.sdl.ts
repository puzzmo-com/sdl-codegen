export const schema = gql`
    type Season {
        id: Int!
        name: String!
        startDate: DateTime!
        endDate: DateTime!
        Prediction: [Prediction]!
    }

    type Query {
        seasons: [Season!]! @requireAuth
        season(id: Int!): Season @requireAuth
    }

    input CreateSeasonInput {
        name: String!
        startDate: DateTime!
        endDate: DateTime!
    }

    input UpdateSeasonInput {
        name: String
        startDate: DateTime
        endDate: DateTime
    }

    type Mutation {
        createSeason(input: CreateSeasonInput!): Season! @requireAuth
        updateSeason(id: Int!, input: UpdateSeasonInput!): Season! @requireAuth
        deleteSeason(id: Int!): Season! @requireAuth
    }
`;
