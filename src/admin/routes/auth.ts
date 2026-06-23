import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createToken, verifyToken } from "../middleware/auth";
import {
	clearAttempts,
	rateLimit,
	recordFailedAttempt,
} from "../middleware/rate-limit";
import { loginPage } from "../views/login";

const auth = new Hono<{ Bindings: Env }>();

// ─── Admin emails that get administrator privileges ─────────────────────────
const ADMIN_EMAILS = ["chenm4872@gmail.com"];

// ─── Login page ──────────────────────────────────────────────────────────────

auth.get("/login", (c) => {
	return c.html(loginPage());
});

// ─── GitHub OAuth: redirect to GitHub ────────────────────────────────────────

auth.get("/github", (c) => {
	const clientId = c.env.GITHUB_OAUTH_CLIENT_ID || "";
	if (!clientId) {
		return c.html(loginPage("GitHub OAuth is not configured"), 500);
	}
	const redirectUri = `${c.env.SITE_URL}/api/auth/github/callback`;
	const url =
		`https://github.com/login/oauth/authorize` +
		`?client_id=${encodeURIComponent(clientId)}` +
		`&redirect_uri=${encodeURIComponent(redirectUri)}` +
		`&scope=user:email`;
	return c.redirect(url);
});

// ─── GitHub OAuth: callback ──────────────────────────────────────────────────

auth.get("/github/callback", async (c) => {
	const code = c.req.query("code");
	const clientId = c.env.GITHUB_OAUTH_CLIENT_ID || "";
	const clientSecret = c.env.GITHUB_OAUTH_CLIENT_SECRET || "";

	if (!code) {
		return c.html(loginPage("Authorization failed — no code received"), 400);
	}

	if (!clientId || !clientSecret) {
		return c.html(loginPage("GitHub OAuth is not configured"), 500);
	}

	// Exchange code for access token
	let accessToken: string;
	try {
		const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
			}),
		});
		const tokenData = await tokenRes.json<{
			access_token?: string;
			error?: string;
		}>();
		if (!tokenData.access_token) {
			return c.html(
				loginPage(`GitHub auth failed: ${tokenData.error || "no token"}`),
				401,
			);
		}
		accessToken = tokenData.access_token;
	} catch {
		return c.html(loginPage("Failed to connect to GitHub"), 502);
	}

	// Fetch user emails
	let emails: Array<{ email: string; primary: boolean; verified: boolean }>;
	try {
		const userRes = await fetch("https://api.github.com/user/emails", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/vnd.github+json",
				"User-Agent": "cf-astro-blog",
			},
		});
		if (!userRes.ok) {
			return c.html(loginPage("Failed to fetch GitHub user info"), 502);
		}
		emails = await userRes.json<
			Array<{ email: string; primary: boolean; verified: boolean }>
		>();
	} catch {
		return c.html(loginPage("Failed to fetch GitHub user info"), 502);
	}

	// Find a verified email matching admin list
	const adminEmail = emails.find(
		(e) =>
			e.verified && ADMIN_EMAILS.includes(e.email.toLowerCase()),
	);

	if (!adminEmail) {
		return c.html(
			loginPage("Access denied — your GitHub account is not authorized"),
			403,
		);
	}

	// Create JWT session
	const token = await createToken(c.env.JWT_SECRET);
	setCookie(c, "admin_session", token, {
		httpOnly: true,
		secure: true,
		sameSite: "Lax",
		path: "/",
		maxAge: 7 * 24 * 60 * 60,
	});

	return c.redirect("/api/admin");
});

// ─── Legacy username/password login (fallback) ───────────────────────────────

auth.post("/login", rateLimit, async (c) => {
	const body = await c.req.parseBody();
	const username = String(body.username || "");
	const password = String(body.password || "");
	const ip = c.req.header("cf-connecting-ip") || "unknown";

	if (!username || !password) {
		return c.html(loginPage("Username and password are required"), 400);
	}

	if (username !== c.env.ADMIN_USERNAME) {
		await recordFailedAttempt(c.env, ip);
		return c.html(loginPage("Invalid credentials"), 401);
	}

	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	if (hashHex !== c.env.ADMIN_PASSWORD_HASH) {
		await recordFailedAttempt(c.env, ip);
		return c.html(loginPage("Invalid credentials"), 401);
	}

	const token = await createToken(c.env.JWT_SECRET);
	setCookie(c, "admin_session", token, {
		httpOnly: true,
		secure: true,
		sameSite: "Lax",
		path: "/",
		maxAge: 7 * 24 * 60 * 60,
	});

	await clearAttempts(c.env, ip);
	return c.redirect("/api/admin");
});

// ─── Logout ──────────────────────────────────────────────────────────────────

auth.get("/logout", (c) => {
	deleteCookie(c, "admin_session", { path: "/" });
	return c.redirect("/api/auth/login");
});

// ─── Verify (for client-side auth check) ─────────────────────────────────────

auth.get("/verify", async (c) => {
	const token = getCookie(c, "admin_session");
	if (!token) {
		return c.json({ authenticated: false }, 401);
	}

	try {
		const valid = await verifyToken(c.env.JWT_SECRET, token);
		return c.json({ authenticated: valid }, valid ? 200 : 401);
	} catch {
		return c.json({ authenticated: false }, 401);
	}
});

export { auth as authRoutes };
