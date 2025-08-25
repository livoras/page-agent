import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getModel } from '../src/models';

async function testForceText() {
  const model = getModel('deepseek');
  
  console.log('测试强制返回文本的方法\n');
  console.log('='.repeat(50));
  
  // 测试：toolChoice 设置为 'none' 或 'required'
  console.log('\n测试: toolChoice = "none" (禁用工具后要求文本)');
  
  const tools = {
    testTool: tool({
      description: 'Test tool',
      inputSchema: z.object({ value: z.string() }),
      execute: async ({ value }) => ({ result: value }),
    }),
  };
  
  // 第一步：调用工具
  console.log('\n步骤1: 调用工具');
  const step1 = streamText({
    model,
    tools,
    toolChoice: 'auto',
    system: '你是一个助手。',
    prompt: '调用 testTool 工具，value 参数为 "hello"',
  });
  
  await step1.text;
  const toolResults = await step1.steps;
  console.log('工具调用数:', toolResults.length);
  
  // 第二步：基于工具结果生成文本
  console.log('\n步骤2: 基于工具结果生成文本响应');
  const step2 = streamText({
    model,
    system: '你是一个助手。基于提供的信息返回JSON格式结果。',
    prompt: `工具执行结果: ${JSON.stringify(toolResults[0]?.toolCalls[0]?.result)}\n\n请返回JSON格式的执行结果:\n\`\`\`json\n{\n  "success": true,\n  "message": "描述",\n  "data": null\n}\n\`\`\``,
  });
  
  const finalText = await step2.text;
  console.log('返回文本长度:', finalText.length);
  console.log('返回文本:', finalText);
}

testForceText().catch(console.error);