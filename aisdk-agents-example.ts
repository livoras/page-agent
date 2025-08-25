/**
 * Vercel AI SDK Agents Example
 *
 * This example demonstrates how to use Vercel AI SDK's agent capabilities
 * with claude-code-openai-wrapper through OpenAI-compatible API.
 */

import { generateText, generateObject, tool, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

async function main() {
  console.log("🤖 Vercel AI SDK Agents Example\n");

  // Create OpenAI-compatible provider pointing to local wrapper
  // IMPORTANT: Use compatibility 'strict' to use chat completions endpoint
  const openai = createOpenAI({
    baseURL: "http://localhost:8080/v1",
    apiKey: "not-needed",
    compatibility: "strict", // Use /v1/chat/completions instead of /v1/responses
  });

  // Example 1: Simple question (basic agent)
  console.log("Example 1: Math question");
  const result1 = await generateText({
    model: openai.chat("claude-sonnet-4-20250514"), // Use .chat() to force chat completions
    system: "You are a helpful AI assistant. Be concise and direct.",
    prompt: "What is 50 + 75?",
  });
  console.log("Response:", result1.text);
  console.log();

  // Example 2: Multi-step task with step control
  console.log("Example 2: Multi-step task with step control");
  const result2 = await generateText({
    model: openai.chat("claude-sonnet-4-20250514"),
    system: "You are a helpful assistant. Complete each task step by step.",
    prompt: "Count from 1 to 3, then say goodbye.",
    stopWhen: stepCountIs(1), // Single step response
  });
  console.log("Response:", result2.text);
  console.log();

  // Example 3: Following instructions (system prompt)
  console.log("Example 3: Following instructions");
  const result3 = await generateText({
    model: openai.chat("claude-sonnet-4-20250514"),
    system: "Always respond in uppercase letters only.",
    prompt: "say hello world",
  });
  console.log("Response:", result3.text);
  console.log();

  // Example 4: Multi-turn conversation (simulated agent memory)
  console.log("Example 4: Multi-turn conversation");
  const messages = [
    { role: "user" as const, content: "My name is Alice" },
    { role: "assistant" as const, content: "Nice to meet you, Alice!" },
    { role: "user" as const, content: "What is my name?" },
  ];

  const result4 = await generateText({
    model: openai.chat("claude-sonnet-4-20250514"),
    messages,
  });
  console.log("Response:", result4.text);
  console.log();

  // Example 5: Simple structured extraction
  console.log("Example 5: Simple structured extraction");
  const result5 = await generateText({
    model: openai.chat("claude-sonnet-4-20250514"),
    system:
      'Extract the task name and steps from the user prompt. Format as JSON with "task" and "steps" fields.',
    prompt:
      "To make coffee: First, boil water. Second, add coffee grounds. Third, pour hot water. Fourth, wait 4 minutes. Fifth, enjoy.",
  });
  console.log("Extracted structure:", result5.text);
  console.log();

  // Example 6: Chain processing (evaluator-optimizer pattern)
  console.log("Example 6: Chain processing pattern");

  // First step: Generate initial response
  const initialResponse = await generateText({
    model: openai.chat("claude-sonnet-4-20250514"),
    prompt: "Write a one-sentence description of AI",
  });

  // Second step: Evaluate and improve
  const improvedResponse = await generateText({
    model: openai.chat("claude-sonnet-4-20250514"),
    system:
      "You are an editor. Improve the clarity and impact of the given text.",
    prompt: `Improve this description: "${initialResponse.text}"`,
  });

  console.log("Initial:", initialResponse.text);
  console.log("Improved:", improvedResponse.text);
  console.log();

  console.log("✅ All examples completed successfully!");
  console.log("\n📝 Key Features Demonstrated:");
  console.log("- Basic text generation with system prompts");
  console.log("- Step control with stopWhen");
  console.log("- Multi-turn conversations");
  console.log("- Structured data extraction");
  console.log("- Chain processing patterns");
  console.log("\n💡 AI SDK Advantages:");
  console.log("- Native TypeScript support with type safety");
  console.log("- Flexible agent patterns without rigid framework");
  console.log("- Streaming support (not shown in examples)");
  console.log("- Provider-agnostic (works with any OpenAI-compatible API)");
  console.log("\n⚠️ Note:");
  console.log(
    "- Tool calling requires wrapper support (not available in claude-code-openai-wrapper)",
  );
  console.log(
    "- For advanced agent features, use direct Anthropic/OpenAI APIs",
  );
}

// Run the examples
main().catch(console.error);
