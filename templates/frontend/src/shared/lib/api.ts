/**
 * Lightweight fetch wrapper for communicating with the backend API.
 *
 * The base URL is read from the VITE_API_URL environment variable, which
 * Vite inlines at build time.  Set this variable per environment:
 *
 *   .env.development  →  VITE_API_URL=http://localhost:3000
 *   .env.production   →  VITE_API_URL=https://api.example.com
 *
 * Usage:
 *   const data = await apiGet<User[]>("/api/users");
 *   await apiPost("/api/users", { name: "Alice" });
 */

/** Base URL for all API requests, resolved from the Vite environment. */
const API_BASE_URL: string = import.meta.env["VITE_API_URL"] ?? "";

/**
 * Represents a failed API response.  Carries the HTTP status code so callers
 * can branch on specific error conditions (e.g. 401 Unauthorized → redirect
 * to login).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Core fetch wrapper.  Attaches common headers, handles non-OK responses by
 * throwing {@link ApiError}, and parses the response body as JSON.
 *
 * @param path    - API path, e.g. `"/api/users"`.
 * @param init    - Standard {@link RequestInit} options (method, body, headers…).
 * @returns       Parsed JSON response body typed as `T`.
 * @throws        {@link ApiError} for non-2xx responses.
 * @throws        {@link TypeError} for network failures.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  // 204 No Content — return undefined cast to T (callers expect void/undefined).
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Perform a GET request.
 *
 * @param path - API path, e.g. `"/api/users"`.
 * @returns    Parsed response body typed as `T`.
 */
export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

/**
 * Perform a POST request with a JSON body.
 *
 * @param path - API path, e.g. `"/api/users"`.
 * @param body - Data to send; will be JSON-serialised.
 * @returns    Parsed response body typed as `T`.
 */
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Perform a PUT request with a JSON body.
 *
 * @param path - API path, e.g. `"/api/users/1"`.
 * @param body - Data to send; will be JSON-serialised.
 * @returns    Parsed response body typed as `T`.
 */
export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Perform a DELETE request.
 *
 * @param path - API path, e.g. `"/api/users/1"`.
 * @returns    Parsed response body typed as `T` (often `void` for 204).
 */
export function apiDelete<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}
