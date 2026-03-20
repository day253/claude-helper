# Claude Helper

**npm 包名**：`claude-helper` · **命令**：`claude-helper`

**技术设计（架构 / 数据流 / 决策）**：[doc/technical-guide-zh.md](doc/technical-guide-zh.md)（结构与 [openclaw-cursor-brain 技术文档](https://github.com/andeya/openclaw-cursor-brain/blob/main/doc/technical-guide-zh.md) 对齐，便于团队评审与贡献）。

面向 **Claude Code** 与 **OpenAI 兼容客户端**：在本地保存多家供应商的 **API Key**，交互时提示 **去哪里申请密钥**，并做 **网络检查**、**导出环境变量** 或 **合并写入** `~/.claude/settings.json`。

思路类似 [Z.AI Coding Tool Helper](https://docs.z.ai/devpack/extension/coding-tool-helper) 的向导体验，但**刻意收窄范围**：不安装第三方编码工具、不管理 MCP，只做密钥保管与对接说明。

配置文件：`~/.llm-providers/config.yaml`

## 安装

```bash
cd claude-helper   # 或你克隆下来的仓库目录名
npm install
npm run build
npm link             # 可选，全局可用 claude-helper
```

从旧版迁移：若曾全局链接过旧包名 `llm-providers-config` / 命令 `llm-config`，请先执行 `npm unlink -g llm-providers-config`，再在本仓库目录 `npm link`（得到 `claude-helper`）。GitHub 若仍用旧仓库 URL，Git 会自动重定向到新名一段时间。

开发调试：

- 直接跑：`npx tsx src/cli.ts list`
- **断点调试**（会先暂停等待附加调试器）：`npm run debug -- list`，在 Cursor/VS Code 选「附加到 Node 进程」或使用 Chrome 打开 `chrome://inspect`

## 命令一览

| 命令 | 说明 |
|------|------|
| `claude-helper init` | 新手向导：**第一步直接回车**即选「推荐」；再逐项只问 API Key（可先显示文档链接），不需要的 Key 回车跳过；**结束后自动检查网络并提示如何启动 Claude** |
| `claude-helper check` | 随时复查：已保存 Key、默认供应商、端点 HTTP 探测；并打印 **启动 Claude Code** 的步骤（与 init/set/active 保存后自动执行的内容相同） |
| `claude-helper list` | 列出全部（含 OpenAI base / Claude base、密钥脱敏） |
| `claude-helper show <provider>` | 查看单个 |
| `claude-helper set <provider>` | 无其它参数时**交互只填 Key**；可用 `--key` / `--base` / `--anthropic-base` / `--model` / `--note`；**保存后自动检查并提示启动 Claude** |
| `claude-helper unset <provider> [field]` | 删除字段或整段供应商配置 |
| `claude-helper active [provider]` | 默认供应商（`export` / `claude` 省略 `-p` 时用）；**设置后会自动检查并提示启动 Claude** |
| `claude-helper export [-p id] [-f shell\|json]` | 输出 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`（LiteLLM、OpenAI SDK 等） |
| `claude-helper claude export [-p id]` | 打印 `export ANTHROPIC_*=...`，可在 shell 中 `eval` |
| `claude-helper claude apply [-p id]` | 将本次计算的 `ANTHROPIC_*` **合并进** `~/.claude/settings.json` 的 `env`；**写入前备份**为 `settings.json.bak.<时间戳>` |
| `claude-helper --help` / `claude-helper claude --help` | 帮助 |

`provider`：`glm` | `kimi` | `minimax` | `openrouter` | `volcano`

## 供应商与 Claude Code 一键 apply

| 供应商 | 申请密钥提示 | OpenAI 默认 Base | 内置 Anthropic Base（`claude apply`） |
|--------|----------------|------------------|----------------------------------------|
| **glm** | 智谱开放平台 → API Keys | `https://open.bigmodel.cn/api/paas/v4` | 有 → `https://open.bigmodel.cn/api/anthropic` |
| **kimi** | Moonshot 开放平台 → API Key | `https://api.moonshot.cn/v1` | 无（需网关，见下） |
| **minimax** | MiniMax 开放平台 | `https://api.minimax.chat/v1` | 无 |
| **openrouter** | OpenRouter → Keys | `https://openrouter.ai/api/v1` | 有 → `https://openrouter.ai/api`（使用 `ANTHROPIC_AUTH_TOKEN`，`ANTHROPIC_API_KEY` 为空字符串） |
| **volcano** | 火山方舟 / 控制台 API Key | `https://ark.cn-beijing.volces.com/api/v3` | 无（地域/endpoint 以控制台为准，可 `--base` 覆盖） |

说明：Kimi / MiniMax / 火山等一般为 **OpenAI 兼容** 端点；Claude Code 默认走 **Anthropic Messages** 形态。若厂商未提供 Anthropic 兼容 URL，需自建 **LiteLLM** 等网关，再把网关的 **Anthropic 根地址** 写入：

```bash
claude-helper set kimi --anthropic-base http://127.0.0.1:4000
claude-helper claude apply -p kimi
```

（示例端口以你本地 LiteLLM 为准。）

## 与 OpenAI 生态对接

```bash
claude-helper active openrouter
eval "$(claude-helper export)"
```

或指定供应商：

```bash
eval "$(claude-helper export -p volcano)"
```

## 与 Claude Code 对接

官方通过用户级 [`settings.json` 的 `env`](https://docs.anthropic.com/en/docs/claude-code/settings) 注入环境变量；本工具的 `claude apply` 会 **合并** `env`，并尽量清除与当前模式冲突的键（例如从 OpenRouter 切回智谱时会去掉多余的 `ANTHROPIC_AUTH_TOKEN`）。

```bash
claude-helper set glm --key YOUR_KEY
claude-helper active glm
claude-helper claude apply
```

**安全提示**：`settings.json` 会包含密钥明文，请勿提交到 Git，并留意备份文件 `settings.json.bak.*` 的权限。

## LiteLLM 简要流程（OpenAI-only 供应商 → Claude Code）

1. 用本工具保存供应商 Key：`claude-helper set kimi --key ...`
2. 配置 LiteLLM，使其上游使用该 Key（可用 `claude-helper export -p kimi` 得到 `OPENAI_*` 参考）
3. 启动 LiteLLM 的 **Anthropic 兼容** 监听地址（常见为 `/v1/messages` 同源代理，具体以 [LiteLLM 文档](https://docs.litellm.ai/) 为准）
4. `claude-helper set kimi --anthropic-base http://127.0.0.1:<端口>`（或文档给出的 anthropic 路径根）
5. `claude-helper claude apply -p kimi`

## 与 Coding Tool Helper 的差异

| | Coding Tool Helper | 本工具 |
|--|-------------------|--------|
| 范围 | 装工具、配 Plan、MCP 等 | **仅** Key + 导出 / 写入 Claude `env` |
| 供应商 | 偏 GLM 生态 | GLM、Kimi、MiniMax、OpenRouter、火山等（可扩展） |
| 配置落点 | 依工具而定 | `~/.llm-providers/config.yaml` + 可选 `~/.claude/settings.json` |

## 发布到 GitHub（例如账号或组织 `day253`）

本仓库默认远程为：`https://github.com/day253/claude-helper.git`（若你的用户名/组织名不同，请改 `git remote set-url`）。

### 方式 A：`gh`（已安装 Homebrew 版）

在终端登录（需浏览器或 Token 一次）：

```bash
gh auth login
```

在 GitHub 上创建空仓库（与下面 `origin` 路径一致），然后推送：

```bash
cd ~/claude-helper
gh repo create day253/claude-helper --public --description "Claude Helper：多供应商 API Key 与 Claude Code 配置"
git push -u origin main
```

（把 `day253/claude-helper` 换成你的 `用户名或组织名/仓库名`；若本地还没有 `origin`，先执行  
`git remote add origin https://github.com/day253/claude-helper.git`。）

### 方式 B：网页新建空仓库

1. 打开 [GitHub New repository](https://github.com/new)，Owner 选 `day253`，仓库名 `claude-helper`，**不要**勾选初始化 README。
2. 本地执行：

```bash
cd ~/claude-helper
git remote set-url origin https://github.com/day253/claude-helper.git
git push -u origin main
```
