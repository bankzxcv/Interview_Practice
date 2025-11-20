# AWS Lambda Serverless Functions

AWS Lambda is a serverless computing service that runs code in response to events and automatically manages the compute resources.

## Overview

AWS Lambda supports multiple programming languages including:
- Node.js (JavaScript/TypeScript)
- Python
- Go
- Java
- Ruby
- .NET (C#/PowerShell)

## Key Features

- **Event-driven**: Triggered by AWS services, HTTP requests, or scheduled events
- **Auto-scaling**: Automatically scales based on request volume
- **Pay-per-use**: Charged only for compute time consumed
- **Integrated**: Works seamlessly with other AWS services
- **Stateless**: Functions are stateless and can be scaled independently

## Pricing Model

- **Free Tier**: 1M requests and 400,000 GB-seconds per month
- **Requests**: $0.20 per 1M requests
- **Duration**: $0.00001667 per GB-second

## Common Use Cases

1. **API Backends**: RESTful APIs with API Gateway
2. **Data Processing**: Process S3 uploads, DynamoDB streams
3. **Real-time File Processing**: Image resizing, video transcoding
4. **Scheduled Jobs**: Cron-like scheduled tasks
5. **Event Processing**: Process IoT data, logs, and metrics

## Tutorials

- [TypeScript Tutorial](./typescript.md) - Build Lambda functions with TypeScript
- [Go Tutorial](./golang.md) - Build high-performance Lambda functions with Go
- [Python Tutorial](./python.md) - Build Lambda functions with Python

## Deployment Options

1. **AWS Console**: Web-based interface
2. **AWS CLI**: Command-line deployment
3. **AWS SAM**: Serverless Application Model framework
4. **Serverless Framework**: Popular third-party framework
5. **Terraform**: Infrastructure as Code
6. **CDK**: Cloud Development Kit (TypeScript/Python)

## Lambda Execution Model

```
Event Source → Lambda Function → Response/Action
     ↓
(API Gateway, S3, DynamoDB, SNS, SQS, etc.)
```

## Best Practices

- Keep functions small and focused (single responsibility)
- Minimize cold start times
- Use environment variables for configuration
- Implement proper error handling and retry logic
- Use Lambda Layers for shared dependencies
- Monitor with CloudWatch Logs and Metrics
- Set appropriate timeout and memory limits
- Use VPC only when necessary (adds cold start latency)
