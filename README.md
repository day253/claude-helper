# llm-providers-config

只做一件事：在本地保存 **多供应商** 的 API 配置（GLM / Kimi / Minimax / OpenRouter），不安装 Claude Code 等工具。

配置文件：`~/.llm-providers/config.yaml`

## 安装

```bash
cd llm-providers-config
npm install
npm run build
npm link   # 可选，全局可用 llm-config
```

开发调试：`npx tsx src/cli.ts list`

## 命令

| 命令 | 说明 |
|------|------|
| `llm-config init` | 向导：勾选供应商并填写 Key / Base URL / 默认模型 |
| `llm-config list` | 列出全部（密钥脱敏） |
| `llm-config show <provider>` | 查看单个 |
| `llm-config set <provider>` | 交互写入；也可用 `--key` / `--base` / `--model` |
| `llm-config unset <provider> [field]` | 删除某项或整段供应商配置 |
| `llm-config active [provider]` | 设置或查看默认供应商（给 `export` 用） |
| `llm-config export [-p provider] [-f shell\|json]` | 输出 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` |

`provider` 取值：`glm` | `kimi` | `minimax` | `openrouter`

## 与客户端对接

多数 OpenAI 兼容客户端只需：

```bash
eval "$(llm-config export -p openrouter)"
```

未加 `-p` 时使用 `active` 指定的默认供应商。

## 默认 Base URL（可被 `set --base` 覆盖）

- **glm**: `https://open.bigmodel.cn/api/paas/v4`
- **kimi**: `https://api.moonshot.cn/v1`
- **minimax**: `https://api.minimax.chat/v1`
- **openrouter**: `https://openrouter.ai/api/v1`

若某家 API 改版，请自行用 `llm-config set <p> --base <url>` 覆盖。

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
