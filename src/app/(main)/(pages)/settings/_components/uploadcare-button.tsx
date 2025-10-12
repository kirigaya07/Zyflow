"use client";
import { FileUploaderRegular } from "@uploadcare/react-uploader/next";
import "@uploadcare/react-uploader/core.css";

type UploadCareButtonProps = {
  onUpload: (url: string) => Promise<void>;
};

function UploadCareButton({ onUpload }: UploadCareButtonProps) {
  return (
    <div>
      <FileUploaderRegular
        sourceList="local, camera, facebook, gdrive"
        classNameUploader="uc-light"
        pubkey="72daf168e0e5682fa168"
        onFileUploadSuccess={(info) => {
          if (info.cdnUrl) {
            onUpload(info.cdnUrl);
          }
        }}
      />
    </div>
  );
}

export default UploadCareButton;
