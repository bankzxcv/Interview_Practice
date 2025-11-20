# LangGraph with Python

Complete guide to building stateful, graph-based agent applications with LangGraph using Python.

## Why Python for LangGraph?

- **Native Support**: LangGraph is Python-first
- **Rich Ecosystem**: Full access to Python AI/ML libraries
- **Type Safety**: TypedDict and annotations for state
- **Async Support**: Built-in async/await patterns
- **Debugging**: Better tooling for graph visualization

## Prerequisites

```bash
# Install Python 3.11+ (recommended for better typing)
python3 --version

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

## Installation

```bash
# Install LangGraph
pip install langgraph

# Install LangChain for integrations
pip install langchain langchain-openai langchain-anthropic

# Install tools and utilities
pip install langchain-community tavily-python

# For persistence
pip install aiosqlite  # SQLite async support

# Development tools
pip install python-dotenv ipython

# Create requirements.txt
pip freeze > requirements.txt
```

## Project Structure

```
langgraph-python/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── graphs/
│   │   ├── __init__.py
│   │   ├── simple_agent.py
│   │   ├── react_agent.py
│   │   ├── multi_agent.py
│   │   └── human_in_loop.py
│   ├── nodes/
│   │   ├── __init__.py
│   │   ├── agent_nodes.py
│   │   └── tool_nodes.py
│   ├── state/
│   │   ├── __init__.py
│   │   └── schemas.py
│   └── tools/
│       ├── __init__.py
│       └── custom_tools.py
├── tests/
│   └── test_graphs.py
├── .env
├── requirements.txt
└── main.py
```

## 1. Basic StateGraph

### Simple Linear Graph

```python
# app/graphs/simple_agent.py
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class State(TypedDict):
    """State schema for the graph"""
    messages: Annotated[list, add_messages]

def chatbot(state: State) -> State:
    """Simple chatbot node"""
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke(state["messages"])

    return {"messages": [response]}

def create_simple_graph():
    """Create a simple linear graph"""
    # Initialize graph
    graph = StateGraph(State)

    # Add nodes
    graph.add_node("chatbot", chatbot)

    # Add edges
    graph.add_edge(START, "chatbot")
    graph.add_edge("chatbot", END)

    # Compile
    app = graph.compile()

    return app

# Usage
if __name__ == "__main__":
    from langchain_core.messages import HumanMessage

    app = create_simple_graph()

    result = app.invoke({
        "messages": [HumanMessage(content="What is LangGraph?")]
    })

    print(result["messages"][-1].content)
```

### Visualizing Graphs

```python
# app/utils/visualization.py
from IPython.display import Image, display

def visualize_graph(app):
    """Visualize the graph structure"""
    try:
        display(Image(app.get_graph().draw_mermaid_png()))
    except Exception:
        print(app.get_graph().draw_ascii())

# Usage
app = create_simple_graph()
visualize_graph(app)
```

## 2. ReAct Agent with Tools

### Define Tools

```python
# app/tools/custom_tools.py
from langchain_core.tools import tool
import random

@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location."""
    # Mock weather data
    weather = random.choice(["sunny", "cloudy", "rainy"])
    temp = random.randint(60, 85)
    return f"The weather in {location} is {weather} with a temperature of {temp}°F"

@tool
def calculate(expression: str) -> str:
    """Safely evaluate a mathematical expression."""
    try:
        result = eval(expression, {"__builtins__": {}})
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"

@tool
def search_database(query: str) -> str:
    """Search a mock database."""
    # Mock database results
    results = {
        "users": "Found 100 users",
        "products": "Found 50 products",
        "orders": "Found 200 orders"
    }
    return results.get(query.lower(), "No results found")
```

### ReAct Agent Graph

```python
# app/graphs/react_agent.py
from typing import TypedDict, Annotated, Literal
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.prebuilt import ToolNode
from app.tools.custom_tools import get_weather, calculate, search_database

class AgentState(TypedDict):
    """State for ReAct agent"""
    messages: Annotated[list, add_messages]

# Define tools
tools = [get_weather, calculate, search_database]
tool_node = ToolNode(tools)

def should_continue(state: AgentState) -> Literal["tools", "end"]:
    """Determine if we should continue or end"""
    messages = state["messages"]
    last_message = messages[-1]

    # If there are tool calls, continue
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "end"

def call_model(state: AgentState) -> AgentState:
    """Call the LLM"""
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    llm_with_tools = llm.bind_tools(tools)

    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def create_react_agent():
    """Create ReAct agent graph"""
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", tool_node)

    # Add edges
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )
    workflow.add_edge("tools", "agent")

    # Compile
    app = workflow.compile()
    return app

# Usage
if __name__ == "__main__":
    app = create_react_agent()

    result = app.invoke({
        "messages": [HumanMessage(content="What's the weather in San Francisco?")]
    })

    for message in result["messages"]:
        print(f"{message.__class__.__name__}: {message.content}")
```

## 3. Stateful Agent with Memory

### Complex State Schema

```python
# app/state/schemas.py
from typing import TypedDict, Annotated, List
from langgraph.graph.message import add_messages

class ResearchState(TypedDict):
    """State for research agent"""
    messages: Annotated[list, add_messages]
    research_topic: str
    findings: List[str]
    iteration: int
    max_iterations: int

def add_findings(existing: List[str], new: List[str]) -> List[str]:
    """Reducer for findings"""
    return existing + new

class AdvancedState(TypedDict):
    """Advanced state with custom reducers"""
    messages: Annotated[list, add_messages]
    findings: Annotated[List[str], add_findings]
    topic: str
    iteration: int
```

### Research Agent with State

```python
# app/graphs/research_agent.py
from typing import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from app.state.schemas import ResearchState

def research_node(state: ResearchState) -> ResearchState:
    """Research a topic"""
    llm = ChatOpenAI(model="gpt-4", temperature=0.7)

    prompt = f"""You are a research assistant.
    Topic: {state['research_topic']}
    Previous findings: {state['findings']}
    Iteration: {state['iteration']} of {state['max_iterations']}

    Provide a new finding about this topic."""

    response = llm.invoke([HumanMessage(content=prompt)])

    return {
        "findings": [response.content],
        "iteration": state["iteration"] + 1,
        "messages": [response]
    }

def should_continue_research(state: ResearchState) -> Literal["research", "end"]:
    """Check if we should continue researching"""
    if state["iteration"] >= state["max_iterations"]:
        return "end"
    return "research"

def create_research_agent():
    """Create research agent with stateful iterations"""
    workflow = StateGraph(ResearchState)

    # Add nodes
    workflow.add_node("research", research_node)

    # Add edges
    workflow.add_edge(START, "research")
    workflow.add_conditional_edges(
        "research",
        should_continue_research,
        {
            "research": "research",
            "end": END
        }
    )

    # Compile
    app = workflow.compile()
    return app

# Usage
if __name__ == "__main__":
    app = create_research_agent()

    result = app.invoke({
        "messages": [],
        "research_topic": "Artificial Intelligence",
        "findings": [],
        "iteration": 0,
        "max_iterations": 3
    })

    print(f"Research Topic: {result['research_topic']}")
    print(f"\nFindings:")
    for i, finding in enumerate(result['findings'], 1):
        print(f"{i}. {finding}\n")
```

## 4. Multi-Agent System

### Supervisor Pattern

```python
# app/graphs/multi_agent.py
from typing import TypedDict, Annotated, Literal
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END, add_messages

class MultiAgentState(TypedDict):
    """State for multi-agent system"""
    messages: Annotated[list, add_messages]
    next_agent: str

def supervisor_node(state: MultiAgentState) -> MultiAgentState:
    """Supervisor decides which agent to use"""
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    system_prompt = """You are a supervisor managing a team of agents:
    - researcher: Finds information and does research
    - writer: Writes and edits content
    - coder: Writes and reviews code

    Based on the user's request, decide which agent should handle it.
    Respond with ONLY the agent name or 'FINISH' if done.
    """

    messages = [
        SystemMessage(content=system_prompt),
        *state["messages"]
    ]

    response = llm.invoke(messages)
    next_agent = response.content.strip().lower()

    return {
        "messages": [response],
        "next_agent": next_agent
    }

def researcher_node(state: MultiAgentState) -> MultiAgentState:
    """Research agent"""
    llm = ChatOpenAI(model="gpt-4")

    system_prompt = "You are a research specialist. Find and summarize information."
    messages = [SystemMessage(content=system_prompt), *state["messages"]]

    response = llm.invoke(messages)
    return {"messages": [response]}

def writer_node(state: MultiAgentState) -> MultiAgentState:
    """Writer agent"""
    llm = ChatOpenAI(model="gpt-4")

    system_prompt = "You are a professional writer. Create clear, engaging content."
    messages = [SystemMessage(content=system_prompt), *state["messages"]]

    response = llm.invoke(messages)
    return {"messages": [response]}

def coder_node(state: MultiAgentState) -> MultiAgentState:
    """Coder agent"""
    llm = ChatOpenAI(model="gpt-4")

    system_prompt = "You are an expert programmer. Write clean, efficient code."
    messages = [SystemMessage(content=system_prompt), *state["messages"]]

    response = llm.invoke(messages)
    return {"messages": [response]}

def router(state: MultiAgentState) -> str:
    """Route to next agent"""
    next_agent = state.get("next_agent", "").lower()

    if next_agent == "finish" or not next_agent:
        return "end"
    elif next_agent in ["researcher", "writer", "coder"]:
        return next_agent
    else:
        return "supervisor"

def create_multi_agent_system():
    """Create multi-agent system with supervisor"""
    workflow = StateGraph(MultiAgentState)

    # Add nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("writer", writer_node)
    workflow.add_node("coder", coder_node)

    # Add edges
    workflow.add_edge(START, "supervisor")
    workflow.add_conditional_edges(
        "supervisor",
        router,
        {
            "researcher": "researcher",
            "writer": "writer",
            "coder": "coder",
            "end": END
        }
    )

    # All workers report back to supervisor
    workflow.add_edge("researcher", "supervisor")
    workflow.add_edge("writer", "supervisor")
    workflow.add_edge("coder", "supervisor")

    # Compile
    app = workflow.compile()
    return app

# Usage
if __name__ == "__main__":
    app = create_multi_agent_system()

    result = app.invoke({
        "messages": [HumanMessage(content="Write a Python function to calculate fibonacci numbers")]
    })

    for msg in result["messages"]:
        print(f"\n{msg.__class__.__name__}:")
        print(msg.content)
```

## 5. Checkpointing and Persistence

### In-Memory Checkpointing

```python
# app/graphs/checkpointed_agent.py
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI

class State(TypedDict):
    messages: Annotated[list, add_messages]
    step: int

def chatbot(state: State) -> State:
    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke(state["messages"])
    return {
        "messages": [response],
        "step": state.get("step", 0) + 1
    }

def create_checkpointed_agent():
    """Agent with checkpoint support"""
    workflow = StateGraph(State)
    workflow.add_node("chatbot", chatbot)
    workflow.add_edge(START, "chatbot")
    workflow.add_edge("chatbot", END)

    # Add checkpointer
    checkpointer = MemorySaver()
    app = workflow.compile(checkpointer=checkpointer)

    return app

# Usage
if __name__ == "__main__":
    from langchain_core.messages import HumanMessage

    app = create_checkpointed_agent()

    # Configure with thread_id for persistence
    config = {"configurable": {"thread_id": "conversation-1"}}

    # First interaction
    result1 = app.invoke({
        "messages": [HumanMessage(content="Hi, I'm Alice")],
        "step": 0
    }, config)
    print(f"Step {result1['step']}: {result1['messages'][-1].content}")

    # Continue conversation (state is maintained)
    result2 = app.invoke({
        "messages": [HumanMessage(content="What's my name?")]
    }, config)
    print(f"Step {result2['step']}: {result2['messages'][-1].content}")
```

### SQLite Persistence

```python
# app/graphs/persistent_agent.py
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
import asyncio
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]

def chatbot(state: State) -> State:
    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

async def create_persistent_agent():
    """Agent with SQLite persistence"""
    workflow = StateGraph(State)
    workflow.add_node("chatbot", chatbot)
    workflow.add_edge(START, "chatbot")
    workflow.add_edge("chatbot", END)

    # SQLite checkpointer
    async with AsyncSqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
        app = workflow.compile(checkpointer=checkpointer)
        return app

# Usage
async def main():
    from langchain_core.messages import HumanMessage

    app = await create_persistent_agent()
    config = {"configurable": {"thread_id": "user-123"}}

    result = await app.ainvoke({
        "messages": [HumanMessage(content="Hello!")]
    }, config)

    print(result["messages"][-1].content)

if __name__ == "__main__":
    asyncio.run(main())
```

## 6. Human-in-the-Loop

### Interactive Agent

```python
# app/graphs/human_in_loop.py
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
import uuid

class State(TypedDict):
    messages: Annotated[list, add_messages]
    requires_approval: bool

def agent_node(state: State) -> State:
    """Agent generates response"""
    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke(state["messages"])

    # Check if response needs approval
    sensitive_topics = ["delete", "remove", "cancel"]
    needs_approval = any(topic in response.content.lower() for topic in sensitive_topics)

    return {
        "messages": [response],
        "requires_approval": needs_approval
    }

def should_interrupt(state: State) -> Literal["human", "end"]:
    """Check if human intervention is needed"""
    if state.get("requires_approval", False):
        return "human"
    return "end"

def create_human_in_loop_agent():
    """Create agent with human-in-the-loop"""
    workflow = StateGraph(State)

    workflow.add_node("agent", agent_node)
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges(
        "agent",
        should_interrupt,
        {
            "human": END,  # Interrupt for human review
            "end": END
        }
    )

    checkpointer = MemorySaver()
    app = workflow.compile(
        checkpointer=checkpointer,
        interrupt_before=["agent"]  # Can also interrupt before nodes
    )

    return app

# Usage with interruption
if __name__ == "__main__":
    app = create_human_in_loop_agent()
    config = {"configurable": {"thread_id": str(uuid.uuid4())}}

    # Start conversation
    result = app.invoke({
        "messages": [HumanMessage(content="Please delete all my data")],
        "requires_approval": False
    }, config)

    print("Agent response:", result["messages"][-1].content)
    print("Requires approval:", result.get("requires_approval"))

    if result.get("requires_approval"):
        # Human makes decision
        approval = input("Approve this action? (yes/no): ")

        if approval.lower() == "yes":
            # Continue execution
            print("Action approved, continuing...")
        else:
            print("Action rejected")
```

## 7. Streaming

### Stream Agent Steps

```python
# app/graphs/streaming_agent.py
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI

class State(TypedDict):
    messages: Annotated[list, add_messages]

def step1(state: State) -> State:
    print("Executing step 1...")
    return {"messages": []}

def step2(state: State) -> State:
    print("Executing step 2...")
    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def create_streaming_agent():
    workflow = StateGraph(State)
    workflow.add_node("step1", step1)
    workflow.add_node("step2", step2)
    workflow.add_edge(START, "step1")
    workflow.add_edge("step1", "step2")
    workflow.add_edge("step2", END)

    return workflow.compile()

# Stream execution
if __name__ == "__main__":
    from langchain_core.messages import HumanMessage

    app = create_streaming_agent()

    print("Streaming agent execution:")
    for event in app.stream({
        "messages": [HumanMessage(content="Tell me a joke")]
    }):
        print(f"Event: {event}")
```

## 8. Complete Application

```python
# main.py
import os
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from app.graphs.react_agent import create_react_agent
from app.graphs.multi_agent import create_multi_agent_system
from app.graphs.checkpointed_agent import create_checkpointed_agent

load_dotenv()

class LangGraphApp:
    """Complete LangGraph application"""

    def __init__(self):
        self.react_agent = create_react_agent()
        self.multi_agent = create_multi_agent_system()
        self.chat_agent = create_checkpointed_agent()

    def react_query(self, query: str):
        """Use ReAct agent"""
        result = self.react_agent.invoke({
            "messages": [HumanMessage(content=query)]
        })
        return result["messages"][-1].content

    def multi_agent_query(self, query: str):
        """Use multi-agent system"""
        result = self.multi_agent.invoke({
            "messages": [HumanMessage(content=query)],
            "next_agent": ""
        })
        return result["messages"][-1].content

    def chat(self, query: str, thread_id: str):
        """Stateful chat"""
        config = {"configurable": {"thread_id": thread_id}}
        result = self.chat_agent.invoke({
            "messages": [HumanMessage(content=query)]
        }, config)
        return result["messages"][-1].content

def main():
    app = LangGraphApp()

    # ReAct agent example
    print("ReAct Agent:")
    response = app.react_query("What's the weather in New York?")
    print(response)
    print("\n" + "="*50 + "\n")

    # Multi-agent example
    print("Multi-Agent System:")
    response = app.multi_agent_query("Write a hello world function in Python")
    print(response)

if __name__ == "__main__":
    main()
```

## Best Practices

1. **State Design**: Keep state minimal and well-typed
2. **Node Functions**: Pure functions that return state updates
3. **Error Handling**: Use try-except in nodes
4. **Checkpointing**: Use appropriate persistence layer
5. **Testing**: Test nodes independently
6. **Visualization**: Use graph visualization for debugging
7. **Monitoring**: Integrate with LangSmith
8. **Async**: Use async for better performance

## Testing

```python
# tests/test_graphs.py
import pytest
from app.graphs.simple_agent import create_simple_graph
from langchain_core.messages import HumanMessage

def test_simple_graph():
    app = create_simple_graph()
    result = app.invoke({
        "messages": [HumanMessage(content="Hello")]
    })

    assert len(result["messages"]) > 0
    assert result["messages"][-1].content

@pytest.mark.asyncio
async def test_async_graph():
    app = create_simple_graph()
    result = await app.ainvoke({
        "messages": [HumanMessage(content="Hello")]
    })

    assert result is not None
```

## Next Steps

1. Explore advanced patterns (subgraphs, parallelization)
2. Integrate with LangSmith for monitoring
3. Build production-ready multi-agent systems
4. Implement custom checkpointers
5. Deploy with proper persistence
