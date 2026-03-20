# llm-providers-config

**技术设计（架构 / 数据流 / 决策）**：[doc/technical-guide-zh.md](doc/technical-guide-zh.md)（结构与 [openclaw-cursor-brain 技术文档](https://github.com/andeya/openclaw-cursor-brain/blob/main/doc/technical-guide-zh.md) 对齐，便于团队评审与贡献）。

面向 **Claude Code** 与 **OpenAI 兼容客户端** 的极简 CLI：在本地保存多家供应商的 **API Key**，交互时明确提示 **去哪里申请密钥**，并一键 **导出环境变量** 或 **合并写入** `~/.claude/settings.json`。

思路类似 [Z.AI Coding Tool Helper](https://docs.z.ai/devpack/extension/coding-tool-helper) 的向导体验，但**刻意收窄范围**：不安装第三方编码工具、不管理 MCP，只做密钥保管与对接说明。

配置文件：`~/.llm-providers/config.yaml`

## 安装

```bash
cd llm-providers-config
npm install
npm run build
npm link   # 可选，全局可用 llm-config
```

开发调试：`npx tsx src/cli.ts list`

## 命令一览

| 命令 | 说明 |
|------|------|
| `llm-config init` | 向导：勾选供应商，**逐项只问 API Key**（前先显示文档链接与申请说明） |
| `llm-config list` | 列出全部（含 OpenAI base / Claude base、密钥脱敏） |
| `llm-config show <provider>` | 查看单个 |
| `llm-config set <provider>` | 无其它参数时**交互只填 Key**；可用 `--key` / `--base` / `--anthropic-base` / `--model` / `--note` |
| `llm-config unset <provider> [field]` | 删除字段或整段供应商配置 |
| `llm-config active [provider]` | 默认供应商（`export` / `claude` 省略 `-p` 时用） |
| `llm-config export [-p id] [-f shell\|json]` | 输出 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`（LiteLLM、OpenAI SDK 等） |
| `llm-config claude export [-p id]` | 打印 `export ANTHROPIC_*=...`，可在 shell 中 `eval` |
| `llm-config claude apply [-p id]` | 将本次计算的 `ANTHROPIC_*` **合并进** `~/.claude/settings.json` 的 `env`；**写入前备份**为 `settings.json.bak.<时间戳>` |
| `llm-config --help` / `llm-config claude --help` | 帮助 |

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
llm-config set kimi --anthropic-base http://127.0.0.1:4000
llm-config claude apply -p kimi
```

（示例端口以你本地 LiteLLM 为准。）

## 与 OpenAI 生态对接

```bash
llm-config active openrouter
eval "$(llm-config export)"
```

或指定供应商：

```bash
eval "$(llm-config export -p volcano)"
```

## 与 Claude Code 对接

官方通过用户级 [`settings.json` 的 `env`](https://docs.anthropic.com/en/docs/claude-code/settings) 注入环境变量；本工具的 `claude apply` 会 **合并** `env`，并尽量清除与当前模式冲突的键（例如从 OpenRouter 切回智谱时会去掉多余的 `ANTHROPIC_AUTH_TOKEN`）。

```bash
llm-config set glm --key YOUR_KEY
llm-config active glm
llm-config claude apply
```

**安全提示**：`settings.json` 会包含密钥明文，请勿提交到 Git，并留意备份文件 `settings.json.bak.*` 的权限。

## LiteLLM 简要流程（OpenAI-only 供应商 → Claude Code）

1. 用本工具保存供应商 Key：`llm-config set kimi --key ...`
2. 配置 LiteLLM，使其上游使用该 Key（可用 `llm-config export -p kimi` 得到 `OPENAI_*` 参考）
3. 启动 LiteLLM 的 **Anthropic 兼容** 监听地址（常见为 `/v1/messages` 同源代理，具体以 [LiteLLM 文档](https://docs.litellm.ai/) 为准）
4. `llm-config set kimi --anthropic-base http://127.0.0.1:<端口>`（或文档给出的 anthropic 路径根）
5. `llm-config claude apply -p kimi`

## 与 Coding Tool Helper 的差异

| | Coding Tool Helper | 本工具 |
|--|-------------------|--------|
| 范围 | 装工具、配 Plan、MCP 等 | **仅** Key + 导出 / 写入 Claude `env` |
| 供应商 | 偏 GLM 生态 | GLM、Kimi、MiniMax、OpenRouter、火山等（可扩展） |
| 配置落点 | 依工具而定 | `~/.llm-providers/config.yaml` + 可选 `~/.claude/settings.json` |

## 发布到 GitHub（例如账号或组织 `day253`）

本仓库已初始化 Git，默认远程为：`https://github.com/day253/llm-providers-config.git`（若你的用户名/组织名不同，请改 `git remote set-url`）。

### 方式 A：`gh`（已安装 Homebrew 版）

在终端登录（需浏览器或 Token 一次）：

```bash
gh auth login
```

在 GitHub 上创建空仓库（与下面 `origin` 路径一致），然后推送：

```bash
cd ~/llm-providers-config
gh repo create day253/llm-providers-config --public --description "多供应商 LLM API 本地配置 CLI"
git push -u origin main
```

（把 `day253/llm-providers-config` 换成你的 `用户名或组织名/仓库名`；若本地还没有 `origin`，先执行  
`git remote add origin https://github.com/day253/llm-providers-config.git`。）

### 方式 B：网页新建空仓库

1. 打开 [GitHub New repository](https://github.com/new)，Owner 选 `day253`，仓库名 `llm-providers-config`，**不要**勾选初始化 README。
2. 本地执行：

```bash
cd ~/llm-providers-config
git remote set-url origin https://github.com/day253/llm-providers-config.git
git push -u origin main
```
