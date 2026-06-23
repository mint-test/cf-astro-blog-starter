# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指导。

## 开发命令

| 命令 | 作用 |
|---------|-------------|
| `npm run dev` | 启动 Astro 开发服务器（SSR 模式，使用 wrangler.jsonc 中的本地 D1/R2/KV） |
| `npm run build` | 生产构建（`astro build`） |
| `npm run preview` | 构建 + 通过 Wrangler 预览（本地 Workers 运行时） |
| `npm run deploy` | `db:migrate:remote` → `astro build` → `wrangler deploy` |
| `npm run check` | 类型检查（`astro check`）+ lint/格式检查（`biome check src/ tests/`） |
| `npm run check:fix` | 使用 Biome 自动修复 lint/格式问题 |
| `npm run format` | 使用 Biome 格式化代码 |
| `npm run lint` | 使用 Biome 进行 lint 检查 |
| `npm test` | 通过 `bun test` 运行所有测试 |
| `npm run db:generate` | 从 schema 变更生成 Drizzle 迁移文件 |
| `npm run db:migrate:local` | 应用本地 D1 迁移 |
| `npm run db:migrate:remote` | 应用生产环境 D1 迁移 |
| `npm run db:seed:local` | 向本地 D1 填充示例文章 |
| `npm run db:seed:remote` | 向生产环境 D1 填充示例文章 |

运行单个测试文件：`bun test tests/unit/schema.test.ts`

## 架构

这是一个运行在 Cloudflare Workers 上的 **Astro + Hono** 博客，采用 SSR 模式。它是单应用——不是 monorepo。两个框架在路由边界处衔接：Astro 渲染面向公众的页面，Hono 处理管理后台和 API。

### 请求流程

```
浏览器请求
  └─> Astro（Cloudflare Workers 上的 SSR）
        ├─> /blog/*, /, /rss.xml, /sitemap.xml, /search  → Astro 页面
        └─> /api/*  → src/pages/api/[...route].ts
                        └─> Hono 应用 (src/admin/app.ts)
                              ├─> /api/auth/*      → 登录/登出
                              ├─> /api/admin/*     → 仪表盘、文章增删改查、媒体管理、数据分析
                              └─> /api/posts/*     → 公开文章数据
```

### 关键架构要点

- **D1 是主数据库**（基于 SQLite，通过 Drizzle ORM 访问）。数据表：`blog_posts`、`blog_categories`、`blog_tags`、`blog_post_tags`（关联表）、`analytics_sessions`、`analytics_events`、`login_attempts`。Schema 定义在 `src/db/schema.ts`。
- **R2 存储媒体文件**（图片、文件）。管理后台的媒体路由处理上传/列表/删除/提供访问。
- **会话基于 JWT**（通过 `jose` 实现 HS256 签名，7 天过期，名为 `admin_session` 的 HTTP-only cookie）。没有刷新令牌机制——过期后重新登录。
- **管理后台 UI 使用 HTMX**（在管理后台布局中从 CDN 加载）。页面是来自 `src/admin/views/` 中 TypeScript 模板函数的服务端渲染 HTML 字符串。不使用 JSX，也没有客户端框架。
- **Astro 页面直接从 D1 获取数据**，使用 `Astro.locals.runtime.env.DB`——不经过 Hono API。Hono API 用于管理后台操作和程序化调用。
- **`src/middleware.ts`** 是 Astro 中间件，在每个响应中注入安全头（CSP、X-Frame-Options 等）。
- **本地开发**使用 Wrangler 的本地 Cloudflare 模拟（D1、R2、KV 均在本地运行）。密钥存放在 `.dev.vars` 中（切勿提交）。README 中的部署按钮用于 Cloudflare 的一键部署功能。

### 数据库访问模式

使用 `src/lib/db.ts` 中的 `getDb(platform.env.DB)` 获取 Drizzle 客户端。所有查询都包裹在 try/catch 中，带有优雅的降级处理（空数组、零值）——D1 不可用时绝不能导致页面崩溃。没有连接池；每个请求创建新的客户端。

### 认证模式

需要认证的管理后台路由使用 `src/admin/middleware/auth.ts` 中的 `requireAuth` 中间件。它读取 `admin_session` cookie，验证 JWT，然后要么继续执行，要么重定向到 `/api/auth/login`。登录频率限制（5 次尝试，15 分钟锁定）由 `login_attempts` 表管理，并由 `src/admin/middleware/rate-limit.ts` 强制执行。

### 样式

不使用 CSS 框架。所有样式都是 `src/styles/global.css` 中的 CSS 自定义属性，通过在 `<html>` 上设置 `data-theme="dark"` 实现暗色模式。主题切换状态持久化到 localStorage。管理后台 CSS 内联在 `src/admin/views/layout.ts` 中。

### 使用 Biome，而非 ESLint/Prettier

`biome.json` 是唯一的 lint/格式化配置。`check` 和 `format` npm 脚本使用 `bunx biome`。VCS 集成已开启（会遵循 `.gitignore`）。在 Biome 配置中，Astro 文件的 `noUnusedImports` 和 `noUnusedVariables` 规则已禁用。

### 错误处理约定

- 数据库查询失败返回空/零结果，而非抛出错误
- 文章不存在返回 302 重定向到 `/blog`
- 管理后台路由在失败时返回用户可见的错误消息（而非通用的 500 状态页）
- 没有集中的错误处理器——每个路由自行处理错误

### 测试

使用 `bun:test`（Bun 内置的测试运行器——无需 Jest/Vitest 配置）。测试文件位于 `tests/unit/` 和 `tests/integration/`。集成测试使用 `app.request()` 直接测试 Hono 端点（无需启动 HTTP 服务器）。Bun 会自动发现测试文件。
