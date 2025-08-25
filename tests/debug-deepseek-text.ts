import { streamText, generateText, tool } from 'ai';
import { z } from 'zod';
import { getModel } from '../src/models';

async function testDeepSeekText() {
  const model = getModel('deepseek');
  
  console.log('测试 DeepSeek 文本返回\n');
  console.log('='.repeat(50));
  
  // 测试1：带工具调用的streamText
  console.log('\n测试1: streamText with tools (like page-agent)');
  const result1 = streamText({
    model,
    tools: {
      testTool: tool({
        description: 'Test tool',
        inputSchema: z.object({ value: z.string() }),
        execute: async ({ value }) => ({ result: value }),
      }),
    },
    system: '你是一个助手。完成任务后返回JSON格式结果。',
    prompt: '调用 testTool 工具，value 参数为 "hello"',
  });
  
  const text1 = await result1.text;
  console.log('返回文本长度:', text1.length);
  console.log('返回文本:', text1 || '[空]');
  
  // 测试2：不带工具的streamText
  console.log('\n测试2: streamText without tools');
  const result2 = streamText({
    model,
    system: '你是一个助手。',
    prompt: '说 "Hello World"',
  });
  
  const text2 = await result2.text;
  console.log('返回文本长度:', text2.length);
  console.log('返回文本:', text2 || '[空]');
  
  // 测试3：generateText with tools
  console.log('\n测试3: generateText with tools');
  const result3 = await generateText({
    model,
    tools: {
      testTool: tool({
        description: 'Test tool',
        inputSchema: z.object({ value: z.string() }),
        execute: async ({ value }) => ({ result: value }),
      }),
    },
    system: '你是一个助手。完成任务后返回JSON格式结果。',
    prompt: '调用 testTool 工具，value 参数为 "hello"，然后说明结果',
  });
  
  console.log('返回文本长度:', result3.text.length);
  console.log('返回文本:', result3.text || '[空]');
  console.log('工具调用数:', result3.toolCalls.length);
}

testDeepSeekText().catch(console.error);