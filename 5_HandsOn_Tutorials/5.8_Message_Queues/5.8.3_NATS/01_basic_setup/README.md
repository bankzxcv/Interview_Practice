# NATS Tutorial 01: Basic Setup

## Overview
Install NATS, understand pub/sub model, and send your first messages.

## Learning Objectives
- Install and run NATS server
- Understand pub/sub messaging
- Use subjects for routing
- Connect with Python client
- Monitor with NATS CLI

## Architecture
```
Publisher --> Subject --> Subscriber(s)
    hello.world
```

## Quick Start
```bash
docker-compose up -d

# Install NATS CLI
go install github.com/nats-io/natscli/nats@latest

# Pub/Sub
python publisher.py
python subscriber.py
```

## Key Concepts
- **Subject**: Topic/channel name (hierarchical: foo.bar.baz)
- **Pub/Sub**: 1-to-many messaging
- **At-most-once**: Core NATS delivery guarantee
- **Wildcard**: * (one token), > (many tokens)

## Verification
```bash
nats pub hello.world "Hello NATS"
nats sub hello.world
nats server info
```

## Best Practices
- Use hierarchical subjects
- Leverage wildcards wisely
- Keep subjects meaningful
- Monitor connections

Next: Tutorial 02 - Subject hierarchies
