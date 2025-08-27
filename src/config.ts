// config.ts - 纯配置文件
export const modelConfigs = {
  deepseek: {
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    apiKey: "4c1c60af-e3b0-41d3-83e1-de9de6a0894a",
    modelId: "deepseek-v3-1-250821",
  },
  k2: {
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    apiKey: "c390a36d-91c6-4a0b-ac1a-a59b2b117c81",
    modelId: "kimi-k2-250711",
  },
  zhipu: {
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    apiKey: "d4099f7390e240dbb9c7fd414f2002e0.PyL3qexhT9dQqXuJ",
    modelId: "glm-4.5",
  },
  // 'claude-code': {
  //   baseURL: 'http://localhost:8080/v1',
  //   apiKey: 'not-needed',
  //   modelId: 'claude-3-7-sonnet-latest',
  // },
} as const;

export type ModelName = keyof typeof modelConfigs;
