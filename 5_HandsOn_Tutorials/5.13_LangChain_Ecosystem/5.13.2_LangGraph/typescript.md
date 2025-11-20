# LangGraph with TypeScript

Complete guide to building stateful, graph-based agent applications with LangGraph using TypeScript.

## Why TypeScript for LangGraph?

- **Type Safety**: Catch errors at compile time
- **IDE Support**: Excellent autocomplete and debugging
- **Modern JavaScript**: Use latest ES features
- **Full-stack**: Same language for frontend and backend
- **Growing Support**: Active TypeScript community

## Prerequisites

```bash
# Install Node.js 18+
node --version

# Install npm or yarn
npm --version
```

## Installation

```bash
# Create new project
mkdir langgraph-typescript
cd langgraph-typescript
npm init -y

# Install TypeScript
npm install -D typescript @types/node ts-node nodemon

# Initialize TypeScript
npx tsc --init

# Install LangGraph
npm install @langchain/langgraph

# Install LangChain integrations
npm install @langchain/core @langchain/openai @langchain/anthropic

# Install tools
npm install @langchain/community zod

# Install utilities
npm install dotenv uuid
npm install -D @types/uuid
```

## Project Structure

```
langgraph-typescript/
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── graphs/
│   │   ├── simpleAgent.ts
│   │   ├── reactAgent.ts
│   │   ├── multiAgent.ts
│   │   └── humanInLoop.ts
│   ├── nodes/
│   │   ├── agentNodes.ts
│   │   └── toolNodes.ts
│   ├── state/
│   │   └── schemas.ts
│   ├── tools/
│   │   └── customTools.ts
│   └── index.ts
├── tests/
│   └── graphs.test.ts
├── .env
├── package.json
└── tsconfig.json
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 1. Basic StateGraph

### Simple Linear Graph

```typescript
// src/graphs/simpleAgent.ts
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";

dotenv.config();

// Define state schema
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// Define node function
async function chatbot(state: typeof StateAnnotation.State) {
  const llm = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

export function createSimpleGraph() {
  // Initialize graph
  const workflow = new StateGraph(StateAnnotation)
    .addNode("chatbot", chatbot)
    .addEdge(START, "chatbot")
    .addEdge("chatbot", END);

  // Compile
  const app = workflow.compile();
  return app;
}

// Usage
async function main() {
  const app = createSimpleGraph();
  const result = await app.invoke({
    messages: [{ role: "user", content: "What is LangGraph?" }],
  });

  console.log(result.messages[result.messages.length - 1].content);
}

if (require.main === module) {
  main();
}
```

## 2. ReAct Agent with Tools

### Define Tools

```typescript
// src/tools/customTools.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const getWeatherTool = new DynamicStructuredTool({
  name: "get_weather",
  description: "Get the current weather for a location",
  schema: z.object({
    location: z.string().describe("City name"),
  }),
  func: async ({ location }) => {
    // Mock weather data
    const weather = ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)];
    const temp = Math.floor(Math.random() * 25) + 60;
    return `The weather in ${location} is ${weather} with a temperature of ${temp}°F`;
  },
});

export const calculateTool = new DynamicStructuredTool({
  name: "calculate",
  description: "Safely evaluate a mathematical expression",
  schema: z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
  }),
  func: async ({ expression }) => {
    try {
      // Safe eval for simple math
      const result = Function(`"use strict"; return (${expression})`)();
      return String(result);
    } catch (error) {
      return `Error: ${error}`;
    }
  },
});

export const searchDatabaseTool = new DynamicStructuredTool({
  name: "search_database",
  description: "Search a mock database",
  schema: z.object({
    query: z.string().describe("Search query"),
  }),
  func: async ({ query }) => {
    const results: Record<string, string> = {
      users: "Found 100 users",
      products: "Found 50 products",
      orders: "Found 200 orders",
    };
    return results[query.toLowerCase()] || "No results found";
  },
});
```

### ReAct Agent Graph

```typescript
// src/graphs/reactAgent.ts
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  getWeatherTool,
  calculateTool,
  searchDatabaseTool,
} from "../tools/customTools";

// Define state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

type AgentState = typeof StateAnnotation.State;

// Define tools
const tools = [getWeatherTool, calculateTool, searchDatabaseTool];
const toolNode = new ToolNode(tools);

// Should continue function
function shouldContinue(state: AgentState): "tools" | typeof END {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return "tools";
  }
  return END;
}

// Call model function
async function callModel(state: AgentState) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  }).bindTools(tools);

  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

export function createReactAgent() {
  const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent");

  return workflow.compile();
}

// Usage
async function main() {
  const app = createReactAgent();

  const result = await app.invoke({
    messages: [
      { role: "user", content: "What's the weather in San Francisco?" },
    ],
  });

  result.messages.forEach((msg: BaseMessage) => {
    console.log(`${msg._getType()}: ${msg.content}`);
  });
}

if (require.main === module) {
  main();
}
```

## 3. Stateful Agent with Memory

### Complex State Schema

```typescript
// src/state/schemas.ts
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Research state
export const ResearchStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  researchTopic: Annotation<string>(),
  findings: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  iteration: Annotation<number>({
    reducer: (x, y) => y ?? x ?? 0,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (x, y) => y ?? x ?? 3,
    default: () => 3,
  }),
});

export type ResearchState = typeof ResearchStateAnnotation.State;
```

### Research Agent with State

```typescript
// src/graphs/researchAgent.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ResearchStateAnnotation, ResearchState } from "../state/schemas";

async function researchNode(state: ResearchState) {
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0.7 });

  const prompt = `You are a research assistant.
Topic: ${state.researchTopic}
Previous findings: ${state.findings.join(", ")}
Iteration: ${state.iteration} of ${state.maxIterations}

Provide a new finding about this topic.`;

  const response = await llm.invoke([new HumanMessage(prompt)]);

  return {
    findings: [response.content as string],
    iteration: state.iteration + 1,
    messages: [response],
  };
}

function shouldContinueResearch(state: ResearchState): "research" | typeof END {
  if (state.iteration >= state.maxIterations) {
    return END;
  }
  return "research";
}

export function createResearchAgent() {
  const workflow = new StateGraph(ResearchStateAnnotation)
    .addNode("research", researchNode)
    .addEdge(START, "research")
    .addConditionalEdges("research", shouldContinueResearch, {
      research: "research",
      [END]: END,
    });

  return workflow.compile();
}

// Usage
async function main() {
  const app = createResearchAgent();

  const result = await app.invoke({
    messages: [],
    researchTopic: "Artificial Intelligence",
    findings: [],
    iteration: 0,
    maxIterations: 3,
  });

  console.log(`Research Topic: ${result.researchTopic}`);
  console.log("\nFindings:");
  result.findings.forEach((finding: string, i: number) => {
    console.log(`${i + 1}. ${finding}\n`);
  });
}

if (require.main === module) {
  main();
}
```

## 4. Multi-Agent System

### Supervisor Pattern

```typescript
// src/graphs/multiAgent.ts
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";

// State definition
const MultiAgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  nextAgent: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
    default: () => "",
  }),
});

type MultiAgentState = typeof MultiAgentStateAnnotation.State;

// Supervisor node
async function supervisorNode(state: MultiAgentState) {
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });

  const systemPrompt = `You are a supervisor managing a team of agents:
- researcher: Finds information and does research
- writer: Writes and edits content
- coder: Writes and reviews code

Based on the user's request, decide which agent should handle it.
Respond with ONLY the agent name or 'FINISH' if done.`;

  const messages = [new SystemMessage(systemPrompt), ...state.messages];
  const response = await llm.invoke(messages);
  const nextAgent = (response.content as string).trim().toLowerCase();

  return {
    messages: [response],
    nextAgent,
  };
}

// Researcher node
async function researcherNode(state: MultiAgentState) {
  const llm = new ChatOpenAI({ modelName: "gpt-4" });

  const systemPrompt = "You are a research specialist. Find and summarize information.";
  const messages = [new SystemMessage(systemPrompt), ...state.messages];

  const response = await llm.invoke(messages);
  return { messages: [response] };
}

// Writer node
async function writerNode(state: MultiAgentState) {
  const llm = new ChatOpenAI({ modelName: "gpt-4" });

  const systemPrompt = "You are a professional writer. Create clear, engaging content.";
  const messages = [new SystemMessage(systemPrompt), ...state.messages];

  const response = await llm.invoke(messages);
  return { messages: [response] };
}

// Coder node
async function coderNode(state: MultiAgentState) {
  const llm = new ChatOpenAI({ modelName: "gpt-4" });

  const systemPrompt = "You are an expert programmer. Write clean, efficient code.";
  const messages = [new SystemMessage(systemPrompt), ...state.messages];

  const response = await llm.invoke(messages);
  return { messages: [response] };
}

// Router function
function router(state: MultiAgentState): string {
  const nextAgent = state.nextAgent.toLowerCase();

  if (nextAgent === "finish" || !nextAgent) {
    return END;
  } else if (["researcher", "writer", "coder"].includes(nextAgent)) {
    return nextAgent;
  } else {
    return "supervisor";
  }
}

export function createMultiAgentSystem() {
  const workflow = new StateGraph(MultiAgentStateAnnotation)
    .addNode("supervisor", supervisorNode)
    .addNode("researcher", researcherNode)
    .addNode("writer", writerNode)
    .addNode("coder", coderNode)
    .addEdge(START, "supervisor")
    .addConditionalEdges("supervisor", router, {
      researcher: "researcher",
      writer: "writer",
      coder: "coder",
      [END]: END,
    })
    .addEdge("researcher", "supervisor")
    .addEdge("writer", "supervisor")
    .addEdge("coder", "supervisor");

  return workflow.compile();
}

// Usage
async function main() {
  const app = createMultiAgentSystem();

  const result = await app.invoke({
    messages: [
      {
        role: "user",
        content: "Write a TypeScript function to calculate fibonacci numbers",
      },
    ],
    nextAgent: "",
  });

  result.messages.forEach((msg: BaseMessage) => {
    console.log(`\n${msg._getType()}:`);
    console.log(msg.content);
  });
}

if (require.main === module) {
  main();
}
```

## 5. Checkpointing and Persistence

### In-Memory Checkpointing

```typescript
// src/graphs/checkpointedAgent.ts
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  step: Annotation<number>({
    reducer: (x, y) => y ?? x ?? 0,
    default: () => 0,
  }),
});

async function chatbot(state: typeof StateAnnotation.State) {
  const llm = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await llm.invoke(state.messages);

  return {
    messages: [response],
    step: state.step + 1,
  };
}

export function createCheckpointedAgent() {
  const workflow = new StateGraph(StateAnnotation)
    .addNode("chatbot", chatbot)
    .addEdge(START, "chatbot")
    .addEdge("chatbot", END);

  // Add checkpointer
  const checkpointer = new MemorySaver();
  const app = workflow.compile({ checkpointer });

  return app;
}

// Usage
async function main() {
  const app = createCheckpointedAgent();

  // Configure with thread_id for persistence
  const config = { configurable: { thread_id: "conversation-1" } };

  // First interaction
  const result1 = await app.invoke(
    {
      messages: [{ role: "user", content: "Hi, I'm Alice" }],
      step: 0,
    },
    config
  );
  console.log(`Step ${result1.step}: ${result1.messages[result1.messages.length - 1].content}`);

  // Continue conversation (state is maintained)
  const result2 = await app.invoke(
    {
      messages: [{ role: "user", content: "What's my name?" }],
    },
    config
  );
  console.log(`Step ${result2.step}: ${result2.messages[result2.messages.length - 1].content}`);
}

if (require.main === module) {
  main();
}
```

## 6. Human-in-the-Loop

### Interactive Agent

```typescript
// src/graphs/humanInLoop.ts
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  requiresApproval: Annotation<boolean>({
    reducer: (x, y) => y ?? x ?? false,
    default: () => false,
  }),
});

type State = typeof StateAnnotation.State;

async function agentNode(state: State) {
  const llm = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await llm.invoke(state.messages);

  // Check if response needs approval
  const sensitiveTopics = ["delete", "remove", "cancel"];
  const content = (response.content as string).toLowerCase();
  const needsApproval = sensitiveTopics.some((topic) =>
    content.includes(topic)
  );

  return {
    messages: [response],
    requiresApproval: needsApproval,
  };
}

function shouldInterrupt(state: State): "human" | typeof END {
  if (state.requiresApproval) {
    return "human";
  }
  return END;
}

export function createHumanInLoopAgent() {
  const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", agentNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldInterrupt, {
      human: END,
      [END]: END,
    });

  const checkpointer = new MemorySaver();
  const app = workflow.compile({
    checkpointer,
    interruptBefore: ["agent"], // Can also interrupt before nodes
  });

  return app;
}

// Usage
async function main() {
  const app = createHumanInLoopAgent();
  const config = { configurable: { thread_id: uuidv4() } };

  const result = await app.invoke(
    {
      messages: [{ role: "user", content: "Please delete all my data" }],
      requiresApproval: false,
    },
    config
  );

  console.log(
    "Agent response:",
    result.messages[result.messages.length - 1].content
  );
  console.log("Requires approval:", result.requiresApproval);

  if (result.requiresApproval) {
    console.log("Action requires human approval");
  }
}

if (require.main === module) {
  main();
}
```

## 7. Streaming

### Stream Agent Steps

```typescript
// src/graphs/streamingAgent.ts
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

async function step1(state: typeof StateAnnotation.State) {
  console.log("Executing step 1...");
  return { messages: [] };
}

async function step2(state: typeof StateAnnotation.State) {
  console.log("Executing step 2...");
  const llm = new ChatOpenAI({ modelName: "gpt-4" });
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

export function createStreamingAgent() {
  const workflow = new StateGraph(StateAnnotation)
    .addNode("step1", step1)
    .addNode("step2", step2)
    .addEdge(START, "step1")
    .addEdge("step1", "step2")
    .addEdge("step2", END);

  return workflow.compile();
}

// Stream execution
async function main() {
  const app = createStreamingAgent();

  console.log("Streaming agent execution:");
  const stream = await app.stream({
    messages: [{ role: "user", content: "Tell me a joke" }],
  });

  for await (const event of stream) {
    console.log("Event:", event);
  }
}

if (require.main === module) {
  main();
}
```

## 8. Complete Application

```typescript
// src/index.ts
import { createReactAgent } from "./graphs/reactAgent";
import { createMultiAgentSystem } from "./graphs/multiAgent";
import { createCheckpointedAgent } from "./graphs/checkpointedAgent";
import * as dotenv from "dotenv";

dotenv.config();

class LangGraphApp {
  private reactAgent: ReturnType<typeof createReactAgent>;
  private multiAgent: ReturnType<typeof createMultiAgentSystem>;
  private chatAgent: ReturnType<typeof createCheckpointedAgent>;

  constructor() {
    this.reactAgent = createReactAgent();
    this.multiAgent = createMultiAgentSystem();
    this.chatAgent = createCheckpointedAgent();
  }

  async reactQuery(query: string): Promise<string> {
    const result = await this.reactAgent.invoke({
      messages: [{ role: "user", content: query }],
    });
    return result.messages[result.messages.length - 1].content as string;
  }

  async multiAgentQuery(query: string): Promise<string> {
    const result = await this.multiAgent.invoke({
      messages: [{ role: "user", content: query }],
      nextAgent: "",
    });
    return result.messages[result.messages.length - 1].content as string;
  }

  async chat(query: string, threadId: string): Promise<string> {
    const config = { configurable: { thread_id: threadId } };
    const result = await this.chatAgent.invoke(
      {
        messages: [{ role: "user", content: query }],
      },
      config
    );
    return result.messages[result.messages.length - 1].content as string;
  }
}

async function main() {
  const app = new LangGraphApp();

  // ReAct agent example
  console.log("ReAct Agent:");
  const response1 = await app.reactQuery("What's the weather in New York?");
  console.log(response1);
  console.log("\n" + "=".repeat(50) + "\n");

  // Multi-agent example
  console.log("Multi-Agent System:");
  const response2 = await app.multiAgentQuery(
    "Write a hello world function in TypeScript"
  );
  console.log(response2);
}

main();
```

## Testing

```typescript
// tests/graphs.test.ts
import { createSimpleGraph } from "../src/graphs/simpleAgent";

describe("LangGraph Tests", () => {
  test("simple graph", async () => {
    const app = createSimpleGraph();
    const result = await app.invoke({
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages[result.messages.length - 1].content).toBeTruthy();
  });
});
```

## Best Practices

1. **Type Safety**: Use TypeScript's type system fully
2. **State Design**: Keep state minimal and well-typed
3. **Error Handling**: Implement try-catch in async functions
4. **Async/Await**: Use proper async patterns
5. **Testing**: Test nodes independently
6. **Monitoring**: Integrate with LangSmith
7. **Checkpointing**: Use appropriate persistence
8. **Documentation**: Document state schemas and node functions

## Next Steps

1. Explore advanced patterns (subgraphs, parallelization)
2. Integrate with LangSmith for monitoring
3. Build production-ready multi-agent systems
4. Deploy with proper error handling
5. Optimize for performance
