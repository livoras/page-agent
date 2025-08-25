import { PageAgent } from '../src/page-agent';

async function debugPageAgent() {
  console.log('🔍 调试 PageAgent - 测试三个操作\n');
  console.log('='.repeat(50));
  
  const agent = new PageAgent({
    serverUrl: 'http://localhost:3102',
    modelName: 'deepseek',
  });

  const operations = [
    '去百度',
    '搜索卷发棒',
    '点击搜索按钮'
  ];

  for (let i = 0; i < operations.length; i++) {
    const instruction = operations[i];
    console.log(`\n📝 操作 ${i + 1}: "${instruction}"`);
    console.log('-'.repeat(40));
    
    try {
      const result = await agent.act(instruction);
      
      console.log('\n📊 结果分析:');
      console.log(`   成功: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`   错误: ${result.errorMessage}`);
      }
      console.log(`   页面描述: ${result.pageDescription}`);
      
      if (result.data) {
        console.log(`   返回数据:`, JSON.stringify(result.data, null, 2));
      }
      
      // 等待一下让页面稳定
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('❌ 执行出错:', error);
    }
  }
  
  await agent.close();
  console.log('\n✅ 调试完成');
}

debugPageAgent().catch(console.error);