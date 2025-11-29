/**
 * UploadCare File Upload Button Component
 *
 * This component provides a comprehensive file upload interface using UploadCare:
 * - Multi-source file upload (local files, camera, social media, cloud storage)
 * - Integrated file processing and CDN delivery
 * - Light theme styling for consistent UI
 * - Automatic CDN URL generation for uploaded files
 *
 * Features:
 * - Support for local file selection and camera capture
 * - Integration with Facebook and Google Drive for file imports
 * - Automatic image optimization and CDN hosting
 * - Success callback with CDN URL for further processing
 * - Responsive design with light theme styling
 */

"use client";
import { FileUploaderRegular } from "@uploadcare/react-uploader/next";
import "@uploadcare/react-uploader/core.css";

/**
 * Props interface for the UploadCareButton component.
 *
 * @interface UploadCareButtonProps
 * @property {(url: string) => Promise<void>} onUpload - Callback function called when file upload succeeds
 */
type UploadCareButtonProps = {
  onUpload: (url: string) => Promise<void>;
};

/**
 * UploadCare file upload button component for profile image management.
 *
 * This component provides:
 * - Multi-source file upload capabilities (local, camera, social media, cloud)
 * - Integration with UploadCare CDN for optimized file delivery
 * - Success handling with automatic CDN URL callback
 * - Light theme styling for consistent user interface
 *
 * Upload sources supported:
 * - Local: File system selection from user's device
 * - Camera: Direct camera capture on supported devices
 * - Facebook: Import images from Facebook account
 * - Google Drive: Import files from Google Drive storage
 *
 * Configuration:
 * - Uses UploadCare public key for authentication
 * - Light theme styling for consistent branding
 * - Automatic CDN URL generation upon successful upload
 *
 * @param onUpload - Callback function that receives the CDN URL after successful upload
 * @returns JSX.Element - UploadCare file uploader widget
 */
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
