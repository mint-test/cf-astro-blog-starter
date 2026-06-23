import { setMaxListeners } from "node:events";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import swup from "@swup/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import katex from "katex";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components";
import rehypeKatex from "rehype-katex";
import "katex/dist/contrib/mhchem.mjs";
import cloudflare from "@astrojs/cloudflare";
import rehypeCallouts from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import remarkAdmonitionToBlockquoteCallout from "remark-admonition-to-blockquote-callout";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import { expressiveCodeConfig, plantumlConfig, siteConfig } from "./src/config";
import I18nKey from "./src/i18n/i18nKey";
import { i18n } from "./src/i18n/translation";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import rehypeEmailProtection from "./src/plugins/rehype-email-protection.mjs";
import rehypeExternalLinks from "./src/plugins/rehype-external-links.mjs";
import rehypeFigure from "./src/plugins/rehype-figure.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { rehypePlantuml } from "./src/plugins/rehype-plantuml.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkImageGrid } from "./src/plugins/remark-image-grid.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";
import { remarkPlantuml } from "./src/plugins/remark-plantuml.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

if (process.env.NODE_ENV === "development") {
	setMaxListeners(20);
}

// Always use Cloudflare adapter (SSR on Workers)
const adapter = cloudflare({
	platformProxy: {
		enabled: true,
	},
});

// https://astro.build/config
export default defineConfig({
	site: siteConfig.site_url,

	base: "/",
	trailingSlash: "always",

	output: "server",

	adapter,

	// Image optimization
	image: {
		layout: "constrained",
	},

	experimental: {
		rustCompiler: false,
		// queuedRendering disabled — interacts badly with request-scoped runtime context
		// queuedRendering: { enabled: true },
	},

	integrations: [
		swup({
			theme: false,
			animationClass: "transition-swup-",
			containers: [
				"#banner-overlay-container",
				"#banner-dim-container",
				"#swup-container",
				"#left-sidebar-dynamic",
				"#right-sidebar-dynamic",
				"#floating-toc-wrapper",
			],
			smoothScrolling: false,
			cache: true,
			preload: true,
			accessibility: true,
			updateHead: true,
			updateBodyClass: false,
			globalInstance: true,
			resolveUrl: (url) => url,
			animateHistoryBrowsing: false,
			skipPopStateHandling: (event) => {
				return event.state?.url?.includes("#");
			},
		}),
		icon({
			include: {
				"material-symbols": [
					"admin-panel-settings", "archive", "arrow-back", "arrow-outward-rounded",
					"article", "article-outline", "book-2-outline-rounded", "build-outline",
					"calendar-clock-outline", "calendar-month-outline-rounded", "calendar-today",
					"calendar-today-outline-rounded", "chat", "chevron-left-rounded",
					"chevron-right-rounded", "close", "close-rounded", "cloud-outline",
					"computer-outline", "copyright-outline", "docs", "edit-calendar-outline-rounded",
					"emoji-people-rounded", "error-outline", "favorite", "folder-off", "folder-open",
					"folder-open-rounded", "folder-outline", "group", "group-off-outline",
					"help-outline", "history-rounded", "home", "home-outline-rounded",
					"home-pin-outline", "info", "info-outline", "ink-pen-outline-rounded",
					"keyboard-arrow-down-rounded", "keyboard-arrow-up-rounded", "label-off", "label-outline",
					"language", "link", "location-on", "lock-outline", "menu-rounded",
					"more-horiz", "movie", "music-note-rounded", "notes-rounded",
					"palette-outline", "pause-rounded", "person", "photo-library-rounded", "pinboard",
					"play-arrow-rounded", "recommend", "repeat-one-rounded", "repeat-rounded",
					"rocket-launch-outline", "rss-feed", "schedule-outline-rounded", "search",
					"search-off", "search-off-rounded", "search-rounded", "sentiment-sad",
					"settings", "shield-lock", "shuffle-rounded", "signpost",
					"skip-next-rounded", "skip-previous-rounded", "subtitles-off-outline-rounded",
					"subtitles-outline-rounded", "sync-rounded", "tag-rounded",
					"text-ad-outline-rounded", "update-rounded", "visibility-outline-rounded",
				],
				"fa7-solid": [
					"arrow-right", "arrow-rotate-left", "arrow-up-right-from-square",
					"chevron-left", "chevron-right", "envelope", "rss", "xmark",
				],
				"fa7-brands": [
					"alipay", "creative-commons", "gitee", "github", "node-js", "qq", "weixin",
				],
				"fa7-regular": ["address-card"],
				"mdi": ["arrow-up", "bed", "clover", "github", "home", "playlist-music", "swap-horizontal"],
				"simple-icons": ["afdian", "kofi", "pnpm"],
				mingcute: ["comment-line", "heartbeat-line"],
			},
		}),
		expressiveCode({
			shiki: {
				engine: "javascript",
				bundledLangs: [
					"typescript", "javascript", "python", "bash", "shell", "sh",
					"css", "html", "json", "yaml", "markdown", "mdx",
					"jsx", "tsx", "sql", "rust", "go", "java", "c",
					"toml", "xml", "diff", "dockerfile", "nginx", "plaintext",
					"powershell", "regexp", "scss", "less", "stylus",
				],
			},
			themes: [expressiveCodeConfig.darkTheme, expressiveCodeConfig.lightTheme],
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => `[data-theme='${theme.name}']`,
			plugins: [
				// TODO: Re-add pluginLanguageBadge and pluginCollapsible when WASM native deps are resolved (satteri, @napi-rs/wasm-runtime)
				pluginCollapsibleSections(),
				pluginLineNumbers(),
			],
			defaultProps: {
				wrap: false,
				overridesByLang: {
					shellsession: {
						showLineNumbers: false,
					},
				},
			},
			styleOverrides: {
				borderRadius: "0.75rem",
				codeFontSize: "0.875rem",
				codeFontFamily:
					"'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {},
				textMarkers: {
					delHue: 0,
					insHue: 180,
					markHue: 250,
				},
				languageBadge: {
					fontSize: "0.75rem",
					fontWeight: "bold",
					borderRadius: "0.25rem",
					opacity: "1",
					borderWidth: "0px",
					borderColor: "transparent",
				},
			},
			frames: {
				showCopyToClipboardButton: true,
			},
		}),
		svelte(),
		sitemap({
			filter: (page) => {
				const url = new URL(page);
				const pathname = url.pathname;

				if (pathname === "/friends/" && !siteConfig.pages.friends) {
					return false;
				}
				if (pathname === "/sponsor/" && !siteConfig.pages.sponsor) {
					return false;
				}
				if (pathname === "/guestbook/" && !siteConfig.pages.guestbook) {
					return false;
				}
				if (pathname === "/bangumi/" && !siteConfig.pages.bangumi) {
					return false;
				}
				if (pathname === "/gallery/" && !siteConfig.pages.gallery) {
					return false;
				}

				return true;
			},
		}),
	],
	markdown: {
		processor: unified({
			remarkPlugins: [
				...(siteConfig.post.rehypeCallouts.enablePythonMarkdownAdmonitions !== false
					? [remarkAdmonitionToBlockquoteCallout]
					: []),
				remarkMath,
				remarkReadingTime,
				remarkImageGrid,
				remarkExcerpt,
				remarkDirective,
				remarkSectionize,
				parseDirectiveNode,
				remarkMermaid,
				[remarkPlantuml, plantumlConfig],
			],
			rehypePlugins: [
				[rehypeKatex, { katex }],
				[rehypeCallouts, { theme: siteConfig.post.rehypeCallouts.theme }],
				rehypeSlug,
				rehypeMermaid,
				rehypePlantuml,
				rehypeFigure,
				[rehypeExternalLinks, { siteUrl: siteConfig.site_url }],
				[rehypeEmailProtection, { method: "base64" }],
				[
					rehypeComponents,
					{
						components: {
							github: GithubCardComponent,
						},
					},
				],
				[
					rehypeAutolinkHeadings,
					{
						behavior: "append",
						properties: {
							className: ["anchor"],
						},
						content: {
							type: "element",
							tagName: "span",
							properties: {
								className: ["anchor-icon"],
								"data-pagefind-ignore": true,
							},
							children: [
								{
									type: "text",
									value: "#",
								},
							],
						},
					},
				],
			],
		}),
	},
	vite: {
		plugins: [tailwindcss()],
		server: {
			watch: {
				ignored: ["**/package/**", "**/Firefly-docs/**"],
			},
		},
		resolve: {
			alias: {
				"@rehype-callouts-theme": `rehype-callouts/theme/${siteConfig.post.rehypeCallouts.theme}`,
				"@": "/src",
				"@components": "/src/components",
				"@assets": "/src/assets",
				"@constants": "/src/constants",
				"@utils": "/src/utils",
				"@i18n": "/src/i18n",
				"@layouts": "/src/layouts",
			},
		},
		build: {
			minify: "esbuild",
			esbuildOptions: {
				minify: true,
				drop: ["debugger"],
				pure: ["console.log", "console.debug"],
			},
			rollupOptions: {
				onwarn(warning, warn) {
					if (
						warning.message.includes("is dynamically imported by") &&
						warning.message.includes("but also statically imported by")
					) {
						return;
					}
					warn(warning);
				},
			},
			cssCodeSplit: true,
			cssMinify: "esbuild",
			assetsInlineLimit: 4096,
		},
	},
});
