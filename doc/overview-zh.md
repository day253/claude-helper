# Claude Helper — 项目说明（原 README 详细内容）

面向 **Claude Code** 与 **OpenAI 兼容客户端**：在本地保存多家供应商的 **API Key**，交互时提示 **去哪里申请密钥**，并做 **网络检查**、**导出环境变量** 或 **合并写入** `~/.claude/settings.json`。

**技术设计**：[technical-guide-zh.md](./technical-guide-zh.md) · **厂商文档索引**：[vendor-docs-zh.md](./vendor-docs-zh.md) · **使用指南**（精简）：仓库根目录 [README.md](../README.md)

智谱 **GLM 编码套餐**：[一键安装助手](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper#) · [Claude Code 专页](https://docs.bigmodel.cn/cn/coding-plan/tool/claude)。MiniMax：[Claude Code 接入](https://platform.minimax.io/docs/token-plan/claude-code)。**Claude Helper** 不替代官方装机向导（`npx @z_ai/coding-helper`），只做 **Key**、**检查**、**export** / **`claude apply`**；更多链接见 [vendor-docs-zh.md](./vendor-docs-zh.md)。

配置文件：`~/.llm-providers/config.yaml`。可选顶层字段 **`wizard_lang`**：`zh` | `en`，控制无参向导、`check`、以及 `claude export` / `apply` 部分提示的语言；首次进入向导会询问语言，主菜单也可切换。

## 近期版本摘要（0.6.x）

**0.6.4**：根目录 **README** 改为**使用指南**；原长文迁至 **[overview-zh.md](./overview-zh.md)**（本页），并更新 technical / vendor 文档交叉引用。

**0.6.3**：借鉴 coding-helper 的 **💡 列表前提示**、`<-` / `x   ` 导航样式、语言 **当前项 ✓**；**首次无 Key** 短路径直进配置；主菜单展示 **settings.json 与本地默认供应商**对齐摘要；`check` 增加 **`--json`**；**`doctor`** 同 `check`。

**0.6.0 起**内置多家供应商（均有厂商文档给出的 **Anthropic 兼容** Claude Code 根 URL），完整 id 与链接见 [vendor-docs-zh.md](./vendor-docs-zh.md)。未知 id 会在读取 YAML 时忽略；无效 `active_provider` 会清空。

## 从源码开发与调试

```bash
cd claude-helper   # 或你克隆下来的仓库目录名
npm install
npm run build
npm link             # 可选，全局可用 claude-helper
```

克隆仓库后 **不再** 使用 `prepare` 自动 `tsc`（避免与 registry 发布的精简包冲突）；本地务必执行一次 `npm run build`。

从旧版迁移 / **清理旧全局命令**：

1. `npm unlink -g llm-providers-config`（若提示无此包可忽略）
2. 若 `$(npm root -g)/../bin/llm-config` 仍存在且已失效：`rm -f "$(npm root -g)/../bin/llm-config"`
3. 在本仓库执行 `npm link`，得到全局命令 `claude-helper`

GitHub 旧仓库 URL 一般会重定向到新名一段时间。

开发调试：

- 直接跑：`npx tsx src/cli.ts`（等同 init）或 `npx tsx src/cli.ts list`
- **断点调试**（会先暂停等待附加调试器）：`npm run debug -- list`，在 Cursor/VS Code 选「附加到 Node 进程」或使用 Chrome 打开 `chrome://inspect`

## 发布到 npm（维护者）

1. 在 npm 网站创建 **Access Token**（具备 **Publish** 权限；若账户开启 2FA，需使用带 **Bypass 2FA** 的 Granular Token 或发布时加 `--otp`）。
2. **勿** 将 token 写入仓库。任选其一完成登录：
   - `npm login`
   - 或在用户级 `~/.npmrc` 增加一行：`//registry.npmjs.org/:_authToken=你的token`
3. 执行 `npm whoami` 确认已登录。
4. 在本仓库根目录：`npm publish`（`prepublishOnly` 会先 `npm run build`；`package.json` 的 **`files`** 已包含 `dist/`，与 `.gitignore` 无关，避免空包）。

## 供应商与 Claude Code 一键 apply

下表仅举例；**全部内置 id、官方文档与默认 Base** 见 [vendor-docs-zh.md](./vendor-docs-zh.md) 与 `src/providers.ts`。

| 供应商 | 文档入口 | 备注 |
|--------|-----------|------|
| **glm** | [智谱 Claude Code](https://docs.bigmodel.cn/cn/coding-plan/tool/claude) | `ANTHROPIC_AUTH_TOKEN`；向导默认首项 |
| **dashscope** / **dashscope_intl** / **modelstudio_intl** | [国内 Coding Plan](https://help.aliyun.com/zh/model-studio/claude-code-coding-plan) · [国际 Coding Plan](https://www.alibabacloud.com/help/en/model-studio/claude-code-coding-plan) · [国际按量](https://www.alibabacloud.com/help/doc-detail/2949529.html) | 三者密钥与 Base **不同**，请按控制台套餐选择 id |
| **deepseek** / **fireworks** / **siliconflow** / **novita** | [DeepSeek Anthropic（中文）](https://api-docs.deepseek.com/zh-cn/guides/anthropic_api) · [Fireworks](https://docs.fireworks.ai/ecosystem/integrations/claude-code) · [SiliconFlow](https://docs.siliconflow.com/cn/usercases/use-siliconcloud-in-ClaudeCode) · [Novita](https://novita.ai/docs/guides/claude-code) | Fireworks/SiliconFlow 文档为 **`ANTHROPIC_API_KEY`**；SiliconFlow **必须** `--model` |
| **minimax** / **moonshot** / **openrouter** / **volcengine** / **zai** / **byteplus** | 见 [vendor-docs-zh.md](./vendor-docs-zh.md) | 区域或路径以官方为准，可用 `--anthropic-base` 覆盖 |

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
| 供应商 | 以 GLM 编码套餐为中心 | 多家 Anthropic 兼容网关（见上表与 [vendor-docs-zh.md](./vendor-docs-zh.md)） |
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
