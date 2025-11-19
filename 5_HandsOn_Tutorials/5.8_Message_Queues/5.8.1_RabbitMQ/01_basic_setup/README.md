# Tutorial 01: RabbitMQ Basic Setup

## Objectives

By the end of this tutorial, you will:
- Set up RabbitMQ using Docker Compose
- Access the RabbitMQ Management UI
- Create your first queue
- Implement a basic producer to send messages
- Implement a basic consumer to receive messages
- Understand message acknowledgment
- Learn connection and channel management

## Prerequisites

- Docker and Docker Compose installed
- Python 3.8+ or Node.js 14+ installed
- Basic understanding of message queues
- Text editor or IDE
- Terminal/command line access

## What is RabbitMQ?

RabbitMQ is an open-source message broker that facilitates communication between different parts of an application or between different applications. It implements the Advanced Message Queuing Protocol (AMQP) and acts as an intermediary for messaging, allowing applications to communicate asynchronously.

### Key Features

- **Reliability**: Persistent messages, delivery acknowledgments
- **Flexible Routing**: Multiple exchange types for complex routing
- **Clustering**: High availability and scalability
- **Management Interface**: Web UI for monitoring and administration
- **Multi-Protocol**: Supports AMQP, STOMP, MQTT
- **Client Libraries**: Available for most programming languages

## When to Use RabbitMQ?

RabbitMQ is ideal for:
- **Task Queues**: Distribute work among multiple workers
- **Decoupling Services**: Separate producers from consumers
- **Load Leveling**: Buffer work during traffic spikes
- **Asynchronous Processing**: Non-blocking operations
- **Event-Driven Architecture**: Publish/subscribe patterns
- **Request-Reply (RPC)**: Synchronous-like async communication

## Step-by-Step Instructions

### Step 1: Create Docker Compose File

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3.12-management
    container_name: rabbitmq
    hostname: rabbitmq
    ports:
      - "5672:5672"    # AMQP protocol port
      - "15672:15672"  # Management UI port
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_DEFAULT_VHOST: /
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - rabbitmq_logs:/var/log/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - rabbitmq_network

volumes:
  rabbitmq_data:
  rabbitmq_logs:

networks:
  rabbitmq_network:
    driver: bridge
```

### Step 2: Start RabbitMQ

```bash
# Start RabbitMQ
docker-compose up -d

# Check if it's running
docker-compose ps

# View logs
docker-compose logs -f rabbitmq
```

Wait for the message: `Server startup complete; 0 plugins started.`

### Step 3: Access Management UI

Open your browser and navigate to:
```
http://localhost:15672
```

**Login credentials:**
- Username: `admin`
- Password: `password`

Explore the UI:
- **Overview**: Cluster status and message rates
- **Connections**: Active client connections
- **Channels**: Communication channels
- **Exchanges**: Message routing components
- **Queues**: Message storage buffers

### Step 4: Install Client Library

**For Python:**
```bash
pip install pika
```

**For Node.js:**
```bash
npm init -y
npm install amqplib
```

### Step 5: Create Producer (Python)

Create `producer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import time
from datetime import datetime

def send_messages():
    """Send messages to RabbitMQ queue"""

    # Connection parameters
    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        virtual_host='/',
        credentials=credentials
    )

    # Establish connection
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare queue (idempotent - safe to call multiple times)
    queue_name = 'hello'
    channel.queue_declare(
        queue=queue_name,
        durable=True,  # Survive broker restart
        exclusive=False,
        auto_delete=False
    )

    # Send 5 messages
    for i in range(1, 6):
        message = {
            'id': i,
            'text': f'Hello World #{i}',
            'timestamp': datetime.now().isoformat()
        }

        channel.basic_publish(
            exchange='',  # Default exchange
            routing_key=queue_name,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
                content_type='application/json'
            )
        )

        print(f"✓ Sent: {message}")
        time.sleep(1)

    # Close connection
    connection.close()
    print("\n✓ All messages sent successfully")

if __name__ == '__main__':
    send_messages()
```

### Step 6: Create Consumer (Python)

Create `consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import time

def callback(ch, method, properties, body):
    """Process received message"""
    message = json.loads(body)
    print(f"✓ Received: {message}")

    # Simulate processing
    time.sleep(2)
    print(f"  Processed message #{message['id']}")

    # Acknowledge message
    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_messages():
    """Consume messages from RabbitMQ queue"""

    # Connection parameters
    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        virtual_host='/',
        credentials=credentials
    )

    # Establish connection
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare queue (ensures it exists)
    queue_name = 'hello'
    channel.queue_declare(
        queue=queue_name,
        durable=True
    )

    # Set QoS - only take 1 message at a time
    channel.basic_qos(prefetch_count=1)

    # Start consuming
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False  # Manual acknowledgment
    )

    print('⏳ Waiting for messages. To exit press CTRL+C')
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print('\n✓ Consumer stopped')
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    consume_messages()
```

### Step 7: Create Node.js Producer (Optional)

Create `producer.js`:

```javascript
const amqp = require('amqplib');

async function sendMessages() {
    try {
        // Connect to RabbitMQ
        const connection = await amqp.connect('amqp://admin:password@localhost:5672/');
        const channel = await connection.createChannel();

        // Declare queue
        const queue = 'hello';
        await channel.assertQueue(queue, {
            durable: true
        });

        // Send 5 messages
        for (let i = 1; i <= 5; i++) {
            const message = {
                id: i,
                text: `Hello World #${i}`,
                timestamp: new Date().toISOString()
            };

            channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
                persistent: true,
                contentType: 'application/json'
            });

            console.log(`✓ Sent: ${JSON.stringify(message)}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await channel.close();
        await connection.close();
        console.log('\n✓ All messages sent successfully');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

sendMessages();
```

### Step 8: Create Node.js Consumer (Optional)

Create `consumer.js`:

```javascript
const amqp = require('amqplib');

async function consumeMessages() {
    try {
        // Connect to RabbitMQ
        const connection = await amqp.connect('amqp://admin:password@localhost:5672/');
        const channel = await connection.createChannel();

        // Declare queue
        const queue = 'hello';
        await channel.assertQueue(queue, {
            durable: true
        });

        // Set prefetch
        channel.prefetch(1);

        console.log('⏳ Waiting for messages. To exit press CTRL+C');

        // Consume messages
        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const message = JSON.parse(msg.content.toString());
                console.log(`✓ Received: ${JSON.stringify(message)}`);

                // Simulate processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log(`  Processed message #${message.id}`);

                // Acknowledge
                channel.ack(msg);
            }
        }, {
            noAck: false
        });

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

consumeMessages();
```

### Step 9: Run Producer and Consumer

**Terminal 1 - Start Consumer:**
```bash
python consumer.py
# or
node consumer.js
```

**Terminal 2 - Run Producer:**
```bash
python producer.py
# or
node producer.js
```

### Step 10: Verify in Management UI

1. Go to http://localhost:15672
2. Click on **Queues** tab
3. You should see the `hello` queue
4. Click on the queue name to see:
   - Message rates
   - Number of consumers
   - Message details

## Expected Output

### Producer Output:
```
✓ Sent: {'id': 1, 'text': 'Hello World #1', 'timestamp': '2024-01-15T10:30:00.123456'}
✓ Sent: {'id': 2, 'text': 'Hello World #2', 'timestamp': '2024-01-15T10:30:01.234567'}
✓ Sent: {'id': 3, 'text': 'Hello World #3', 'timestamp': '2024-01-15T10:30:02.345678'}
✓ Sent: {'id': 4, 'text': 'Hello World #4', 'timestamp': '2024-01-15T10:30:03.456789'}
✓ Sent: {'id': 5, 'text': 'Hello World #5', 'timestamp': '2024-01-15T10:30:04.567890'}

✓ All messages sent successfully
```

### Consumer Output:
```
⏳ Waiting for messages. To exit press CTRL+C
✓ Received: {'id': 1, 'text': 'Hello World #1', 'timestamp': '2024-01-15T10:30:00.123456'}
  Processed message #1
✓ Received: {'id': 2, 'text': 'Hello World #2', 'timestamp': '2024-01-15T10:30:01.234567'}
  Processed message #2
✓ Received: {'id': 3, 'text': 'Hello World #3', 'timestamp': '2024-01-15T10:30:02.345678'}
  Processed message #3
...
```

## Explanation

### How It Works

1. **Producer** sends messages to RabbitMQ
2. **RabbitMQ** stores messages in queue
3. **Consumer** retrieves and processes messages
4. **Acknowledgment** confirms successful processing
5. **Message removed** from queue after acknowledgment

### Key Concepts

**Connection**: TCP connection to RabbitMQ server
- Heavyweight, should be reused
- One connection per application recommended

**Channel**: Virtual connection inside a connection
- Lightweight, can have many per connection
- Where most API operations happen

**Queue Declaration**: Ensures queue exists
- Idempotent operation (safe to call multiple times)
- Both producer and consumer should declare

**Message Persistence**: `delivery_mode=2`
- Survives broker restart
- Queue must also be durable

**Acknowledgment**: Manual vs. Auto
- Auto: Message deleted when sent
- Manual: Message deleted when acked
- Manual is safer for critical messages

**Prefetch Count**: QoS setting
- Limits unacked messages per consumer
- Prevents overwhelming slow consumers
- Value of 1 = fair dispatch

## Verification Steps

### 1. Check Queue in Management UI
```
Queues → hello → Message details
```

### 2. Check Message Count
```bash
docker exec rabbitmq rabbitmqctl list_queues
```

### 3. Check Connections
```bash
docker exec rabbitmq rabbitmqctl list_connections
```

### 4. Check Channels
```bash
docker exec rabbitmq rabbitmqctl list_channels
```

### 5. Send Test Message via UI
1. Go to Queues → hello
2. Click "Publish message"
3. Enter payload and click "Publish message"
4. Watch consumer receive it

## Troubleshooting

### Issue: Connection Refused

**Symptoms:**
```
pika.exceptions.AMQPConnectionError: Connection refused
```

**Solution:**
```bash
# Check if RabbitMQ is running
docker-compose ps

# Check if port is open
netstat -an | grep 5672

# Restart RabbitMQ
docker-compose restart rabbitmq
```

### Issue: Authentication Failed

**Symptoms:**
```
pika.exceptions.ProbableAuthenticationError: ACCESS_REFUSED
```

**Solution:**
- Verify username/password in code matches docker-compose.yml
- Check RabbitMQ logs: `docker-compose logs rabbitmq`

### Issue: Queue Not Found

**Symptoms:**
```
Channel.close: (404) NOT_FOUND
```

**Solution:**
- Ensure queue is declared before using
- Check queue name spelling
- Verify virtual host

### Issue: Messages Not Consumed

**Possible Causes:**
1. Consumer not running
2. No acknowledgment sent
3. Prefetch count too high
4. Consumer crashed

**Debug:**
```bash
# Check unacked messages
docker exec rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged

# Check consumer count
docker exec rabbitmq rabbitmqctl list_queues name consumers
```

### Issue: High Memory Usage

**Solution:**
```bash
# Check memory
docker stats rabbitmq

# Set memory limit in docker-compose.yml
services:
  rabbitmq:
    mem_limit: 1g
```

## Best Practices

### 1. Connection Management
```python
# ✅ Good: Reuse connection
connection = create_connection()
channel = connection.channel()
# ... use channel ...
connection.close()

# ❌ Bad: Create connection per message
for msg in messages:
    connection = create_connection()
    send(connection, msg)
    connection.close()
```

### 2. Error Handling
```python
import pika
import time

def send_with_retry(message, max_retries=3):
    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            channel.basic_publish(...)
            connection.close()
            return True
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
    return False
```

### 3. Graceful Shutdown
```python
import signal
import sys

def signal_handler(sig, frame):
    print('\nShutting down gracefully...')
    channel.stop_consuming()
    connection.close()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
```

### 4. Message Validation
```python
import json
from jsonschema import validate, ValidationError

schema = {
    "type": "object",
    "properties": {
        "id": {"type": "integer"},
        "text": {"type": "string"}
    },
    "required": ["id", "text"]
}

def callback(ch, method, properties, body):
    try:
        message = json.loads(body)
        validate(instance=message, schema=schema)
        # Process message
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"Invalid message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
```

### 5. Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info(f"Connected to RabbitMQ at {host}:{port}")
logger.info(f"Message sent: {message}")
```

## Key Takeaways

1. ✅ RabbitMQ uses **connections** and **channels** for communication
2. ✅ **Queue declaration** is idempotent and should be done by both producer and consumer
3. ✅ **Message persistence** requires both durable queue and persistent messages
4. ✅ **Manual acknowledgment** is safer than auto-ack for critical messages
5. ✅ **Prefetch count** controls load distribution among consumers
6. ✅ Always handle **connection errors** and implement retry logic
7. ✅ Use the **Management UI** for monitoring and debugging
8. ✅ Close connections properly to avoid resource leaks

## Next Steps

After completing this tutorial:
1. Experiment with different message payloads
2. Try running multiple consumers
3. Test what happens when consumer crashes before acking
4. Explore the Management UI features
5. Move on to **Tutorial 02: Exchanges** to learn advanced routing

## Additional Resources

- [RabbitMQ Tutorial 1](https://www.rabbitmq.com/tutorials/tutorial-one-python.html)
- [Pika Documentation](https://pika.readthedocs.io/)
- [AMQP Concepts](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
- [Best Practices](https://www.cloudamqp.com/blog/part1-rabbitmq-best-practice.html)

---

**Congratulations!** You've set up RabbitMQ and implemented your first producer and consumer! 🎉
