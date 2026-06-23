import type { Loader } from "astro/loaders";
import { getDb } from "@/lib/db";
import { getRuntimeEnv } from "@/lib/runtime-context";
import { eq, inArray } from "drizzle-orm";

/**
 * Astro 6 custom content loader that reads blog posts from Cloudflare D1.
 *
 * This bridges the gap between:
 * - Firefly's frontend (expects content collections via getCollection('posts'))
 * - cf-astro-blog-starter's backend (posts stored in D1, managed via admin panel)
 *
 * In SSR mode, the loader runs on each request, querying D1 for the latest posts.
 */
export function d1PostsLoader(): Loader {
	return {
		name: "d1-posts",
		load: async ({ store, logger, parseData, generateDigest }) => {
			try {
				const env = getRuntimeEnv();

				// During astro check / astro build, Cloudflare bindings are not available.
				// Return empty store gracefully — actual data loads on each SSR request.
				if (!env?.DB) {
					logger.info("D1 not available (outside Worker context). Skipping content load.");
					return;
				}

				const db = getDb(env.DB);

				logger.info("Loading posts from D1...");

				// 1. Query all published posts (single query)
				const posts = await db.query.blogPosts.findMany({
					where: (p, { eq }) => eq(p.status, "published"),
					orderBy: (p, { desc }) => [desc(p.pinned), desc(p.publishedAt)],
				});

				logger.info(`Found ${posts.length} published posts`);

				// 2. Batch-fetch all referenced categories (single query)
				const categoryIds = [...new Set(posts.map((p) => p.categoryId).filter(Boolean))];
				const categoryMap = new Map<number, string>();
				if (categoryIds.length > 0) {
					const cats = await db.query.blogCategories.findMany({
						where: (c) => inArray(c.id, categoryIds),
					});
					for (const cat of cats) {
						categoryMap.set(cat.id, cat.name);
					}
				}

				// 3. Batch-fetch all post-tag relations (single query)
				const postIds = posts.map((p) => p.id);
				const tagsByPost = new Map<number, string[]>();
				if (postIds.length > 0) {
					const allPostTags = await db.query.blogPostTags.findMany({
						where: (pt) => inArray(pt.postId, postIds),
					});

					// Batch-fetch all tags (single query)
					const tagIds = [...new Set(allPostTags.map((pt) => pt.tagId))];
					const tagMap = new Map<number, string>();
					if (tagIds.length > 0) {
						const allTags = await db.query.blogTags.findMany({
							where: (t) => inArray(t.id, tagIds),
						});
						for (const tag of allTags) {
							tagMap.set(tag.id, tag.name);
						}
					}

					// Group tag names by post ID
					for (const pt of allPostTags) {
						const tagName = tagMap.get(pt.tagId);
						if (tagName) {
							const names = tagsByPost.get(pt.postId) || [];
							names.push(tagName);
							tagsByPost.set(pt.postId, names);
						}
					}
				}

				// 4. Map and store each post
				for (const post of posts) {
					// Digest includes slug + timestamp + content prefix for accurate invalidation
					const digestStr =
						post.slug +
						"|" +
						(post.updatedAt || post.publishedAt || post.createdAt) +
						"|" +
						(post.content?.slice(0, 200) ?? "");
					const digest = generateDigest(digestStr);

					const imageUrl = post.featuredImageKey
						? `/api/media/${post.featuredImageKey}`
						: "";

					const publishedDate = post.publishedAt
						? new Date(post.publishedAt)
						: new Date(post.createdAt);
					const updatedDate = post.updatedAt
						? new Date(post.updatedAt)
						: undefined;

					const entryData = {
						title: post.title,
						published: publishedDate,
						updated: updatedDate,
						draft: post.status !== "published",
						description: post.excerpt ?? "",
						image: imageUrl,
						tags: tagsByPost.get(post.id) ?? [],
						category: categoryMap.get(post.categoryId ?? 0) ?? "",
						lang: post.lang ?? "zh_CN",
						pinned: post.pinned === 1,
						author: post.authorName ?? "",
						sourceLink: post.sourceLink ?? "",
						licenseName: post.licenseName ?? "",
						licenseUrl: post.licenseUrl ?? "",
						comment: post.commentEnabled !== 0,
						password: post.password ?? "",
						passwordHint: post.passwordHint ?? "",
						prevTitle: "",
						prevSlug: "",
						nextTitle: "",
						nextSlug: "",
					};

					// Don't let one malformed post break the entire collection
					try {
						store.set({
							id: post.slug,
							body: post.content,
							filePath: `src/content/posts/${post.slug}.md`,
							digest,
							rendered: undefined,
							data: await parseData({
								id: post.slug,
								data: entryData,
							}),
						});
					} catch (err) {
						logger.error(
							`Failed to parse post "${post.slug}": ${(err as Error).message}. Skipping.`,
						);
					}
				}

				logger.info("D1 posts loaded successfully");
			} catch (err) {
				logger.error(
					`D1 content loader failed: ${(err as Error).message}. Returning empty store.`,
				);
				// Return empty store — let pages render gracefully without posts
			}
		},
	};
}
