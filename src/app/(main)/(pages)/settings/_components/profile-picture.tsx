"use client";
import React from "react";
import UploadCareButton from "./uploadcare-button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Props = {
  userImage: string | null;
  onDelete?: () => Promise<any>;
  onUpload: (url: string) => Promise<void>;
};

const ProfilePicture = ({ userImage, onDelete, onUpload }: Props) => {
  const router = useRouter();

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
              <Image src={userImage} alt="User_Image" fill />
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
