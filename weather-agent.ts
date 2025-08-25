import { generateText, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// 从 constants.ts 导入配置
const DEEPSEEK_URL = "https://api.deepseek.com/v1";
const DEEPSEEK_KEY = "sk-063cdfd58a5d444cbab422e9e6e033e5";
const DEEP_SEEK_MODEL = "deepseek-chat";

// 创建 DeepSeek 客户端（兼容 OpenAI API）
// DeepSeek 使用标准的 OpenAI 兼容端点
const deepseek = createOpenAI({
  baseURL: DEEPSEEK_URL,
  apiKey: DEEPSEEK_KEY,
});

// 模拟天气数据库
const weatherData: Record<string, { temp: number; condition: string }> = {
  'San Francisco': { temp: 65, condition: 'foggy' },
  'SF': { temp: 65, condition: 'foggy' },
  'New York': { temp: 72, condition: 'sunny' },
  'NYC': { temp: 72, condition: 'sunny' },
  'Beijing': { temp: 28, condition: 'clear' },
  'Tokyo': { temp: 25, condition: 'rainy' },
};

async function runWeatherAgent() {
  try {
    console.log('🤖 Starting Weather Agent with DeepSeek...\n');
    
    const result = await generateText({
      model: deepseek.chat(DEEP_SEEK_MODEL),
      stopWhen: stepCountIs(5), // 最多执行5步
      tools: {
        getWeather: tool({
          description: 'Get current weather information for a city',
          inputSchema: z.object({
            location: z.string().describe('City name to get weather for'),
          }),
          execute: async ({ location }) => {
            console.log(`🌡️  Fetching weather for: ${location}`);
            
            // 模拟 API 延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const weather = weatherData[location] || {
              temp: Math.floor(Math.random() * 30) + 10,
              condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
            };
            
            return {
              location,
              temperature: weather.temp,
              condition: weather.condition,
              unit: 'Celsius'
            };
          }
        }),
        compareWeather: tool({
          description: 'Compare weather between two cities',
          inputSchema: z.object({
            city1: z.string(),
            city2: z.string(),
          }),
          execute: async ({ city1, city2 }) => {
            console.log(`📊 Comparing weather: ${city1} vs ${city2}`);
            
            const weather1 = weatherData[city1] || { temp: 20, condition: 'unknown' };
            const weather2 = weatherData[city2] || { temp: 20, condition: 'unknown' };
            
            return {
              comparison: {
                [city1]: weather1,
                [city2]: weather2,
                difference: Math.abs(weather1.temp - weather2.temp),
                warmer: weather1.temp > weather2.temp ? city1 : city2
              }
            };
          }
        })
      },
      system: `You are a helpful weather assistant. 
        When asked about weather, use the available tools to get accurate information.
        Always provide a friendly and informative response.
        If asked about multiple cities, get the weather for each one.`,
      prompt: 'What is the weather like in SF and NYC? Which city is warmer?',
      onStepFinish: async ({ text, toolCalls, toolResults }) => {
        if (toolCalls && toolCalls.length > 0) {
          console.log('\n📝 Tool calls made:', toolCalls.map(tc => tc.toolName).join(', '));
        }
        if (toolResults && toolResults.length > 0) {
          console.log('✅ Tool results received\n');
        }
      }
    });

    console.log('\n🎯 Final Response:\n');
    console.log(result.text);
    
    console.log('\n📊 Execution Summary:');
    console.log(`- Total steps: ${result.steps.length}`);
    console.log(`- Tool calls: ${result.steps.flatMap(s => s.toolCalls).length}`);
    console.log(`- Tokens used: ${result.usage?.totalTokens || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Error running weather agent:', error);
  }
}

// 执行示例
if (require.main === module) {
  runWeatherAgent();
}

export { runWeatherAgent, deepseek };