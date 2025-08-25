import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getModel } from '../src/models';
import { PlaywrightClient } from 'better-playwright-mcp2/lib/index.js';

async function testJsonAfter() {
  const model = getModel('deepseek');
  const client = new PlaywrightClient('http://localhost:3102');
  
  // 创建页面
  const page = await client.createPage('test', 'Test page', 'about:blank');
  const pageId = page.pageId;
  
  console.log('测试在工具调用后返回JSON\n');
  console.log('='.repeat(50));
  
  const result = streamText({
    model,
    tools: {
      navigate: tool({
        description: 'Navigate to a website',
        inputSchema: z.object({
          url: z.string().describe('URL to navigate to'),
        }),
        execute: async ({ url }) => {
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          await client.navigate(pageId, url);
          await new Promise(resolve => setTimeout(resolve, 2000));
          const snapshot = await client.getSnapshot(pageId);
          return {
            success: true,
            navigatedTo: url,
            pageTitle: snapshot.title || 'Unknown'
          };
        },
      }),
    },
    system: `You are a helpful browser automation assistant.
When asked to navigate somewhere, use the navigate tool.
After using tools, provide a response that:
1. First describes what you did in a friendly way
2. Then includes a JSON result block like this:

\`\`\`json
{
  "success": true,
  "message": "description of what happened",
  "data": null
}
\`\`\`

Respond in the same language as the user's request.`,
    prompt: '去百度',
  });
  
  console.log('🎯 Response:\n');
  
  // 监听文本流
  for await (const textChunk of result.textStream) {
    process.stdout.write(textChunk);
  }
  
  console.log('\n\n' + '─'.repeat(50));
  
  const finalText = await result.text;
  const steps = await result.steps;
  
  console.log('\n📊 Summary:');
  console.log('Text length:', finalText.length);
  console.log('Has JSON:', finalText.includes('```json'));
  console.log('Tool calls:', steps.flatMap(s => s.toolCalls).length);
  
  // 提取JSON
  const jsonMatch = finalText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    console.log('\n提取的JSON:');
    console.log(JSON.parse(jsonMatch[1]));
  }
  
  // 清理
  await client.closePage(pageId);
}

testJsonAfter().catch(console.error);