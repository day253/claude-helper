# Claude Helper

**npm 包名**：`claude-helper` · **命令**：`claude-helper`（**无子命令**即进入向导：先**选一家**供应商，再**按文档提示**填 API Key，等同 `init`）

**技术设计**：[doc/technical-guide-zh.md](doc/technical-guide-zh.md) · **厂商文档索引（含 MiniMax / 智谱一键助手等官方链接）**：[doc/vendor-docs-zh.md](doc/vendor-docs-zh.md)

面向 **Claude Code** 与 **OpenAI 兼容客户端**：在本地保存多家供应商的 **API Key**，交互时提示 **去哪里申请密钥**，并做 **网络检查**、**导出环境变量** 或 **合并写入** `~/.claude/settings.json`。

智谱 **GLM 编码套餐**：[一键安装助手](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper#) · [Claude Code 专页](https://docs.bigmodel.cn/cn/coding-plan/tool/claude)。MiniMax：[Claude Code 接入](https://platform.minimax.io/docs/token-plan/claude-code)。**Claude Helper** 不替代官方装机向导（`npx @z_ai/coding-helper`），只做 **Key**、**检查**、**export** / **`claude apply`**；更多链接见 [vendor-docs-zh.md](doc/vendor-docs-zh.md)。

配置文件：`~/.llm-providers/config.yaml`

**0.6.1**：无参 / `init` 为**循环主菜单向导**（参考官方 `npx @z_ai/coding-helper` 的分层与提示习惯：横幅、全局配置警告、`claude apply` 二次确认、下一步菜单）。**0.6.0 起**内置 **14 家**供应商（均有厂商文档给出的 **Anthropic 兼容** Claude Code 根 URL）：`byteplus`、`dashscope`、`dashscope_intl`、`deepseek`、`fireworks`、`glm`、`minimax`、`modelstudio_intl`、`moonshot`、`novita`、`openrouter`、`siliconflow`、`volcengine`、`zai`。完整链接见 [doc/vendor-docs-zh.md](doc/vendor-docs-zh.md)。未知 id 会在读取 YAML 时忽略；无效 `active_provider` 会清空。

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
| （无子命令）或 `claude-helper init` | **主菜单向导**（风格参考官方 coding-helper）：配置 Key / 写入 Claude Code / 检查 / 退出；配置路径内含供应商列表、同步摘要、`claude apply` 确认与启动提示 |
| `claude-helper check` | 随时复查：已保存 Key、默认供应商、**仅 Anthropic 兼容根** HTTP 探测（OpenAI export Base 不探测）；并打印 **启动 Claude Code** 的步骤（与 init/set/active 保存后自动执行的内容相同） |
| `claude-helper list` | 列出全部（含 OpenAI base / Claude base、密钥脱敏） |
| `claude-helper show <provider>` | 查看单个 |
| `claude-helper set <provider>` | 无其它参数时**交互只填 Key**；可用 `--key` / `--base` / `--anthropic-base` / `--model` / `--note`；**保存后自动检查并提示启动 Claude** |
| `claude-helper unset <provider> [field]` | 删除字段或整段供应商配置 |
| `claude-helper active [provider]` | 默认供应商（`export` / `claude` 省略 `-p` 时用）；**设置后会自动检查并提示启动 Claude** |
| `claude-helper export [-p id] [-f shell\|json]` | 输出 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`（LiteLLM、OpenAI SDK 等） |
| `claude-helper claude export [-p id]` | 打印 `export ANTHROPIC_*=...`，可在 shell 中 `eval` |
| `claude-helper claude apply [-p id]` | 将本次计算的 `ANTHROPIC_*` **合并进** `~/.claude/settings.json` 的 `env`；**写入前备份**为 `settings.json.bak.<时间戳>` |
| `claude-helper --help` / `claude-helper claude --help` | 帮助 |

`provider`：运行 `claude-helper --help` 查看当前列表（由 `src/providers.ts` 生成）。

## 供应商与 Claude Code 一键 apply

下表仅举例；**全部内置 id、官方文档与默认 Base** 见 [doc/vendor-docs-zh.md](doc/vendor-docs-zh.md) 与 `src/providers.ts`。

| 供应商 | 文档入口 | 备注 |
|--------|-----------|------|
| **glm** | [智谱 Claude Code](https://docs.bigmodel.cn/cn/coding-plan/tool/claude) | `ANTHROPIC_AUTH_TOKEN`；向导默认首项 |
| **dashscope** / **dashscope_intl** / **modelstudio_intl** | [国内 Coding Plan](https://help.aliyun.com/zh/model-studio/claude-code-coding-plan) · [国际 Coding Plan](https://www.alibabacloud.com/help/en/model-studio/claude-code-coding-plan) · [国际按量](https://www.alibabacloud.com/help/doc-detail/2949529.html) | 三者密钥与 Base **不同**，请按控制台套餐选择 id |
| **deepseek** / **fireworks** / **siliconflow** / **novita** | [DeepSeek Anthropic](https://api-docs.deepseek.com/guides/anthropic_api) · [Fireworks](https://docs.fireworks.ai/ecosystem/integrations/claude-code) · [SiliconFlow](https://docs.siliconflow.com/cn/usercases/use-siliconcloud-in-ClaudeCode) · [Novita](https://novita.ai/docs/guides/claude-code) | Fireworks/SiliconFlow 文档为 **`ANTHROPIC_API_KEY`**；SiliconFlow **必须** `--model` |
| **minimax** / **moonshot** / **openrouter** / **volcengine** / **zai** / **byteplus** | 见 [vendor-docs-zh.md](doc/vendor-docs-zh.md) | 区域或路径以官方为准，可用 `--anthropic-base` 覆盖 |

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
| 供应商 | 以 GLM 编码套餐为中心 | 多家 Anthropic 兼容网关（见上表与 [vendor-docs-zh.md](doc/vendor-docs-zh.md)） |
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
