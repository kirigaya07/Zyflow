"use server";

/**
 * User Data Retrieval Actions Module
 *
 * This module provides user data fetching functionality for the connections system.
 * Handles database queries to retrieve user information including connection status.
 */

import { db } from "@/lib/db";

/**
 * Retrieves comprehensive user data including all service connections.
 *
 * This function:
 * - Queries user record by Clerk ID
 * - Includes all related connection records
 * - Provides connection status for UI rendering
 * - Returns null if user not found
 *
 * @param id - Clerk user ID to query
 * @returns User data with connections array, or null if not found
 *
 * @example
 * ```typescript
 * const userData = await getUserData(user.id);
 * if (userData) {
 *   console.log('User connections:', userData.connections);
 * }
 * ```
 */
export const getUserData = async (id: string) => {
  const user_info = await db.user.findUnique({
    where: {
      clerkId: id,
    },
    include: {
      connections: true,
    },
  });

  return user_info;
};
