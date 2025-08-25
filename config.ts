// config.ts - 纯配置文件
export const modelConfigs = {
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: 'sk-063cdfd58a5d444cbab422e9e6e033e5',
    modelId: 'deepseek-chat',
  },
  k2: {
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: 'c390a36d-91c6-4a0b-ac1a-a59b2b117c81',
    modelId: 'kimi-k2-250711',
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: 'd5fc093527084079b319b28e824cc53d.6zP2QFGrD0SBEX9s',
    modelId: 'glm-4.5',
  },
} as const;

export type ModelName = keyof typeof modelConfigs;