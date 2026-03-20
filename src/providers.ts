export type ProviderId = 'glm' | 'minimax' | 'openrouter';

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
    docs: 'https://docs.bigmodel.cn/cn/coding-plan/extension/coding-tool-helper',
    keyHelp:
      '按文档「快速开始」获取 API Key。若还要自动装 Claude Code、配 MCP、插件市场等，请用官方：npx @z_ai/coding-helper（与本工具分工不同，见 README）。',
    claudeAnthropicBaseUrl: 'https://open.bigmodel.cn/api/anthropic',
    claudeUseAuthToken: false,
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
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/docs',
    keyHelp: '打开 OpenRouter → Keys → Create Key；用量与计费见控制台说明。',
    claudeAnthropicBaseUrl: 'https://openrouter.ai/api',
    claudeUseAuthToken: true,
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(s: string): s is ProviderId {
  return s in PROVIDERS;
}
