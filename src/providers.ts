export type ProviderId = 'glm' | 'openrouter';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** 默认 OpenAI 兼容 base URL（无末尾斜杠） */
  defaultBaseUrl: string;
  /** 文档首页 */
  docs?: string;
  /** 一行中文：去哪申请 API Key */
  keyHelp: string;
  /** 官方 Anthropic Messages 兼容根 URL（本工具仅保留具备该能力的供应商） */
  claudeAnthropicBaseUrl: string;
  /** true：Claude Code 使用 ANTHROPIC_AUTH_TOKEN；false：使用 ANTHROPIC_API_KEY */
  claudeUseAuthToken?: boolean;
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
