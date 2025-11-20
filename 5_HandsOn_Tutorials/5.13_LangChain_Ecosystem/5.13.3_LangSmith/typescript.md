# LangSmith with TypeScript

Complete guide to integrating LangSmith observability and evaluation into TypeScript applications.

## Why LangSmith for TypeScript?

- **Type Safety**: Full TypeScript support with type definitions
- **Automatic Tracing**: Zero-config tracing for LangChain.js apps
- **Modern JavaScript**: ES6+ features and async/await
- **Full-stack**: Use same monitoring for frontend and backend
- **Growing Support**: Active TypeScript/JavaScript community

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
mkdir langsmith-typescript
cd langsmith-typescript
npm init -y

# Install TypeScript
npm install -D typescript @types/node ts-node nodemon

# Initialize TypeScript
npx tsc --init

# Install LangSmith
npm install langsmith

# Install LangChain integrations
npm install @langchain/core @langchain/openai @langchain/anthropic

# Install utilities
npm install dotenv
```

## Setup

### Get API Key

1. Sign up at https://smith.langchain.com
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy the key

### Environment Variables

```bash
# .env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=my-project  # Optional: defaults to "default"
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com  # Optional

# LLM API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Project Structure

```
langsmith-typescript/
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── tracing/
│   │   ├── basicTracing.ts
│   │   ├── manualTracing.ts
│   │   └── metadataTracing.ts
│   ├── evaluation/
│   │   ├── createDataset.ts
│   │   ├── runEvaluation.ts
│   │   └── evaluators.ts
│   ├── monitoring/
│   │   ├── errorTracking.ts
│   │   └── costTracking.ts
│   └── index.ts
├── tests/
│   └── langsmith.test.ts
├── .env
├── package.json
└── tsconfig.json
```

## 1. Basic Tracing

### Automatic Tracing with LangChain

```typescript
// src/tracing/basicTracing.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";

dotenv.config();

async function basicTracingExample() {
  // Create a simple chain
  const prompt = ChatPromptTemplate.fromTemplate("Tell me a joke about {topic}");
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0.7 });
  const outputParser = new StringOutputParser();

  const chain = prompt.pipe(llm).pipe(outputParser);

  // This run will automatically be traced
  const result = await chain.invoke({ topic: "programming" });

  console.log(result);
  console.log("\n✅ Check LangSmith dashboard to see the trace!");
}

basicTracingExample();
```

### Manual Tracing with LangSmith Client

```typescript
// src/tracing/manualTracing.ts
import { Client } from "langsmith";
import { RunTree } from "langsmith";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client();

async function manualTracingExample() {
  // Create a parent run
  const parentRun = new RunTree({
    name: "custom_workflow",
    run_type: "chain",
    inputs: { user_query: "What is AI?" },
    project_name: "my-project",
  });

  await parentRun.postRun();

  try {
    // Child run 1
    const childRun1 = await parentRun.createChild({
      name: "data_retrieval",
      run_type: "retriever",
      inputs: { query: "AI definition" },
    });
    await childRun1.postRun();

    // Simulate retrieval
    const retrievedData = "AI is the simulation of human intelligence...";
    childRun1.end({ documents: [retrievedData] });
    await childRun1.patchRun();

    // Child run 2
    const childRun2 = await parentRun.createChild({
      name: "llm_generation",
      run_type: "llm",
      inputs: { context: retrievedData },
    });
    await childRun2.postRun();

    // Simulate LLM call
    const result = "Artificial Intelligence (AI) refers to...";
    childRun2.end({ response: result });
    await childRun2.patchRun();

    // End parent run
    parentRun.end({ final_answer: result });
    await parentRun.patchRun();

    console.log(`✅ Trace created: ${parentRun.trace_url}`);
  } catch (error) {
    parentRun.end({ error: String(error) });
    await parentRun.patchRun();
    throw error;
  }
}

manualTracingExample();
```

## 2. Adding Metadata and Tags

### Enhanced Tracing

```typescript
// src/tracing/metadataTracing.ts
import { traceable } from "langsmith/traceable";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

const chatWithMetadata = traceable(
  async (message: string, userId: string) => {
    const llm = new ChatOpenAI({ modelName: "gpt-4" });
    const response = await llm.invoke(message);

    return {
      response: response.content,
      userId,
    };
  },
  {
    name: "chat_with_metadata",
    run_type: "llm",
    tags: ["production", "customer-support"],
    metadata: { version: "1.0.0", model: "gpt-4" },
  }
);

// Usage
async function main() {
  const result = await chatWithMetadata(
    "What are your business hours?",
    "user-123"
  );

  console.log(result);
}

main();
```

### Wrapper for Tracing

```typescript
// src/tracing/wrapperTracing.ts
import { wrapOpenAI } from "langsmith/wrappers";
import { OpenAI } from "openai";
import * as dotenv from "dotenv";

dotenv.config();

async function wrappedOpenAI() {
  // Wrap OpenAI client for automatic tracing
  const client = wrapOpenAI(new OpenAI());

  const completion = await client.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: "Hello!" }],
  });

  console.log(completion.choices[0].message.content);
  console.log("✅ Traced automatically!");
}

wrappedOpenAI();
```

## 3. Datasets and Evaluation

### Creating Datasets

```typescript
// src/evaluation/createDataset.ts
import { Client } from "langsmith";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client();

async function createEvaluationDataset() {
  // Create dataset
  const datasetName = `qa-evaluation-${uuidv4().slice(0, 8)}`;
  const dataset = await client.createDataset(datasetName, {
    description: "Q&A evaluation dataset",
  });

  // Add examples
  const examples = [
    {
      inputs: { question: "What is TypeScript?" },
      outputs: {
        answer:
          "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.",
      },
    },
    {
      inputs: { question: "What is machine learning?" },
      outputs: {
        answer:
          "Machine learning is a subset of AI that enables systems to learn from data.",
      },
    },
    {
      inputs: { question: "What is a neural network?" },
      outputs: {
        answer:
          "A neural network is a computing system inspired by biological neural networks.",
      },
    },
  ];

  for (const example of examples) {
    await client.createExample(example.inputs, example.outputs, {
      datasetId: dataset.id,
    });
  }

  console.log(`✅ Created dataset: ${datasetName}`);
  console.log(`   Dataset ID: ${dataset.id}`);
  console.log(`   Examples: ${examples.length}`);

  return datasetName;
}

createEvaluationDataset();
```

### Running Evaluations

```typescript
// src/evaluation/runEvaluation.ts
import { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Run, Example } from "langsmith";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client();

async function qaChain(inputs: { question: string }): Promise<{ answer: string }> {
  const prompt = ChatPromptTemplate.fromTemplate(
    "Answer the following question concisely: {question}"
  );
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  const outputParser = new StringOutputParser();

  const chain = prompt.pipe(llm).pipe(outputParser);

  const answer = await chain.invoke({ question: inputs.question });
  return { answer };
}

async function runEvaluation(datasetName: string) {
  // Define custom evaluator
  const checkAnswerLength = (run: Run, example: Example) => {
    const answer = (run.outputs?.answer as string) || "";
    const length = answer.length;

    // Good length: 50-500 characters
    let score: number;
    if (length >= 50 && length <= 500) {
      score = 1.0;
    } else if (length < 50) {
      score = 0.5;
    } else {
      score = 0.7;
    }

    return {
      key: "answer_length",
      score,
      comment: `Answer length: ${length} characters`,
    };
  };

  // Run evaluation
  const results = await evaluate(qaChain, {
    data: datasetName,
    evaluators: [checkAnswerLength],
    experimentPrefix: "qa-eval",
    description: "Testing QA chain performance",
  });

  console.log("✅ Evaluation complete!");
  console.log("   Results:", results);
}

// Usage
async function main() {
  const datasetName = "qa-evaluation-xxxxx"; // Replace with your dataset name
  await runEvaluation(datasetName);
}

main();
```

### Custom Evaluators

```typescript
// src/evaluation/evaluators.ts
import { Run, Example } from "langsmith";

export interface EvaluationResult {
  key: string;
  score: number;
  comment?: string;
}

export const answerLengthEvaluator = (
  run: Run,
  example: Example
): EvaluationResult => {
  const answer = (run.outputs?.answer as string) || "";
  const length = answer.length;

  let score: number;
  if (length >= 50 && length <= 500) {
    score = 1.0;
  } else if (length < 50) {
    score = 0.5;
  } else {
    score = 0.7;
  }

  return {
    key: "answer_length",
    score,
    comment: `Answer length: ${length} characters`,
  };
};

export const answerRelevanceEvaluator = (
  run: Run,
  example: Example
): EvaluationResult => {
  const answer = (run.outputs?.answer as string) || "";
  const question = (example.inputs?.question as string) || "";

  // Simple relevance check (in production, use LLM-based evaluator)
  const hasKeywords = question
    .toLowerCase()
    .split(" ")
    .some((word) => answer.toLowerCase().includes(word));

  return {
    key: "relevance",
    score: hasKeywords ? 1.0 : 0.0,
    comment: hasKeywords ? "Answer seems relevant" : "Answer may not be relevant",
  };
};

export const answerCompletenessEvaluator = (
  run: Run,
  example: Example
): EvaluationResult => {
  const answer = (run.outputs?.answer as string) || "";
  const expectedAnswer = (example.outputs?.answer as string) || "";

  // Check if answer covers expected content
  const expectedWords = expectedAnswer.toLowerCase().split(" ");
  const answerWords = answer.toLowerCase().split(" ");

  const coverage = expectedWords.filter((word) =>
    answerWords.includes(word)
  ).length;
  const score = coverage / expectedWords.length;

  return {
    key: "completeness",
    score,
    comment: `Coverage: ${(score * 100).toFixed(0)}%`,
  };
};
```

## 4. Feedback and Annotations

### Adding Feedback

```typescript
// src/monitoring/feedback.ts
import { Client } from "langsmith";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client();

async function addFeedbackToRun() {
  // Get a run by ID (you'll get this from the dashboard)
  const runId = "your-run-id-here"; // Replace with actual run ID

  // Add positive feedback
  await client.createFeedback(runId, "user-rating", {
    score: 1.0,
    comment: "Great response!",
  });

  console.log(`✅ Feedback added to run ${runId}`);
}

async function captureUserFeedback() {
  // Simulate a run
  const runId = "some-run-id"; // In production, capture from actual run

  // User provides feedback
  const userRating = 5; // 1-5 scale
  const userComment = "Very helpful answer";

  // Store in LangSmith
  await client.createFeedback(runId, "user_rating", {
    score: userRating / 5.0, // Normalize to 0-1
    comment: userComment,
  });

  console.log("✅ User feedback captured");
}

captureUserFeedback();
```

## 5. Production Monitoring

### Error Tracking

```typescript
// src/monitoring/errorTracking.ts
import { traceable } from "langsmith/traceable";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

const productionChain = traceable(
  async (query: string) => {
    try {
      const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
      const response = await llm.invoke(query);

      return {
        status: "success",
        response: response.content,
      };
    } catch (error) {
      console.error(`Error in production chain: ${error}`);
      // Error is automatically captured in trace
      return {
        status: "error",
        error: String(error),
      };
    }
  },
  { run_type: "chain", tags: ["production"] }
);

async function main() {
  // Success case
  const result = await productionChain("What is AI?");
  console.log(result);
}

main();
```

### Cost Tracking

```typescript
// src/monitoring/costTracking.ts
import { ChatOpenAI } from "@langchain/openai";
import { traceable } from "langsmith/traceable";
import * as dotenv from "dotenv";

dotenv.config();

const trackCosts = traceable(
  async () => {
    const llm = new ChatOpenAI({ modelName: "gpt-4" });

    let totalTokens = 0;
    const responses = [];

    // Make several calls
    for (let i = 0; i < 3; i++) {
      const response = await llm.invoke(`Tell me fact number ${i} about TypeScript`);
      responses.push(response);

      // In production, extract token counts from response metadata
      // totalTokens += response.response_metadata?.token_usage?.total_tokens || 0;
    }

    console.log(`Total calls: ${responses.length}`);
    console.log("✅ Check LangSmith dashboard for detailed cost breakdown");
  },
  { name: "cost_tracking", tags: ["monitoring"] }
);

trackCosts();
```

## 6. A/B Testing

### Compare Prompts

```typescript
// src/experiments/abTesting.ts
import { evaluate } from "langsmith/evaluation";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Run, Example } from "langsmith";
import * as dotenv from "dotenv";

dotenv.config();

// Version A: Simple prompt
async function qaChainV1(inputs: { question: string }): Promise<{ answer: string }> {
  const prompt = ChatPromptTemplate.fromTemplate("Answer: {question}");
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  const chain = prompt.pipe(llm);

  const response = await chain.invoke(inputs);
  return { answer: response.content as string };
}

// Version B: Detailed prompt
async function qaChainV2(inputs: { question: string }): Promise<{ answer: string }> {
  const prompt = ChatPromptTemplate.fromTemplate(
    "You are a helpful assistant. Answer the following question " +
      "in a clear and concise way: {question}"
  );
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  const chain = prompt.pipe(llm);

  const response = await chain.invoke(inputs);
  return { answer: response.content as string };
}

async function runABTest(datasetName: string) {
  // Evaluator
  const answerQuality = (run: Run, example: Example) => ({
    key: "quality",
    score: ((run.outputs?.answer as string)?.length || 0) > 50 ? 1 : 0,
  });

  // Test version A
  console.log("Testing Version A...");
  const resultsA = await evaluate(qaChainV1, {
    data: datasetName,
    evaluators: [answerQuality],
    experimentPrefix: "prompt-v1",
  });

  // Test version B
  console.log("Testing Version B...");
  const resultsB = await evaluate(qaChainV2, {
    data: datasetName,
    evaluators: [answerQuality],
    experimentPrefix: "prompt-v2",
  });

  console.log("\n✅ A/B Test Complete!");
  console.log("Version A:", resultsA);
  console.log("Version B:", resultsB);
}

async function main() {
  const datasetName = "your-dataset-name";
  await runABTest(datasetName);
}

main();
```

## 7. Complete Production Example

```typescript
// src/index.ts
import { Client, traceable } from "langsmith";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { Document } from "langchain/document";
import * as dotenv from "dotenv";

dotenv.config();

class ProductionRAGApp {
  private client: Client;
  private llm: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.client = new Client();
    this.llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
    this.embeddings = new OpenAIEmbeddings();
  }

  query = traceable(
    async (question: string, userId?: string) => {
      try {
        // Load vector store
        const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
          collectionName: "langchain_docs",
        });

        const retriever = vectorStore.asRetriever({ k: 3 });

        // RAG prompt
        const template = `Answer based on this context:

{context}

Question: {question}
Answer:`;

        const prompt = ChatPromptTemplate.fromTemplate(template);
        const outputParser = new StringOutputParser();

        const formatDocs = (docs: Document[]) =>
          docs.map((doc) => doc.pageContent).join("\n\n");

        // Build chain
        const chain = RunnableSequence.from([
          {
            context: retriever.pipe(formatDocs),
            question: new RunnablePassthrough(),
          },
          prompt,
          this.llm,
          outputParser,
        ]);

        // Execute (fully traced)
        const answer = await chain.invoke(question);

        console.log(`Query successful for user: ${userId}`);

        return {
          status: "success",
          answer,
          userId,
        };
      } catch (error) {
        console.error(`Query failed: ${error}`);
        return {
          status: "error",
          error: String(error),
          userId,
        };
      }
    },
    {
      run_type: "chain",
      tags: ["production", "rag"],
      name: "rag_query",
    }
  );

  async addUserFeedback(runId: string, rating: number, comment?: string) {
    try {
      await this.client.createFeedback(runId, "user_rating", {
        score: rating / 5.0,
        comment,
      });
      console.log(`Feedback added: ${rating}/5`);
    } catch (error) {
      console.error(`Failed to add feedback: ${error}`);
    }
  }
}

async function main() {
  const app = new ProductionRAGApp();

  // Example query
  const result = await app.query("What is LangChain?", "user-123");

  console.log(`Status: ${result.status}`);
  if (result.status === "success") {
    console.log(`Answer: ${result.answer}`);
  }

  console.log("\n✅ Check LangSmith dashboard for traces!");
}

main();
```

## 8. Best Practices

### Environment Configuration

```typescript
// src/config/langsmithConfig.ts
interface LangSmithEnvironment {
  project: string;
  tracing: string;
}

export class LangSmithConfig {
  static setupEnvironment(environment: "development" | "staging" | "production") {
    const configs: Record<string, LangSmithEnvironment> = {
      development: {
        project: "my-app-dev",
        tracing: "true",
      },
      staging: {
        project: "my-app-staging",
        tracing: "true",
      },
      production: {
        project: "my-app-prod",
        tracing: "true",
      },
    };

    const config = configs[environment] || configs.development;

    process.env.LANGCHAIN_PROJECT = config.project;
    process.env.LANGCHAIN_TRACING_V2 = config.tracing;

    console.log(`✅ LangSmith configured for ${environment}`);
  }
}

// Usage
LangSmithConfig.setupEnvironment("production");
```

## 9. Testing

```typescript
// tests/langsmith.test.ts
import { Client } from "langsmith";
import { ProductionRAGApp } from "../src/index";

const client = new Client();

describe("LangSmith Tests", () => {
  let app: ProductionRAGApp;

  beforeEach(() => {
    app = new ProductionRAGApp();
  });

  test("query success", async () => {
    const result = await app.query("What is TypeScript?", "test-user");

    expect(result.status).toBe("success");
    expect(result.answer).toBeTruthy();
    expect(result.answer.length).toBeGreaterThan(0);
  });

  test("query with tracing", async () => {
    const result = await app.query("Test question", "test-user");

    // Verify trace exists
    expect(result).toBeTruthy();
  });
});
```

## Best Practices Summary

1. **Type Safety**: Use TypeScript types for better code quality
2. **Environment Variables**: Keep API keys secure in .env
3. **Project Organization**: Separate dev/staging/prod environments
4. **Rich Metadata**: Add user IDs, versions, and tags
5. **Dataset Testing**: Build comprehensive test suites
6. **Custom Evaluators**: Define domain-specific metrics
7. **Cost Monitoring**: Track token usage and API costs
8. **Error Handling**: Ensure all errors are traced
9. **Async Patterns**: Use proper async/await throughout
10. **Team Collaboration**: Share traces and insights

## Next Steps

1. Integrate LangSmith into your TypeScript application
2. Create evaluation datasets
3. Set up custom evaluators
4. Monitor production performance
5. Iterate based on insights
6. Build feedback loops
7. Optimize costs and quality
