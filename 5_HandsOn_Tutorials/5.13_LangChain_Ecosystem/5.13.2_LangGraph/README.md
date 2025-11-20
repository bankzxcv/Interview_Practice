# LangGraph Framework

LangGraph is a library for building stateful, multi-actor applications with LLMs, using graph-based workflows. It extends LangChain with cyclic graph capabilities for complex agent architectures.

## Overview

LangGraph enables building:
- **Stateful Agents**: Agents that maintain state across interactions
- **Multi-Agent Systems**: Multiple agents working together
- **Cyclic Workflows**: Graphs with loops and conditional branching
- **Human-in-the-Loop**: Interactive workflows requiring human input
- **Complex Orchestration**: Advanced agent coordination patterns

## Key Features

- **Graph-Based**: Define workflows as directed graphs
- **State Management**: Built-in state persistence and management
- **Conditional Edges**: Dynamic routing based on agent output
- **Checkpointing**: Save and restore workflow state
- **Streaming**: Real-time streaming of agent actions
- **Time Travel**: Replay and debug agent executions
- **Persistence**: Multiple backend options for state storage

## Core Concepts

### 1. **StateGraph**
The foundation for building stateful workflows
- Nodes: Individual steps/agents in the workflow
- Edges: Connections between nodes
- State: Shared data structure across nodes

### 2. **Nodes**
Functions that process state and return updates
- Can be LLM calls, tools, or custom logic
- Receive current state as input
- Return state updates

### 3. **Edges**
Define the flow between nodes
- **Normal Edges**: Direct connections
- **Conditional Edges**: Dynamic routing based on state
- **START/END**: Special nodes for entry and exit points

### 4. **Checkpointing**
Persist state at each step
- **MemorySaver**: In-memory checkpointing
- **SqliteSaver**: SQLite-based persistence
- **PostgresSaver**: PostgreSQL persistence

## Architecture Patterns

### ReAct Agent Pattern
```
    START
      ↓
    Agent (decide action)
      ↓
    ┌─────────┐
    │  Tools  │ ←──┐
    └─────────┘    │
      ↓            │
    Agent (reason) │
      ↓            │
    Decision ──────┘
      ↓
     END
```

### Multi-Agent Pattern
```
    START
      ↓
   Supervisor
   ↙    ↓    ↘
 Agent1 Agent2 Agent3
   ↘    ↓    ↙
   Aggregator
      ↓
     END
```

### Human-in-the-Loop
```
    START
      ↓
    Agent
      ↓
   [Interrupt]
      ↓
   Human Input
      ↓
    Agent
      ↓
     END
```

## Common Use Cases

1. **Complex Agents**: Multi-step reasoning with tool use
2. **Multi-Agent Systems**: Collaborative agent architectures
3. **Chatbots**: Stateful conversational agents
4. **Autonomous Systems**: Self-directed task completion
5. **Workflows**: Business process automation
6. **Research Assistants**: Multi-step research and analysis
7. **Code Generation**: Iterative code writing with validation

## Tutorials

- [Python Tutorial](./python.md) - Build LangGraph applications with Python
- [TypeScript Tutorial](./typescript.md) - Build LangGraph applications with TypeScript

## LangGraph vs LangChain

| Feature | LangChain | LangGraph |
|---------|-----------|-----------|
| Workflow Type | Linear chains | Cyclic graphs |
| State Management | Limited | Built-in |
| Conditional Logic | Basic | Advanced |
| Multi-Agent | Difficult | Native support |
| Checkpointing | Manual | Automatic |
| Human-in-Loop | Custom | Built-in |

## Key Components

### StateGraph
```python
from langgraph.graph import StateGraph

graph = StateGraph(state_schema)
graph.add_node("node_name", node_function)
graph.add_edge("node1", "node2")
graph.add_conditional_edges("node", routing_function)
```

### State Schema
Define the structure of shared state:
```python
from typing import TypedDict, Annotated
from langgraph.graph import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_info: str
    step: int
```

### Checkpointers
```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# In-memory
checkpointer = MemorySaver()

# SQLite
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
```

## Best Practices

1. **State Design**: Keep state minimal and well-defined
2. **Node Functions**: Make nodes pure and testable
3. **Error Handling**: Implement proper error boundaries
4. **Checkpointing**: Use appropriate persistence backend
5. **Conditional Logic**: Keep routing logic simple and clear
6. **Testing**: Test nodes independently before integration
7. **Monitoring**: Use LangSmith for observability
8. **State Updates**: Use reducer functions for complex updates

## Advanced Features

### Subgraphs
Nest graphs within nodes for modularity

### Parallel Execution
Run multiple nodes concurrently

### Streaming
Stream intermediate results in real-time

### Time Travel
Debug by replaying from checkpoints

### Dynamic Graphs
Modify graph structure at runtime

## When to Use LangGraph

✅ **Use LangGraph when:**
- Building complex, multi-step agents
- Need stateful workflows with loops
- Implementing multi-agent systems
- Require human-in-the-loop interactions
- Need checkpoint/resume capabilities
- Building production-grade agent systems

❌ **Use LangChain instead when:**
- Simple linear workflows
- Basic RAG applications
- Quick prototypes
- No state persistence needed

## Comparison with Other Tools

### vs AutoGen
- **LangGraph**: More control, explicit graphs
- **AutoGen**: Higher-level, automatic orchestration

### vs CrewAI
- **LangGraph**: Graph-based, flexible architecture
- **CrewAI**: Role-based, opinionated structure

### vs LangChain Agents
- **LangGraph**: Cyclic, stateful, production-ready
- **LangChain Agents**: Linear, simpler, prototyping

## Deployment Considerations

- **State Storage**: Choose appropriate checkpointer
- **Scalability**: Consider distributed state backends
- **Monitoring**: Integrate with LangSmith
- **Error Recovery**: Implement retry and fallback logic
- **API Costs**: Monitor LLM API usage
- **Latency**: Optimize for response time

## Learning Path

1. **Start Simple**: Basic agent with tools
2. **Add State**: Implement stateful workflows
3. **Conditional Logic**: Use conditional edges
4. **Multi-Agent**: Build collaborative systems
5. **Production**: Add checkpointing and monitoring
6. **Advanced**: Explore subgraphs and parallelization

## Resources

- Official Documentation: https://langchain-ai.github.io/langgraph/
- GitHub Repository: Examples and code
- LangSmith: Production monitoring
- Community Discord: Support and discussions

## Next Steps

1. Choose your language (Python or TypeScript)
2. Learn StateGraph fundamentals
3. Build a simple ReAct agent
4. Add conditional edges and routing
5. Implement checkpointing
6. Deploy to production with monitoring
