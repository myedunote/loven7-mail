# AI Agent 部署指令

这份文档写给 Claude Code、Codex、OpenCode、Hermes、OpenClaw 等 AI 编程 / 运维 Agent。目标是把 Loven7 Mail Cloudflare Suite 部署到用户自己的 Cloudflare 账号，同时避免用户把 API、密码、Token 或密钥直接写进 Prompt、聊天记录或 GitHub 仓库。

仓库地址：

```text
https://github.com/Lur1N77777/loven7-mail-cloudflare-suite
```

项目包含两个 Cloudflare Pages 站点：

```text
apps/admin    管理后台 PWA
apps/webmail  用户邮箱站 / 分享站，包含 Cloudflare Pages Functions
```

## 给 Agent 的核心要求

1. 先部署前端项目，不要要求用户把 Worker API、管理员密码、站点密码、Cloudflare Token、GitHub Token 或分享密钥写进 Prompt。
2. 不要把任何私密信息提交到 GitHub，也不要写入 `.env.production`、`.env.local`、`dist/` 或说明文档。
3. 管理后台 `apps/admin` 默认不设置 `VITE_API_BASE`。部署完成后，用户会在网页里的 **连接设置** 中填写 Worker API 地址和管理员密码，浏览器会本地缓存。
4. 用户站 `apps/webmail` 如果需要访问上游 Worker 或启用分享功能，只能通过 Cloudflare Pages 的运行时环境变量和 KV 绑定配置。你可以用 Cloudflare 控制台、Wrangler、Cloudflare API 或 MCP 的安全配置流程完成；如果没有安全输入能力，就告诉用户部署后去 Cloudflare 控制台填写，不要让用户在公开 Prompt 里粘贴明文。
5. 生成或设置 `SHARE_ENCRYPTION_SECRET` 时，不要在最终回复里输出密钥原文。
6. 如果管理后台和用户站是两个不同 origin，必须在用户站 Pages 项目设置 `SHARE_ADMIN_CORS_ORIGINS=<管理后台 origin>`，不要设置 `*`。

## 最快部署 Prompt

用户可以把下面一段话交给 Agent：

```text
请帮我部署这个 GitHub 项目到我的 Cloudflare 账号：https://github.com/Lur1N77777/loven7-mail-cloudflare-suite 。这是基于 Cloudflare Temp Mail / cloudflare_temp_email 官方 Worker API 的增强前端套件，包含 apps/admin 管理后台和 apps/webmail 用户站/分享站。请创建两个 Cloudflare Pages 项目：管理后台使用 apps/admin，构建命令 npm ci && npm run build，输出目录 dist；用户站使用 apps/webmail，构建命令 npm ci && npm run build，输出目录 dist。不要让我在这段 Prompt 里填写任何 API、密码、Token 或密钥，也不要把这些信息写入仓库；管理后台部署完成后，我会在网页界面的“连接设置”里填写自己的 Worker API 地址和管理员密码。分享功能如果需要 KV 或运行时变量，请通过 Cloudflare 控制台/安全配置完成，并生成必要密钥，但不要在最终回复中泄露密钥原文；后台和用户站分开部署时，在用户站 Pages 里设置 SHARE_ADMIN_CORS_ORIGINS=<管理后台 origin>。部署完成后请返回管理后台 URL、用户站 URL，以及我下一步需要在界面里完成的配置。
```

## 部署管理后台 `apps/admin`

Cloudflare Pages 设置：

| 设置项 | 值 |
| --- | --- |
| Project name | `loven7-mail-admin`，也可以按用户要求修改 |
| Root directory | `apps/admin` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |

环境变量建议：

| 变量 | 设置方式 |
| --- | --- |
| `VITE_API_BASE` | 默认留空。不要把用户的 Worker API 写死进公开前端。 |
| `VITE_FRONTEND_LOGIN_BASE` | 可选。用户站 URL 已知时可以设置；也可以部署后在后台 **系统设置** 保存。 |
| `VITE_APP_NAME` | 可选，默认 `Loven7-Mail`。 |

部署后，用户在管理后台网页中打开 **连接设置**，填写自己的 Worker API 地址、管理员密码和可选站点密码。不要替用户把这些信息写进仓库。

## 部署用户站 / 分享站 `apps/webmail`

Cloudflare Pages 设置：

| 设置项 | 值 |
| --- | --- |
| Project name | `loven7-mail-webmail`，也可以按用户要求修改 |
| Root directory | `apps/webmail` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |

用户站的 Pages Functions 会在运行时读取这些配置。请通过 Cloudflare 的安全配置入口设置，不要把值写进 Prompt 或仓库：

| 配置 | 说明 |
| --- | --- |
| `MAIL_WORKER_BASE_URL` | Cloudflare Temp Mail Worker/API 根地址。用户不应在公开 Prompt 中粘贴；如果你没有安全输入能力，部署后提示用户去 Cloudflare Pages 环境变量里填写。 |
| `SITE_PASSWORD` | 可选。只有上游 Worker 启用了站点密码时才需要。 |
| `SHARE_ENCRYPTION_SECRET` | 分享功能需要。生成 32 字符以上随机字符串，保存到 Cloudflare Pages 环境变量，不要回显原文。 |
| `SHARE_ADMIN_CORS_ORIGINS` | 后台与用户站分开部署时需要。填写管理后台页面 origin，例如 `https://your-admin.pages.dev`；不要填写用户站地址，不要设置 `*`。 |
| `SHARE_PUBLIC_CORS_ORIGINS` | 可选。公开分享 API 的额外跨源来源；正常分享页同源访问时留空。 |
| `SHARE_KV` | 分享功能需要的 KV Namespace 绑定，绑定名必须是 `SHARE_KV`。 |

如果用户暂时只想先打开前端，可以先部署站点，再引导用户在 Cloudflare Pages 的环境变量和 KV 绑定页面补齐分享配置。

## 本地构建验证

部署前至少验证两个应用能构建：

```bash
git clone https://github.com/Lur1N77777/loven7-mail-cloudflare-suite.git
cd loven7-mail-cloudflare-suite

cd apps/admin
npm ci
npm run build
cd ../..

cd apps/webmail
npm ci
npm run check:functions:headers
npm run check:functions:cors
npm run check:functions:image
npm run build
cd ../..
```

不要提交构建产物、依赖目录或本地配置：

```text
node_modules/
dist/
.env.production
.env.local
.wrangler/
```

## 部署后让用户完成连接设置

两个 Pages 项目部署完成后，告诉用户：

1. 打开管理后台 URL。
2. 进入 **连接设置**。
3. 填写自己的 Worker API 地址、管理员密码和可选站点密码。
4. 进入 **系统设置**。
5. 把 **前端登录链接前缀** 设置为用户站 URL。
6. 回到 **地址管理**，复制一个邮箱登录链接测试用户站。
7. 如果启用分享功能，再测试单邮箱分享、多邮箱分享、撤回分享。

## 验证清单

部署完成后检查：

- 管理后台可以打开。
- 用户站可以打开。
- 管理后台连接信息可以在网页里保存，刷新后不需要重复输入。
- 地址管理可以加载邮箱地址。
- 复制邮箱登录链接后可以打开用户站。
- 如果启用分享功能：可以创建分享链接、打开分享链接、撤回分享链接。
- 如果管理后台和用户站不同 origin：用户站已设置 `SHARE_ADMIN_CORS_ORIGINS=<管理后台 origin>`。
- 最终回复不包含任何密码、Token 或密钥原文。

## 最终回复给用户

按这个格式回复：

```text
部署完成：

管理后台：<admin Pages URL>
用户站 / 分享站：<webmail Pages URL>
GitHub 仓库：https://github.com/Lur1N77777/loven7-mail-cloudflare-suite

已完成：
- 创建并部署 apps/admin Pages 项目
- 创建并部署 apps/webmail Pages 项目
- 分享功能所需 KV / 环境变量已通过 Cloudflare 安全配置完成（如已启用，不回显密钥）

下一步：
1. 打开管理后台。
2. 进入“连接设置”。
3. 填写你的 Worker API 地址和管理员密码。
4. 进入“系统设置”，填写用户站 URL 作为前端登录链接前缀。
5. 在地址管理中复制登录链接或创建分享链接进行测试。

安全说明：我没有把任何 API、密码、Token 或密钥写入仓库，也不会在回复里显示密钥原文。
```

## 常见失败处理

### 管理后台提示需要连接设置

这是正常行为。管理后台默认不内置 API 和密码，用户需要在网页里的 **连接设置** 中填写自己的 Worker API 地址和管理员密码。

### 用户站提示 `MAIL_WORKER_BASE_URL is not configured`

用户站 Pages 没有配置 Worker/API 根地址。请让用户到 Cloudflare Pages 的环境变量页面填写该值，然后重新部署或重新触发部署。不要让用户把明文写进公开 Prompt。

### 分享接口提示 `SHARE_KV is not configured`

用户站 Pages 没有绑定 KV Namespace。绑定名必须是：

```text
SHARE_KV
```

### 分享接口提示 `SHARE_ENCRYPTION_SECRET is not configured`

用户站 Pages 没有设置分享加密密钥。通过 Cloudflare Pages 环境变量设置一个 32 字符以上随机字符串，不要在回复中显示原文。

### 管理后台创建/管理分享链接提示网络或 CORS 失败

确认管理后台 **系统设置 → 前端登录链接前缀** 填写的是用户站 URL；然后在用户站 Pages 环境变量里设置 `SHARE_ADMIN_CORS_ORIGINS=<管理后台 origin>`，例如 `https://your-admin.pages.dev`。同时确认 `SHARE_KV` 和 `SHARE_ENCRYPTION_SECRET` 已配置。

### 管理后台复制出来的登录链接域名不对

进入管理后台 **系统设置**，把 **前端登录链接前缀** 改成用户站 URL。
