export const schema = gql`
    type User {
        id: Int!
        username: String!
        email: String!
        hashedPassword: String!
        salt: String!
        resetToken: String
        resetTokenExpiresAt: DateTime
        roles: String!
        predictions: [Prediction]!
    }

    type Query {
        users: [User!]! @requireAuth
        user(id: Int!): User @requireAuth
    }

    input CreateUserInput {
        email: String!
        username: String!
        hashedPassword: String!
        salt: String!
        resetToken: String
        resetTokenExpiresAt: DateTime
        roles: String!
    }

    input UpdateUserInput {
        username: String
        email: String
        hashedPassword: String
        salt: String
        resetToken: String
        resetTokenExpiresAt: DateTime
        roles: String
    }

    type SuccessInput {
        success: Boolean
        message: String
    }

    type Mutation {
        createUser(input: CreateUserInput!): User! @requireAuth
        updateUser(id: Int!, input: UpdateUserInput!): User! @requireAuth
        deleteUser(id: Int!): User! @requireAuth
        sendResetPasswordEmail(email: String!): SuccessInput @skipAuth
        resetPassword(resetToken: String!, password: String!): User! @skipAuth
    }
`;
