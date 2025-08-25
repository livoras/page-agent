import { PageAgent } from '../src/page-agent';
import * as readline from 'readline';

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testPageAgent() {
  console.log('🚀 Starting PageAgent Test');
  console.log('='.repeat(50));
  
  // Initialize PageAgent
  const agent = new PageAgent({
    serverUrl: 'http://localhost:3102',
    modelName: process.argv[2] || 'deepseek',
  });

  console.log('✅ PageAgent initialized');
  console.log(`📍 Server: http://localhost:3102`);
  console.log(`🤖 Model: ${process.argv[2] || 'deepseek'}`);
  console.log('='.repeat(50));

  // Test cases for automated testing
  const automatedTests = [
    '打开百度',
    '在搜索框输入 OpenAI',
    '点击搜索按钮',
    '获取搜索结果列表',
  ];

  // Function to run a single test
  async function runTest(instruction: string) {
    console.log(`\n📝 Instruction: "${instruction}"`);
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    const result = await agent.act(instruction);
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Result:`);
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    
    
    console.log(`   Page: ${result.pageDescription}`);
    
    if (result.data) {
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    }
    
    return result;
  }

  // Interactive mode or automated mode
  const isInteractive = process.argv.includes('--interactive') || process.argv.includes('-i');
  
  if (isInteractive) {
    console.log('\n🎮 Interactive Mode');
    console.log('Type your instructions in natural language.');
    console.log('Type "exit" or "quit" to stop.\n');
    
    const askQuestion = () => {
      rl.question('> ', async (instruction) => {
        if (instruction.toLowerCase() === 'exit' || instruction.toLowerCase() === 'quit') {
          await agent.close();
          rl.close();
          process.exit(0);
        }
        
        await runTest(instruction);
        askQuestion(); // Ask for next instruction
      });
    };
    
    askQuestion();
    
  } else {
    console.log('\n🤖 Automated Test Mode');
    console.log(`Running ${automatedTests.length} test cases...\n`);
    
    for (const test of automatedTests) {
      await runTest(test);
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Additional English tests
    console.log('\n\n🌍 Testing English Instructions');
    console.log('='.repeat(50));
    
    const englishTests = [
      'navigate to google.com',
      'type machine learning in search box',
    ];
    
    for (const test of englishTests) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Clean up
    await agent.close();
    console.log('\n✅ All tests completed!');
    console.log(`📄 Page ID was: ${agent.getPageId() || 'Already closed'}`);
    process.exit(0);
  }
}

// Error handling
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

// Run tests
testPageAgent().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});