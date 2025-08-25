import { PlaywrightClient } from 'better-playwright-mcp2/lib/index.js';
import { streamText, generateText, tool } from 'ai';
import { z } from 'zod';
import { getModel } from './models';
import { SYSTEM_PROMPT } from './page-agent-prompts';

export interface PageAgentConfig {
  serverUrl?: string;
  modelName?: string;
}

export interface ActionResult {
  success: boolean;
  errorMessage?: string;
  pageDescription: string;
  data: any | null;
}

export class PageAgent {
  private client: PlaywrightClient;
  private pageId: string | null = null;
  private model: any;
  private serverUrl: string;

  constructor(config: PageAgentConfig = {}) {
    this.serverUrl = config.serverUrl || 'http://localhost:3102';
    this.client = new PlaywrightClient(this.serverUrl);
    this.model = getModel(config.modelName || 'deepseek');
  }

  private get tools() {
    return {
      navigate: tool({
        description: '导航到指定的URL或网站',
        inputSchema: z.object({
          url: z.string().describe('要导航到的URL地址，如 google.com 或 https://github.com'),
        }),
        execute: async ({ url }) => {
          await this.ensurePage();
          
          // 如果没有协议，添加 https://
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          
          const result = await this.client.navigate(this.pageId!, url);
          return { success: true, navigatedTo: url };
        },
      }),

      click: tool({
        description: 'Click on an element in the page',
        inputSchema: z.object({
          ref: z.string().describe('The ref ID of the element to click'),
          elementDescription: z.string().optional().describe('Natural language description of the element'),
        }),
        execute: async ({ ref, elementDescription }) => {
          await this.ensurePage();
          const result = await this.client.click(this.pageId!, ref, elementDescription);
          return { success: true, clicked: elementDescription || `element with ref=${ref}` };
        },
      }),

      type: tool({
        description: 'Type text into an input field',
        inputSchema: z.object({
          ref: z.string().describe('The ref ID of the input element'),
          text: z.string().describe('The text to type'),
          elementDescription: z.string().optional().describe('Natural language description of the element'),
        }),
        execute: async ({ ref, text, elementDescription }) => {
          await this.ensurePage();
          const result = await this.client.type(this.pageId!, ref, text, elementDescription);
          return { success: true, typed: text, into: elementDescription || `element with ref=${ref}` };
        },
      }),

      fill: tool({
        description: 'Fill a form field with a value (clears existing content first)',
        inputSchema: z.object({
          ref: z.string().describe('The ref ID of the form element'),
          value: z.string().describe('The value to fill'),
          elementDescription: z.string().optional().describe('Natural language description of the element'),
        }),
        execute: async ({ ref, value, elementDescription }) => {
          await this.ensurePage();
          const result = await this.client.fill(this.pageId!, ref, value, elementDescription);
          return { success: true, filled: value, into: elementDescription || `element with ref=${ref}` };
        },
      }),

      select: tool({
        description: 'Select an option from a dropdown',
        inputSchema: z.object({
          ref: z.string().describe('The ref ID of the select element'),
          value: z.string().describe('The value or text of the option to select'),
          elementDescription: z.string().optional().describe('Natural language description of the element'),
        }),
        execute: async ({ ref, value, elementDescription }) => {
          await this.ensurePage();
          const result = await this.client.select(this.pageId!, ref, value, elementDescription);
          return { success: true, selected: value, from: elementDescription || `element with ref=${ref}` };
        },
      }),


      waitAndGetSnapshot: tool({
        description: 'Wait for a moment and get current page snapshot',
        inputSchema: z.object({
          seconds: z.number().default(2).describe('Seconds to wait before getting snapshot'),
        }),
        execute: async ({ seconds }) => {
          await this.ensurePage();
          await new Promise(resolve => setTimeout(resolve, seconds * 1000));
          const snapshot = await this.client.getSnapshot(this.pageId!);
          return { success: true, snapshot: snapshot.snapshot };
        },
      }),
    };
  }

  private async ensurePage(): Promise<void> {
    if (!this.pageId) {
      const page = await this.client.createPage(
        'agent-page',
        'Page managed by PageAgent',
        'about:blank'
      );
      this.pageId = page.pageId;
      console.log(`📄 Created new page with ID: ${this.pageId}`);
    }
  }

  async act(instruction: string): Promise<ActionResult> {
    try {
      console.log(`\n🎯 Executing: "${instruction}"`);
      console.log("─".repeat(50));
      
      // Ensure page exists
      await this.ensurePage();
      
      // Get current page snapshot
      console.log('📸 Getting page snapshot...');
      const snapshotResult = await this.client.getSnapshot(this.pageId!);
      const snapshot = snapshotResult.snapshot || 'Page is empty or loading';
      
      // Let AI decide and execute the action with streaming
      console.log('🤖 AI analyzing task...\n');
      
      const result = streamText({
        model: this.model,
        tools: this.tools,
        toolChoice: 'auto',
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `当前页面状态:\n${snapshot}\n\n要执行的任务: ${instruction}\n\n分析页面并执行必要的操作来完成任务。`,
          },
        ],
        onStepFinish: async ({ toolCalls, usage }) => {
          if (toolCalls && toolCalls.length > 0) {
            console.log(`\n✅ [Step] 完成了 ${toolCalls.length} 个工具调用`);
            toolCalls.forEach(tc => {
              if (tc.result) {
                console.log(`   └─ ${tc.toolName}: ${JSON.stringify(tc.result)}`);
              }
            });
          }
          if (usage) {
            console.log(`   └─ Tokens: prompt=${usage.promptTokens}, completion=${usage.completionTokens}`);
          }
        },
      });

      // 处理流式输出 - 参考 stream-weather-agent.ts
      console.log('🎯 AI Response:\n');
      
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
              console.log(`\n\n🔧 [调用工具: ${chunk.toolName}]`);
              console.log(`   参数: ${JSON.stringify(chunk.input)}`);
              break;

            case "tool-result":
              console.log(`✅ [工具完成]`);
              break;
          }
        }
      })();

      // 等待两个流都完成
      await Promise.all([textStreamTask, eventStreamTask]);
      console.log('\n\n' + "─".repeat(50));

      // Get final page state description
      const finalSnapshot = await this.client.getSnapshot(this.pageId!);
      const pageDescription = await this.describePageState(finalSnapshot.snapshot || 'Page state unavailable');
      
      // 获取最终统计 - 参考 stream-weather-agent.ts
      const finalUsage = await result.usage;
      const steps = await result.steps;
      const finalText = await result.text;
      
      console.log('\n📊 执行统计:');
      console.log(`   ├─ 总步数: ${steps.length}`);
      console.log(`   ├─ 工具调用: ${steps.flatMap((s) => s.toolCalls).length}`);
      console.log(`   └─ 总 Tokens: ${finalUsage?.totalTokens || 'N/A'}`);
      
      // 从 AI 响应中提取 JSON 结果
      const jsonMatch = finalText.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        try {
          const jsonResult = JSON.parse(jsonMatch[1]);
          console.log('\n📋 AI 判断结果:', jsonResult);
          
          return {
            success: jsonResult.success || false,
            pageDescription,
            data: jsonResult.data || null,
            errorMessage: jsonResult.success ? undefined : (jsonResult.message || '任务执行失败'),
          };
        } catch (parseError) {
          console.error('❌ 解析 JSON 失败:', parseError);
        }
      }
      
      // 降级处理：如果没有返回 JSON，基于工具调用判断
      console.warn('⚠️  AI 未返回 JSON 格式结果，使用降级逻辑');
      const allToolCalls = steps.flatMap((s) => s.toolCalls);
      const success = allToolCalls.length > 0 && !allToolCalls.some(tc => tc.result?.error);
      
      return {
        success,
        pageDescription,
        data: allToolCalls.length > 0 ? allToolCalls[0].result : null,
        errorMessage: success ? undefined : '未执行任何操作或操作失败',
      };
      
    } catch (error) {
      console.error('❌ Error during act():', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        pageDescription: 'Unable to describe page due to error',
        data: null,
      };
    }
  }

  private async describePageState(snapshot: string): Promise<string> {
    try {
      const result = await generateText({
        model: this.model,
        system: 'You are a helpful assistant that describes web pages in natural language. Be concise and focus on the main content and interactive elements visible on the page. Respond in the same language as the user query.',
        prompt: `Describe this web page state in 1-2 sentences, focusing on what the user can see and interact with:\n\n${snapshot}`,
      });
      
      return result.text || 'Page description unavailable';
    } catch (error) {
      return 'Unable to generate page description';
    }
  }

  async close(): Promise<void> {
    if (this.pageId) {
      try {
        await this.client.closePage(this.pageId);
        console.log(`🔒 Closed page: ${this.pageId}`);
        this.pageId = null;
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
  }

  getPageId(): string | null {
    return this.pageId;
  }
}