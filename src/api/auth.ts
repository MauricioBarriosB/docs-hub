import { apiClient } from './client';
import type { AuthSession, LoginRequest, RegisterRequest, User } from './types';

/** POST /api/auth/login — returns tokens + the authenticated user. */
export async function loginRequest(payload: LoginRequest): Promise<AuthSession> {
  return apiClient.post<AuthSession>('/auth/login', payload, { anonymous: true });
}

/** POST /api/auth/register — creates a `user` account and logs in. */
export async function registerRequest(payload: RegisterRequest): Promise<AuthSession> {
  return apiClient.post<AuthSession>('/auth/register', payload, { anonymous: true });
}

/** GET /api/auth/me — current user (used to validate a restored session). */
export async function fetchCurrentUser(): Promise<User> {
  return apiClient.get<User>('/auth/me');
}

/** POST /api/auth/logout — best-effort server-side refresh-token revocation. */
export async function logoutRequest(): Promise<void> {
  await apiClient.post<void>('/auth/logout');
}
