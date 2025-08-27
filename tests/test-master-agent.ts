import { MasterAgent } from "../src/master-agent";

async function testMasterAgent() {
  console.log("🚀 Starting MasterAgent Test");
  console.log("=".repeat(60));

  const agent = new MasterAgent({
    serverUrl: "http://localhost:3102",
    modelName: process.argv[2] || "deepseek",
    maxSteps: 15,
  });

  console.log("✅ MasterAgent initialized");
  console.log(`📍 Server: http://localhost:3102`);
  console.log(`🤖 Model: ${process.argv[2] || "deepseek"}`);
  console.log("=".repeat(60));

  // Test cases
  const testCases = [
    "打开亚马逊搜索卷发棒，进入评论数最高的产品，分析用户最近5条评论，提供优化建议",
    // "访问京东，搜索 iPhone 15，找出最便宜的一个",
    // "打开知乎，看看今天的热榜前三条是什么",
  ];

  for (const task of testCases) {
    console.log(`\n\n${"🎯".repeat(30)}`);
    console.log(`测试任务: "${task}"`);
    console.log(`${"🎯".repeat(30)}\n`);

    try {
      const result = await agent.execute(task);

      console.log("\n" + "=".repeat(60));
      console.log("📋 任务执行结果:");
      console.log(`   成功: ${result.success ? "✅" : "❌"}`);
      console.log(`   执行步骤: ${result.steps.length}`);

      if (result.finalData) {
        console.log("\n📊 提取的数据:");
        console.log(JSON.stringify(result.finalData, null, 2));
      }

      console.log("\n📝 任务总结:");
      console.log(result.summary);
      console.log("=".repeat(60));
    } catch (error) {
      console.error("❌ 任务执行失败:", error);
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  await agent.close();
  console.log("\n✅ All tests completed!");
  process.exit(0);
}

// Error handling
process.on("SIGINT", async () => {
  console.log("\n\n👋 Shutting down...");
  process.exit(0);
});

// Run tests
testMasterAgent().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
