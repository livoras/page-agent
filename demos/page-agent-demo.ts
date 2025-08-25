#!/usr/bin/env tsx
import { PageAgent } from '../src/page-agent';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function demo() {
  console.log(`
╔════════════════════════════════════════════════════╗
║         🤖 PageAgent Interactive Demo 🤖           ║
╠════════════════════════════════════════════════════╣
║  Natural Language Browser Automation               ║
║                                                    ║
║  Examples:                                        ║
║    • 打开百度                                      ║
║    • 搜索 ChatGPT                                 ║
║    • 点击第一个结果                                 ║
║    • Navigate to github.com                       ║
║    • Type hello world in search                   ║
║                                                    ║
║  Commands:                                        ║
║    • exit / quit - Stop the demo                  ║
║    • help - Show this message again               ║
╚════════════════════════════════════════════════════╝
`);

  const agent = new PageAgent({
    serverUrl: 'http://localhost:3102',
    modelName: process.argv[2] || 'deepseek',
  });

  console.log(`🔗 Connected to server: http://localhost:3102`);
  console.log(`🤖 Using model: ${process.argv[2] || 'deepseek'}\n`);

  const processCommand = async (input: string): Promise<boolean> => {
    const command = input.trim().toLowerCase();
    
    if (command === 'exit' || command === 'quit') {
      console.log('\n👋 Goodbye!');
      await agent.close();
      return false;
    }
    
    if (command === 'help') {
      console.log(`
📚 Help:
  • Type any natural language instruction
  • Examples: "打开谷歌", "search for AI news", "click login button"
  • Type 'exit' to quit
`);
      return true;
    }
    
    // Execute the natural language command
    console.log('\n⏳ Processing...\n');
    const result = await agent.act(input);
    
    // Display results with nice formatting
    if (result.success) {
      console.log('✅ Success!');
    } else {
      console.log('❌ Failed');
      if (result.errorMessage) {
        console.log(`   Error: ${result.errorMessage}`);
      }
    }
    
    console.log(`\n📄 Page State:`);
    console.log(`   ${result.pageDescription}\n`);
    
    return true;
  };

  // Main interaction loop
  const askForCommand = () => {
    rl.question('🎯 What would you like to do? > ', async (input) => {
      const shouldContinue = await processCommand(input);
      
      if (shouldContinue) {
        askForCommand();
      } else {
        rl.close();
        process.exit(0);
      }
    });
  };

  askForCommand();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

// Start the demo
demo().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});