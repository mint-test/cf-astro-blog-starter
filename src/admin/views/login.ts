export function loginPage(error?: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Admin Login</title>
	<meta name="robots" content="noindex, nofollow" />
	<style>
		*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
		html {
			font-family: system-ui, -apple-system, sans-serif;
			font-size: 14px;
			color: #f1f5f9;
			background: #0f172a;
		}
		body {
			min-height: 100dvh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.login-card {
			width: 100%;
			max-width: 400px;
			padding: 2rem;
			background: #1e293b;
			border: 1px solid #334155;
			border-radius: 0.5rem;
		}
		h1 { font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center; }
		.form-group { margin-bottom: 1rem; }
		label { display: block; margin-bottom: 0.375rem; color: #cbd5e1; font-size: 0.85rem; }
		input {
			width: 100%;
			padding: 0.625rem 0.75rem;
			background: #0f172a;
			border: 1px solid #334155;
			border-radius: 0.375rem;
			color: #f1f5f9;
			font-family: inherit;
			font-size: 0.9rem;
		}
		input:focus { outline: none; border-color: #3b82f6; }
		button, .btn {
			width: 100%;
			padding: 0.625rem;
			border: none;
			border-radius: 0.375rem;
			font-family: inherit;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			text-align: center;
			text-decoration: none;
			display: block;
		}
		.btn-primary { background: #3b82f6; color: #fff; margin-top: 0.5rem; }
		.btn-primary:hover { background: #60a5fa; }
		.btn-github {
			background: #24292e;
			color: #fff;
			margin-bottom: 1.5rem;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			border: 1px solid #444d56;
		}
		.btn-github:hover { background: #2f363d; }
		.btn-github svg { width: 18px; height: 18px; fill: currentColor; }
		.divider {
			display: flex;
			align-items: center;
			text-align: center;
			margin: 1.5rem 0;
			color: #64748b;
			font-size: 0.8rem;
		}
		.divider::before, .divider::after {
			content: "";
			flex: 1;
			border-bottom: 1px solid #334155;
		}
		.divider::before { margin-right: 0.75rem; }
		.divider::after { margin-left: 0.75rem; }
		.error {
			background: rgba(239,68,68,0.1);
			color: #ef4444;
			padding: 0.625rem;
			border-radius: 0.375rem;
			margin-bottom: 1rem;
			font-size: 0.85rem;
			text-align: center;
			border: 1px solid rgba(239,68,68,0.2);
		}
	</style>
</head>
<body>
	<div class="login-card">
		<h1>Admin Login</h1>

		<a href="/api/auth/github" class="btn btn-github">
			<svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
			Sign in with GitHub
		</a>

		${error ? `<div class="error">${error}</div>` : ""}

		<div class="divider">or use password</div>

		<form method="post" action="/api/auth/login">
			<div class="form-group">
				<label for="username">Username</label>
				<input type="text" id="username" name="username" required autocomplete="username" />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required autocomplete="current-password" />
			</div>
			<button type="submit" class="btn-primary">Sign In</button>
		</form>
	</div>
</body>
</html>`;
}
