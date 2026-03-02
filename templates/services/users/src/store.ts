/**
 * In-memory user store.
 *
 * This module exports a single `Map` instance that persists across handler
 * calls within the same Lambda execution environment (warm invocations) and
 * across all handler imports during local development via the dev server.
 *
 * Phase 6 (database preset) replaces this module with DynamoDB or RDS
 * repository implementations while keeping handler signatures unchanged.
 */

// @feature:database import { UserRepository } from "./db/user-repository.js";

import type { User } from "./types/index.js";

/**
 * Module-level store — one Map per process.
 *
 * During local development (dev-server) the same process handles all routes,
 * so data written by POST /users is immediately visible to GET /users.
 *
 * On Lambda each handler file is a separate bundle entry point; they share
 * the container's module cache when the execution environment is warm.
 */
// @feature:database // In-memory store replaced by database repository when database feature is enabled.
export const users = new Map<string, User>();
