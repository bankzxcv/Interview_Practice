# LangSmith with Python

Complete guide to integrating LangSmith observability and evaluation into Python applications.

## Why LangSmith for Python?

- **Automatic Tracing**: Zero-config tracing for LangChain apps
- **Deep Integration**: Native support for Python ecosystem
- **Evaluation Tools**: Comprehensive testing framework
- **Production Ready**: Monitor live applications
- **Rich SDK**: Full-featured Python client

## Prerequisites

```bash
# Install Python 3.9+
python3 --version

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

## Installation

```bash
# Install LangSmith
pip install langsmith

# Install LangChain (for integration)
pip install langchain langchain-openai langchain-anthropic

# Install additional tools
pip install python-dotenv

# Create requirements.txt
pip freeze > requirements.txt
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

## 1. Basic Tracing

### Automatic Tracing with LangChain

```python
# app/tracing/basic_tracing.py
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

load_dotenv()

# Enable tracing (automatically enabled when env vars are set)
def basic_tracing_example():
    """Basic LangChain tracing"""

    # Create a simple chain
    prompt = ChatPromptTemplate.from_template("Tell me a joke about {topic}")
    llm = ChatOpenAI(model="gpt-4", temperature=0.7)
    output_parser = StrOutputParser()

    chain = prompt | llm | output_parser

    # This run will automatically be traced
    result = chain.invoke({"topic": "programming"})

    print(result)
    print("\n✅ Check LangSmith dashboard to see the trace!")

if __name__ == "__main__":
    basic_tracing_example()
```

### Manual Tracing with LangSmith Client

```python
# app/tracing/manual_tracing.py
from langsmith import Client
from langsmith.run_trees import RunTree
from datetime import datetime

client = Client()

def manual_tracing_example():
    """Manual tracing for custom code"""

    # Create a parent run
    parent_run = RunTree(
        name="custom_workflow",
        run_type="chain",
        inputs={"user_query": "What is AI?"},
        project_name="my-project"
    )

    # Start the run
    parent_run.post()

    # Simulate some work
    try:
        # Child run 1
        child_run_1 = parent_run.create_child(
            name="data_retrieval",
            run_type="retriever",
            inputs={"query": "AI definition"}
        )
        child_run_1.post()

        # Simulate retrieval
        retrieved_data = "AI is the simulation of human intelligence..."
        child_run_1.end(outputs={"documents": [retrieved_data]})
        child_run_1.patch()

        # Child run 2
        child_run_2 = parent_run.create_child(
            name="llm_generation",
            run_type="llm",
            inputs={"context": retrieved_data}
        )
        child_run_2.post()

        # Simulate LLM call
        result = "Artificial Intelligence (AI) refers to..."
        child_run_2.end(outputs={"response": result})
        child_run_2.patch()

        # End parent run
        parent_run.end(outputs={"final_answer": result})
        parent_run.patch()

        print(f"✅ Trace created: {parent_run.trace_url}")

    except Exception as e:
        parent_run.end(error=str(e))
        parent_run.patch()
        raise

if __name__ == "__main__":
    manual_tracing_example()
```

## 2. Adding Metadata and Tags

### Enhanced Tracing

```python
# app/tracing/metadata_tracing.py
from langsmith import traceable
from langchain_openai import ChatOpenAI
import os

@traceable(
    run_type="llm",
    name="chat_with_metadata",
    tags=["production", "customer-support"],
    metadata={"version": "1.0.0", "model": "gpt-4"}
)
def chat_with_metadata(message: str, user_id: str):
    """Function with custom metadata"""
    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke(message)

    return {
        "response": response.content,
        "user_id": user_id
    }

# Usage
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    result = chat_with_metadata(
        "What are your business hours?",
        user_id="user-123"
    )

    print(result)
```

### Context Manager for Tracing

```python
# app/tracing/context_tracing.py
from langsmith import trace
from langchain_openai import ChatOpenAI

def process_query(query: str):
    """Process a user query with traced steps"""

    with trace(
        name="query_processing",
        run_type="chain",
        inputs={"query": query},
        tags=["processing"],
    ) as run:
        # Step 1: Validate
        with trace(name="validation", run_type="tool") as validation_run:
            is_valid = len(query) > 0
            validation_run.end(outputs={"is_valid": is_valid})

        # Step 2: Generate response
        if is_valid:
            with trace(name="generation", run_type="llm") as gen_run:
                llm = ChatOpenAI(model="gpt-4")
                response = llm.invoke(query)
                gen_run.end(outputs={"response": response.content})
                result = response.content
        else:
            result = "Invalid query"

        run.end(outputs={"result": result})
        return result

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    result = process_query("What is machine learning?")
    print(result)
```

## 3. Datasets and Evaluation

### Creating Datasets

```python
# app/evaluation/create_dataset.py
from langsmith import Client
import uuid

client = Client()

def create_evaluation_dataset():
    """Create a dataset for testing"""

    # Create dataset
    dataset_name = "qa-evaluation-" + str(uuid.uuid4())[:8]
    dataset = client.create_dataset(
        dataset_name=dataset_name,
        description="Q&A evaluation dataset"
    )

    # Add examples
    examples = [
        {
            "inputs": {"question": "What is Python?"},
            "outputs": {"answer": "Python is a high-level programming language known for its simplicity and readability."}
        },
        {
            "inputs": {"question": "What is machine learning?"},
            "outputs": {"answer": "Machine learning is a subset of AI that enables systems to learn from data."}
        },
        {
            "inputs": {"question": "What is a neural network?"},
            "outputs": {"answer": "A neural network is a computing system inspired by biological neural networks."}
        },
    ]

    for example in examples:
        client.create_example(
            inputs=example["inputs"],
            outputs=example["outputs"],
            dataset_id=dataset.id
        )

    print(f"✅ Created dataset: {dataset_name}")
    print(f"   Dataset ID: {dataset.id}")
    print(f"   Examples: {len(examples)}")

    return dataset_name

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    create_evaluation_dataset()
```

### Running Evaluations

```python
# app/evaluation/run_evaluation.py
from langsmith import Client
from langsmith.evaluation import evaluate
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

client = Client()

def qa_chain(inputs: dict) -> dict:
    """QA chain to evaluate"""
    prompt = ChatPromptTemplate.from_template(
        "Answer the following question concisely: {question}"
    )
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    output_parser = StrOutputParser()

    chain = prompt | llm | output_parser

    answer = chain.invoke({"question": inputs["question"]})
    return {"answer": answer}

def run_evaluation(dataset_name: str):
    """Run evaluation on dataset"""

    # Define custom evaluator
    def check_answer_length(run, example):
        """Check if answer is not too short or too long"""
        answer = run.outputs.get("answer", "")
        length = len(answer)

        # Good length: 50-500 characters
        if 50 <= length <= 500:
            score = 1.0
        elif length < 50:
            score = 0.5
        else:
            score = 0.7

        return {
            "key": "answer_length",
            "score": score,
            "comment": f"Answer length: {length} characters"
        }

    # Run evaluation
    results = evaluate(
        qa_chain,
        data=dataset_name,
        evaluators=[check_answer_length],
        experiment_prefix="qa-eval",
        description="Testing QA chain performance"
    )

    print(f"✅ Evaluation complete!")
    print(f"   Results: {results}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    # Use dataset created earlier
    dataset_name = "qa-evaluation-xxxxx"  # Replace with your dataset name
    run_evaluation(dataset_name)
```

### Built-in Evaluators

```python
# app/evaluation/builtin_evaluators.py
from langsmith.evaluation import evaluate
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langsmith.schemas import Run, Example

def qa_chain(inputs: dict) -> dict:
    """Simple QA chain"""
    prompt = ChatPromptTemplate.from_template("Answer: {question}")
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    chain = prompt | llm

    response = chain.invoke({"question": inputs["question"]})
    return {"answer": response.content}

def run_evaluation_with_builtin():
    """Use built-in evaluators"""
    from langchain.evaluation import load_evaluator

    # Correctness evaluator (requires reference answer)
    def correctness_evaluator(run: Run, example: Example):
        evaluator = load_evaluator("labeled_criteria", criteria="correctness")
        result = evaluator.evaluate_strings(
            prediction=run.outputs["answer"],
            reference=example.outputs["answer"],
            input=example.inputs["question"]
        )
        return {
            "key": "correctness",
            "score": 1.0 if result["value"] == "Y" else 0.0
        }

    # Relevance evaluator
    def relevance_evaluator(run: Run, example: Example):
        evaluator = load_evaluator("criteria", criteria="relevance")
        result = evaluator.evaluate_strings(
            prediction=run.outputs["answer"],
            input=example.inputs["question"]
        )
        return {
            "key": "relevance",
            "score": 1.0 if result["value"] == "Y" else 0.0
        }

    # Run evaluation
    results = evaluate(
        qa_chain,
        data="your-dataset-name",
        evaluators=[correctness_evaluator, relevance_evaluator],
        experiment_prefix="builtin-eval"
    )

    print(results)

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    run_evaluation_with_builtin()
```

## 4. Feedback and Annotations

### Adding Feedback

```python
# app/feedback/add_feedback.py
from langsmith import Client
import uuid

client = Client()

def add_feedback_to_run():
    """Add feedback to a specific run"""

    # Get a run by ID (you'll get this from the dashboard)
    run_id = "your-run-id-here"  # Replace with actual run ID

    # Add positive feedback
    client.create_feedback(
        run_id=run_id,
        key="user-rating",
        score=1.0,
        comment="Great response!"
    )

    print(f"✅ Feedback added to run {run_id}")

def capture_user_feedback():
    """Capture and store user feedback"""

    # Simulate a run
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke("What is AI?")

    # Get run ID from context (available in callbacks)
    # In production, you'd capture this from the actual run
    run_id = str(uuid.uuid4())

    # User provides feedback
    user_rating = 5  # 1-5 scale
    user_comment = "Very helpful answer"

    # Store in LangSmith
    client.create_feedback(
        run_id=run_id,
        key="user_rating",
        score=user_rating / 5.0,  # Normalize to 0-1
        comment=user_comment
    )

    print(f"✅ User feedback captured")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    capture_user_feedback()
```

## 5. Production Monitoring

### Error Tracking

```python
# app/monitoring/error_tracking.py
from langsmith import traceable
from langchain_openai import ChatOpenAI
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@traceable(run_type="chain", tags=["production"])
def production_chain(query: str):
    """Production chain with error handling"""
    try:
        llm = ChatOpenAI(model="gpt-4", temperature=0)
        response = llm.invoke(query)
        return {"status": "success", "response": response.content}

    except Exception as e:
        logger.error(f"Error in production chain: {str(e)}")
        # Error is automatically captured in trace
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    # Success case
    result = production_chain("What is AI?")
    print(result)

    # Error case (invalid API key scenario)
    # result = production_chain("trigger error")
```

### Cost Tracking

```python
# app/monitoring/cost_tracking.py
from langsmith import Client
from langchain_openai import ChatOpenAI
from langchain.callbacks import get_openai_callback

client = Client()

def track_costs():
    """Track token usage and costs"""

    with get_openai_callback() as cb:
        llm = ChatOpenAI(model="gpt-4")

        # Make several calls
        for i in range(3):
            llm.invoke(f"Tell me fact number {i} about Python")

        # Print cost information
        print(f"Total Tokens: {cb.total_tokens}")
        print(f"Prompt Tokens: {cb.prompt_tokens}")
        print(f"Completion Tokens: {cb.completion_tokens}")
        print(f"Total Cost (USD): ${cb.total_cost:.4f}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    track_costs()
```

## 6. A/B Testing

### Compare Prompts

```python
# app/experiments/ab_testing.py
from langsmith import Client
from langsmith.evaluation import evaluate
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

client = Client()

# Version A: Simple prompt
def qa_chain_v1(inputs: dict) -> dict:
    prompt = ChatPromptTemplate.from_template(
        "Answer: {question}"
    )
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    chain = prompt | llm
    response = chain.invoke(inputs)
    return {"answer": response.content}

# Version B: Detailed prompt
def qa_chain_v2(inputs: dict) -> dict:
    prompt = ChatPromptTemplate.from_template(
        "You are a helpful assistant. Answer the following question "
        "in a clear and concise way: {question}"
    )
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    chain = prompt | llm
    response = chain.invoke(inputs)
    return {"answer": response.content}

def run_ab_test(dataset_name: str):
    """Run A/B test comparing two versions"""

    # Evaluator
    def answer_quality(run, example):
        return {
            "key": "quality",
            "score": len(run.outputs["answer"]) > 50  # Simple metric
        }

    # Test version A
    print("Testing Version A...")
    results_a = evaluate(
        qa_chain_v1,
        data=dataset_name,
        evaluators=[answer_quality],
        experiment_prefix="prompt-v1"
    )

    # Test version B
    print("Testing Version B...")
    results_b = evaluate(
        qa_chain_v2,
        data=dataset_name,
        evaluators=[answer_quality],
        experiment_prefix="prompt-v2"
    )

    print(f"\n✅ A/B Test Complete!")
    print(f"Version A: {results_a}")
    print(f"Version B: {results_b}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    dataset_name = "your-dataset-name"
    run_ab_test(dataset_name)
```

## 7. Complete Production Example

```python
# main.py
import os
from dotenv import load_dotenv
from langsmith import Client, traceable
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionRAGApp:
    """Production RAG application with LangSmith monitoring"""

    def __init__(self):
        self.client = Client()
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
        self.embeddings = OpenAIEmbeddings()

    @traceable(
        run_type="chain",
        tags=["production", "rag"],
        name="rag_query"
    )
    def query(self, question: str, user_id: str = None) -> dict:
        """Query with full tracing and monitoring"""

        try:
            # Load vector store (traced automatically)
            vectorstore = Chroma(
                persist_directory="./chroma_db",
                embedding_function=self.embeddings
            )

            retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

            # RAG prompt
            template = """Answer based on this context:

{context}

Question: {question}
Answer:"""

            prompt = ChatPromptTemplate.from_template(template)

            def format_docs(docs):
                return "\n\n".join(doc.page_content for doc in docs)

            # Build chain
            chain = (
                {"context": retriever | format_docs, "question": RunnablePassthrough()}
                | prompt
                | self.llm
                | StrOutputParser()
            )

            # Execute (fully traced)
            answer = chain.invoke(question)

            # Log success
            logger.info(f"Query successful for user: {user_id}")

            return {
                "status": "success",
                "answer": answer,
                "user_id": user_id
            }

        except Exception as e:
            # Error is automatically captured in trace
            logger.error(f"Query failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "user_id": user_id
            }

    def add_user_feedback(self, run_id: str, rating: int, comment: str = None):
        """Add user feedback to a run"""
        try:
            self.client.create_feedback(
                run_id=run_id,
                key="user_rating",
                score=rating / 5.0,
                comment=comment
            )
            logger.info(f"Feedback added: {rating}/5")
        except Exception as e:
            logger.error(f"Failed to add feedback: {str(e)}")

def main():
    """Main application"""
    app = ProductionRAGApp()

    # Example query
    result = app.query(
        "What is LangChain?",
        user_id="user-123"
    )

    print(f"Status: {result['status']}")
    if result['status'] == 'success':
        print(f"Answer: {result['answer']}")

    print("\n✅ Check LangSmith dashboard for traces!")

if __name__ == "__main__":
    main()
```

## 8. Best Practices

### Project Organization

```python
# app/config/langsmith_config.py
import os

class LangSmithConfig:
    """LangSmith configuration"""

    @staticmethod
    def setup_environment(environment: str = "development"):
        """Setup environment-specific configuration"""

        configs = {
            "development": {
                "project": "my-app-dev",
                "tracing": "true"
            },
            "staging": {
                "project": "my-app-staging",
                "tracing": "true"
            },
            "production": {
                "project": "my-app-prod",
                "tracing": "true"
            }
        }

        config = configs.get(environment, configs["development"])

        os.environ["LANGCHAIN_PROJECT"] = config["project"]
        os.environ["LANGCHAIN_TRACING_V2"] = config["tracing"]

        print(f"✅ LangSmith configured for {environment}")

# Usage
if __name__ == "__main__":
    LangSmithConfig.setup_environment("production")
```

## 9. Testing

```python
# tests/test_with_langsmith.py
import pytest
from langsmith import Client
from app.main import ProductionRAGApp

client = Client()

@pytest.fixture
def app():
    return ProductionRAGApp()

def test_query_success(app):
    """Test successful query"""
    result = app.query("What is Python?", user_id="test-user")

    assert result["status"] == "success"
    assert "answer" in result
    assert len(result["answer"]) > 0

def test_query_with_tracing(app):
    """Test that tracing is working"""
    result = app.query("Test question", user_id="test-user")

    # Verify trace exists (in practice, you'd query LangSmith API)
    assert result is not None
```

## Best Practices Summary

1. **Use Environment Variables**: Keep API keys secure
2. **Organize by Project**: Separate dev/staging/prod
3. **Add Rich Metadata**: Include user IDs, versions, tags
4. **Create Datasets**: Build comprehensive test suites
5. **Custom Evaluators**: Define domain-specific metrics
6. **Monitor Costs**: Track token usage and expenses
7. **Capture Feedback**: Collect user ratings and comments
8. **Error Handling**: Ensure errors are traced
9. **A/B Testing**: Compare different approaches
10. **Team Collaboration**: Share traces and insights

## Next Steps

1. Integrate LangSmith into your application
2. Create evaluation datasets
3. Set up custom evaluators
4. Monitor production performance
5. Iterate based on insights
6. Build feedback loops
7. Optimize costs and quality
