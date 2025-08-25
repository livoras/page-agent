import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getModel } from "./models";

// 模拟天气数据库
const weatherData: Record<string, { temp: number; condition: string }> = {
  "San Francisco": { temp: 65, condition: "foggy" },
  SF: { temp: 65, condition: "foggy" },
  "New York": { temp: 72, condition: "sunny" },
  NYC: { temp: 72, condition: "sunny" },
  Beijing: { temp: 28, condition: "clear" },
  Tokyo: { temp: 25, condition: "rainy" },
};

async function runStreamingWeatherAgent() {
  const modelName = process.argv[2] || "deepseek";
  const model = getModel(modelName);

  console.log(`🤖 Starting Streaming Weather Agent with ${modelName}...\n`);
  console.log("─".repeat(50));

  const result = streamText({
    model,
    stopWhen: stepCountIs(5), // 最多执行5步
    tools: {
      getWeather: tool({
        description: "Get current weather information for a city",
        inputSchema: z.object({
          location: z.string().describe("City name to get weather for"),
        }),
        execute: async ({ location }) => {
          console.log(`\n🌡️  [Tool] Fetching weather for: ${location}`);

          // 模拟 API 延迟
          await new Promise((resolve) => setTimeout(resolve, 500));

          const weather = weatherData[location] || {
            temp: Math.floor(Math.random() * 30) + 10,
            condition: ["sunny", "cloudy", "rainy"][
              Math.floor(Math.random() * 3)
            ],
          };

          return {
            location,
            temperature: weather.temp,
            condition: weather.condition,
            unit: "Celsius",
          };
        },
      }),
      compareWeather: tool({
        description: "Compare weather between two cities",
        inputSchema: z.object({
          city1: z.string(),
          city2: z.string(),
        }),
        execute: async ({ city1, city2 }) => {
          console.log(`\n📊 [Tool] Comparing: ${city1} vs ${city2}`);

          const weather1 = weatherData[city1] || {
            temp: 20,
            condition: "unknown",
          };
          const weather2 = weatherData[city2] || {
            temp: 20,
            condition: "unknown",
          };

          return {
            comparison: {
              [city1]: weather1,
              [city2]: weather2,
              difference: Math.abs(weather1.temp - weather2.temp),
              warmer: weather1.temp > weather2.temp ? city1 : city2,
            },
          };
        },
      }),
    },
    system: `You are a helpful weather assistant.
      When asked about weather, use the available tools to get accurate information.
      Always provide a friendly and informative response.
      If asked about multiple cities, get the weather for each one.`,
    prompt: "What is the weather like in SF and NYC? Which city is warmer?",
    onStepFinish: async ({
      text,
      toolCalls,
      toolResults,
      finishReason,
      usage,
    }) => {
      if (toolCalls && toolCalls.length > 0) {
        console.log(`\n✅ [Step] Completed ${toolCalls.length} tool call(s)`);
      }
      if (usage) {
        console.log(
          `   └─ Tokens: prompt=${usage.promptTokens}, completion=${usage.completionTokens}`,
        );
      }
    },
  });

  // 处理流式输出
  console.log("\n🎯 Response (Streaming):\n");

  // 创建一个并行任务来监听文本流
  const textStreamTask = (async () => {
    for await (const textChunk of result.textStream) {
      process.stdout.write(textChunk);
    }
  })();

  // 同时监听全事件流来追踪工具调用
  const eventStreamTask = (async () => {
    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case "tool-call":
          console.log(`\n\n🔧 [Calling tool: ${chunk.toolName}]`);
          break;

        case "tool-result":
          console.log(`✅ [Tool completed]`);
          break;
      }
    }
  })();

  // 等待两个流都完成
  await Promise.all([textStreamTask, eventStreamTask]);
  console.log("\n\n" + "─".repeat(50));

  // 获取最终统计
  const finalUsage = await result.usage;
  const steps = await result.steps;

  console.log("\n📊 Execution Summary:");
  console.log(`   ├─ Total steps: ${steps.length}`);
  console.log(`   ├─ Tool calls: ${steps.flatMap((s) => s.toolCalls).length}`);
  console.log(`   └─ Total tokens: ${finalUsage?.totalTokens || "N/A"}`);
}

// 执行示例
if (require.main === module) {
  runStreamingWeatherAgent();
}

export { runStreamingWeatherAgent };
