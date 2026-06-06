# 部署速查

这份文档只回答一个问题：已经有 Cloudflare Temp Mail / `cloudflare_temp_email` 上游 Worker 后，怎样最快把 Loven7 Mail Cloudflare Suite 部署起来。

## 结论

可以把部署任务交给 AI Agent 自动完成。Agent 可以创建两个 Cloudflare Pages 项目、配置 GitHub Actions、创建并绑定 KV、设置运行时变量、触发部署和检查 `/api/runtime`。

有一件事建议保留在浏览器里手动做：管理后台首次打开后的 Worker API 地址和管理员密码填写。它们会保存在当前浏览器本地缓存，不需要写进仓库、Prompt 或构建环境。

## 一键部署按钮

Cloudflare 官方 `Deploy to Cloudflare` 按钮目前只支持 Workers 应用，不支持 Pages 应用。本仓库推荐部署为两个 Cloudflare Pages 项目，所以现在不能放一个真正可用的官方一键按钮。

如果把官方按钮直接指向这个仓库，它会进入 Workers 创建流程，而不是按 `apps/admin` 和 `apps/webmail` 创建两个 Pages 项目，部署结果不符合预期。

当前最接近“一键部署”的方案是把下面的 Agent 指令交给有 Cloudflare / GitHub 操作能力的 Agent；手动部署则按本文的 Pages 控制台步骤完成。未来如果要做官方同款按钮，需要新增 Workers Static Assets 版本，并把用户站的 Pages Functions 路由迁移到 Worker 路由。

## 项目需要什么数据库

没有 SQL 数据库，没有 D1、MySQL、Postgres，也没有迁移脚本。

分享功能只需要一个 Cloudflare KV Namespace：

| 项 | 值 |
| --- | --- |
| 用途 | 保存分享链接、撤回状态、仅新增邮件 cutoff、访客隐藏邮件记录 |
| 绑定位置 | 用户站 `apps/webmail` 的 Cloudflare Pages Functions |
| Binding name | `SHARE_KV` |
| Production / Preview | 建议分别绑定不同 KV Namespace |

如果暂时只用单邮箱 JWT 登录，不用分享功能，可以先不绑定 KV；但管理后台里的分享创建和分享管理会不可用。

## 自动部署：交给 Agent

把下面这段发给有 Cloudflare / GitHub 操作能力的 Agent。不要在公开聊天里粘贴 Token、管理员密码、Worker API 密钥或分享密钥；让 Agent 通过它所在环境的安全输入、secrets、MCP 或 Cloudflare 登录流程读取。

```text
请帮我自动部署这个开源项目：
https://github.com/Lur1N77777/loven7-mail-cloudflare-suite

我已经有 Cloudflare Temp Mail / cloudflare_temp_email 上游 Worker。请不要让我在公开 Prompt 里粘贴 Cloudflare Token、GitHub Token、管理员密码、站点密码、Worker API 地址或分享密钥；如需这些值，请通过安全输入 / secrets / Cloudflare 登录流程收集，不要写入仓库、README、commit、Actions 日志或最终回复。

请完成：
1. 创建或复用两个 Cloudflare Pages 项目：
   - 管理后台：Root directory apps/admin，Build command npm ci && npm run build，Output directory dist。
   - 用户站 / 分享站：Root directory apps/webmail，Build command npm ci && npm run build，Output directory dist。
2. 管理后台默认不要设置 VITE_API_BASE。部署完成后我会在网页“连接设置”里填写 Worker API 地址和管理员密码。
3. 为用户站配置运行时：
   - MAIL_WORKER_BASE_URL：通过安全输入读取我的上游 Worker/API 根地址。
   - SITE_PASSWORD：只有上游 Worker 启用站点密码时才设置。
   - SHARE_ENCRYPTION_SECRET：生成 32 字符以上随机值，保存为 Cloudflare Pages secret，不要回显原文。
   - SHARE_ADMIN_CORS_ORIGINS：填写管理后台 Pages 的 origin，例如 https://xxx.pages.dev。
   - SHARE_PUBLIC_CORS_ORIGINS：默认留空。
4. 创建或复用一个 Cloudflare KV Namespace，并在用户站 Pages Functions 里绑定为 SHARE_KV。不要把 KV Namespace ID 写进仓库。
5. 触发部署并检查构建结果。部署后访问用户站 /api/runtime，确认 MAIL_WORKER_BASE_URL、SHARE_KV、SHARE_ENCRYPTION_SECRET 都已配置。
6. 最终只返回管理后台 URL、用户站 URL、Actions/Cloudflare 部署结果，以及我下一步需要在管理后台网页里填写的内容；不要输出任何密钥原文。
```

Agent 部署完成后，你只需要：

1. 打开管理后台 URL。
2. 进入“连接设置”，填写你的 Worker API 地址、管理员密码和可选站点密码。
3. 进入“系统设置”，把“前端登录链接前缀”设置为用户站 URL。
4. 在“地址管理”复制一个邮箱登录链接，测试用户站。
5. 如果启用分享功能，创建一个分享链接并打开测试。

## 手动部署：Cloudflare 控制台

手动部署建议走 Cloudflare Pages 控制台，命令最少，也不需要理解数据库。

### 1. 创建管理后台 Pages

| 设置项 | 值 |
| --- | --- |
| Project name | `loven7-mail-admin`，也可以自定义 |
| Root directory | `apps/admin` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |

环境变量可以先不填。管理后台首次打开后会让你在网页里填写连接信息。

### 2. 创建用户站 Pages

| 设置项 | 值 |
| --- | --- |
| Project name | `loven7-mail-webmail`，也可以自定义 |
| Root directory | `apps/webmail` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |

### 3. 配置用户站运行时变量

在用户站 Pages 项目里进入 Settings -> Variables and Secrets：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `MAIL_WORKER_BASE_URL` | 是 | 你的上游 Temp Mail Worker/API 根地址。 |
| `SITE_PASSWORD` | 否 | 上游 Worker 开启站点密码时填写。 |
| `SHARE_ENCRYPTION_SECRET` | 分享功能需要 | 32 字符以上随机字符串，建议保存为 secret。 |
| `SHARE_ADMIN_CORS_ORIGINS` | 分站部署分享功能需要 | 管理后台页面 origin，例如 `https://your-admin.pages.dev`。 |
| `SHARE_PUBLIC_CORS_ORIGINS` | 否 | 默认留空。 |

### 4. 绑定 KV

在用户站 Pages 项目里进入 Settings -> Functions -> KV namespace bindings：

| 设置项 | 值 |
| --- | --- |
| Binding name | `SHARE_KV` |
| KV Namespace | 新建或选择你自己的 Namespace |

建议命名为 `loven7-mail-share`。Preview 环境如果要测试分享功能，也要单独绑定 KV；建议使用独立 Preview KV，避免污染 Production 分享数据。

### 5. 连接两个站点

两个 Pages 项目部署好后：

1. 打开管理后台。
2. 在“连接设置”填写 Worker API 地址、管理员密码和可选站点密码。
3. 在“系统设置”把“前端登录链接前缀”设置为用户站 URL。
4. 回到“地址管理”测试邮箱登录链接和分享链接。

## 可选命令

本地发布前预检：

```bash
npm run check:cloudflare
```

完整发布检查：

```bash
npm run check:release
```

部署后检查用户站运行时：

```powershell
$env:WEBMAIL_RUNTIME_URL="https://你的用户站域名"
npm run check:cloudflare:runtime
```

## 常见卡点

`SHARE_KV is not configured`：用户站 Pages 没有绑定 KV，或者只给 Production 绑定了但正在访问 Preview。

`SHARE_ENCRYPTION_SECRET is not configured`：用户站 Pages 没有设置分享加密密钥，添加后重新部署。

`MAIL_WORKER_BASE_URL is not configured`：用户站 Pages 没有设置上游 Worker/API 根地址。

管理后台创建分享时 CORS 失败：确认用户站变量 `SHARE_ADMIN_CORS_ORIGINS` 填的是管理后台 origin，不是用户站 URL，也不要填 `*`。
