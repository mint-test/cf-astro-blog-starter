export interface SiteConfig {
	name: string;
	url: string;
	description: string;
	author: string;
	language: string;
}

export const siteConfig: SiteConfig = {
	name: "CF Astro Blog",
	url: "https://icemint.cc.cd",
	description: "A blog powered by Astro + Hono on Cloudflare Workers",
	author: "Admin",
	language: "zh_CN",
};

export interface PaginationParams {
	page: number;
	limit: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export type PostStatus = "draft" | "published" | "scheduled";

// Cloudflare Worker environment type — re-exported from env.d.ts
// Used by runtime-context.ts for request-scoped binding propagation
export interface Env {
	DB: D1Database;
	MEDIA_BUCKET: R2Bucket;
	SESSION: KVNamespace;
	ASSETS: Fetcher;

	SITE_NAME: string;
	SITE_URL: string;
	TURNSTILE_SITE_KEY: string;

	JWT_SECRET: string;
	ADMIN_USERNAME: string;
	ADMIN_PASSWORD_HASH: string;
	TURNSTILE_SECRET_KEY: string;

	GITHUB_OAUTH_CLIENT_ID: string;
	GITHUB_OAUTH_CLIENT_SECRET: string;
}
