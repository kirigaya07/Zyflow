/**
 * Database Configuration and Connection Management
 *
 * This module sets up and exports a Prisma database client instance with proper
 * connection pooling and development optimization. Uses singleton pattern to
 * prevent multiple database connections in development mode.
 */

import { PrismaClient } from "../generated/prisma";

/**
 * Global declaration for Prisma client to enable singleton pattern.
 * Prevents multiple database connections during development hot reloads.
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Database client instance with environment-specific configuration.
 *
 * Features:
 * - Singleton pattern to prevent connection leaks in development
 * - Environment-specific logging configuration
 * - Automatic connection string management via environment variables
 * - Development vs production optimization
 *
 * Configuration:
 * - Development: Logs errors and warnings for debugging
 * - Production: Logs only errors to reduce overhead
 * - Uses DATABASE_URL environment variable for connection string
 *
 * @example
 * ```typescript
 * import { db } from '@/lib/db';
 *
 * const users = await db.user.findMany();
 * ```
 */
export const db =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Store the client globally in non-production environments to prevent multiple instances
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
