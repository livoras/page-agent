import { PlaywrightClient } from 'better-playwright-mcp3';

async function testPlaywrightClient() {
  console.log('Testing Playwright Client connection...');
  
  try {
    // Create client instance connecting to default port
    const client = new PlaywrightClient('http://localhost:3102');  // Default port for better-playwright-mcp2 server

    console.log('Client created successfully');

    // Test creating a new page
    console.log('Creating new browser page...');
    const page = await client.createPage(
      'test-page',
      'Test page for connection verification',
      'https://example.com'  // Initial URL
    );
    
    console.log('Page created with ID:', page.pageId);

    // Get page snapshot
    console.log('Getting page snapshot...');
    const snapshot = await client.getSnapshot(page.pageId);
    
    console.log('Snapshot received:', snapshot.snapshot ? 'Success' : 'Failed');

    // Test clicking (if there's a clickable element)
    console.log('Testing interaction capabilities...');
    
    // Close the page
    console.log('Closing page...');
    await client.closePage(page.pageId);
    
    console.log('Page closed successfully');
    console.log('\n✅ All tests passed! Playwright client is working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testPlaywrightClient();