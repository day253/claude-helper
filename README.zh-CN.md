# Claude Helper

多供应商 **API Key** 本地保存、**健康检查**，以及向 **Claude Code** 合并写入 `~/.claude/settings.json`（`ANTHROPIC_*`）。  
**npm**：[`claude-helper`](https://www.npmjs.com/package/claude-helper) · **命令**：`claude-helper`（无子命令即进入交互向导，等同 `init`）。

**English README**：[README.md](README.md)

| 文档 | 说明 |
|------|------|
| **本文** | 安装与日常使用（简体中文） |
| [doc/overview-zh.md](doc/overview-zh.md) | 项目说明、与官方助手差异、供应商表、开发/发布/GitHub |
| [doc/vendor-docs-zh.md](doc/vendor-docs-zh.md) | 各厂商文档链接与内置 Base |
| [doc/technical-guide-zh.md](doc/technical-guide-zh.md) | 模块与数据流（给维护者） |
| [doc/github-npm-publish-zh.md](doc/github-npm-publish-zh.md) | 用 GitHub Actions + 标签自动发布 npm |

---

## 安装

```bash
# 全局
npm install -g claude-helper

# 或免安装（首次解析包可能较慢，可改用全局安装）
npx claude-helper --help
```

从源码参与开发：`git clone` 后执行 `npm install && npm run build`，详见 [doc/overview-zh.md](doc/overview-zh.md)。

---

## 使用指南

### 1. 第一次用（向导）

直接运行（不要带子命令）：

```bash
claude-helper
```

流程概要：可选 **引导语言**（`zh` / `en`）→ 若无任何 Key，会进入 **短路径**：选供应商 → 粘贴 **API Key**（终端里可点文档链接）→ 可选 **同步到 Claude Code**。主菜单里可 **检查**、**切换语言**、看 **settings 是否与当前默认供应商一致**。

配置保存在 **`~/.llm-providers/config.yaml`**（可选字段 **`wizard_lang`**）。

### 2. Claude Code：写入环境变量

```bash
claude-helper set glm --key <你的KEY>    # 或其它 provider，见 --help
claude-helper active glm
claude-helper claude apply                 # 合并进 ~/.claude/settings.json，会先备份
```

之后在项目目录终端执行 **`claude`** 即可（需已安装 [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview)）。

### 3. 只导出当前终端可用（不写入 settings）

```bash
claude-helper claude export
# 或 eval：
eval "$(claude-helper claude export)"
```

### 4. OpenAI 兼容客户端（LiteLLM / OpenAI SDK 等）

```bash
claude-helper active <provider>
eval "$(claude-helper export)"
# 或 JSON：claude-helper export -f json
```

### 5. 检查网络与配置

```bash
claude-helper check
claude-helper check --verbose     # 完整详情（脚注、文档链接等）
claude-helper doctor              # 与 check 相同（习惯 chelper doctor 时可用）
claude-helper check --json        # 机器可读，便于脚本
claude-helper check --try-models glm-4.7,glm-5,glm-4.5-air   # 对当前默认供应商逐个试模型（POST /v1/messages）
```

默认 **精简** 输出；向导主菜单里的「运行检查」与上相同，结束后会提示可用 `--verbose` 查看完整报告。`--try-models` 用于智谱等多模型 ID 排障，**不改** `config.yaml`；与 `--json` 合用时结果里带 `model_probes` 数组。

---

## 常用命令速查

| 命令 | 作用 |
|------|------|
| `claude-helper` / `init` | 交互主菜单 / 首次短路径配置 |
| `check` / `doctor` | 检查 Key、默认供应商、Anthropic 根探测、与 settings 对齐；可选 `--try-models` 批量试模型 |
| `set <id>` | 写 Key / `--base` / `--anthropic-base` / `--model`；无 flag 时可只交互填 Key |
| `active [id]` | 查看或设置默认供应商 |
| `list` / `show <id>` | 列表或查看单项（密钥脱敏） |
| `export` | `OPENAI_*` shell 或 JSON |
| `claude export` / `claude apply` | `ANTHROPIC_*` 打印或写入 settings |

`provider` 列表以 `claude-helper --help` 为准。

---

## 说明

- **不替代** 智谱官方 `npx @z_ai/coding-helper`（装机、MCP、插件市场等）；本工具只做 Key、检查、导出与 **claude apply**。对比见 [doc/overview-zh.md](doc/overview-zh.md)。
- **安全**：`settings.json` 含密钥明文，勿提交 Git；注意 `settings.json.bak.*` 权限。
