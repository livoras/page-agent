import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getModel } from '../src/models';

async function compareImplementations() {
  const model = getModel('deepseek');
  
  console.log('对比 stream-weather-agent 和 page-agent 的实现\n');
  console.log('='.repeat(50));
  
  // 模拟 stream-weather-agent 的方式
  console.log('\n测试1: 类似 stream-weather-agent 的实现');
  const weatherResult = streamText({
    model,
    tools: {
      getWeather: tool({
        description: 'Get weather',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }) => ({ weather: 'sunny', temp: 25 }),
      }),
    },
    system: `You are a helpful weather assistant.
      When asked about weather, use the available tools to get accurate information.
      Always provide a friendly and informative response.`,
    prompt: 'What is the weather in Beijing?',
  });
  
  const weatherText = await weatherResult.text;
  console.log('Weather agent 返回文本长度:', weatherText.length);
  console.log('前100字符:', weatherText.substring(0, 100));
  
  // 模拟 page-agent 的方式
  console.log('\n\n测试2: 类似 page-agent 的实现');
  const pageResult = streamText({
    model,
    tools: {
      navigate: tool({
        description: '导航到URL',
        inputSchema: z.object({ url: z.string() }),
        execute: async ({ url }) => ({ success: true, navigatedTo: url }),
      }),
    },
    system: `你是一个浏览器自动化助手。

## 响应格式要求
所有任务完成后，必须返回 JSON 格式的执行结果：
\`\`\`json
{
  "success": true/false,
  "message": "任务执行结果描述",
  "data": null
}
\`\`\``,
    prompt: '导航到百度',
  });
  
  const pageText = await pageResult.text;
  console.log('Page agent 返回文本长度:', pageText.length);
  console.log('返回文本:', pageText || '[空]');
  
  // 测试3: 更明确的指令
  console.log('\n\n测试3: 更明确要求返回文本');
  const explicitResult = streamText({
    model,
    tools: {
      navigate: tool({
        description: '导航到URL',
        inputSchema: z.object({ url: z.string() }),
        execute: async ({ url }) => ({ success: true, navigatedTo: url }),
      }),
    },
    system: `你是一个浏览器自动化助手。执行工具后必须返回文本说明结果。`,
    prompt: '导航到百度，然后告诉我执行结果',
  });
  
  const explicitText = await explicitResult.text;
  console.log('明确要求返回文本长度:', explicitText.length);
  console.log('返回文本:', explicitText || '[空]');
}

compareImplementations().catch(console.error);