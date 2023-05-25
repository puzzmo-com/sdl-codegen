// @ts-ignore

import { dnull } from "dnull"

import { db } from "src/lib/db"

import {
	UpdateUserProfileResolver,
	DeleteUserProfileResolver,
	UserProfileTypeResolvers,
	AddLeaderboardToUserProfileResolver,
	RemoveLeaderboardFromUserProfileResolver,
} from "src/lib/types/userProfiles"

export const updateUserProfile: UpdateUserProfileResolver = ({ input, id }) => {}

export const addLeaderboardToUserProfile: AddLeaderboardToUserProfileResolver = async ({ leaderboardStableID }) => {}

export const removeLeaderboardFromUserProfile: RemoveLeaderboardFromUserProfileResolver = async ({ leaderboardStableID }) => {}

export const deleteUserProfile: DeleteUserProfileResolver = (args) => {
	const { id } = args
	return db.userProfile.delete({ where: { userID: id.replace(":userprofile", "") } })
}

export const UserProfile: UserProfileTypeResolvers = {
	id: (_, { root }) => root.userID + ":userprofile",
	user: (_obj, { root }) => db.user.findFirst({ where: { id: root.userID } }),
}
