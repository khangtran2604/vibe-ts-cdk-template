/**
 * Integration tests for the users API.
 *
 * These tests exercise the full request/response cycle through the Hono app
 * (which wraps the Lambda handlers via `lambdaToHono`).  supertest drives an
 * in-process HTTP server bound to an ephemeral port — no external server is
 * needed.
 *
 * Each suite clears the in-memory store so tests are fully isolated.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import type { Server } from "node:http";
import { serve } from "@hono/node-server";
import { app } from "../../src/app.js";
import { users } from "../../src/store.js";

// One server per test — bound to port 0 (OS assigns an ephemeral port).
let server: Server;

beforeEach(() => {
  users.clear();
  server = serve({ fetch: app.fetch, port: 0 });
});

afterEach(() => {
  server.close();
});

// ---------------------------------------------------------------------------
// POST /users — create
// ---------------------------------------------------------------------------

describe("POST /users", () => {
  it("creates a user and returns 201", async () => {
    const res = await request(server)
      .post("/users")
      .send({ name: "Alice", email: "alice@example.com" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Alice");
    expect(res.body.data.email).toBe("alice@example.com");
    expect(typeof res.body.data.id).toBe("string");
    expect(res.body.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(server)
      .post("/users")
      .send({ email: "noname@example.com" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(server)
      .post("/users")
      .send({ name: "NoEmail" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ---------------------------------------------------------------------------
// GET /users/:id — get single user
// ---------------------------------------------------------------------------

describe("GET /users/:id", () => {
  it("returns 200 with the user when it exists", async () => {
    const createRes = await request(server)
      .post("/users")
      .send({ name: "Bob", email: "bob@example.com" })
      .set("Content-Type", "application/json");

    const id = createRes.body.data.id as string;
    const getRes = await request(server).get(`/users/${id}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.id).toBe(id);
    expect(getRes.body.data.name).toBe("Bob");
  });

  it("returns 404 when the user does not exist", async () => {
    const res = await request(server).get("/users/non-existent-id");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// GET /users — list
// ---------------------------------------------------------------------------

describe("GET /users", () => {
  it("returns 200 with an empty list when no users exist", async () => {
    const res = await request(server).get("/users");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.pagination.total).toBe(0);
    expect(res.body.data.pagination.hasMore).toBe(false);
  });

  it("returns all created users", async () => {
    await request(server)
      .post("/users")
      .send({ name: "Carol", email: "carol@example.com" })
      .set("Content-Type", "application/json");

    await request(server)
      .post("/users")
      .send({ name: "Dave", email: "dave@example.com" })
      .set("Content-Type", "application/json");

    const res = await request(server).get("/users");

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// PUT /users/:id — update
// ---------------------------------------------------------------------------

describe("PUT /users/:id", () => {
  it("updates a user and returns 200", async () => {
    const createRes = await request(server)
      .post("/users")
      .send({ name: "Eve", email: "eve@example.com" })
      .set("Content-Type", "application/json");

    const id = createRes.body.data.id as string;

    const updateRes = await request(server)
      .put(`/users/${id}`)
      .send({ name: "Eve Updated" })
      .set("Content-Type", "application/json");

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.name).toBe("Eve Updated");
    // Email unchanged.
    expect(updateRes.body.data.email).toBe("eve@example.com");
  });

  it("returns 404 when updating a non-existent user", async () => {
    const res = await request(server)
      .put("/users/ghost-id")
      .send({ name: "Ghost" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// DELETE /users/:id
// ---------------------------------------------------------------------------

describe("DELETE /users/:id", () => {
  it("deletes a user and returns 204", async () => {
    const createRes = await request(server)
      .post("/users")
      .send({ name: "Frank", email: "frank@example.com" })
      .set("Content-Type", "application/json");

    const id = createRes.body.data.id as string;
    const delRes = await request(server).delete(`/users/${id}`);

    expect(delRes.status).toBe(204);
    expect(users.has(id)).toBe(false);
  });

  it("returns 404 when deleting a non-existent user", async () => {
    const res = await request(server).delete("/users/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
