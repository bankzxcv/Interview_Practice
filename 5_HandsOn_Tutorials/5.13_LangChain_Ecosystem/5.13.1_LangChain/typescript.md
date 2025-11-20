# LangChain with TypeScript

Complete guide to building LLM applications with LangChain using TypeScript.

## Why TypeScript for LangChain?

- **Type Safety**: Catch errors at compile time
- **IDE Support**: Excellent autocomplete and IntelliSense
- **Modern JavaScript**: Use latest ES features
- **Full-stack**: Same language for frontend and backend
- **Growing Ecosystem**: Strong community adoption

## Prerequisites

```bash
# Install Node.js 18+
node --version

# Install npm or yarn
npm --version
# or
yarn --version
```

## Installation

```bash
# Create new project
mkdir langchain-typescript
cd langchain-typescript
npm init -y

# Install TypeScript
npm install -D typescript @types/node ts-node

# Initialize TypeScript
npx tsc --init

# Install LangChain
npm install langchain

# Install LangChain integrations
npm install @langchain/openai @langchain/anthropic

# Install vector stores
npm install chromadb

# Install additional tools
npm install dotenv pdf-parse

# Install dev dependencies
npm install -D @types/node nodemon
```

## Project Structure

```
langchain-typescript/
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── chains/
│   │   ├── simpleChain.ts
│   │   ├── ragChain.ts
│   │   └── agentChain.ts
│   ├── prompts/
│   │   └── templates.ts
│   ├── tools/
│   │   └── customTools.ts
│   ├── memory/
│   │   └── chatMemory.ts
│   └── index.ts
├── data/
│   └── documents/
├── tests/
│   └── chains.test.ts
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

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  }
}
```

## 1. Basic LLM Usage

### Simple LLM Call

```typescript
// src/basic/simpleLLM.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import * as dotenv from "dotenv";

dotenv.config();

async function basicLLMExample() {
  // Using OpenAI
  const openai = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.invoke("What is LangChain?");
  console.log("OpenAI Response:", response.content);

  // Using Anthropic Claude
  const claude = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const claudeResponse = await claude.invoke("What is LangChain?");
  console.log("Claude Response:", claudeResponse.content);
}

basicLLMExample();
```

### Streaming Responses

```typescript
// src/basic/streaming.ts
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

async function streamingExample() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
    streaming: true,
  });

  const stream = await llm.stream("Write a haiku about coding");

  for await (const chunk of stream) {
    process.stdout.write(chunk.content);
  }
  console.log("\n");
}

streamingExample();
```

## 2. Prompt Templates

### Basic Prompt Template

```typescript
// src/prompts/templates.ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";

dotenv.config();

async function promptTemplateExample() {
  // Simple prompt template
  const template = `You are a helpful assistant.

User question: {question}

Please provide a clear and concise answer.`;

  const prompt = PromptTemplate.fromTemplate(template);

  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
  });

  // Create chain using LCEL
  const chain = prompt.pipe(llm);

  const response = await chain.invoke({
    question: "What is machine learning?",
  });

  console.log(response.content);
}

async function chatPromptExample() {
  const systemTemplate = "You are a {role} who {style}.";
  const humanTemplate = "{userInput}";

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["human", humanTemplate],
  ]);

  const llm = new ChatOpenAI({ modelName: "gpt-4" });
  const chain = chatPrompt.pipe(llm);

  const response = await chain.invoke({
    role: "TypeScript expert",
    style: "explains concepts with code examples",
    userInput: "How do generics work?",
  });

  console.log(response.content);
}

// Run examples
(async () => {
  await promptTemplateExample();
  console.log("\n" + "=".repeat(50) + "\n");
  await chatPromptExample();
})();
```

### Few-Shot Prompting

```typescript
// src/prompts/fewShot.ts
import { ChatOpenAI } from "@langchain/openai";
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

async function fewShotExample() {
  // Example dataset
  const examples = [
    { input: "happy", output: "sad" },
    { input: "tall", output: "short" },
    { input: "hot", output: "cold" },
  ];

  // Example template
  const exampleTemplate = `
Input: {input}
Output: {output}`;

  const examplePrompt = PromptTemplate.fromTemplate(exampleTemplate);

  // Few-shot prompt
  const fewShotPrompt = new FewShotPromptTemplate({
    examples,
    examplePrompt,
    prefix: "Give the antonym of every input\n",
    suffix: "Input: {adjective}\nOutput:",
    inputVariables: ["adjective"],
  });

  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  const chain = fewShotPrompt.pipe(llm);

  const result = await chain.invoke({ adjective: "big" });
  console.log(result.content);
}

fewShotExample();
```

## 3. Chains

### Simple Chain

```typescript
// src/chains/simpleChain.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function simpleChain() {
  const prompt = ChatPromptTemplate.fromTemplate(
    "Tell me a {adjective} joke about {topic}"
  );

  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.9,
  });

  const outputParser = new StringOutputParser();

  // LCEL (LangChain Expression Language)
  const chain = prompt.pipe(llm).pipe(outputParser);

  const result = await chain.invoke({
    adjective: "funny",
    topic: "programming",
  });

  console.log(result);
}

simpleChain();
```

### Sequential Chain

```typescript
// src/chains/sequentialChain.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function sequentialChain() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
  });

  const outputParser = new StringOutputParser();

  // Step 1: Generate a topic
  const topicPrompt = ChatPromptTemplate.fromTemplate(
    "Generate a random topic about: {subject}"
  );
  const topicChain = topicPrompt.pipe(llm).pipe(outputParser);

  // Step 2: Write about the topic
  const writingPrompt = ChatPromptTemplate.fromTemplate(
    "Write a short paragraph about: {topic}"
  );
  const writingChain = writingPrompt.pipe(llm).pipe(outputParser);

  // Step 3: Summarize
  const summaryPrompt = ChatPromptTemplate.fromTemplate(
    "Summarize this in one sentence: {paragraph}"
  );
  const summaryChain = summaryPrompt.pipe(llm).pipe(outputParser);

  // Execute pipeline
  const topic = await topicChain.invoke({ subject: "technology" });
  const paragraph = await writingChain.invoke({ topic });
  const summary = await summaryChain.invoke({ paragraph });

  console.log(`Topic: ${topic}`);
  console.log(`\nParagraph: ${paragraph}`);
  console.log(`\nSummary: ${summary}`);
}

sequentialChain();
```

## 4. RAG (Retrieval Augmented Generation)

### Document Loading and Splitting

```typescript
// src/rag/documentLoader.ts
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

async function loadDocuments() {
  // Load PDF
  const pdfLoader = new PDFLoader("data/documents/example.pdf");
  const pdfDocs = await pdfLoader.load();

  // Load text files from directory
  const textLoader = new DirectoryLoader(
    "data/documents/",
    {
      ".txt": (path) => new TextLoader(path),
    }
  );
  const textDocs = await textLoader.load();

  // Combine documents
  const allDocs = [...pdfDocs, ...textDocs];

  // Split documents
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splits = await textSplitter.splitDocuments(allDocs);

  console.log(`Loaded ${allDocs.length} documents`);
  console.log(`Split into ${splits.length} chunks`);

  return splits;
}

loadDocuments();
```

### Vector Store and Retrieval

```typescript
// src/rag/vectorStore.ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "langchain/document";

async function createVectorStore() {
  // Sample documents
  const documents = [
    new Document({
      pageContent: "LangChain is a framework for building LLM applications",
    }),
    new Document({
      pageContent: "Vector stores enable semantic search over documents",
    }),
    new Document({
      pageContent: "RAG combines retrieval with language models",
    }),
    new Document({
      pageContent: "Embeddings represent text as numerical vectors",
    }),
  ];

  // Create embeddings
  const embeddings = new OpenAIEmbeddings();

  // Create vector store
  const vectorStore = await Chroma.fromDocuments(
    documents,
    embeddings,
    {
      collectionName: "langchain_docs",
    }
  );

  // Query vector store
  const results = await vectorStore.similaritySearch("What is LangChain?", 2);

  console.log("Search Results:");
  results.forEach((doc, i) => {
    console.log(`\n${i + 1}. ${doc.pageContent}`);
  });

  return vectorStore;
}

createVectorStore();
```

### Complete RAG Chain

```typescript
// src/chains/ragChain.ts
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { Document } from "langchain/document";

async function ragChain() {
  // Create embeddings
  const embeddings = new OpenAIEmbeddings();

  // Load existing vector store (or create new one)
  const vectorStore = await Chroma.fromExistingCollection(
    embeddings,
    { collectionName: "langchain_docs" }
  );

  // Create retriever
  const retriever = vectorStore.asRetriever({ k: 3 });

  // RAG prompt template
  const template = `Answer the question based only on the following context:

Context: {context}

Question: {question}

Answer:`;

  const prompt = ChatPromptTemplate.fromTemplate(template);
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  const outputParser = new StringOutputParser();

  // Helper function to format documents
  const formatDocs = (docs: Document[]) => {
    return docs.map((doc) => doc.pageContent).join("\n\n");
  };

  // Build RAG chain
  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    outputParser,
  ]);

  // Query the chain
  const question = "What is LangChain used for?";
  const answer = await chain.invoke(question);

  console.log(`Question: ${question}`);
  console.log(`Answer: ${answer}`);
}

ragChain();
```

## 5. Memory

### Conversation Buffer Memory

```typescript
// src/memory/chatMemory.ts
import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

async function conversationWithMemory() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
  });

  const memory = new BufferMemory();

  const conversation = new ConversationChain({
    llm,
    memory,
    verbose: true,
  });

  // Multi-turn conversation
  const response1 = await conversation.call({
    input: "Hi! My name is Alice.",
  });
  console.log(response1.response);
  console.log("\n" + "=".repeat(50) + "\n");

  const response2 = await conversation.call({
    input: "What's 2+2?",
  });
  console.log(response2.response);
  console.log("\n" + "=".repeat(50) + "\n");

  const response3 = await conversation.call({
    input: "What's my name?",
  });
  console.log(response3.response);
}

conversationWithMemory();
```

### Summary Memory

```typescript
// src/memory/summaryMemory.ts
import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

async function conversationWithSummary() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  const memory = new ConversationSummaryMemory({
    llm,
    returnMessages: true,
  });

  const conversation = new ConversationChain({
    llm,
    memory,
    verbose: true,
  });

  // Have a longer conversation
  const responses: string[] = [];

  const r1 = await conversation.call({
    input: "Tell me about TypeScript programming",
  });
  responses.push(r1.response);

  const r2 = await conversation.call({
    input: "What are its main advantages?",
  });
  responses.push(r2.response);

  const r3 = await conversation.call({
    input: "Summarize what we discussed",
  });
  responses.push(r3.response);

  responses.forEach((response, i) => {
    console.log(`\nResponse ${i + 1}: ${response}`);
  });
}

conversationWithSummary();
```

## 6. Agents and Tools

### Built-in Tools

```typescript
// src/agents/toolAgent.ts
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { DynamicTool } from "@langchain/core/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

async function agentWithTools() {
  // Define custom tools
  const calculatorTool = new DynamicTool({
    name: "calculator",
    description: "Useful for calculating square roots. Input should be a number.",
    func: async (input: string) => {
      try {
        return Math.sqrt(parseFloat(input)).toString();
      } catch {
        return "Invalid number";
      }
    },
  });

  const tools = [calculatorTool];

  // Create agent
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant with access to tools."],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  // Use the agent
  const result = await agentExecutor.invoke({
    input: "What is the square root of 144?",
  });

  console.log(`\nResult: ${result.output}`);
}

agentWithTools();
```

### Custom Tools

```typescript
// src/tools/customTools.ts
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

class WeatherTool extends StructuredTool {
  name = "weather";
  description = "Get current weather for a location";
  schema = z.object({
    location: z.string().describe("City name"),
  });

  async _call({ location }: z.infer<typeof this.schema>): Promise<string> {
    // In production, call a real weather API
    return `The weather in ${location} is sunny and 72°F`;
  }
}

// Usage
(async () => {
  const tool = new WeatherTool();
  const result = await tool.invoke({ location: "San Francisco" });
  console.log(result);
})();
```

## 7. Output Parsers

### Structured Output

```typescript
// src/parsers/structuredOutput.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

async function structuredOutputExample() {
  // Define schema using Zod
  const recipeSchema = z.object({
    name: z.string().describe("Recipe name"),
    ingredients: z.array(z.string()).describe("List of ingredients"),
    instructions: z.array(z.string()).describe("Cooking instructions"),
    prepTime: z.number().describe("Prep time in minutes"),
  });

  // Create parser
  const parser = StructuredOutputParser.fromZodSchema(recipeSchema);

  // Create prompt
  const prompt = ChatPromptTemplate.fromTemplate(
    `Generate a recipe for {dish}.

{formatInstructions}`
  );

  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
  });

  // Build chain
  const chain = prompt.pipe(llm).pipe(parser);

  // Get structured output
  const recipe = await chain.invoke({
    dish: "chocolate chip cookies",
    formatInstructions: parser.getFormatInstructions(),
  });

  console.log(`Recipe: ${recipe.name}`);
  console.log(`Prep Time: ${recipe.prepTime} minutes`);
  console.log(`\nIngredients:`);
  recipe.ingredients.forEach((ingredient) => {
    console.log(`  - ${ingredient}`);
  });
  console.log(`\nInstructions:`);
  recipe.instructions.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
}

structuredOutputExample();
```

## 8. Complete Application Example

```typescript
// src/index.ts
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { Document } from "langchain/document";
import * as dotenv from "dotenv";

dotenv.config();

class LangChainApp {
  private llm: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private memory: BufferMemory;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.embeddings = new OpenAIEmbeddings();
    this.memory = new BufferMemory();
  }

  async simpleChat(message: string): Promise<string> {
    const response = await this.llm.invoke(message);
    return response.content as string;
  }

  async chatWithMemory(message: string): Promise<string> {
    const conversation = new ConversationChain({
      llm: this.llm,
      memory: this.memory,
    });

    const response = await conversation.call({ input: message });
    return response.response;
  }

  async ragQuery(question: string, vectorStorePath: string): Promise<string> {
    const vectorStore = await Chroma.fromExistingCollection(
      this.embeddings,
      { collectionName: vectorStorePath }
    );

    const retriever = vectorStore.asRetriever({ k: 3 });

    const template = `Answer based on this context:

{context}

Question: {question}
Answer:`;

    const prompt = ChatPromptTemplate.fromTemplate(template);
    const outputParser = new StringOutputParser();

    const formatDocs = (docs: Document[]) => {
      return docs.map((doc) => doc.pageContent).join("\n\n");
    };

    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocs),
        question: new RunnablePassthrough(),
      },
      prompt,
      this.llm,
      outputParser,
    ]);

    return chain.invoke(question);
  }
}

async function main() {
  const app = new LangChainApp();

  // Simple chat
  console.log("Simple Chat:");
  const response = await app.simpleChat("What is LangChain?");
  console.log(response);
  console.log("\n" + "=".repeat(50) + "\n");

  // Chat with memory
  console.log("Chat with Memory:");
  const r1 = await app.chatWithMemory("My favorite color is blue");
  console.log(r1);
  const r2 = await app.chatWithMemory("What's my favorite color?");
  console.log(r2);
}

main();
```

## 9. Testing

```typescript
// tests/chains.test.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

describe("LangChain Tests", () => {
  test("simple chain", async () => {
    const prompt = ChatPromptTemplate.fromTemplate("Say 'hello'");
    const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
    const parser = new StringOutputParser();

    const chain = prompt.pipe(llm).pipe(parser);
    const result = await chain.invoke({});

    expect(result.toLowerCase()).toContain("hello");
  });

  test("prompt formatting", async () => {
    const prompt = ChatPromptTemplate.fromTemplate("Hello {name}");
    const formatted = await prompt.format({ name: "Alice" });

    expect(formatted).toContain("Alice");
  });
});
```

## Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LANGSMITH_API_KEY=...  # Optional, for monitoring
LANGSMITH_TRACING=true  # Optional
```

## Best Practices

1. **Use TypeScript**: Leverage type safety for better code quality
2. **LCEL**: Use LangChain Expression Language for composable chains
3. **Error Handling**: Implement try-catch for async operations
4. **Cost Monitoring**: Track token usage and API costs
5. **Async/Await**: Use proper async patterns
6. **Type Definitions**: Define interfaces for your data
7. **Environment Variables**: Use dotenv for configuration
8. **Testing**: Write unit tests for chains and components

## Common Pitfalls

- **Token Limits**: Monitor context window sizes
- **Rate Limits**: Implement exponential backoff
- **Memory Management**: Clear conversation memory periodically
- **Type Assertions**: Use proper type guards
- **Async Errors**: Always handle promise rejections

## Next Steps

1. Explore LangGraph for complex agent workflows
2. Integrate LangSmith for production monitoring
3. Build custom tools and chains
4. Deploy to production with proper error handling
5. Optimize for cost and latency
