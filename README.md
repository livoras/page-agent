# Claude Code + AI SDKs Integration

Use Claude Code with Vercel AI SDK and OpenAI Agents SDK through OpenAI API compatible wrapper.

## Setup

```bash
pnpm install
```

## How it Works

1. **Start the OpenAI API wrapper server:**
```bash
cd /tmp/claude-code-openai-wrapper
python main.py  # Choose 'N' for no API key
```

2. **Run examples:**
```bash
bun index.ts                  # Vercel AI SDK simple example
bun aisdk-wrapper-final.ts    # Vercel AI SDK comprehensive examples
bun openai-agents-example.ts  # OpenAI Agents SDK example
```

## Quick Start

### Vercel AI SDK

```typescript
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const claude = createOpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'not-needed',
});

const { text } = await generateText({
  model: claude.chat('claude-sonnet-4-20250514'),
  prompt: 'Hello!',
});
```

### OpenAI Agents SDK

```typescript
import { Agent, run, setTracingDisabled } from '@openai/agents';
import { setDefaultOpenAIClient, setOpenAIAPI } from '@openai/agents-openai';
import OpenAI from 'openai';

// Disable tracing (optional, removes warnings)
setTracingDisabled(true);

// IMPORTANT: Use Chat Completions API
setOpenAIAPI('chat_completions');

const client = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'not-needed',
});

setDefaultOpenAIClient(client);

const agent = new Agent({
  name: 'Assistant',
  model: 'claude-sonnet-4-20250514',
  instructions: 'Be helpful and concise.',
});

const result = await run(agent, 'Hello!', { maxTurns: 1 });
```

## Features

✅ Text generation  
✅ Streaming responses  
✅ Multi-turn conversations  
✅ System prompts  
✅ OpenAI Agents SDK (with Chat API)
✅ Vercel AI SDK
❌ Tool calls / Function calling (not supported by Claude Code CLI)
❌ OpenAI Responses API (use Chat API instead)  

## Available Models

- `claude-sonnet-4-20250514` (recommended)
- `claude-opus-4-20250514`

## Files

- `index.ts` - Vercel AI SDK simple example
- `aisdk-wrapper-final.ts` - Vercel AI SDK comprehensive examples
- `openai-agents-example.ts` - OpenAI Agents SDK integration

## Prerequisites

1. Claude Code CLI installed and authenticated
2. Node.js/Bun and pnpm  
3. Python 3.10+ with Poetry