import { PlaywrightClient } from 'better-playwright-mcp2/lib/index.js';
import { streamText, generateText } from 'ai';
import { getModel } from './models';
import { SYSTEM_PROMPT } from './page-agent-prompts';
import { createPageTools } from './page-tools';

export interface PageAgentConfig {
  serverUrl?: string;
  modelName?: string;
}

export interface ActionResult {
  success: boolean;
  pageDescription: string;
  data: any | null;
}

export class PageAgent {
  private client: PlaywrightClient;
  private pageId: string | null = null;
  private model: any;
  private serverUrl: string;
  private extractedData: any = null;
  private extractionMessage: string = '';

  constructor(config: PageAgentConfig = {}) {
    this.serverUrl = config.serverUrl || 'http://localhost:3102';
    this.client = new PlaywrightClient(this.serverUrl);
    this.model = getModel(config.modelName || 'deepseek');
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
      
      // Reset extracted data for new task
      this.extractedData = null;
      this.extractionMessage = '';
      
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
        tools: createPageTools(this.client, this.pageId!, (data, message) => {
          this.extractedData = data;
          this.extractionMessage = message;
        }),
        toolChoice: 'auto',
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `当前页面状态:\n${snapshot}\n\n要执行的任务: ${instruction}\n\n分析页面并执行必要的操作来完成任务。对于数据提取任务，使用 setResultData 存储提取的数据。`,
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
      
      // 判断任务是否成功
      const allToolCalls = steps.flatMap((s) => s.toolCalls);
      const success = allToolCalls.length > 0 && !allToolCalls.some(tc => tc.result?.error);
      
      // 如果提取了数据，使用提取的数据
      const resultData = this.extractedData || (allToolCalls.length > 0 ? allToolCalls[0].result : null);
      
      console.log('\n📊 结果:');
      if (this.extractedData) {
        console.log(`   ├─ 提取的数据: ${this.extractionMessage}`);
      }
      console.log(`   └─ 成功: ${success ? '✅' : '❌'}`);
      
      return {
        success,
        pageDescription,
        data: resultData,
      };
      
    } catch (error) {
      console.error('❌ Error during act():', error);
      return {
        success: false,
        pageDescription: 'Unable to describe page due to error',
        data: null,
      };
    }
  }

  private async describePageState(snapshot: string): Promise<string> {
    try {
      const result = await generateText({
        model: this.model,
        system: '你是一个帮助描述网页的助手。简洁地描述页面的主要内容和可交互元素。根据用户的语言回复。',
        prompt: `用1-2句话描述这个网页状态，重点说明用户能看到和交互的内容:\n\n${snapshot}`,
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