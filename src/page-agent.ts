import { PlaywrightClient } from "better-playwright-mcp3";
import { streamText, stepCountIs } from "ai";
import { getModel } from "./models";
import { SYSTEM_PROMPT } from "./page-agent-prompts";
import { createPageTools } from "./page-tools";

export interface PageAgentConfig {
  serverUrl?: string;
  modelName?: string;
}

export interface ActionResult {
  success: boolean;
  data: any | null;
}

export class PageAgent {
  private client: PlaywrightClient;
  private pageId: string | null = null;
  private model: any;
  private serverUrl: string;
  private extractedData: any = null;
  private extractionMessage: string = "";

  constructor(config: PageAgentConfig = {}) {
    this.serverUrl = config.serverUrl || "http://localhost:3102";
    this.client = new PlaywrightClient(this.serverUrl);
    this.model = getModel(config.modelName || "deepseek");
  }

  private async ensurePage(): Promise<void> {
    if (!this.pageId) {
      const page = await this.client.createPage(
        "agent-page",
        "Page managed by PageAgent",
        "about:blank",
      );
      this.pageId = page.pageId;
      console.log(`📄 Created new page with ID: ${this.pageId}`);
    }
  }

  async act(instruction: string): Promise<ActionResult> {
    console.log(`\n🎯 Executing: "${instruction}"`);
    console.log("─".repeat(50));

    // Reset extracted data for new task
    this.extractedData = null;
    this.extractionMessage = "";

    // Ensure page exists
    await this.ensurePage();

    // Let AI decide and execute the action with streaming
    console.log("🤖 AI analyzing task...");

    const userMessage = `要执行的任务: ${instruction}\n\n请按照三层工作流程执行：\n1. 先使用 getOutline 了解页面概览\n2. 基于概览，使用 searchSnapshot 搜索具体内容\n3. 使用找到的 ref 执行操作\n\n对于数据提取任务，使用 setResultData 存储提取的数据。`;

    const result = streamText({
      model: this.model,
      stopWhen: stepCountIs(100),
      tools: createPageTools(this.client, this.pageId!, (data, message) => {
        this.extractedData = data;
        this.extractionMessage = message;
      }),
      toolChoice: "auto",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
      onStepFinish: async ({ toolCalls, toolResults, usage }) => {
        if (toolCalls && toolCalls.length > 0) {
          console.log(`\n✅ [Step] 完成了 ${toolCalls.length} 个工具调用`);
          toolCalls.forEach((tc, index) => {
            console.log(`   └─ 工具: ${tc.toolName}`);
            // 从 toolResults 中获取对应的结果
            const result = toolResults?.[index]?.output;
            if (result) {
              console.log(
                `      结果: ${JSON.stringify(result).substring(0, 200)}`,
              );
            } else {
              console.log(`      结果: (无结果)`);
            }
          });
        }
        if (usage) {
          console.log(
            `   └─ Tokens: prompt=${usage.promptTokens}, completion=${usage.completionTokens}`,
          );
        }
      },
    });

    // 处理流式输出 - 参考 stream-weather-agent.ts
    console.log("🎯 AI Response:\n");

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
    console.log("\n\n" + "─".repeat(50));

    // 获取最终统计 - 参考 stream-weather-agent.ts
    const finalUsage = await result.usage;
    const steps = await result.steps;
    const finalText = await result.text;

    console.log("\n📊 执行统计:");
    console.log(`   ├─ 总步数: ${steps.length}`);
    console.log(`   ├─ 工具调用: ${steps.flatMap((s) => s.toolCalls).length}`);
    console.log(`   └─ 总 Tokens: ${finalUsage?.totalTokens || "N/A"}`);

    // 判断任务是否成功
    const allToolCalls = steps.flatMap((s) => s.toolCalls);
    const allToolResults = steps.flatMap((s) => s.toolResults || []);
    const success =
      allToolCalls.length > 0 && !allToolResults.some((tr) => tr.output?.error);

    // 如果提取了数据，使用提取的数据
    const resultData =
      this.extractedData ||
      (allToolResults.length > 0 ? allToolResults[0].output : null);

    console.log("\n📊 结果:");
    if (this.extractedData) {
      console.log(`   ├─ 提取的数据: ${this.extractionMessage}`);
    }
    console.log(`   └─ 成功: ${success ? "✅" : "❌"}`);

    return {
      success,
      data: resultData,
    };
  }

  async close(): Promise<void> {
    if (this.pageId) {
      await this.client.closePage(this.pageId);
      console.log(`🔒 Closed page: ${this.pageId}`);
      this.pageId = null;
    }
  }

  getPageId(): string | null {
    return this.pageId;
  }
}
