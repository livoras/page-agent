// Using Vercel AI SDK with OpenAI API wrapper
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

async function main() {
  console.log('=== Vercel AI SDK + Claude Code OpenAI Wrapper ===\n');
  console.log('Make sure claude-code-openai-wrapper is running on port 8000\n');
  
  // Create OpenAI provider pointing to local wrapper
  const claude = createOpenAI({
    baseURL: 'http://localhost:8000/v1',
    apiKey: 'not-needed',
  });
  
  // Simple test
  const { text } = await generateText({
    model: claude.chat('claude-sonnet-4-20250514'),
    prompt: 'What is 15 + 25?',
  });
  
  console.log('Response:', text);
  console.log('\n✅ Integration successful!');
  console.log('See aisdk-wrapper-final.ts for more examples');
}

main().catch(console.error);