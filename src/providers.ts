export type ProviderId = 'glm' | 'kimi' | 'minimax' | 'openrouter';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** 默认 OpenAI 兼容 base URL（无末尾斜杠） */
  defaultBaseUrl: string;
  /** 文档/说明用 */
  docs?: string;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  glm: {
    id: 'glm',
    label: '智谱 GLM (BigModel)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    docs: 'https://open.bigmodel.cn/',
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi (Moonshot)',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    docs: 'https://platform.moonshot.cn/',
  },
  minimax: {
    id: 'minimax',
    label: 'MiniMax',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    docs: 'https://platform.minimax.io/',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/docs',
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(s: string): s is ProviderId {
  return s in PROVIDERS;
}
