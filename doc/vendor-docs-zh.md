# 厂商官方文档索引（Claude Code / 编码套餐）

本页汇总 **与本工具内置供应商相关** 的官方说明链接，便于对照环境变量与套餐要求。`claude-helper` 具体写入的键仍以 `src/providers.ts` 为准。

各内置供应商在 `src/providers.ts` 的 `claudeExtraEnv` 中尽量补齐 **`ANTHROPIC_MODEL`、`ANTHROPIC_SMALL_FAST_MODEL`、`ANTHROPIC_DEFAULT_SONNET_MODEL` / `OPUS` / `HAIKU`**（具体 ID 以各厂商文档为准；OpenRouter / SiliconFlow / 火山等为常见占位，务必按需 `set <id> --model` 覆盖）。**glm / zai** 的 Sonnet/Opus 与 Haiku 默认拆分见 [智谱](https://docs.bigmodel.cn/cn/coding-plan/tool/claude) / [Z.AI](https://docs.z.ai/scenario-example/develop-tools/claude)；改用 GLM-5 等可 `set glm --model glm-5`（会同步覆盖上述同组键）或手改 `~/.claude/settings.json`。

内置供应商 id 一览（`claude-helper --help` 与 `PROVIDER_IDS` 一致）：

`byteplus` · `dashscope` · `dashscope_intl` · `deepseek` · `fireworks` · `glm` · `minimax` · `modelstudio_intl` · `moonshot` · `novita` · `openrouter` · `siliconflow` · `volcengine` · `zai`

---

## 必选入口（用户点名）

| 说明 | 链接 |
|------|------|
| **MiniMax · Claude Code** | [platform.minimax.io/docs/token-plan/claude-code](https://platform.minimax.io/docs/token-plan/claude-code) |
| **智谱 · 一键安装助手（Coding Tool Helper）** | [docs.bigmodel.cn/.../coding-tool-helper#](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper#) |

---

## 按供应商（内置 `ProviderId`）

| 供应商 | Claude Code / 编程工具接入 | 其它 |
|--------|---------------------------|------|
| **byteplus** | [ModelArk · Claude Code](https://docs.byteplus.com/en/docs/modelark/1928262) | [ModelArk 概览](https://docs.byteplus.com/en/docs/modelark/1099455) |
| **dashscope** | [百炼 · Claude Code（国内 Coding Plan）](https://help.aliyun.com/zh/model-studio/claude-code-coding-plan) | [OpenAI 兼容调用](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope) |
| **dashscope_intl** | [Model Studio · Claude Code（国际 Coding Plan）](https://www.alibabacloud.com/help/en/model-studio/claude-code-coding-plan) | 与 **modelstudio_intl**（按量）勿混用 |
| **modelstudio_intl** | [Claude Code + Qwen（国际按量）](https://www.alibabacloud.com/help/doc-detail/2949529.html) | 仅新加坡区按量；Coding Plan 用 **dashscope_intl** |
| **deepseek** | [Anthropic API / Claude Code（中文）](https://api-docs.deepseek.com/zh-cn/guides/anthropic_api) | [DeepSeek API 文档](https://api-docs.deepseek.com/) |
| **fireworks** | [Claude Code 集成](https://docs.fireworks.ai/ecosystem/integrations/claude-code) | [Anthropic 兼容说明](https://docs.fireworks.ai/tools-sdks/anthropic-compatibility) |
| **glm**（智谱 · 国内） | [Claude Code 配置](https://docs.bigmodel.cn/cn/coding-plan/tool/claude) | [一键安装助手](https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper) · [Claude API 兼容](https://docs.bigmodel.cn/cn/guide/develop/claude/introduction) |
| **zai**（Z.AI · 国际） | [Claude Code + GLM Coding Plan](https://docs.z.ai/scenario-example/develop-tools/claude) | [Coding Tool Helper](https://docs.z.ai/devpack/extension/coding-tool-helper) · [OpenAI SDK](https://docs.z.ai/guides/develop/openai/python) |
| **minimax** | [Claude Code](https://platform.minimax.io/docs/token-plan/claude-code) | [接口密钥（国际）](https://platform.minimax.io/user-center/basic-information/interface-key) / [国内](https://platform.minimaxi.com/user-center/basic-information/interface-key) |
| **moonshot**（Kimi） | [Claude Code / Cline / RooCode](https://platform.moonshot.ai/docs/guide/agent-support) | [API Keys](https://platform.moonshot.ai/console/api-keys) |
| **novita** | [Claude Code](https://novita.ai/docs/guides/claude-code) | [Anthropic 兼容与模型](https://novita.ai/docs/guides/llm-anthropic-compatibility) |
| **openrouter** | [Claude Code 集成](https://openrouter.ai/docs/guides/guides/coding-agents/claude-code-integration) | [OpenRouter Docs](https://openrouter.ai/docs) |
| **siliconflow** | [在 Claude Code 中使用](https://docs.siliconflow.com/cn/usercases/use-siliconcloud-in-ClaudeCode) | [模型列表](https://cloud.siliconflow.com/models) |
| **volcengine**（火山方舟） | [Claude Code](https://www.volcengine.com/docs/82379/1928262) | [Coding Plan 快速开始](https://www.volcengine.com/docs/82379/1928261) · [套餐概览](https://www.volcengine.com/docs/82379/1925114) |

---

## Claude Code 通用

| 主题 | 链接 |
|------|------|
| Anthropic · `settings.json` / `env` | [Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings) |
| 环境变量说明 | [Environment variables](https://code.claude.com/docs/en/env-vars) |
| 第三方 / 企业部署概览 | [Third-party integrations](https://docs.anthropic.com/en/docs/claude-code/third-party-integrations) |

**智谱 / Z.AI（glm、zai）与 Claude Code 2.1.69+**：官方说明部分版本需 `ENABLE_TOOL_SEARCH=0` 与 `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`。本工具在 `claude apply` / `claude export` / `check` 生成 env 时，若本机可执行 `claude --version` 且解析为 **2.1.69 ≤ 版本 < 2.2.0**，会自动写入上述键；未安装 CLI 或版本不在该区间则不写入。详见 [智谱 · Claude Code](https://docs.bigmodel.cn/cn/coding-plan/tool/claude) 常见问题。

---

## 维护说明

新增供应商时：在本表增加一行，并在 [overview-zh.md](./overview-zh.md) 的供应商示例表（若仍保留该段）、根目录 [README.zh-CN.md](../README.zh-CN.md) / [README.md](../README.md)（使用指南中若提及新 id）与 `src/providers.ts` 中保持 **Anthropic 根 URL** 与官方文档一致；若文档要求额外 `env` 键，使用 `ProviderMeta.claudeExtraEnv`，以便 `claude apply` 切换供应商时正确清理残留键。

**未收录**：无厂商官方「Claude Code + 明确 `ANTHROPIC_BASE_URL`」文档的渠道（如仅社区代理、仅 OpenAI 兼容等），不写入内置列表，避免误导。
