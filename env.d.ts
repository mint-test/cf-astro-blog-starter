/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
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

declare namespace App {
	interface Locals extends Runtime {}
}

// Firefly: Window interface extensions for Svelte components and settings
declare global {
	interface Window {
		theme: {
			setTheme: (theme: "light" | "dark" | "system") => void;
			getTheme: () => "light" | "dark" | "system";
			getSystemTheme: () => "light" | "dark";
			getActualTheme: () => "light" | "dark";
		};
		setTheme: (theme: "light" | "dark" | "system") => void;
		addEventListener: ((
			type: "themeChange",
			listener: (event: CustomEvent<{ theme: string }>) => void,
		) => void) &
			Window["addEventListener"];
		removeEventListener: ((
			type: "themeChange",
			listener: (event: CustomEvent<{ theme: string }>) => void,
		) => void) &
			Window["removeEventListener"];
	}
}
