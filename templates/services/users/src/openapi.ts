/**
 * OpenAPI route registration for the users service.
 *
 * This module creates an `OpenAPIRegistry` and registers all 5 CRUD endpoints
 * together with their request/response schemas.  The registry is consumed by
 * the spec-generation script to produce the final `openapi.json` artifact.
 *
 * Endpoints registered:
 *   POST   /users          — create a user
 *   GET    /users          — list users (cursor pagination)
 *   GET    /users/{id}     — get a single user
 *   PUT    /users/{id}     — update a user (partial)
 *   DELETE /users/{id}     — delete a user
 */

import { z } from "zod";
import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";

import {
  UserSchema,
  CreateUserBodySchema,
  UpdateUserBodySchema,
} from "./schemas/index.js";
import {
  ApiResponseSchema,
  ApiErrorResponseSchema,
  PaginatedResultSchema,
} from "@{{projectName}}/shared-types";

// Enable the `.openapi()` method on every Zod type.  Idempotent — safe to call
// in every module that constructs schemas.
extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const registry = new OpenAPIRegistry();

// ---------------------------------------------------------------------------
// Schema registrations
// ---------------------------------------------------------------------------

// Register entity schemas so the generator emits them under #/components/schemas.
registry.register("User", UserSchema);
registry.register("CreateUserBody", CreateUserBodySchema);
registry.register("UpdateUserBody", UpdateUserBodySchema);

// ---------------------------------------------------------------------------
// Shared inline schemas
// ---------------------------------------------------------------------------

/** Reusable `{id}` path parameter schema. */
const idPathParam = z.string().uuid().openapi({
  param: { name: "id", in: "path" },
  example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
});

// ---------------------------------------------------------------------------
// POST /users — create a user
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "post",
  path: "/users",
  summary: "Create a user",
  description: "Creates a new user and persists it.  Returns the created user.",
  tags: ["Users"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: CreateUserBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: ApiResponseSchema(UserSchema),
        },
      },
    },
    400: {
      description: "Request body is missing, malformed JSON, or fails schema validation",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// GET /users — list users with cursor pagination
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/users",
  summary: "List users",
  description:
    "Returns a cursor-paginated list of users.  Pass the `cursor` value from " +
    "the previous response to fetch the next page.",
  tags: ["Users"],
  request: {
    query: z.object({
      cursor: z
        .string()
        .optional()
        .openapi({
          description:
            "Opaque pagination cursor returned by the previous page response.",
          example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
        }),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .optional()
        .openapi({
          description: "Maximum number of users to return (1–100).  Defaults to 20.",
          example: 20,
        }),
    }),
  },
  responses: {
    200: {
      description: "Paginated list of users",
      content: {
        "application/json": {
          schema: ApiResponseSchema(PaginatedResultSchema(UserSchema)),
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// GET /users/{id} — get a single user
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  summary: "Get a user",
  description: "Retrieves a single user by their UUID.",
  tags: ["Users"],
  request: {
    params: z.object({ id: idPathParam }),
  },
  responses: {
    200: {
      description: "User found",
      content: {
        "application/json": {
          schema: ApiResponseSchema(UserSchema),
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// PUT /users/{id} — update a user (partial)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "put",
  path: "/users/{id}",
  summary: "Update a user",
  description:
    "Applies a partial update to an existing user.  Only the fields supplied " +
    "in the request body are changed.",
  tags: ["Users"],
  request: {
    params: z.object({ id: idPathParam }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: UpdateUserBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User updated successfully",
      content: {
        "application/json": {
          schema: ApiResponseSchema(UserSchema),
        },
      },
    },
    400: {
      description: "Request body is missing, malformed JSON, or fails schema validation",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// DELETE /users/{id} — delete a user
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "delete",
  path: "/users/{id}",
  summary: "Delete a user",
  description: "Removes a user permanently.  Returns 204 No Content on success.",
  tags: ["Users"],
  request: {
    params: z.object({ id: idPathParam }),
  },
  responses: {
    204: {
      description: "User deleted — no response body",
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
  },
});
