export type ProviderId =
  | 'glm'
  | 'minimax'
  | 'moonshot'
  | 'openrouter'
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
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-k2.5',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-k2.5',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-k2.5',
      CLAUDE_CODE_SUBAGENT_MODEL: 'kimi-k2.5',
      ENABLE_TOOL_SEARCH: 'false',
    },
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/docs/guides/guides/coding-agents/claude-code-integration',
    keyHelp: '打开 OpenRouter → Keys → Create Key；用量与计费见控制台说明。',
    claudeAnthropicBaseUrl: 'https://openrouter.ai/api',
    claudeUseAuthToken: true,
  },
  volcengine: {
    id: 'volcengine',
    label: '火山引擎方舟 (Coding Plan)',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    docs: 'https://www.volcengine.com/docs/82379/1928262',
    keyHelp:
      '须开通火山方舟 **Coding Plan**，按官方《Claude Code》文档填写密钥与模型。默认 Anthropic 根为北京区 `/api/coding`；若文档更新区域或路径，请用 --anthropic-base 覆盖。',
    claudeAnthropicBaseUrl: 'https://ark.cn-beijing.volces.com/api/coding',
    claudeUseAuthToken: true,
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
    },
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(s: string): s is ProviderId {
  return s in PROVIDERS;
}
