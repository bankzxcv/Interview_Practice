# LangSmith Observability Platform

LangSmith is the official observability, evaluation, and monitoring platform for LangChain applications. It provides tools for debugging, testing, and monitoring LLM applications in development and production.

## Overview

LangSmith helps developers:
- **Debug**: Trace and visualize LLM application execution
- **Test**: Evaluate model outputs against test datasets
- **Monitor**: Track production performance and costs
- **Optimize**: Identify and fix issues in LLM workflows
- **Collaborate**: Share traces and datasets with team members

## Key Features

- **Tracing**: Automatic capture of all LLM calls and intermediate steps
- **Datasets**: Create and manage test datasets for evaluation
- **Evaluators**: Built-in and custom evaluation metrics
- **Annotations**: Add feedback and labels to traces
- **Monitoring**: Real-time dashboards and alerts
- **Debugging**: Detailed inspection of chains and agents
- **Versioning**: Track prompt and chain versions
- **Cost Tracking**: Monitor API usage and costs

## Core Concepts

### 1. **Traces**
Complete record of an application execution
- All LLM calls
- Tool invocations
- Chain steps
- Timing information
- Input/output data
- Error messages

### 2. **Runs**
Individual steps within a trace
- LLM runs
- Chain runs
- Tool runs
- Custom runs

### 3. **Projects**
Organizational units for traces
- Group related traces
- Separate environments (dev/staging/prod)
- Team collaboration

### 4. **Datasets**
Collections of test examples
- Input/output pairs
- Expected results
- Metadata

### 5. **Evaluators**
Functions that score outputs
- Correctness
- Relevance
- Tone
- Custom metrics

## Architecture

```
Your Application
       ↓
  LangSmith Client
       ↓
  LangSmith API
       ↓
  LangSmith Dashboard
```

## Use Cases

1. **Development Debugging**: Trace and debug complex chains
2. **Testing**: Run evaluations against test datasets
3. **Production Monitoring**: Track performance and errors
4. **Cost Optimization**: Monitor and reduce API costs
5. **Quality Assurance**: Evaluate output quality
6. **A/B Testing**: Compare different prompts or models
7. **Team Collaboration**: Share traces and insights

## Tutorials

- [Python Tutorial](./python.md) - Integrate LangSmith with Python applications
- [TypeScript Tutorial](./typescript.md) - Integrate LangSmith with TypeScript applications

## Dashboard Features

### Traces View
- Visualize execution flow
- See timing breakdowns
- Inspect inputs/outputs
- View error details

### Datasets
- Create test datasets
- Import/export data
- Version datasets
- Share with team

### Evaluations
- Run batch evaluations
- Compare results
- Track improvements
- Generate reports

### Monitoring
- Real-time metrics
- Cost tracking
- Error rates
- Latency charts

### Playground
- Test prompts interactively
- Compare models
- Iterate quickly
- Save configurations

## Integration Options

### Automatic Tracing
```python
# Python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-api-key"
```

```typescript
// TypeScript
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_API_KEY = "your-api-key";
```

### Manual Tracing
Use the LangSmith SDK for custom traces

### API Integration
Direct API calls for custom applications

## Evaluation Patterns

### Unit Testing
Test individual components

### Integration Testing
Test complete workflows

### Regression Testing
Ensure changes don't break existing functionality

### A/B Testing
Compare different approaches

## Best Practices

1. **Organize Projects**: Separate dev/staging/prod environments
2. **Use Datasets**: Build comprehensive test datasets
3. **Add Metadata**: Include useful context in traces
4. **Custom Evaluators**: Create domain-specific metrics
5. **Monitor Costs**: Set up cost tracking and alerts
6. **Annotate Traces**: Add feedback for continuous improvement
7. **Version Prompts**: Track changes to prompts and chains
8. **Team Collaboration**: Share insights and traces

## Pricing

- **Developer Plan**: Free for development and small projects
- **Team Plan**: Collaboration features and higher limits
- **Enterprise Plan**: Custom limits, SLA, and support

## Privacy & Security

- Data encryption in transit and at rest
- SOC 2 Type II compliant
- GDPR compliant
- Optional self-hosting
- Data retention policies
- Access controls and permissions

## Common Metrics Tracked

### Performance Metrics
- Latency (p50, p95, p99)
- Throughput (requests/second)
- Error rates
- Success rates

### Cost Metrics
- Token usage
- API costs by model
- Cost per request
- Daily/monthly spend

### Quality Metrics
- Output quality scores
- User feedback
- Evaluation results
- Regression detection

## Debugging Workflow

1. **Identify Issue**: Notice problem in production or tests
2. **Find Trace**: Locate relevant trace in LangSmith
3. **Inspect Steps**: Examine each step in the trace
4. **Identify Root Cause**: Find where the issue occurred
5. **Fix & Test**: Update code and verify with dataset
6. **Deploy**: Push fix to production
7. **Monitor**: Verify fix resolves issue

## Evaluation Workflow

1. **Create Dataset**: Build test examples
2. **Define Evaluators**: Set up evaluation criteria
3. **Run Baseline**: Establish baseline performance
4. **Iterate**: Make improvements
5. **Re-evaluate**: Test against dataset
6. **Compare Results**: Analyze improvements
7. **Deploy**: Release improved version

## Integration with Other Tools

- **LangChain**: Native integration
- **LangGraph**: Full support for graph tracing
- **CI/CD**: Automated testing in pipelines
- **Jupyter Notebooks**: Interactive development
- **VS Code**: Extension for quick access
- **Slack**: Alerts and notifications

## Comparison with Alternatives

### vs Application Logging
- **LangSmith**: LLM-specific, structured traces
- **Logging**: Generic, unstructured logs

### vs APM Tools
- **LangSmith**: AI/LLM focused, prompt versioning
- **APM**: General application monitoring

### vs Weights & Biases
- **LangSmith**: LLM apps, production monitoring
- **W&B**: ML training, experiment tracking

## Getting Started Checklist

- [ ] Sign up for LangSmith account
- [ ] Get API key
- [ ] Set environment variables
- [ ] Run first traced application
- [ ] Explore trace in dashboard
- [ ] Create first dataset
- [ ] Run first evaluation
- [ ] Set up production monitoring

## Advanced Features

### Custom Metadata
Add context to traces for better organization

### Feedback System
Collect user feedback programmatically

### Webhooks
Trigger actions based on events

### Annotations
Add labels and notes to traces

### Filters
Complex queries for finding specific traces

### Exports
Download data for analysis

## When to Use LangSmith

✅ **Use LangSmith when:**
- Building production LLM applications
- Need to debug complex chains or agents
- Want to evaluate output quality
- Need to monitor costs and performance
- Building a team product requiring collaboration
- Need compliance and audit trails

❌ **May not need LangSmith when:**
- Simple prototype or proof of concept
- One-off scripts
- No need for monitoring or debugging
- Cost is a primary concern (use free tier)

## Resources

- Official Documentation: https://docs.smith.langchain.com
- API Reference: Complete API documentation
- Community Discord: Support and discussions
- Example Notebooks: Best practices and patterns
- Blog: Updates and tutorials

## Next Steps

1. Create a LangSmith account
2. Get your API key
3. Follow language-specific tutorial (Python or TypeScript)
4. Trace your first application
5. Create a dataset and run evaluations
6. Set up production monitoring
7. Explore advanced features
