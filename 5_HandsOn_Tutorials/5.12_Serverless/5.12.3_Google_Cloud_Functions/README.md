# Google Cloud Functions

Google Cloud Functions is Google's serverless compute platform that allows you to run code in response to events without managing servers.

## Overview

Google Cloud Functions supports:
- **1st Generation**: Node.js, Python, Go, Java, .NET, Ruby, PHP
- **2nd Generation** (Cloud Run-powered): Enhanced features, longer timeouts, more instances

## Key Features

- **Event-driven**: HTTP, Pub/Sub, Cloud Storage, Firestore, Firebase
- **Auto-scaling**: 0 to thousands of instances
- **Multiple triggers**: HTTP, background events, scheduled
- **Integrated**: Works with Google Cloud services
- **Two generations**: Choose based on your needs

## Generations Comparison

### 1st Generation
- **Max timeout**: 9 minutes
- **Max instances**: 3,000 (can request increase)
- **Max memory**: 8 GB
- **Cold starts**: Optimized for quick starts
- **Use case**: Simple event-driven functions

### 2nd Generation (Recommended)
- **Max timeout**: 60 minutes
- **Max instances**: 1,000 (default), can request increase
- **Max memory**: 32 GB
- **Traffic splitting**: A/B testing support
- **Min instances**: Keep warm instances
- **Concurrency**: Multiple requests per instance
- **Use case**: Complex workloads, HTTP services

## Pricing

### 1st Generation
- **Invocations**: $0.40 per million
- **Compute time**: $0.0000025 per GB-second
- **Network**: $0.12 per GB egress
- **Free tier**: 2M invocations, 400,000 GB-seconds, 200,000 GHz-seconds, 5 GB egress

### 2nd Generation
- Based on Cloud Run pricing
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GB-second
- **Requests**: $0.40 per million
- **Free tier**: Similar to Cloud Run free tier

## Common Triggers

1. **HTTP**: RESTful APIs, webhooks
2. **Pub/Sub**: Asynchronous event processing
3. **Cloud Storage**: File upload/deletion events
4. **Firestore**: Database changes
5. **Firebase**: Authentication, Realtime DB, Analytics
6. **Cloud Scheduler**: Cron jobs
7. **Eventarc**: Any Cloud Audit Log event

## Tutorials

- [TypeScript Tutorial](./typescript.md) - Build Cloud Functions with TypeScript
- [Go Tutorial](./golang.md) - Build Cloud Functions with Go
- [Python Tutorial](./python.md) - Build Cloud Functions with Python

## Development Tools

1. **Google Cloud SDK (gcloud)**: Command-line deployment
2. **Functions Framework**: Local development and testing
3. **Firebase CLI**: For Firebase-triggered functions
4. **Cloud Console**: Web-based management
5. **Terraform**: Infrastructure as Code

## Deployment Regions

Choose from 30+ regions worldwide:
- **Americas**: us-central1, us-east1, us-west1, etc.
- **Europe**: europe-west1, europe-west2, etc.
- **Asia Pacific**: asia-east1, asia-northeast1, etc.

## Best Practices

1. **Use 2nd gen** for new projects (better features, performance)
2. **Set minimum instances** to reduce cold starts
3. **Implement retry logic** for idempotency
4. **Use Secret Manager** for sensitive data
5. **Enable VPC Connector** for private resources
6. **Monitor with Cloud Monitoring** and Logging
7. **Set appropriate timeout** and memory limits
8. **Use concurrency** in 2nd gen for cost optimization
9. **Implement proper error handling**
10. **Use environment variables** for configuration
