/**
 * OpenAI Agents SDK + Claude Code via OpenAI Wrapper
 * 
 * This example shows how to use OpenAI Agents SDK with claude-code-openai-wrapper
 * by configuring it to use the Chat Completions API instead of Responses API.
 */

import { Agent, run, setTracingDisabled } from '@openai/agents';
import { setDefaultOpenAIClient, setOpenAIAPI } from '@openai/agents-openai';
import OpenAI from 'openai';

// Disable tracing to avoid API key warnings
setTracingDisabled(true);

// Set dummy API key for SDK requirements
process.env.OPENAI_API_KEY = 'dummy-key';

async function main() {
  console.log('🤖 OpenAI Agents SDK + Claude Code Integration\n');
  
  // IMPORTANT: Switch to Chat Completions API (not Responses API)
  setOpenAIAPI('chat_completions');
  
  // Create OpenAI client pointing to local wrapper
  const client = new OpenAI({
    baseURL: 'http://localhost:8000/v1',
    apiKey: 'not-needed',
  });
  
  // Set as default client for Agents SDK
  setDefaultOpenAIClient(client);
  
  // Create an agent
  const agent = new Agent({
    name: 'Claude Assistant',
    model: 'claude-sonnet-4-20250514',
    instructions: 'You are a helpful AI assistant. Be concise and direct.',
  });
  
  // Example 1: Simple question
  console.log('Example 1: Math question');
  const result1 = await run(
    agent,
    'What is 50 + 75?',
    { maxTurns: 1 }
  );
  console.log('Response:', extractText(result1));
  console.log();
  
  // Example 2: Multi-step reasoning
  console.log('Example 2: Multi-step task');
  const result2 = await run(
    agent,
    'Count from 1 to 3, then say goodbye.',
    { maxTurns: 1 }
  );
  console.log('Response:', extractText(result2));
  console.log();
  
  // Example 3: Context understanding
  console.log('Example 3: Following instructions');
  const contextAgent = new Agent({
    name: 'Formatted Assistant',
    model: 'claude-sonnet-4-20250514',
    instructions: 'Always respond in uppercase letters only.',
  });
  
  const result3 = await run(
    contextAgent,
    'say hello world',
    { maxTurns: 1 }
  );
  console.log('Response:', extractText(result3));
  console.log();
  
  console.log('✅ All examples completed successfully!');
  console.log('\n📝 Key Points:');
  console.log('- Must use setOpenAIAPI("chat_completions")');
  console.log('- Works with claude-code-openai-wrapper on localhost:8000');
  console.log('- Use maxTurns: 1 for single responses');
  console.log('- Tool calls not supported (Claude Code CLI limitation)');
  console.log('\n⚠️ Limitations:');
  console.log('- No function calling / tools support');
  console.log('- No Responses API (must use Chat Completions API)');
  console.log('- For tool-based workflows, use native OpenAI/Anthropic APIs');
}

function extractText(result: any): string {
  return result.finalOutput?.[0]?.content?.[0]?.text || 
         result.output?.[0]?.content?.[0]?.text || 
         result.messages?.[result.messages.length - 1]?.content || 
         'No response';
}

// Run the examples
main().catch(console.error);