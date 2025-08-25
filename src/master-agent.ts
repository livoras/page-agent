import { stepCountIs, streamText } from "ai";
import { tool } from "ai";
import { z } from "zod";
import { getModel } from "./models";
import { PageAgent, ActionResult } from "./page-agent";
import { MASTER_SYSTEM_PROMPT } from "./master-agent-prompts";

export interface MasterAgentConfig {
  serverUrl?: string;
  modelName?: string;
  maxSteps?: number;
}

export interface TaskResult {
  success: boolean;
  summary: string;
  steps: StepResult[];
  finalData?: any;
}

export interface StepResult {
  instruction: string;
  purpose: string;
  success: boolean;
  pageState: string;
  data?: any;
}

export class MasterAgent {
  private pageAgent: PageAgent;
  private model: any;
  private maxSteps: number;
  private steps: StepResult[] = [];

  constructor(config: MasterAgentConfig = {}) {
    this.pageAgent = new PageAgent({
      serverUrl: config.serverUrl,
      modelName: config.modelName || "deepseek",
    });
    this.model = getModel(config.modelName || "deepseek");
    this.maxSteps = config.maxSteps || 20;
  }

  async execute(userTask: string): Promise<TaskResult> {
    console.log(`\n🎯 Master Agent 开始执行任务: "${userTask}"`);
    console.log("═".repeat(60));

    // Reset steps for new task
    this.steps = [];

    const result = streamText({
      model: this.model,
      stopWhen: stepCountIs(10),
      system: MASTER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `要完成的任务：${userTask}\n\n请分析任务，逐步执行必要的浏览器操作来完成任务。`,
        },
      ],
      tools: {
        browserAction: tool({
          description:
            "执行浏览器操作：导航、点击、输入、提取数据、询问页面状态等",
          inputSchema: z.object({
            instruction: z
              .string()
              .describe(
                "自然语言操作指令，如'打开百度'、'查看页面有什么内容'、'提取搜索结果'",
              ),
            purpose: z.string().describe("这一步操作的目的和意图"),
            expectedOutcome: z
              .string()
              .optional()
              .describe("预期的结果或页面状态"),
          }),
          execute: async ({ instruction, purpose, expectedOutcome }) => {
            console.log(`\n📍 步骤 ${this.steps.length + 1}:`);
            console.log(`   指令: ${instruction}`);
            console.log(`   目的: ${purpose}`);
            if (expectedOutcome) {
              console.log(`   预期: ${expectedOutcome}`);
            }

            // Execute the browser action through PageAgent
            const actionResult = await this.pageAgent.act(instruction);

            // Store step result
            const stepResult: StepResult = {
              instruction,
              purpose,
              success: actionResult.success,
              pageState: actionResult.pageDescription,
              data: actionResult.data,
            };
            this.steps.push(stepResult);

            console.log(
              `   结果: ${actionResult.success ? "✅ 成功" : "❌ 失败"}`,
            );
            if (actionResult.data) {
              console.log(`   数据: 已提取`);
            }

            // Return raw information for AI to interpret
            return {
              success: actionResult.success,
              pageState: actionResult.pageDescription,
              extractedData: actionResult.data,
              stepNumber: this.steps.length,
            };
          },
        }),
      },
      onStepFinish: async ({ toolCalls, usage, text }) => {
        if (toolCalls && toolCalls.length > 0) {
          console.log(`   └─ 工具调用完成`);
        }
        if (usage) {
          console.log(
            `   └─ Tokens: ${usage.totalTokens || usage.promptTokens + usage.completionTokens}`,
          );
        }
      },
    });

    // Process streaming output
    console.log("\n💭 AI 思考过程:\n");
    console.log("─".repeat(40));

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    console.log("\n" + "─".repeat(40));

    // Get final result
    const finalText = await result.text;
    const finalUsage = await result.usage;

    console.log("\n═".repeat(60));
    console.log("📊 任务执行统计:");
    console.log(`   ├─ 总步骤数: ${this.steps.length}`);
    console.log(
      `   ├─ 成功步骤: ${this.steps.filter((s) => s.success).length}`,
    );
    console.log(`   └─ 总 Tokens: ${finalUsage?.totalTokens || "N/A"}`);

    // Determine overall success
    const overallSuccess =
      this.steps.length > 0 && this.steps[this.steps.length - 1].success;

    // Get final data if any
    const finalData = this.steps
      .filter((s) => s.data)
      .map((s) => s.data)
      .pop();

    return {
      success: overallSuccess,
      summary: finalText || "任务执行完成",
      steps: this.steps,
      finalData,
    };
  }

  async close(): Promise<void> {
    await this.pageAgent.close();
    console.log("🔒 Master Agent 已关闭");
  }
}
