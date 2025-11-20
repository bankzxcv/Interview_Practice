# Azure Functions

Azure Functions is Microsoft's serverless compute service that enables you to run event-driven code without managing infrastructure.

## Overview

Azure Functions supports multiple programming languages:
- Node.js (JavaScript/TypeScript)
- Python
- C#
- Java
- PowerShell
- Go (via custom handlers)

## Key Features

- **Event-driven**: Triggered by HTTP, timers, queues, blobs, and more
- **Auto-scaling**: Automatically scales based on demand
- **Integrated**: Works with Azure services and external services
- **Multiple hosting plans**: Consumption, Premium, Dedicated
- **Durable Functions**: Stateful workflows in serverless
- **Built-in bindings**: Input/output bindings for common services

## Hosting Plans

### Consumption Plan
- **Pay-per-execution**: Only pay for execution time
- **Auto-scaling**: Automatically scales out
- **5-minute timeout** (default), 10 minutes maximum
- **Free grant**: 1M requests and 400,000 GB-s per month

### Premium Plan
- **Better performance**: Pre-warmed instances (no cold start)
- **VNET connectivity**: Connect to virtual networks
- **Unlimited execution duration**
- **Higher costs** but predictable performance

### Dedicated (App Service) Plan
- **Reserved instances**: Run on dedicated VMs
- **Predictable billing**: Pay for VM hours
- **Full control**: Over scaling and resources

## Pricing (Consumption Plan)

- **Execution**: $0.20 per million executions
- **Execution time**: $0.000016 per GB-s
- **Free grant**: First 1M executions and 400,000 GB-s free each month

## Common Triggers

1. **HTTP Trigger**: RESTful APIs
2. **Timer Trigger**: Scheduled tasks (cron)
3. **Blob Trigger**: Process file uploads
4. **Queue Trigger**: Process queue messages
5. **Event Hub**: Process streaming data
6. **Cosmos DB**: React to database changes
7. **Service Bus**: Enterprise messaging

## Tutorials

- [TypeScript Tutorial](./typescript.md) - Build Azure Functions with TypeScript
- [Go Tutorial](./golang.md) - Build Azure Functions with Go (Custom Handlers)
- [Python Tutorial](./python.md) - Build Azure Functions with Python

## Development Tools

1. **Azure Functions Core Tools**: Local development CLI
2. **Visual Studio Code**: Azure Functions extension
3. **Azure Portal**: Web-based development and testing
4. **Azure CLI**: Command-line deployment
5. **Terraform**: Infrastructure as Code

## Best Practices

- Use function-level keys for security
- Implement proper error handling
- Use application insights for monitoring
- Keep functions stateless
- Use durable functions for complex workflows
- Set appropriate timeout values
- Use managed identities for authentication
- Implement retry policies for resilience
