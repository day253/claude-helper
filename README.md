# Claude Helper

**npm 包名**：`claude-helper` · **命令**：`claude-helper`（**无子命令**即进入向导：先**选一家**供应商，再**按文档提示**填 API Key，等同 `init`）

**技术设计（架构 / 数据流 / 决策）**：[doc/technical-guide-zh.md](doc/technical-guide-zh.md)（结构与 [openclaw-cursor-brain 技术文档](https://github.com/andeya/openclaw-cursor-brain/blob/main/doc/technical-guide-zh.md) 对齐，便于团队评审与贡献）。

面向 **Claude Code** 与 **OpenAI 兼容客户端**：在本地保存多家供应商的 **API Key**，交互时提示 **去哪里申请密钥**，并做 **网络检查**、**导出环境变量** 或 **合并写入** `~/.claude/settings.json`。

智谱 **GLM 编码套餐** 官方装机向导见：[一键安装助手（Coding Tool Helper）](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper)（`npx @z_ai/coding-helper` / `coding-helper`）。**Claude Helper** 与之思路相近，但**刻意收窄**：不自动安装 CLI、不配 MCP/插件市场，只做 **Key 保管**、**网络检查**、**导出** 与 **`claude apply`**。国际站说明亦可对照 [Z.AI 文档](https://docs.z.ai/devpack/extension/coding-tool-helper)。

配置文件：`~/.llm-providers/config.yaml`

**0.4.1 起**内置 **glm / minimax / openrouter**（均有官方文档给出的 **Anthropic 兼容** 根 URL，可直接 `claude apply`）。旧版 YAML 里其它供应商 id 会在读取时**忽略**；若 `active_provider` 已失效会清空，请重新 `claude-helper` 向导或 `active`。

## 安装

```bash
cd claude-helper   # 或你克隆下来的仓库目录名
npm install
npm run build
npm link             # 可选，全局可用 claude-helper
```

从旧版迁移 / **清理旧全局命令**：

1. `npm unlink -g llm-providers-config`（若提示无此包可忽略）
2. 若 `$(npm root -g)/../bin/llm-config` 仍存在且已失效：`rm -f "$(npm root -g)/../bin/llm-config"`
3. 在本仓库执行 `npm link`，得到全局命令 `claude-helper`

GitHub 旧仓库 URL 一般会重定向到新名一段时间。

开发调试：

- 直接跑：`npx tsx src/cli.ts`（等同 init）或 `npx tsx src/cli.ts list`
- **断点调试**（会先暂停等待附加调试器）：`npm run debug -- list`，在 Cursor/VS Code 选「附加到 Node 进程」或使用 Chrome 打开 `chrome://inspect`

## 命令一览

| 命令 | 说明 |
|------|------|
| （无子命令）或 `claude-helper init` | 向导：**先列表选唯一供应商**（回车默认智谱 glm），**再**按屏幕上的文档链接与说明填写该家 API Key，并设为默认；**结束后自动检查并提示启动 Claude** |
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

`provider`：`glm` | `minimax` | `openrouter`（均有官方 **Anthropic 兼容** 端点说明，可直接 `claude apply`）。

## 供应商与 Claude Code 一键 apply

| 供应商 | 申请密钥提示 | OpenAI 默认 Base | Anthropic Base（`claude apply`） |
|--------|----------------|------------------|----------------------------------|
| **glm** | [一键安装助手](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper) 或开放平台 API Keys | `https://open.bigmodel.cn/api/paas/v4` | `https://open.bigmodel.cn/api/anthropic` |
| **minimax** | [Claude Code 接入（MiniMax）](https://platform.minimax.io/docs/token-plan/claude-code) | `https://api.minimax.io/v1` | 国际默认 `https://api.minimax.io/anthropic`；**中国大陆**请 `set minimax --anthropic-base https://api.minimaxi.com/anthropic`。`apply` 会一并写入官方文档建议的模型别名与超时等 `env`（见 `providers.ts` 中 `claudeExtraEnv`） |
| **openrouter** | OpenRouter → Keys | `https://openrouter.ai/api/v1` | `https://openrouter.ai/api`（`ANTHROPIC_AUTH_TOKEN` + 空的 `ANTHROPIC_API_KEY`） |

高级：若需改用自建代理根地址，可用 `claude-helper set <id> --anthropic-base <URL>` 覆盖内置 Anthropic Base。

## 与 OpenAI 生态对接

```bash
claude-helper active openrouter
eval "$(claude-helper export)"
```

或指定供应商：

```bash
eval "$(claude-helper export -p openrouter)"
```

## 与 Claude Code 对接

官方通过用户级 [`settings.json` 的 `env`](https://docs.anthropic.com/en/docs/claude-code/settings) 注入环境变量；本工具的 `claude apply` 会 **合并** `env`，并先删除「上一供应商可能留下的」键：各厂商在 `claudeExtraEnv` 里声明过的附加变量（如 MiniMax 的模型别名）、以及认证模式切换时需去掉的 `ANTHROPIC_AUTH_TOKEN` 等。

```bash
claude-helper set glm --key YOUR_KEY
claude-helper active glm
claude-helper claude apply
```

**安全提示**：`settings.json` 会包含密钥明文，请勿提交到 Git，并留意备份文件 `settings.json.bak.*` 的权限。

## 与智谱官方「一键安装助手」的差异

官方文档：[接入指南 · 一键安装助手](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper)（NPM：`@z_ai/coding-helper`，命令 `coding-helper` / `chelper`，支持 `doctor` 等）。

| | 官方 Coding Tool Helper | Claude Helper（本仓库） |
|--|-------------------------|-------------------------|
| 范围 | 装编码工具、套餐、MCP、Claude 插件市场等 | **仅** Key、检查、`export` / `claude apply` |
| 启动 | `npx @z_ai/coding-helper` | `claude-helper`（无参即向导选一家） |
| 供应商 | 以 GLM 编码套餐为中心 | 内置 Anthropic 端点的 **glm、minimax、openrouter** |
| 配置落点 | 依官方向导 | `~/.llm-providers/config.yaml` + 可选 `~/.claude/settings.json` |

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
