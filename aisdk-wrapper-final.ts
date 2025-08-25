import { generateText, streamText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// 创建连接到 claude-code-openai-wrapper 的 AI SDK provider
const claude = createOpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'not-needed',
  compatibility: 'strict',
});

// 使用 .chat() 方法来调用标准的 /v1/chat/completions 端点
const model = claude.chat('claude-sonnet-4-20250514');

async function demo() {
  console.log('🚀 Vercel AI SDK + Claude Code Wrapper Demo\n');
  
  // 1. 简单文本生成
  console.log('1️⃣ Simple text generation:');
  const { text } = await generateText({
    model,
    prompt: 'What is 100 / 4?',
  });
  console.log('  Result:', text, '\n');
  
  // 2. 带系统提示的对话
  console.log('2️⃣ With system prompt:');
  const { text: explanation } = await generateText({
    model,
    system: 'You are a concise teacher. Answer in one sentence.',
    prompt: 'What is JavaScript?',
  });
  console.log('  Result:', explanation, '\n');
  
  // 3. 流式响应
  console.log('3️⃣ Streaming response:');
  const { textStream } = await streamText({
    model,
    prompt: 'List 3 colors',
  });
  console.log('  Streaming: ');
  for await (const chunk of textStream) {
    process.stdout.write(chunk);
  }
  console.log('\n');
  
  // 4. 多轮对话
  console.log('4️⃣ Multi-turn conversation:');
  const { text: answer } = await generateText({
    model,
    messages: [
      { role: 'user', content: 'My name is Alice' },
      { role: 'assistant', content: 'Nice to meet you, Alice!' },
      { role: 'user', content: 'What is my name?' }
    ],
  });
  console.log('  Result:', answer, '\n');
  
  // 5. 结构化输出（JSON mode）
  console.log('5️⃣ Structured output (JSON):');
  try {
    const { object } = await generateObject({
      model,
      schema: z.object({
        answer: z.number(),
        explanation: z.string(),
      }),
      prompt: 'Calculate 50 + 75',
    });
    console.log('  Result:', object, '\n');
  } catch (error) {
    console.log('  Note: Structured output might not be fully supported\n');
  }
  
  console.log('✅ All demos completed successfully!');
}

demo().catch(console.error);