/**
 * Next.js Configuration File
 *
 * This configuration file customizes Next.js behavior for the Zyflow application:
 * - Image optimization settings for external CDN sources
 * - Server Actions configuration for handling large file uploads
 * - Security settings for remote image domains
 * - Performance optimizations for workflow automation features
 *
 * Key configurations:
 * - Remote image patterns for Clerk authentication and UploadCare CDN
 * - Increased Server Actions body size limit for file processing
 * - Experimental features for enhanced server-side functionality
 */

import type { NextConfig } from "next";

/**
 * Next.js configuration object defining application behavior and optimizations.
 *
 * This configuration enables:
 * - External image optimization from trusted CDN sources
 * - Enhanced Server Actions for file upload and processing
 * - Security controls for remote content access
 * - Performance optimizations for large data handling
 */
const nextConfig: NextConfig = {
  /**
   * Image optimization configuration for external sources.
   *
   * Defines trusted domains for Next.js Image component optimization:
   * - Clerk authentication service images (user avatars, profile pictures)
   * - UploadCare CDN for user-uploaded content (profile images, file attachments)
   *
   * Security benefits:
   * - Prevents unauthorized external image loading
   * - Enables Next.js image optimization for trusted sources
   * - Maintains consistent image performance across the application
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com", // Clerk authentication service images
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev", // Clerk development environment images
      },
      {
        protocol: "https",
        hostname: "ucarecdn.com", // UploadCare CDN primary domain
      },
      {
        protocol: "https",
        hostname: "ucarecdn.net", // UploadCare CDN alternate domain
      },
      {
        protocol: "https",
        hostname: "ucarecd.net", // UploadCare CDN legacy domain
      },
    ],
  },
  /**
   * Experimental features configuration for enhanced functionality.
   *
   * Enables experimental Next.js features that improve application capabilities:
   * - Server Actions with increased payload limits for file processing
   * - Enhanced server-side functionality for workflow automation
   */
  experimental: {
    /**
     * Server Actions configuration for handling large data payloads.
     *
     * Increases the default body size limit to support:
     * - Large file uploads through UploadCare integration
     * - Zoom meeting recordings and transcript processing
     * - Workflow data with complex node configurations
     * - AI-generated content with extensive metadata
     *
     * Default limit: 1MB
     * Configured limit: 5MB (5x increase for workflow automation needs)
     */
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
