# Page Agent

基于 better-playwright-mcp3 的智能网页自动化代理，使用 AI 理解自然语言指令并自动执行网页操作。

## 功能特性

- 🤖 自然语言控制：用中文或英文描述任务，AI 自动执行
- 🔍 智能元素定位：通过 searchSnapshot 精准搜索页面元素
- 📊 数据提取：自动提取网页上的结构化数据
- 🎯 三层工作流：Outline → Search → Action 的高效执行模式

## 安装

```bash
# 安装依赖
pnpm install

# 安装并启动 better-playwright-mcp3 服务
npx better-playwright-mcp3@latest server
```

## 快速开始

```typescript
import { PageAgent } from './src/page-agent';

const agent = new PageAgent({
  serverUrl: 'http://localhost:3102',  // better-playwright-mcp3 服务地址
  modelName: 'deepseek'                 // 使用的 AI 模型
});

// 执行任务
const result = await agent.act('去百度搜索 OpenAI');

// 获取提取的数据
if (result.success && result.data) {
  console.log('提取的数据:', result.data);
}

// 关闭页面
await agent.close();
```

## 支持的任务类型

### 1. 导航任务
```javascript
await agent.act('打开亚马逊');
await agent.act('去 github.com');
```

### 2. 操作任务
```javascript
await agent.act('在搜索框输入手机');
await agent.act('点击搜索按钮');
await agent.act('选择北京');
```

### 3. 数据提取
```javascript
await agent.act('获取搜索结果的标题和链接');
await agent.act('提取商品价格');
```

## 工作原理

1. **getOutline**: 获取页面概览，了解页面结构
2. **searchSnapshot**: 使用正则表达式搜索特定元素
3. **执行操作**: 通过 ref ID 操作找到的元素
4. **重新理解**: 每次操作后重新调用 getOutline 了解页面变化

## 配置

### AI 模型选择

在 `src/models.ts` 中配置可用的 AI 模型：

```typescript
// 支持的模型
- deepseek
- gpt-4o
- claude-3.5-sonnet
```

### 服务器配置

```typescript
const agent = new PageAgent({
  serverUrl: 'http://localhost:3102', // better-playwright-mcp3 服务地址
  modelName: 'deepseek'               // AI 模型
});
```

## 示例

运行演示：

```bash
# 基础演示
pnpm tsx demos/page-agent-demo.ts

# 测试工作流
pnpm tsx tests/test-new-workflow.ts
```

## 依赖项

- **better-playwright-mcp3** v3.2.0+: 浏览器自动化和内容搜索
- **ai** (Vercel AI SDK): AI 模型集成
- **zod**: 参数验证

## 开发

```bash
# 运行测试
pnpm tsx tests/test-new-workflow.ts

# 查看日志
# 日志会实时显示 AI 的思考过程和工具调用
```

## 注意事项

1. 需要先启动 better-playwright-mcp3 服务
2. 确保 AI 模型 API 密钥已配置
3. searchSnapshot 使用标准正则表达式，多个关键词用 `|` 分隔

## License

MIT