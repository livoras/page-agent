import { tool } from 'ai';
import { z } from 'zod';
import { PlaywrightClient } from 'better-playwright-mcp3';

export function createPageTools(client: PlaywrightClient, pageId: string, setExtractedData: (data: any, message: string) => void) {
  return {
    getOutline: tool({
      description: '获取页面的结构化概览（约100行），用于了解页面大致内容和布局，以便进行更精准的搜索（任务开始时应先调用）',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const outline = await (client as any).getOutline(pageId);
          console.log('✅ getOutline success, length:', outline?.length || 0);
          return { success: true, outline };
        } catch (error) {
          console.error('❌ getOutline error:', error);
          throw error;
        }
      },
    }),

    navigate: tool({
      description: '导航到指定的URL或网站（导航后必须调用getOutline了解新页面）',
      inputSchema: z.object({
        url: z.string().describe('要导航到的URL地址，如 google.com 或 https://github.com'),
      }),
      execute: async ({ url }) => {
        try {
          // 如果没有协议，添加 https://
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          
          const result = await client.navigate(pageId, url);
          console.log('✅ navigate success:', result);
          
          // 等待页面加载
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          return { 
            success: true, 
            navigatedTo: url,
            pageTitle: 'Page loaded',
            pageUrl: url
          };
        } catch (error) {
          console.error('❌ navigate error:', error);
          throw error;
        }
      },
    }),

    click: tool({
      description: '点击页面元素（需先通过getOutline和searchSnapshot找到元素的ref）',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the element to click'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, elementDescription }) => {
        try {
          const result = await client.click(pageId, ref, elementDescription);
          console.log('✅ click success:', result);
          return { success: true, clicked: elementDescription || `element with ref=${ref}` };
        } catch (error) {
          console.error('❌ click error:', error);
          throw error;
        }
      },
    }),

    type: tool({
      description: '在输入框中输入文本（需先通过getOutline和searchSnapshot找到元素的ref）',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the input element'),
        text: z.string().describe('The text to type'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, text, elementDescription }) => {
        try {
          const result = await client.type(pageId, ref, text, elementDescription);
          console.log('✅ type success:', result);
          return { success: true, typed: text, into: elementDescription || `element with ref=${ref}` };
        } catch (error) {
          console.error('❌ type error:', error);
          throw error;
        }
      },
    }),

    fill: tool({
      description: '填充表单字段，会先清空现有内容（需先通过getOutline和searchSnapshot找到元素的ref）',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the form element'),
        value: z.string().describe('The value to fill'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, value, elementDescription }) => {
        try {
          const result = await client.fill(pageId, ref, value, elementDescription);
          console.log('✅ fill success:', result);
          return { success: true, filled: value, into: elementDescription || `element with ref=${ref}` };
        } catch (error) {
          console.error('❌ fill error:', error);
          throw error;
        }
      },
    }),

    select: tool({
      description: '从下拉菜单中选择选项（需先通过getOutline和searchSnapshot找到元素的ref）',
      inputSchema: z.object({
        ref: z.string().describe('The ref ID of the select element'),
        value: z.string().describe('The value or text of the option to select'),
        elementDescription: z.string().optional().describe('Natural language description of the element'),
      }),
      execute: async ({ ref, value, elementDescription }) => {
        try {
          const result = await client.select(pageId, ref, value, elementDescription);
          console.log('✅ select success:', result);
          return { success: true, selected: value, from: elementDescription || `element with ref=${ref}` };
        } catch (error) {
          console.error('❌ select error:', error);
          throw error;
        }
      },
    }),

    searchSnapshot: tool({
      description: '在页面中搜索特定内容，返回匹配的元素及其ref（在getOutline后使用，用于定位具体元素）',
      inputSchema: z.object({
        pattern: z.string().describe('搜索模式：普通文本或正则表达式'),
        ignoreCase: z.boolean().optional().default(true).describe('是否忽略大小写（默认true）'),
        lineLimit: z.number().optional().default(100).describe('返回的最大行数（默认100）'),
      }),
      execute: async ({ pattern, ignoreCase, lineLimit }) => {
        try {
          const options = { ignoreCase, lineLimit };
          const results = await (client as any).searchSnapshot(pageId, pattern, options);
          console.log('✅ searchSnapshot success, found', results?.matchCount || 0, 'matches');
          return { success: true, ...results };
        } catch (error) {
          console.error('❌ searchSnapshot error:', error);
          throw error;
        }
      },
    }),

    setResultData: tool({
      description: 'Set structured data extracted from the page as the result',
      inputSchema: z.object({
        data: z.any().describe('The structured data extracted from the page (e.g., list of products, search results, specific information)'),
        message: z.string().describe('A description of what data was extracted'),
      }),
      execute: async ({ data, message }) => {
        try {
          console.log('🔍 [DEBUG] setResultData called with:', { message, dataKeys: Object.keys(data || {}) });
          setExtractedData(data, message);
          console.log('✅ setResultData success:', message);
          return { success: true, message: 'Data has been set as result' };
        } catch (error) {
          console.error('❌ setResultData error:', error);
          throw error;
        }
      },
    }),
  };
}