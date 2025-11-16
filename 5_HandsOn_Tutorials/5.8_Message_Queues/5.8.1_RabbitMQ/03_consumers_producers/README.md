# RabbitMQ Tutorial 03: Advanced Consumer/Producer Patterns

## Overview
Learn advanced patterns for producers and consumers including work queues, message priorities, TTL, and dead letter exchanges.

## Learning Objectives
- Implement work queue patterns
- Use message priorities
- Configure message TTL (Time To Live)
- Set up Dead Letter Exchanges (DLX)
- Handle message rejections and retries
- Implement prefetch and quality of service

## Key Concepts

### Work Queue Pattern
Distribute time-consuming tasks among multiple workers.

```
Producer --> Queue --> Worker 1
                  --> Worker 2
                  --> Worker 3
```

### Message Priority
Higher priority messages processed first (0-255, default 0).

### Message TTL
Automatic message expiration after specified time.

### Dead Letter Exchange
Route rejected, expired, or failed messages for analysis.

## Quick Start

```bash
# Start RabbitMQ
docker-compose up -d

# Terminal 1-3: Start workers
python worker.py
python worker.py
python worker.py

# Terminal 4: Send tasks
python task_producer.py

# Terminal 5: Priority consumer
python priority_consumer.py

# Terminal 6: DLX consumer
python dlx_consumer.py
```

## Verification

```bash
# Check queue depths
docker exec rabbitmq rabbitmqadmin list queues

# Monitor message rates
# Visit http://localhost:15672
```

## Best Practices

1. Use `basic_qos(prefetch_count=1)` for fair dispatch
2. Always acknowledge messages explicitly
3. Set appropriate message TTL
4. Configure DLX for error handling
5. Use priorities sparingly (performance impact)

## Next Steps
- Tutorial 04: RabbitMQ clustering
