# RabbitMQ Tutorial 01: Basic Setup

## Overview
This tutorial covers the basics of RabbitMQ installation, creating your first queue, and understanding fundamental messaging concepts.

## Learning Objectives
- Install and run RabbitMQ using Docker
- Understand RabbitMQ architecture (producers, queues, consumers)
- Create your first queue
- Send and receive messages
- Access RabbitMQ Management UI

## Prerequisites
- Docker and Docker Compose installed
- Basic understanding of message queues
- Python 3.7+ (for examples)

## Architecture

```
Producer --> [Exchange] --> [Queue] --> Consumer
```

## Setup Instructions

### Step 1: Start RabbitMQ

```bash
docker-compose up -d
```

### Step 2: Verify RabbitMQ is Running

```bash
docker ps
docker logs rabbitmq
```

### Step 3: Access Management UI

Open browser to: http://localhost:15672
- Username: `admin`
- Password: `admin123`

### Step 4: Install Python Client

```bash
pip install pika
```

## Running the Examples

### Send a Message

```bash
python producer.py
```

### Receive a Message

```bash
python consumer.py
```

## Code Explanation

### Producer
- Connects to RabbitMQ
- Creates a channel
- Declares a queue (idempotent - creates if doesn't exist)
- Publishes a message to the queue
- Closes the connection

### Consumer
- Connects to RabbitMQ
- Creates a channel
- Declares the same queue
- Sets up a callback function
- Starts consuming messages
- Acknowledges messages after processing

## Verification Steps

1. **Check Queue Created**
   - Go to Management UI → Queues
   - You should see `hello_queue`

2. **Send Test Messages**
   ```bash
   python producer.py
   ```

3. **Check Message Count**
   - In Management UI, queue should show 1 message ready

4. **Consume Messages**
   ```bash
   python consumer.py
   ```

5. **Verify Delivery**
   - Consumer should print the message
   - Message count in UI should decrease

## Key Concepts

### Queue
- Named message buffer
- Messages stored until consumed
- Durable queues survive broker restarts

### Channel
- Virtual connection inside a TCP connection
- Lightweight vs creating multiple TCP connections
- Most operations done via channels

### Exchange
- Routes messages to queues
- Default exchange used when publishing directly to queue
- Different types: direct, topic, fanout, headers

### Message Acknowledgment
- Manual: Consumer explicitly acks
- Auto: Acks immediately on delivery
- Manual is safer but slower

## Common Issues

### Connection Refused
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Check logs
docker logs rabbitmq
```

### Authentication Failed
- Verify credentials in producer/consumer code
- Check docker-compose.yml for correct username/password

### Queue Not Found
- Queues are auto-created when declared
- Ensure producer and consumer use same queue name

## Best Practices

1. **Always declare queues** - Both producer and consumer should declare
2. **Use meaningful queue names** - Descriptive and consistent
3. **Handle connection errors** - Implement retry logic
4. **Close connections** - Always close connections properly
5. **Use acknowledgments** - Prevent message loss

## Next Steps

- Tutorial 02: Explore exchanges and routing
- Experiment with different message payloads (JSON, binary)
- Try manual acknowledgments with error scenarios
- Explore queue properties (durable, exclusive, auto-delete)

## Additional Resources

- [RabbitMQ Official Documentation](https://www.rabbitmq.com/documentation.html)
- [Pika Documentation](https://pika.readthedocs.io/)
- [AMQP 0-9-1 Model](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
