/**
 * User Settings Page Component
 *
 * This page provides comprehensive user profile management functionality:
 * - User profile information editing (name, profile picture)
 * - Profile image upload and removal capabilities
 * - Integration with Clerk authentication for secure user management
 * - Server actions for database operations
 *
 * Features:
 * - Authenticated user profile management
 * - Profile picture upload/removal with real-time updates
 * - User information form with validation
 * - Responsive design with sticky header
 * - Server-side data fetching and mutations
 */

import ProfileForm from "@/components/forms/profile-form";
import React from "react";
import ProfilePicture from "./_components/profile-picture";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Settings page component for user profile management.
 *
 * This component handles:
 * - Authentication verification and user data fetching
 * - Server actions for profile image and user info updates
 * - Layout and structure for settings interface
 * - Integration between profile components and database operations
 *
 * Server Actions:
 * - removeProfileImage: Clears user's profile image from database
 * - uploadProfileImage: Updates user's profile image URL
 * - updateUserInfo: Updates user's display name and other info
 *
 * Security:
 * - Requires authenticated user via Clerk
 * - All database operations use authenticated user's clerkId
 * - Server actions provide secure backend mutations
 *
 * @returns JSX.Element - Settings page with user profile management interface
 */
const Settings = async () => {
  const authUser = await currentUser();
  if (!authUser) return null;

  const user = await db.user.findUnique({ where: { clerkId: authUser.id } });

  /**
   * Server action to remove the user's profile image.
   *
   * This function:
   * - Clears the profileImage field in the database
   * - Uses the authenticated user's clerkId for security
   * - Returns the updated user record
   *
   * @returns Promise<User> - Updated user record with cleared profile image
   */
  const removeProfileImage = async () => {
    "use server";
    const response = await db.user.update({
      where: {
        clerkId: authUser.id,
      },
      data: {
        profileImage: "",
      },
    });
    return response;
  };

  /**
   * Server action to upload and set a new profile image.
   *
   * This function:
   * - Updates the user's profileImage field with the new image URL
   * - Uses the authenticated user's clerkId for security
   * - Returns the updated user record
   *
   * @param image - The new profile image URL to set
   * @returns Promise<User> - Updated user record with new profile image
   */
  const uploadProfileImage = async (image: string) => {
    "use server";
    const id = authUser.id;
    const response = await db.user.update({
      where: {
        clerkId: id,
      },
      data: {
        profileImage: image,
      },
    });

    return response;
  };

  /**
   * Server action to update user's profile information.
   *
   * This function:
   * - Updates the user's name field in the database
   * - Uses the authenticated user's clerkId for security
   * - Returns the updated user record
   *
   * @param name - The new display name for the user
   * @returns Promise<User> - Updated user record with new name
   */
  const updateUserInfo = async (name: string) => {
    "use server";

    const updateUser = await db.user.update({
      where: {
        clerkId: authUser.id,
      },
      data: {
        name,
      },
    });
    return updateUser;
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Settings</span>
      </h1>
      <div className="flex flex-col gap-10 p-6">
        <div>
          <h2 className="text-2xl font-bold">User Profile</h2>
          <p className="text-base text-white/50">
            Add or update your information
          </p>
        </div>
        <ProfilePicture
          onDelete={removeProfileImage}
          userImage={user?.profileImage || ""}
          onUpload={uploadProfileImage}
        />
        <ProfileForm user={user} onUpdate={updateUserInfo} />
      </div>
    </div>
  );
};

export default Settings;
