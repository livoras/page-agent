// models.ts - 模型创建
import { createOpenAI } from '@ai-sdk/openai';
import { modelConfigs, type ModelName } from './config';

export function getModel(name: ModelName | string = 'deepseek') {
  const config = modelConfigs[name as ModelName];
  if (!config) {
    const available = Object.keys(modelConfigs).join(', ');
    throw new Error(`Model '${name}' not found. Available models: ${available}`);
  }
  
  const client = createOpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
  
  return client.chat(config.modelId);
}