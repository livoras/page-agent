import { PageAgent } from "../src/page-agent";
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testNewWorkflow() {
  console.log("🧪 测试新的三层工作流程");
  console.log("=" .repeat(60));
  
  const agent = new PageAgent({ 
    modelName: "k2",
    serverUrl: "http://localhost:3102" 
  });

  try {
    // 测试1：导航到百度
    console.log("\n📍 测试1: 导航到百度");
    const result1 = await agent.act("去百度");
    console.log("结果:", result1.success ? "✅ 成功" : "❌ 失败");
    
    // 测试2：搜索OpenAI
    console.log("\n📍 测试2: 搜索 OpenAI");
    const result2 = await agent.act("搜索OpenAI");
    console.log("结果:", result2.success ? "✅ 成功" : "❌ 失败");
    
    // 测试3：提取搜索结果
    console.log("\n📍 测试3: 获取搜索结果");
    const result3 = await agent.act("获取前5个搜索结果的标题和链接");
    console.log("结果:", result3.success ? "✅ 成功" : "❌ 失败");
    if (result3.data) {
      console.log("提取的数据:", JSON.stringify(result3.data, null, 2));
    }
    
  } catch (error) {
    console.error("❌ 测试失败:", error);
  } finally {
    await agent.close();
    console.log("\n✅ 测试完成");
  }
}

// 运行测试
testNewWorkflow().catch(console.error);