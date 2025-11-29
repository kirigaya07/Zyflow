/**
 * Profile Picture Management Component
 *
 * This component provides comprehensive profile image management functionality:
 * - Display current user profile picture with fallback handling
 * - Upload new profile images via UploadCare integration
 * - Remove existing profile images with confirmation
 * - Responsive image display with proper aspect ratios
 *
 * Features:
 * - Support for multiple image sources (UploadCare, external URLs)
 * - Conditional rendering based on image availability
 * - Error handling for upload and deletion operations
 * - Auto-refresh after successful operations
 * - Responsive design with centered layout
 */

"use client";
import React from "react";
import UploadCareButton from "./uploadcare-button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * Props interface for the ProfilePicture component.
 *
 * @interface Props
 * @property {string | null} userImage - Current user's profile image URL or null if none set
 * @property {() => Promise<any>} [onDelete] - Optional callback function for image deletion
 * @property {(url: string) => Promise<void>} onUpload - Callback function for handling image uploads
 */
type Props = {
  userImage: string | null;
  onDelete?: () => Promise<any>;
  onUpload: (url: string) => Promise<void>;
};

/**
 * Profile picture management component for user settings.
 *
 * This component handles:
 * - Display of current profile image with proper fallbacks
 * - Image upload functionality via UploadCare widget
 * - Image removal with server-side deletion
 * - Responsive layout and error handling
 *
 * Image handling features:
 * - Detects UploadCare CDN URLs for optimized rendering
 * - Falls back to Next.js Image component for external URLs
 * - Responsive sizing with proper aspect ratio maintenance
 * - Centered layout with consistent spacing
 *
 * State management:
 * - Triggers router refresh after successful operations
 * - Provides error handling with console logging
 * - Conditional rendering based on image availability
 *
 * @param userImage - Current profile image URL or null for empty state
 * @param onDelete - Optional server action for image deletion
 * @param onUpload - Server action for handling new image uploads
 * @returns JSX.Element - Profile picture display and management interface
 */
const ProfilePicture = ({ userImage, onDelete, onUpload }: Props) => {
  const router = useRouter();

  /**
   * Handles profile image removal with error handling and UI refresh.
   *
   * This function:
   * - Calls the provided onDelete server action
   * - Refreshes the router to update the UI
   * - Logs errors to console for debugging
   * - Gracefully handles missing onDelete callback
   */
  const onRemoveProfileImage = async () => {
    if (!onDelete) return;

    try {
      const response = await onDelete();
      if (response) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to remove profile image:", error);
    }
  };

  return (
    <div className="flex flex-col">
      <p className="text-lg text-white"> Profile Picture</p>
      <div className="flex h-[30vh] flex-col items-center justify-center">
        {userImage ? (
          <>
            <div className="relative h-full w-2/12">
              {userImage.includes("ucarecdn") ||
              userImage.includes("ucarecd") ? (
                <img
                  src={userImage}
                  alt="User_Image"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Image src={userImage} alt="User_Image" fill />
              )}
            </div>
            <Button
              onClick={onRemoveProfileImage}
              className="bg-transparent text-white/70 hover:bg-transparent hover:text-white"
            >
              <X /> Remove Logo
            </Button>
          </>
        ) : (
          <UploadCareButton
            onUpload={async (url: string) => {
              try {
                await onUpload(url);
                router.refresh();
              } catch (error) {
                console.error("Failed to upload profile image:", error);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePicture;
