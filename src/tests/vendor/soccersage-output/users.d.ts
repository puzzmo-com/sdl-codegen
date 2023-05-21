import type { CreateUserInput, UpdateUserInput } from "./shared-schema-types";
import type { User as RTUser, SuccessInput as RTSuccessInput, Prediction as RTPrediction } from "./shared-return-types";
import type { Prediction as PPrediction, User as PUser } from "@prisma/client";
import type { GraphQLResolveInfo } from "graphql";
import type { RedwoodGraphQLContext } from "@redwoodjs/graphql-server/dist/functions/types";

/** SDL: users: [User!]! */
export interface UsersResolver {
  (args?: object, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTUser[] | Promise<RTUser[]> | (() => Promise<RTUser[]>);
}

/** SDL: user(id: Int!): User */
export interface UserResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTUser | null | Promise<RTUser | null> | (() => Promise<RTUser | null>);
}

/** SDL: createUser(input: CreateUserInput!): User! */
export interface CreateUserResolver {
  (args: { input: CreateUserInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTUser | Promise<RTUser> | (() => Promise<RTUser>);
}

/** SDL: updateUser(id: Int!, input: UpdateUserInput!): User! */
export interface UpdateUserResolver {
  (args: { id: number, input: UpdateUserInput }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTUser | Promise<RTUser> | (() => Promise<RTUser>);
}

/** SDL: deleteUser(id: Int!): User! */
export interface DeleteUserResolver {
  (args: { id: number }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): RTUser | Promise<RTUser> | (() => Promise<RTUser>);
}

/** SDL: sendResetPasswordEmail(email: String!): SuccessInput */
export interface SendResetPasswordEmailResolver {
  (args: { email: string }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): Promise<RTSuccessInput | null>;
}

/** SDL: resetPassword(password: String!, resetToken: String!): User! */
export interface ResetPasswordResolver {
  (args: { password: string, resetToken: string }, obj?: { root: object, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }): Promise<RTUser>;
}

type UserAsParent = PUser & {
  id: () => Promise<number>,
  email: () => Promise<string>,
  username: () => Promise<string>,
  hashedPassword: () => Promise<string>,
  resetToken: () => Promise<string | undefined>,
  resetTokenExpiresAt: () => Promise<DateTime | undefined>,
  salt: () => Promise<string>,
  roles: () => Promise<string>,
  predictions: () => Promise<Array<PPrediction>>
};

export interface UserTypeResolvers {

  /** SDL: id: Int! */
  id: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => number | Promise<number> | (() => Promise<number>);

  /** SDL: email: String! */
  email: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: username: String! */
  username: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: hashedPassword: String! */
  hashedPassword: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: resetToken: String */
  resetToken: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | null | Promise<string | null> | (() => Promise<string | null>);

  /** SDL: resetTokenExpiresAt: DateTime */
  resetTokenExpiresAt: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => DateTime | null | Promise<DateTime | null> | (() => Promise<DateTime | null>);

  /** SDL: salt: String! */
  salt: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: roles: String! */
  roles: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => string | Promise<string> | (() => Promise<string>);

  /** SDL: predictions: [Prediction]! */
  predictions: (args: undefined, obj: { root: UserAsParent, context: RedwoodGraphQLContext, info: GraphQLResolveInfo }) => Array<RTPrediction> | Promise<Array<RTPrediction>> | (() => Promise<Array<RTPrediction>>);
}

type DateTime = any;
