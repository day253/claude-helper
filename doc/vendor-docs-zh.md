# 厂商官方文档索引（Claude Code / 编码套餐）

本页汇总 **与本工具内置供应商相关** 的官方说明链接，便于对照环境变量与套餐要求。`claude-helper` 具体写入的键仍以 `src/providers.ts` 为准。

---

## 必选入口（用户点名）

| 说明 | 链接 |
|------|------|
| **MiniMax · Claude Code** | [platform.minimax.io/docs/token-plan/claude-code](https://platform.minimax.io/docs/token-plan/claude-code) |
| **智谱 · 一键安装助手（Coding Tool Helper）** | [docs.bigmodel.cn/.../coding-tool-helper#](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper#) |

---

## 按供应商（内置 `ProviderId`）

| 供应商 | Claude Code / 编程工具接入 | 其它（套餐、OpenAI 兼容等） |
|--------|---------------------------|----------------------------|
| **glm**（智谱 · 国内） | [Claude Code 配置](https://docs.bigmodel.cn/cn/coding-plan/tool/claude) | [一键安装助手](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper) · [Claude API 兼容说明](https://docs.bigmodel.cn/cn/guide/develop/claude/introduction) |
| **zai**（Z.AI · 国际） | [Claude Code + GLM Coding Plan](https://docs.z.ai/scenario-example/develop-tools/claude) | [Coding Tool Helper](https://docs.z.ai/devpack/extension/coding-tool-helper) · [OpenAI SDK 示例](https://docs.z.ai/guides/develop/openai/python) |
| **minimax** | [Claude Code](https://platform.minimax.io/docs/token-plan/claude-code) | [接口密钥（国际）](https://platform.minimax.io/user-center/basic-information/interface-key) / [国内平台](https://platform.minimaxi.com/user-center/basic-information/interface-key) |
| **moonshot**（Kimi） | [Claude Code / Cline / RooCode](https://platform.moonshot.ai/docs/guide/agent-support) | [API Keys](https://platform.moonshot.ai/console/api-keys) |
| **openrouter** | [Claude Code 集成](https://openrouter.ai/docs/guides/guides/coding-agents/claude-code-integration) | [OpenRouter 文档首页](https://openrouter.ai/docs) |
| **volcengine**（火山方舟） | [Claude Code](https://www.volcengine.com/docs/82379/1928262) | [Coding Plan 快速开始](https://www.volcengine.com/docs/82379/1928261) · [套餐概览](https://www.volcengine.com/docs/82379/1925114) |

---

## Claude Code 通用

| 主题 | 链接 |
|------|------|
| Anthropic · `settings.json` / `env` | [Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings) |
| 环境变量说明 | [Environment variables](https://code.claude.com/docs/en/env-vars)（或 [Anthropic 站内 env 文档](https://docs.anthropic.com/en/docs/claude-code/env-vars)） |
| 第三方 / 企业部署概览 | [Third-party integrations](https://docs.anthropic.com/en/docs/claude-code/third-party-integrations) |

---

## 维护说明

新增供应商时：在本表增加一行，并在 `README.md` 供应商表与 `src/providers.ts` 中保持 **Anthropic 根 URL** 与官方文档一致；若文档要求额外 `env` 键，使用 `ProviderMeta.claudeExtraEnv`，以便 `claude apply` 切换供应商时正确清理残留键。
