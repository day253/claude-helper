export type ProviderId =
  | 'byteplus'
  | 'dashscope'
  | 'dashscope_intl'
  | 'deepseek'
  | 'fireworks'
  | 'glm'
  | 'minimax'
  | 'modelstudio_intl'
  | 'moonshot'
  | 'novita'
  | 'openrouter'
  | 'siliconflow'
  | 'volcengine'
  | 'zai';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** 默认 OpenAI 兼容 base URL（无末尾斜杠） */
  defaultBaseUrl: string;
  /** 文档首页 */
  docs?: string;
  /** 一行中文：去哪申请 API Key */
  keyHelp: string;
  /** 官方 Anthropic Messages 兼容根 URL */
  claudeAnthropicBaseUrl: string;
  /** true：Claude Code 使用 ANTHROPIC_AUTH_TOKEN；false：使用 ANTHROPIC_API_KEY */
  claudeUseAuthToken?: boolean;
  /** 写入 Claude env 的附加键（见各厂商 Claude Code 文档）；切换供应商时会先统一清除所有供应商声明过的附加键 */
  claudeExtraEnv?: Record<string, string>;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  byteplus: {
    id: 'byteplus',
    label: 'BytePlus ModelArk（国际）',
    defaultBaseUrl: 'https://ark.ap-southeast.bytepluses.com/api/coding/v3',
    docs: 'https://docs.byteplus.com/en/docs/modelark/1928262',
    keyHelp:
      'BytePlus Ark API Key；须订阅 ModelArk **Coding Plan**。Anthropic 根默认新加坡区 `/api/coding`；模型名以文档为准，可用 --model 覆盖为具体模型 ID。',
    claudeAnthropicBaseUrl: 'https://ark.ap-southeast.bytepluses.com/api/coding',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'ark-code-latest',
      ANTHROPIC_SMALL_FAST_MODEL: 'ark-code-latest',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'ark-code-latest',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'ark-code-latest',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'ark-code-latest',
    },
  },
  dashscope: {
    id: 'dashscope',
    label: '阿里云百炼 Coding Plan（国内）',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    docs: 'https://help.aliyun.com/zh/model-studio/claude-code-coding-plan',
    keyHelp:
      '国内 **Coding Plan** 专属 Key 与模型列表见文档。Anthropic 根默认 `coding.dashscope.aliyuncs.com/apps/anthropic`。国际站 Coding Plan 请用供应商 **dashscope_intl**；新加坡按量请用 **modelstudio_intl**。',
    claudeAnthropicBaseUrl: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'qwen3.5-plus',
      ANTHROPIC_SMALL_FAST_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'qwen3.5-plus',
    },
  },
  dashscope_intl: {
    id: 'dashscope_intl',
    label: '阿里云 Model Studio Coding Plan（国际）',
    defaultBaseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    docs: 'https://www.alibabacloud.com/help/en/model-studio/claude-code-coding-plan',
    keyHelp:
      '仅适用于 **国际站 Coding Plan**（新加坡区 Key）。Anthropic 根默认 `coding-intl.dashscope.aliyuncs.com/apps/anthropic`。国内用户请用 **dashscope**。',
    claudeAnthropicBaseUrl: 'https://coding-intl.dashscope.aliyuncs.com/apps/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'qwen3.5-plus',
      ANTHROPIC_SMALL_FAST_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'qwen3.5-plus',
    },
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    docs: 'https://api-docs.deepseek.com/zh-cn/guides/anthropic_api',
    keyHelp:
      '开放平台 API Key。官方 Claude Code 示例使用 `ANTHROPIC_AUTH_TOKEN` 与较长 `API_TIMEOUT_MS`；模型名等见文档，可用 --model 覆盖。',
    claudeAnthropicBaseUrl: 'https://api.deepseek.com/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      API_TIMEOUT_MS: '600000',
      ANTHROPIC_MODEL: 'deepseek-chat',
      ANTHROPIC_SMALL_FAST_MODEL: 'deepseek-chat',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'deepseek-chat',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'deepseek-chat',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'deepseek-chat',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    },
  },
  fireworks: {
    id: 'fireworks',
    label: 'Fireworks AI',
    defaultBaseUrl: 'https://api.fireworks.ai/inference/v1',
    docs: 'https://docs.fireworks.ai/ecosystem/integrations/claude-code',
    keyHelp:
      'app.fireworks.ai 创建 API Key。文档使用 `ANTHROPIC_API_KEY` + `https://api.fireworks.ai/inference`。默认模型 ID 为官方示例中的 Kimi-2.5，可改用 GLM-5 等（见文档），并用 --model 覆盖各变量。',
    claudeAnthropicBaseUrl: 'https://api.fireworks.ai/inference',
    claudeUseAuthToken: false,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'accounts/fireworks/models/kimi-k2p5',
      ANTHROPIC_SMALL_FAST_MODEL: 'accounts/fireworks/models/kimi-k2p5',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'accounts/fireworks/models/kimi-k2p5',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'accounts/fireworks/models/kimi-k2p5',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'accounts/fireworks/models/kimi-k2p5',
      CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
    },
  },
  glm: {
    id: 'glm',
    label: '智谱 GLM (BigModel)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    docs: 'https://docs.bigmodel.cn/cn/coding-plan/tool/claude',
    keyHelp:
      '文档：https://docs.bigmodel.cn/cn/coding-plan/tool/claude ；一键助手：https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper 。开放平台 API Keys。若需自动装 CLI、MCP、插件市场等：npx @z_ai/coding-helper。',
    claudeAnthropicBaseUrl: 'https://open.bigmodel.cn/api/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      API_TIMEOUT_MS: '3000000',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
      ANTHROPIC_MODEL: 'glm-4.7',
      ANTHROPIC_SMALL_FAST_MODEL: 'glm-4.5-air',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.7',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.7',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
    },
  },
  minimax: {
    id: 'minimax',
    label: 'MiniMax',
    defaultBaseUrl: 'https://api.minimax.io/v1',
    docs: 'https://platform.minimax.io/docs/token-plan/claude-code',
    keyHelp:
      '按官方文档配置 Claude Code。API Key：开放平台「接口密钥」。国际默认 Anthropic Base 已为 api.minimax.io；**中国大陆**请执行：claude-helper set minimax --anthropic-base https://api.minimaxi.com/anthropic',
    claudeAnthropicBaseUrl: 'https://api.minimax.io/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      API_TIMEOUT_MS: '3000000',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
      ANTHROPIC_MODEL: 'MiniMax-M2.7',
      ANTHROPIC_SMALL_FAST_MODEL: 'MiniMax-M2.7',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'MiniMax-M2.7',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'MiniMax-M2.7',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'MiniMax-M2.7',
    },
  },
  modelstudio_intl: {
    id: 'modelstudio_intl',
    label: '阿里云 Model Studio（国际 · 按量）',
    defaultBaseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    docs: 'https://www.alibabacloud.com/help/doc-detail/2949529.html',
    keyHelp:
      '仅 **新加坡区按量**（非 Coding Plan 专属 URL）。使用 `ANTHROPIC_API_KEY`（与文档一致）。Coding Plan 用户请用 **dashscope_intl**，勿混用。',
    claudeAnthropicBaseUrl: 'https://dashscope-intl.aliyuncs.com/apps/anthropic',
    claudeUseAuthToken: false,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'qwen3.5-plus',
      ANTHROPIC_SMALL_FAST_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'qwen3.5-plus',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'qwen3.5-plus',
    },
  },
  moonshot: {
    id: 'moonshot',
    label: '月之暗面 Kimi (Moonshot)',
    defaultBaseUrl: 'https://api.moonshot.ai/v1',
    docs: 'https://platform.moonshot.ai/docs/guide/agent-support',
    keyHelp:
      '在开放平台创建 API Key。默认 Anthropic Base 为国际站；**中国大陆**可：claude-helper set moonshot --anthropic-base https://api.moonshot.cn/anthropic。模型名等以官方文档为准，可用 --model 覆盖。',
    claudeAnthropicBaseUrl: 'https://api.moonshot.ai/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'kimi-k2.5',
      ANTHROPIC_SMALL_FAST_MODEL: 'kimi-k2.5',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-k2.5',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-k2.5',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-k2.5',
      CLAUDE_CODE_SUBAGENT_MODEL: 'kimi-k2.5',
      ENABLE_TOOL_SEARCH: 'false',
    },
  },
  novita: {
    id: 'novita',
    label: 'Novita AI',
    defaultBaseUrl: 'https://api.novita.ai/openai',
    docs: 'https://novita.ai/docs/guides/claude-code',
    keyHelp:
      'Novita 控制台 API Key。Anthropic 兼容根见文档；模型 ID 以 [Anthropic 兼容模型列表](https://novita.ai/docs/guides/llm-anthropic-compatibility) 为准，可用 --model 覆盖。',
    claudeAnthropicBaseUrl: 'https://api.novita.ai/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'moonshotai/kimi-k2-instruct',
      ANTHROPIC_SMALL_FAST_MODEL: 'moonshotai/kimi-k2-instruct',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'moonshotai/kimi-k2-instruct',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'moonshotai/kimi-k2-instruct',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'moonshotai/kimi-k2-instruct',
    },
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/docs/guides/guides/coding-agents/claude-code-integration',
    keyHelp:
      '打开 OpenRouter → Keys → Create Key；用量与计费见控制台说明。内置默认路由模型可 `set openrouter --model <OpenRouter 模型 ID>` 覆盖（见 openrouter.ai/models）。',
    claudeAnthropicBaseUrl: 'https://openrouter.ai/api',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'anthropic/claude-3.5-sonnet',
      ANTHROPIC_SMALL_FAST_MODEL: 'anthropic/claude-3.5-sonnet',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'anthropic/claude-3.5-sonnet',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'anthropic/claude-3.5-sonnet',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'anthropic/claude-3.5-sonnet',
    },
  },
  siliconflow: {
    id: 'siliconflow',
    label: 'SiliconFlow（硅基流动）',
    defaultBaseUrl: 'https://api.siliconflow.com/v1',
    docs: 'https://docs.siliconflow.com/cn/usercases/use-siliconcloud-in-ClaudeCode',
    keyHelp:
      '控制台 API Key。文档使用 `ANTHROPIC_API_KEY`；Base 国内可用 `https://api.siliconflow.cn`（`set siliconflow --anthropic-base ...`）。默认模型为常见示例 ID，请以 [模型列表](https://cloud.siliconflow.com/models) 为准并用 `set siliconflow --model <模型ID>` 覆盖。',
    claudeAnthropicBaseUrl: 'https://api.siliconflow.com',
    claudeUseAuthToken: false,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'deepseek-ai/DeepSeek-V3',
      ANTHROPIC_SMALL_FAST_MODEL: 'deepseek-ai/DeepSeek-V3',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'deepseek-ai/DeepSeek-V3',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'deepseek-ai/DeepSeek-V3',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'deepseek-ai/DeepSeek-V3',
    },
  },
  volcengine: {
    id: 'volcengine',
    label: '火山引擎方舟 (Coding Plan)',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    docs: 'https://www.volcengine.com/docs/82379/1928262',
    keyHelp:
      '须开通火山方舟 **Coding Plan**，按官方《Claude Code》文档填写密钥与模型。默认 Anthropic 根为北京区 `/api/coding`；内置默认模型 ID 为常见占位，请以控制台为准并用 `--model` 覆盖；路径变更请用 `--anthropic-base`。',
    claudeAnthropicBaseUrl: 'https://ark.cn-beijing.volces.com/api/coding',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      ANTHROPIC_MODEL: 'ark-code-latest',
      ANTHROPIC_SMALL_FAST_MODEL: 'ark-code-latest',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'ark-code-latest',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'ark-code-latest',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'ark-code-latest',
    },
  },
  zai: {
    id: 'zai',
    label: 'Z.AI（国际站 GLM Coding Plan）',
    defaultBaseUrl: 'https://api.z.ai/api/paas/v4',
    docs: 'https://docs.z.ai/scenario-example/develop-tools/claude',
    keyHelp:
      '在 [Z.AI 开放平台](https://z.ai/model-api) 创建 API Key。Anthropic Base 默认 `https://api.z.ai/api/anthropic`。**GLM 编码套餐** OpenAI 兼容端点多为 `.../coding/paas/v4`，需要时可：claude-helper set zai --base https://api.z.ai/api/coding/paas/v4',
    claudeAnthropicBaseUrl: 'https://api.z.ai/api/anthropic',
    claudeUseAuthToken: true,
    claudeExtraEnv: {
      API_TIMEOUT_MS: '3000000',
      ANTHROPIC_MODEL: 'glm-4.7',
      ANTHROPIC_SMALL_FAST_MODEL: 'glm-4.5-air',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.7',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.7',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
    },
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

/** init 向导列表：`glm` 置顶，其余按 id 字母序，避免供应商变多时首选项乱跳 */
export const PROVIDER_IDS_WIZARD: ProviderId[] = (() => {
  const rest = PROVIDER_IDS.filter((id) => id !== 'glm').sort((a, b) => a.localeCompare(b));
  return ['glm', ...rest];
})();

export function isProviderId(s: string): s is ProviderId {
  return s in PROVIDERS;
}
