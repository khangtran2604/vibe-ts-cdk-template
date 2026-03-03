/**
 * In-memory user repository.
 *
 * Provides the same async interface as the DynamoDB implementation so
 * handlers can use a single code path regardless of whether the database
 * feature is enabled.
 *
 * When the database feature is enabled (full preset), this file is
 * overwritten by the DynamoDB-backed implementation from the database
 * template overlay.
 */

import type { User } from "../types/index.js";
import { users } from "../store.js";

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return users.get(id) ?? null;
  },

  async create(user: User): Promise<void> {
    users.set(user.id, user);
  },

  async update(id: string, user: User): Promise<void> {
    users.set(id, user);
  },

  async delete(id: string): Promise<void> {
    users.delete(id);
  },

  async exists(id: string): Promise<boolean> {
    return users.has(id);
  },

  async list(opts: {
    limit: number;
    cursor: string | null;
  }): Promise<{ items: User[]; total: number }> {
    const allUsers = Array.from(users.values());
    const total = allUsers.length;

    let startIndex = 0;
    if (opts.cursor) {
      const cursorIndex = allUsers.findIndex((u) => u.id === opts.cursor);
      // If cursor not found, start from the beginning (graceful degradation).
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const items = allUsers.slice(startIndex, startIndex + opts.limit);
    return { items, total };
  },
};
