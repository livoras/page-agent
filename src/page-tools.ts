import { tool } from 'ai';
import { z } from 'zod';
import { PlaywrightClient } from 'better-playwright-mcp2/lib/index.js';

export function createPageTools(client: PlaywrightClient, pageId: string, setExtractedData: (data: any, message: string) => void) {
  return {
    navigate: tool({
      description: '导航到指定的URL或网站',
      inputSchema: z.object({
        url: z.string().describe('要导航到的URL地址，如 google.com 或 https://github.com'),
      }),
      execute: async ({ url }) => {
        // 如果没有协议，添加 https://
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        
        const result = await client.navigate(pageId, url);
        
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 获取导航后的快照
        const afterNav = await client.getSnapshot(pageId);
        
        return { 
          success: true, 
          navigatedTo: url,
          pageTitle: afterNav.title || 'Unknown',
          pageUrl: afterNav.url || url
        };
      },
    }),

    click: tool({
      description: 'Click on an element in the page',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the element to click'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, elementDescription }) => {
        const result = await client.click(pageId, ref, elementDescription);
        return { success: true, clicked: elementDescription || `element with ref=${ref}` };
      },
    }),

    type: tool({
      description: 'Type text into an input field',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the input element'),
        text: z.string().describe('The text to type'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, text, elementDescription }) => {
        const result = await client.type(pageId, ref, text, elementDescription);
        return { success: true, typed: text, into: elementDescription || `element with ref=${ref}` };
      },
    }),

    fill: tool({
      description: 'Fill a form field with a value (clears existing content first)',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the form element'),
        value: z.string().describe('The value to fill'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, value, elementDescription }) => {
        const result = await client.fill(pageId, ref, value, elementDescription);
        return { success: true, filled: value, into: elementDescription || `element with ref=${ref}` };
      },
    }),

    select: tool({
      description: 'Select an option from a dropdown',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the select element'),
        value: z.string().describe('The value or text of the option to select'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, value, elementDescription }) => {
        const result = await client.select(pageId, ref, value, elementDescription);
        return { success: true, selected: value, from: elementDescription || `element with ref=${ref}` };
      },
    }),

    waitAndGetSnapshot: tool({
      description: 'Wait for a moment and get current page snapshot',
      inputSchema: z.object({
        seconds: z.number().default(2).describe('Seconds to wait before getting snapshot'),
      }),
      execute: async ({ seconds }) => {
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        const snapshot = await client.getSnapshot(pageId);
        return { success: true, snapshot: snapshot.snapshot };
      },
    }),

    setResultData: tool({
      description: 'Set structured data extracted from the page as the result',
      inputSchema: z.object({
        data: z.any().describe('The structured data extracted from the page (e.g., list of products, search results, specific information)'),
        message: z.string().describe('A description of what data was extracted'),
      }),
      execute: async ({ data, message }) => {
        setExtractedData(data, message);
        return { success: true, message: 'Data has been set as result' };
      },
    }),
  };
}