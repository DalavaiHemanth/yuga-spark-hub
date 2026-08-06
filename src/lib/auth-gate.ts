/**
 * Cache for the authenticated-route gate (role + profile status).
 * Kept in its own module so any screen can invalidate it without import cycles.
 */
export type AuthGate = { userId: string; isAdmin: boolean; profileCompleted: boolean | null };

let cached: { userId: string; at: number; value: AuthGate } | null = null;
const TTL = 60_000;

export function readAuthGate(userId: string): AuthGate | null {
  if (cached && cached.userId === userId && Date.now() - cached.at < TTL) return cached.value;
  return null;
}

export function writeAuthGate(value: AuthGate) {
  cached = { userId: value.userId, at: Date.now(), value };
}

export function clearAuthGateCache() {
  cached = null;
}