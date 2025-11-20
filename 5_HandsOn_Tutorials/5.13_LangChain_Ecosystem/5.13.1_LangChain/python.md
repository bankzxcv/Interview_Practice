# LangChain with Python

Complete guide to building LLM applications with LangChain using Python.

## Why Python for LangChain?

- **Native Support**: LangChain originated in Python
- **Rich Ecosystem**: Most ML/AI libraries are Python-first
- **Rapid Development**: Quick prototyping and iteration
- **Community**: Largest LangChain community
- **Data Science**: Integrates with pandas, numpy, scikit-learn

## Prerequisites

```bash
# Install Python 3.9+
python3 --version

# Install pip
pip3 --version

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

## Installation

```bash
# Install LangChain core
pip install langchain

# Install LangChain community packages
pip install langchain-community

# Install OpenAI integration
pip install langchain-openai

# Install Anthropic integration
pip install langchain-anthropic

# Install vector stores
pip install chromadb faiss-cpu

# Install additional tools
pip install pypdf python-dotenv tiktoken

# Create requirements.txt
pip freeze > requirements.txt
```

## Project Structure

```
langchain-python/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── chains/
│   │   ├── __init__.py
│   │   ├── simple_chain.py
│   │   ├── rag_chain.py
│   │   └── agent_chain.py
│   ├── prompts/
│   │   ├── __init__.py
│   │   └── templates.py
│   ├── tools/
│   │   ├── __init__.py
│   │   └── custom_tools.py
│   └── memory/
│       ├── __init__.py
│       └── chat_memory.py
├── data/
│   └── documents/
├── tests/
│   └── test_chains.py
├── .env
├── requirements.txt
└── main.py
```

## 1. Basic LLM Usage

### Simple LLM Call

```python
# app/basic_llm.py
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

load_dotenv()

def basic_llm_example():
    """Basic LLM usage example"""

    # Using OpenAI
    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.7,
        api_key=os.getenv("OPENAI_API_KEY")
    )

    response = llm.invoke("What is LangChain?")
    print(f"OpenAI Response: {response.content}")

    # Using Anthropic Claude
    claude = ChatAnthropic(
        model="claude-3-5-sonnet-20241022",
        temperature=0.7,
        api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    response = claude.invoke("What is LangChain?")
    print(f"Claude Response: {response.content}")

if __name__ == "__main__":
    basic_llm_example()
```

### Streaming Responses

```python
# app/streaming.py
from langchain_openai import ChatOpenAI
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

def streaming_example():
    """Stream LLM responses in real-time"""

    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.7,
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()]
    )

    # Stream the response
    for chunk in llm.stream("Write a haiku about coding"):
        print(chunk.content, end="", flush=True)
    print()

if __name__ == "__main__":
    streaming_example()
```

## 2. Prompt Templates

### Basic Prompt Template

```python
# app/prompts/templates.py
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain_openai import ChatOpenAI

def prompt_template_example():
    """Using prompt templates"""

    # Simple prompt template
    template = """You are a helpful assistant.

    User question: {question}

    Please provide a clear and concise answer.
    """

    prompt = PromptTemplate(
        input_variables=["question"],
        template=template
    )

    llm = ChatOpenAI(model="gpt-4", temperature=0.7)

    # Create chain
    chain = prompt | llm

    response = chain.invoke({"question": "What is machine learning?"})
    print(response.content)

def chat_prompt_example():
    """Using chat prompt templates"""

    system_template = "You are a {role} who {style}."
    human_template = "{user_input}"

    chat_prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("human", human_template)
    ])

    llm = ChatOpenAI(model="gpt-4")
    chain = chat_prompt | llm

    response = chain.invoke({
        "role": "Python expert",
        "style": "explains concepts with code examples",
        "user_input": "How do decorators work?"
    })

    print(response.content)

if __name__ == "__main__":
    prompt_template_example()
    print("\n" + "="*50 + "\n")
    chat_prompt_example()
```

### Few-Shot Prompting

```python
# app/prompts/few_shot.py
from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_openai import ChatOpenAI

def few_shot_example():
    """Few-shot learning with examples"""

    # Example dataset
    examples = [
        {
            "input": "happy",
            "output": "sad"
        },
        {
            "input": "tall",
            "output": "short"
        },
        {
            "input": "hot",
            "output": "cold"
        }
    ]

    # Example template
    example_template = """
    Input: {input}
    Output: {output}
    """

    example_prompt = PromptTemplate(
        input_variables=["input", "output"],
        template=example_template
    )

    # Few-shot prompt
    few_shot_prompt = FewShotPromptTemplate(
        examples=examples,
        example_prompt=example_prompt,
        prefix="Give the antonym of every input\n",
        suffix="Input: {adjective}\nOutput:",
        input_variables=["adjective"]
    )

    llm = ChatOpenAI(model="gpt-4", temperature=0)
    chain = few_shot_prompt | llm

    result = chain.invoke({"adjective": "big"})
    print(result.content)

if __name__ == "__main__":
    few_shot_example()
```

## 3. Chains

### Simple LLM Chain

```python
# app/chains/simple_chain.py
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema.output_parser import StrOutputParser

def simple_chain():
    """Basic chain with prompt, LLM, and parser"""

    prompt = ChatPromptTemplate.from_template(
        "Tell me a {adjective} joke about {topic}"
    )

    llm = ChatOpenAI(model="gpt-4", temperature=0.9)
    output_parser = StrOutputParser()

    # LCEL (LangChain Expression Language)
    chain = prompt | llm | output_parser

    result = chain.invoke({
        "adjective": "funny",
        "topic": "programming"
    })

    print(result)

if __name__ == "__main__":
    simple_chain()
```

### Sequential Chain

```python
# app/chains/sequential_chain.py
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema.runnable import RunnablePassthrough

def sequential_chain():
    """Multi-step chain processing"""

    llm = ChatOpenAI(model="gpt-4", temperature=0.7)

    # Step 1: Generate a topic
    topic_prompt = ChatPromptTemplate.from_template(
        "Generate a random topic about: {subject}"
    )

    # Step 2: Write about the topic
    writing_prompt = ChatPromptTemplate.from_template(
        "Write a short paragraph about: {topic}"
    )

    # Step 3: Summarize the paragraph
    summary_prompt = ChatPromptTemplate.from_template(
        "Summarize this in one sentence: {paragraph}"
    )

    # Build sequential chain
    topic_chain = topic_prompt | llm
    writing_chain = writing_prompt | llm
    summary_chain = summary_prompt | llm

    # Execute pipeline
    topic = topic_chain.invoke({"subject": "technology"})
    paragraph = writing_chain.invoke({"topic": topic.content})
    summary = summary_chain.invoke({"paragraph": paragraph.content})

    print(f"Topic: {topic.content}")
    print(f"\nParagraph: {paragraph.content}")
    print(f"\nSummary: {summary.content}")

if __name__ == "__main__":
    sequential_chain()
```

## 4. RAG (Retrieval Augmented Generation)

### Document Loading and Splitting

```python
# app/rag/document_loader.py
from langchain.document_loaders import (
    PyPDFLoader,
    TextLoader,
    DirectoryLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter

def load_documents():
    """Load and split documents"""

    # Load PDF
    pdf_loader = PyPDFLoader("data/documents/example.pdf")
    pdf_docs = pdf_loader.load()

    # Load text files from directory
    text_loader = DirectoryLoader(
        "data/documents/",
        glob="**/*.txt",
        loader_cls=TextLoader
    )
    text_docs = text_loader.load()

    # Combine documents
    all_docs = pdf_docs + text_docs

    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )

    splits = text_splitter.split_documents(all_docs)

    print(f"Loaded {len(all_docs)} documents")
    print(f"Split into {len(splits)} chunks")

    return splits

if __name__ == "__main__":
    load_documents()
```

### Vector Store and Retrieval

```python
# app/rag/vector_store.py
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

def create_vector_store():
    """Create and query vector store"""

    # Sample documents
    documents = [
        Document(page_content="LangChain is a framework for building LLM applications"),
        Document(page_content="Vector stores enable semantic search over documents"),
        Document(page_content="RAG combines retrieval with language models"),
        Document(page_content="Embeddings represent text as numerical vectors"),
    ]

    # Create embeddings
    embeddings = OpenAIEmbeddings()

    # Create vector store
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory="./chroma_db"
    )

    # Query vector store
    results = vectorstore.similarity_search(
        "What is LangChain?",
        k=2
    )

    print("Search Results:")
    for i, doc in enumerate(results, 1):
        print(f"\n{i}. {doc.page_content}")

    return vectorstore

if __name__ == "__main__":
    create_vector_store()
```

### Complete RAG Chain

```python
# app/chains/rag_chain.py
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

def rag_chain():
    """Complete RAG implementation"""

    # Load existing vector store
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory="./chroma_db",
        embedding_function=embeddings
    )

    # Create retriever
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    # RAG prompt template
    template = """Answer the question based only on the following context:

Context: {context}

Question: {question}

Answer:"""

    prompt = ChatPromptTemplate.from_template(template)
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    # Helper function to format documents
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    # Build RAG chain
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    # Query the chain
    question = "What is LangChain used for?"
    answer = rag_chain.invoke(question)

    print(f"Question: {question}")
    print(f"Answer: {answer}")

if __name__ == "__main__":
    rag_chain()
```

## 5. Memory

### Conversation Buffer Memory

```python
# app/memory/chat_memory.py
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain

def conversation_with_memory():
    """Chatbot with conversation memory"""

    llm = ChatOpenAI(model="gpt-4", temperature=0.7)

    memory = ConversationBufferMemory()

    conversation = ConversationChain(
        llm=llm,
        memory=memory,
        verbose=True
    )

    # Multi-turn conversation
    print(conversation.predict(input="Hi! My name is Alice."))
    print("\n" + "="*50 + "\n")

    print(conversation.predict(input="What's 2+2?"))
    print("\n" + "="*50 + "\n")

    print(conversation.predict(input="What's my name?"))

if __name__ == "__main__":
    conversation_with_memory()
```

### Summary Memory

```python
# app/memory/summary_memory.py
from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain

def conversation_with_summary():
    """Conversation with summarized history"""

    llm = ChatOpenAI(model="gpt-4", temperature=0)

    memory = ConversationSummaryMemory(llm=llm)

    conversation = ConversationChain(
        llm=llm,
        memory=memory,
        verbose=True
    )

    # Have a longer conversation
    responses = []
    responses.append(conversation.predict(
        input="Tell me about Python programming"
    ))

    responses.append(conversation.predict(
        input="What are its main advantages?"
    ))

    responses.append(conversation.predict(
        input="Summarize what we discussed"
    ))

    for i, response in enumerate(responses, 1):
        print(f"\nResponse {i}: {response}")

if __name__ == "__main__":
    conversation_with_summary()
```

## 6. Agents and Tools

### Built-in Tools

```python
# app/agents/tool_agent.py
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.tools import DuckDuckGoSearchRun
import math

def agent_with_tools():
    """Agent that can use tools"""

    # Define custom tools
    def calculate_square_root(x: str) -> str:
        """Calculate square root of a number"""
        try:
            return str(math.sqrt(float(x)))
        except ValueError:
            return "Invalid number"

    tools = [
        Tool(
            name="Calculator",
            func=calculate_square_root,
            description="Useful for calculating square roots. Input should be a number."
        ),
        DuckDuckGoSearchRun()
    ]

    # Create agent
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant with access to tools."),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_openai_functions_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # Use the agent
    result = agent_executor.invoke({
        "input": "What is the square root of 144?"
    })

    print(f"\nResult: {result['output']}")

if __name__ == "__main__":
    agent_with_tools()
```

### Custom Tools

```python
# app/tools/custom_tools.py
from langchain.tools import BaseTool
from typing import Optional
from pydantic import BaseModel, Field

class WeatherInput(BaseModel):
    """Input for weather tool"""
    location: str = Field(description="City name")

class WeatherTool(BaseTool):
    """Custom weather tool"""
    name = "weather"
    description = "Get current weather for a location"
    args_schema = WeatherInput

    def _run(self, location: str) -> str:
        """Execute the tool"""
        # In production, call a real weather API
        return f"The weather in {location} is sunny and 72°F"

    async def _arun(self, location: str) -> str:
        """Async version"""
        return self._run(location)

# Usage
if __name__ == "__main__":
    tool = WeatherTool()
    result = tool.run("San Francisco")
    print(result)
```

## 7. Output Parsers

### Structured Output

```python
# app/parsers/structured_output.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

class Recipe(BaseModel):
    """Recipe data model"""
    name: str = Field(description="Recipe name")
    ingredients: List[str] = Field(description="List of ingredients")
    instructions: List[str] = Field(description="Cooking instructions")
    prep_time: int = Field(description="Prep time in minutes")

def structured_output_example():
    """Parse LLM output into structured data"""

    # Create parser
    parser = PydanticOutputParser(pydantic_object=Recipe)

    # Create prompt
    prompt = ChatPromptTemplate.from_template(
        """Generate a recipe for {dish}.

{format_instructions}"""
    )

    llm = ChatOpenAI(model="gpt-4", temperature=0.7)

    # Build chain
    chain = prompt | llm | parser

    # Get structured output
    recipe = chain.invoke({
        "dish": "chocolate chip cookies",
        "format_instructions": parser.get_format_instructions()
    })

    print(f"Recipe: {recipe.name}")
    print(f"Prep Time: {recipe.prep_time} minutes")
    print(f"\nIngredients:")
    for ingredient in recipe.ingredients:
        print(f"  - {ingredient}")
    print(f"\nInstructions:")
    for i, step in enumerate(recipe.instructions, 1):
        print(f"  {i}. {step}")

if __name__ == "__main__":
    structured_output_example()
```

## 8. Complete Application Example

```python
# main.py
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

load_dotenv()

class LangChainApp:
    """Complete LangChain application"""

    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.embeddings = OpenAIEmbeddings()
        self.memory = ConversationBufferMemory()

    def simple_chat(self, message: str) -> str:
        """Simple chat completion"""
        response = self.llm.invoke(message)
        return response.content

    def chat_with_memory(self, message: str) -> str:
        """Chat with conversation memory"""
        conversation = ConversationChain(
            llm=self.llm,
            memory=self.memory
        )
        return conversation.predict(input=message)

    def rag_query(self, question: str, vectorstore_path: str) -> str:
        """Query using RAG"""
        vectorstore = Chroma(
            persist_directory=vectorstore_path,
            embedding_function=self.embeddings
        )

        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

        template = """Answer based on this context:

{context}

Question: {question}
Answer:"""

        prompt = ChatPromptTemplate.from_template(template)

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

        return chain.invoke(question)

def main():
    """Main application"""
    app = LangChainApp()

    # Simple chat
    print("Simple Chat:")
    response = app.simple_chat("What is LangChain?")
    print(response)
    print("\n" + "="*50 + "\n")

    # Chat with memory
    print("Chat with Memory:")
    print(app.chat_with_memory("My favorite color is blue"))
    print(app.chat_with_memory("What's my favorite color?"))

if __name__ == "__main__":
    main()
```

## 9. Testing

```python
# tests/test_chains.py
import pytest
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema.output_parser import StrOutputParser

def test_simple_chain():
    """Test a simple chain"""
    prompt = ChatPromptTemplate.from_template("Say 'hello'")
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    parser = StrOutputParser()

    chain = prompt | llm | parser
    result = chain.invoke({})

    assert "hello" in result.lower()

def test_prompt_formatting():
    """Test prompt template formatting"""
    prompt = ChatPromptTemplate.from_template("Hello {name}")
    formatted = prompt.format(name="Alice")

    assert "Alice" in formatted
```

## Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LANGSMITH_API_KEY=...  # Optional, for monitoring
LANGSMITH_TRACING_V2=true  # Optional
```

## Best Practices

1. **Use LCEL**: LangChain Expression Language for composable chains
2. **Error Handling**: Implement try-catch for LLM calls
3. **Cost Monitoring**: Track token usage and API costs
4. **Caching**: Cache embeddings and frequent queries
5. **Testing**: Unit test chains and components
6. **Logging**: Use callbacks for debugging
7. **Type Safety**: Use Pydantic models for structured outputs
8. **Async**: Use async operations for better performance

## Common Pitfalls

- **Token Limits**: Monitor context window sizes
- **Rate Limits**: Implement exponential backoff
- **Memory Leaks**: Clear conversation memory periodically
- **Embedding Costs**: Cache embeddings when possible
- **Prompt Engineering**: Iterate on prompts for better results

## Next Steps

1. Explore LangGraph for complex agent workflows
2. Integrate LangSmith for production monitoring
3. Build custom tools and chains
4. Deploy to production with proper error handling
5. Optimize for cost and latency
