import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getModel } from '../src/models';

async function testChinese() {
  const model = getModel('deepseek');
  
  console.log('测试中文系统提示的影响\n');
  console.log('='.repeat(50));
  
  const navigateTool = {
    navigate: tool({
      description: '导航到URL',
      inputSchema: z.object({ url: z.string() }),
      execute: async ({ url }) => ({ success: true, navigatedTo: url }),
    }),
  };
  
  // 测试1: 英文系统提示
  console.log('\n测试1: 英文系统提示');
  const englishResult = streamText({
    model,
    tools: navigateTool,
    system: 'You are a browser automation assistant. After using tools, provide a response.',
    prompt: 'Navigate to Baidu',
  });
  
  const englishText = await englishResult.text;
  console.log('返回文本长度:', englishText.length);
  console.log('返回文本:', englishText || '[空]');
  
  // 测试2: 中文系统提示
  console.log('\n\n测试2: 中文系统提示');
  const chineseResult = streamText({
    model,
    tools: navigateTool,
    system: '你是一个浏览器自动化助手。使用工具后，提供响应。',
    prompt: '导航到百度',
  });
  
  const chineseText = await chineseResult.text;
  console.log('返回文本长度:', chineseText.length);
  console.log('返回文本:', chineseText || '[空]');
  
  // 测试3: 中文 + JSON 要求
  console.log('\n\n测试3: 中文 + JSON 格式要求');
  const jsonResult = streamText({
    model,
    tools: navigateTool,
    system: '你是一个浏览器自动化助手。使用工具后返回JSON格式结果。',
    prompt: '导航到百度',
  });
  
  const jsonText = await jsonResult.text;
  console.log('返回文本长度:', jsonText.length);
  console.log('返回文本:', jsonText || '[空]');
  
  // 测试4: 英文询问天气（类似weather-agent）
  console.log('\n\n测试4: 英文询问（weather-agent风格）');
  const weatherResult = streamText({
    model,
    tools: navigateTool,
    system: 'You are a helpful assistant. Always provide a friendly response.',
    prompt: 'Please navigate to Baidu',
  });
  
  const weatherText = await weatherResult.text;
  console.log('返回文本长度:', weatherText.length);
  console.log('返回文本:', weatherText || '[空]');
}

testChinese().catch(console.error);