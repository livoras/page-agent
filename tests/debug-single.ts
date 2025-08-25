import { PageAgent } from '../src/page-agent';

async function debugSingle() {
  const agent = new PageAgent({
    serverUrl: 'http://localhost:3102',
    modelName: 'deepseek',
  });

  console.log('测试单个操作: 去百度\n');
  
  const result = await agent.act('去百度');
  
  console.log('\n最终结果:');
  console.log('成功:', result.success);
  console.log('错误:', result.errorMessage);
  
  await agent.close();
}

debugSingle().catch(console.error);