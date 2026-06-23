import type { Env } from "@/lib/types";

let currentEnv: Env | null = null;

/**
 * Set the runtime environment for the current request.
 * Called by Astro middleware at the start of each request.
 * Safe in Cloudflare Workers — one request per isolate.
 */
export function setRuntimeEnv(env: Env): void {
	currentEnv = env;
}

/**
 * Get the runtime environment for the current request.
 * Used by the D1 content loader to access Cloudflare bindings.
 * Returns null instead of throwing when called outside of a request context
 * (e.g., during astro check, astro build, or content syncing).
 */
export function getRuntimeEnv(): Env | null {
	return currentEnv;
}

/**
 * Clear the runtime environment after a request completes.
 * Prevents cross-request environment leakage when the next request
 * on the same isolate fails to set its own env.
 */
export function clearRuntimeEnv(): void {
	currentEnv = null;
}
