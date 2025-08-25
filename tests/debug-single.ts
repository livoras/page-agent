import { PageAgent } from '../src/page-agent';

async function debugSingle() {
  const modelName = process.argv[2] || 'deepseek';
  console.log(`使用模型: ${modelName}\n`);
  
  const agent = new PageAgent({
    serverUrl: 'http://localhost:3102',
    modelName,
  });

  console.log('测试单个操作: 去百度');
  console.log('(DeepSeek中文+工具调用=无文本返回)\n');
  
  const result = await agent.act('去百度');
  
  console.log('\n最终结果:');
  console.log('成功:', result.success);
  console.log('页面描述:', result.pageDescription);
  if (result.data) {
    console.log('返回数据:', JSON.stringify(result.data, null, 2));
  }
  
  await agent.close();
}

debugSingle().catch(console.error);