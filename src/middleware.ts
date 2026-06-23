import { defineMiddleware } from "astro:middleware";
import { clearRuntimeEnv } from "@/lib/runtime-context";

export const onRequest = defineMiddleware(async (context, next) => {
	// Reset env cache per request, ensuring fresh bindings each time
	clearRuntimeEnv();

	// Astro 6: env bindings are accessed via `import { env } from "cloudflare:workers"`,
	// not via context.locals.runtime.env (removed in @astrojs/cloudflare v13).

	const response = await next();

	// Security headers for all responses
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=()",
	);

	// CSP for non-API routes
	if (!context.url.pathname.startsWith("/api/")) {
		response.headers.set(
			"Content-Security-Policy",
			[
				"default-src 'self'",
				"script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
				"img-src 'self' data: blob: https:",
				"font-src 'self' https://fonts.gstatic.com",
				"connect-src 'self' https:",
				"frame-src https://challenges.cloudflare.com",
			].join("; "),
		);
	}

	return response;
});
