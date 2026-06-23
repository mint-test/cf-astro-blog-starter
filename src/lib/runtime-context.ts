/**
 * Astro 6 + @astrojs/cloudflare v13: the old context.locals.runtime.env has been removed.
 *
 * Use `cloudflare:workers` import — it's request-scoped in the V8 isolate model.
 * During astro build / astro dev startup, this module is not available, so we
 * fall back to null gracefully (content loader will skip loading).
 */

let cachedEnv: Record<string, unknown> | null = null;
let envPromise: Promise<Record<string, unknown>> | null = null;

async function loadEnv(): Promise<Record<string, unknown> | null> {
	try {
		// Dynamic import — only resolves at request time in CF Workers runtime
		const mod = await import("cloudflare:workers");
		return (mod as { env: Record<string, unknown> }).env ?? null;
	} catch {
		return null;
	}
}

/** Get Cloudflare Worker bindings (DB, R2, KV, secrets, etc.) for the current request. */
export async function getRuntimeEnv(): Promise<Record<string, unknown> | null> {
	// Cache the promise so we only attempt the import once per request
	if (!envPromise) {
		envPromise = loadEnv();
	}
	return envPromise.then((env) => {
		if (env) cachedEnv = env;
		return env;
	});
}

/** Reset the env cache — call at start of each request for fresh bindings */
export function clearRuntimeEnv(): void {
	envPromise = null;
	cachedEnv = null;
}
