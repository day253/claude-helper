export type ProviderId = 'glm' | 'kimi' | 'minimax' | 'openrouter' | 'volcano';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** 默认 OpenAI 兼容 base URL（无末尾斜杠） */
  defaultBaseUrl: string;
  /** 文档首页 */
  docs?: string;
  /** 一行中文：去哪申请 API Key */
  keyHelp: string;
  /** 官方 Anthropic Messages 兼容根 URL；缺省则需自建网关并配置 anthropic_base_url */
  claudeAnthropicBaseUrl?: string;
  /** true：Claude Code 使用 ANTHROPIC_AUTH_TOKEN；false：使用 ANTHROPIC_API_KEY */
  claudeUseAuthToken?: boolean;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  glm: {
    id: 'glm',
    label: '智谱 GLM (BigModel)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    docs: 'https://open.bigmodel.cn/',
    keyHelp: '打开智谱开放平台 → 控制台 → API Keys 创建密钥（Coding Plan / 通用 API Key 均可按文档选用）。',
    claudeAnthropicBaseUrl: 'https://open.bigmodel.cn/api/anthropic',
    claudeUseAuthToken: false,
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi (Moonshot)',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    docs: 'https://platform.moonshot.cn/',
    keyHelp: '登录 Moonshot 开放平台 → API Key 管理 → 创建新的 API Key。',
  },
  minimax: {
    id: 'minimax',
    label: 'MiniMax',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    docs: 'https://platform.minimax.io/',
    keyHelp: '登录 MiniMax 开放平台 → 账户 / API 密钥页面创建并复制密钥。',
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
  volcano: {
    id: 'volcano',
    label: '火山引擎（方舟 Ark）',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    docs: 'https://www.volcengine.com/docs/82379',
    keyHelp: '火山引擎控制台 → 机器学习平台 / 方舟 → API Key 管理；可按地域使用对应 endpoint（默认北京 api/v3）。',
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(s: string): s is ProviderId {
  return s in PROVIDERS;
}
