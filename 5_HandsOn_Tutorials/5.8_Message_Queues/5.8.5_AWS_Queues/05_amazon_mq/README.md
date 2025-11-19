# Tutorial 05: Amazon MQ (Managed RabbitMQ/ActiveMQ)

## Overview

Amazon MQ is a managed message broker service for Apache ActiveMQ and RabbitMQ. It provides compatibility with existing applications using industry-standard APIs and protocols, making it ideal for migrating from self-hosted message brokers to AWS.

## Table of Contents
1. [Amazon MQ Fundamentals](#amazon-mq-fundamentals)
2. [RabbitMQ vs ActiveMQ](#rabbitmq-vs-activemq)
3. [Creating Brokers](#creating-brokers)
4. [RabbitMQ with AMQP](#rabbitmq-with-amqp)
5. [ActiveMQ with OpenWire](#activemq-with-openwire)
6. [Migration Strategies](#migration-strategies)
7. [High Availability](#high-availability)
8. [Terraform Configuration](#terraform-configuration)

## Amazon MQ Fundamentals

### What is Amazon MQ?

Amazon MQ is a managed message broker service that supports Apache ActiveMQ and RabbitMQ engines. It handles broker provisioning, patching, backup, and maintenance.

**Key Features:**
- **Fully Managed**: AWS handles infrastructure, patching, backups
- **High Availability**: Active/standby deployments across AZs
- **Industry Standards**: AMQP, MQTT, OpenWire, STOMP, WebSocket
- **Easy Migration**: Compatible with existing applications
- **Security**: VPC isolation, encryption at rest and in transit

### When to Use Amazon MQ

| Use Amazon MQ When | Use SQS/SNS When |
|-------------------|------------------|
| Migrating from existing brokers | Building new applications |
| Need AMQP, MQTT, STOMP protocols | Simple queue or pub/sub needed |
| Complex routing rules | Standard message delivery |
| Existing applications use JMS | Unlimited scalability required |
| Need message priority queues | Cost optimization priority |

### Supported Protocols

| Protocol | Use Case | Engine |
|----------|----------|--------|
| **AMQP 0.9.1** | RabbitMQ standard protocol | RabbitMQ |
| **AMQP 1.0** | Enterprise messaging | ActiveMQ |
| **MQTT** | IoT device messaging | Both |
| **OpenWire** | ActiveMQ Java clients | ActiveMQ |
| **STOMP** | Text-based messaging | Both |
| **WebSocket** | Web browser messaging | Both |

## RabbitMQ vs ActiveMQ

### Comparison

| Feature | RabbitMQ | ActiveMQ |
|---------|----------|----------|
| **Protocol** | AMQP 0.9.1, MQTT, STOMP | OpenWire, AMQP 1.0, MQTT, STOMP |
| **Language** | Erlang | Java |
| **Performance** | Higher throughput | Good throughput |
| **Routing** | Advanced exchange types | Standard routing |
| **Use Case** | Modern microservices | Enterprise Java apps |
| **Learning Curve** | Moderate | Easy for Java developers |

### Feature Comparison

```python
# RabbitMQ Strengths
- Advanced routing (topic, fanout, headers exchanges)
- Better performance for high message rates
- Rich plugin ecosystem
- Better for microservices

# ActiveMQ Strengths
- Better JMS compliance
- Easier for Java developers
- Virtual topics
- Better for enterprise Java apps
```

### When to Choose Each

**Choose RabbitMQ:**
- Microservices architecture
- Need advanced routing patterns
- High throughput requirements
- Python, Node.js, Go applications

**Choose ActiveMQ:**
- Existing JMS applications
- Enterprise Java environment
- Need JMS features
- Familiar with Java ecosystem

## Creating Brokers

### Create RabbitMQ Broker (AWS CLI)

```bash
# Create RabbitMQ broker
aws mq create-broker \
  --broker-name my-rabbitmq-broker \
  --engine-type RABBITMQ \
  --engine-version 3.11.20 \
  --host-instance-type mq.t3.micro \
  --publicly-accessible false \
  --deployment-mode SINGLE_INSTANCE \
  --users '[{
    "Username": "admin",
    "Password": "SecurePassword123!",
    "ConsoleAccess": true
  }]' \
  --subnet-ids subnet-12345678 \
  --security-groups sg-12345678

# Get broker details
aws mq describe-broker --broker-id b-1234abcd-56ef-78gh-90ij-123456789012
```

### Create RabbitMQ Broker (boto3)

```python
import boto3

mq = boto3.client('mq', region_name='us-east-1')

# Create RabbitMQ broker
response = mq.create_broker(
    BrokerName='my-rabbitmq-broker',
    EngineType='RABBITMQ',
    EngineVersion='3.11.20',
    HostInstanceType='mq.m5.large',
    DeploymentMode='SINGLE_INSTANCE',  # or 'CLUSTER_MULTI_AZ'
    PubliclyAccessible=False,
    AutoMinorVersionUpgrade=True,
    Users=[
        {
            'Username': 'admin',
            'Password': 'SecurePassword123!',
            'ConsoleAccess': True
        }
    ],
    SubnetIds=['subnet-12345678'],
    SecurityGroups=['sg-12345678']
)

broker_id = response['BrokerId']
print(f"Broker ID: {broker_id}")

# Wait for broker to be ready
waiter = mq.get_waiter('broker_running')
waiter.wait(BrokerId=broker_id)

# Get broker endpoints
broker = mq.describe_broker(BrokerId=broker_id)
endpoint = broker['BrokerInstances'][0]['Endpoints'][0]
print(f"AMQP Endpoint: {endpoint}")
```

### Create ActiveMQ Broker

```python
import boto3

mq = boto3.client('mq', region_name='us-east-1')

# Create ActiveMQ broker
response = mq.create_broker(
    BrokerName='my-activemq-broker',
    EngineType='ACTIVEMQ',
    EngineVersion='5.17.6',
    HostInstanceType='mq.m5.large',
    DeploymentMode='ACTIVE_STANDBY_MULTI_AZ',  # High availability
    PubliclyAccessible=False,
    AutoMinorVersionUpgrade=True,
    Users=[
        {
            'Username': 'admin',
            'Password': 'SecurePassword123!',
            'ConsoleAccess': True,
            'Groups': ['admin']
        }
    ],
    SubnetIds=['subnet-12345678', 'subnet-87654321'],  # Two AZs for HA
    SecurityGroups=['sg-12345678']
)

broker_id = response['BrokerId']
print(f"ActiveMQ Broker ID: {broker_id}")
```

## RabbitMQ with AMQP

### Install Python Client (pika)

```bash
pip install pika
```

### Connect to RabbitMQ

```python
import pika
import ssl

# Connection parameters
credentials = pika.PlainCredentials('admin', 'SecurePassword123!')

# SSL context for Amazon MQ
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

parameters = pika.ConnectionParameters(
    host='b-1234abcd-56ef-78gh-90ij-123456789012.mq.us-east-1.amazonaws.com',
    port=5671,  # AMQPS port
    credentials=credentials,
    ssl_options=pika.SSLOptions(ssl_context),
    virtual_host='/'
)

connection = pika.BlockingConnection(parameters)
channel = connection.channel()

print("Connected to RabbitMQ")
```

### Publisher Example

```python
import pika
import json
import ssl

def create_connection():
    """Create connection to Amazon MQ RabbitMQ"""
    credentials = pika.PlainCredentials('admin', 'SecurePassword123!')

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    parameters = pika.ConnectionParameters(
        host='b-1234abcd.mq.us-east-1.amazonaws.com',
        port=5671,
        credentials=credentials,
        ssl_options=pika.SSLOptions(ssl_context)
    )

    return pika.BlockingConnection(parameters)

def publish_message(exchange, routing_key, message):
    """Publish message to RabbitMQ exchange"""
    connection = create_connection()
    channel = connection.channel()

    # Declare exchange
    channel.exchange_declare(
        exchange=exchange,
        exchange_type='topic',
        durable=True
    )

    # Publish message
    channel.basic_publish(
        exchange=exchange,
        routing_key=routing_key,
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Persistent
            content_type='application/json'
        )
    )

    print(f"Published to {exchange}/{routing_key}: {message}")

    connection.close()

# Usage
order_data = {
    'order_id': '12345',
    'customer': 'john@example.com',
    'total': 99.99
}

publish_message('orders', 'order.created', order_data)
```

### Consumer Example

```python
import pika
import json
import ssl

def create_connection():
    """Create connection to Amazon MQ RabbitMQ"""
    credentials = pika.PlainCredentials('admin', 'SecurePassword123!')

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    parameters = pika.ConnectionParameters(
        host='b-1234abcd.mq.us-east-1.amazonaws.com',
        port=5671,
        credentials=credentials,
        ssl_options=pika.SSLOptions(ssl_context)
    )

    return pika.BlockingConnection(parameters)

def callback(ch, method, properties, body):
    """Process received message"""
    try:
        message = json.loads(body)
        print(f"Received: {message}")

        # Process message
        process_order(message)

        # Acknowledge message
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"Error processing message: {e}")
        # Reject and requeue message
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def process_order(order_data):
    """Process order"""
    print(f"Processing order: {order_data['order_id']}")

def consume_messages(exchange, queue, routing_key):
    """Consume messages from RabbitMQ queue"""
    connection = create_connection()
    channel = connection.channel()

    # Declare exchange
    channel.exchange_declare(
        exchange=exchange,
        exchange_type='topic',
        durable=True
    )

    # Declare queue
    channel.queue_declare(queue=queue, durable=True)

    # Bind queue to exchange
    channel.queue_bind(
        queue=queue,
        exchange=exchange,
        routing_key=routing_key
    )

    # Set QoS (prefetch count)
    channel.basic_qos(prefetch_count=10)

    # Start consuming
    channel.basic_consume(
        queue=queue,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"Consuming from {queue}...")
    channel.start_consuming()

# Usage
if __name__ == '__main__':
    consume_messages('orders', 'order-processing-queue', 'order.*')
```

### Advanced RabbitMQ Patterns

```python
import pika
import json

def setup_fanout_pattern():
    """Setup fanout exchange for broadcasting"""
    connection = create_connection()
    channel = connection.channel()

    # Create fanout exchange
    channel.exchange_declare(
        exchange='notifications',
        exchange_type='fanout',
        durable=True
    )

    # Create multiple queues
    queues = ['email-queue', 'sms-queue', 'push-queue']

    for queue in queues:
        channel.queue_declare(queue=queue, durable=True)
        channel.queue_bind(queue=queue, exchange='notifications')

    # Publish message (goes to all queues)
    message = {'user': 'john@example.com', 'message': 'Order shipped!'}

    channel.basic_publish(
        exchange='notifications',
        routing_key='',  # Empty for fanout
        body=json.dumps(message)
    )

    print(f"Broadcast message to all subscribers")
    connection.close()

def setup_topic_pattern():
    """Setup topic exchange for selective routing"""
    connection = create_connection()
    channel = connection.channel()

    # Create topic exchange
    channel.exchange_declare(
        exchange='logs',
        exchange_type='topic',
        durable=True
    )

    # Create queues with different routing patterns
    bindings = [
        ('error-logs', 'logs', '*.error'),
        ('app-logs', 'logs', 'app.*'),
        ('all-critical', 'logs', '*.critical')
    ]

    for queue, exchange, routing_key in bindings:
        channel.queue_declare(queue=queue, durable=True)
        channel.queue_bind(queue=queue, exchange=exchange, routing_key=routing_key)

    # Publish with different routing keys
    messages = [
        ('app.error', {'level': 'error', 'app': 'web', 'message': 'Error occurred'}),
        ('db.critical', {'level': 'critical', 'app': 'database', 'message': 'DB down'}),
        ('app.info', {'level': 'info', 'app': 'web', 'message': 'Request processed'})
    ]

    for routing_key, message in messages:
        channel.basic_publish(
            exchange='logs',
            routing_key=routing_key,
            body=json.dumps(message)
        )
        print(f"Published {routing_key}")

    connection.close()
```

## ActiveMQ with OpenWire

### Install Java Client

```bash
# Maven dependency
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-client</artifactId>
    <version>5.17.6</version>
</dependency>
```

### Python with STOMP

```bash
pip install stomp.py
```

```python
import stomp
import json
import time

class ActiveMQClient:
    """ActiveMQ client using STOMP protocol"""

    def __init__(self, host, port, username, password):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.connection = None

    def connect(self):
        """Connect to ActiveMQ broker"""
        self.connection = stomp.Connection([(self.host, self.port)])

        self.connection.connect(
            username=self.username,
            password=self.password,
            wait=True
        )

        print(f"Connected to ActiveMQ at {self.host}:{self.port}")

    def send_message(self, destination, message):
        """Send message to queue or topic"""
        self.connection.send(
            destination=destination,
            body=json.dumps(message),
            headers={'persistent': 'true'}
        )

        print(f"Sent to {destination}: {message}")

    def subscribe(self, destination, callback):
        """Subscribe to queue or topic"""

        class MessageListener(stomp.ConnectionListener):
            def on_message(self, frame):
                message = json.loads(frame.body)
                callback(message)

        self.connection.set_listener('', MessageListener())
        self.connection.subscribe(destination=destination, id=1, ack='auto')

        print(f"Subscribed to {destination}")

    def disconnect(self):
        """Disconnect from broker"""
        if self.connection:
            self.connection.disconnect()
            print("Disconnected from ActiveMQ")

# Usage - Publisher
client = ActiveMQClient(
    host='b-1234abcd.mq.us-east-1.amazonaws.com',
    port=61614,  # STOMP+SSL port
    username='admin',
    password='SecurePassword123!'
)

client.connect()

# Send to queue
client.send_message('/queue/orders', {
    'order_id': '12345',
    'customer': 'john@example.com'
})

# Send to topic
client.send_message('/topic/notifications', {
    'message': 'New order created'
})

client.disconnect()

# Usage - Consumer
def process_message(message):
    """Process received message"""
    print(f"Processing: {message}")

consumer = ActiveMQClient(
    host='b-1234abcd.mq.us-east-1.amazonaws.com',
    port=61614,
    username='admin',
    password='SecurePassword123!'
)

consumer.connect()
consumer.subscribe('/queue/orders', process_message)

# Keep running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    consumer.disconnect()
```

## Migration Strategies

### From Self-Hosted RabbitMQ

```python
"""
Migration strategy from self-hosted RabbitMQ to Amazon MQ

Steps:
1. Create Amazon MQ RabbitMQ broker
2. Set up parallel processing (both brokers)
3. Gradually migrate consumers
4. Switch publishers
5. Decommission old broker
"""

# Phase 1: Dual publishing
def publish_to_both_brokers(message):
    """Publish to both old and new brokers"""

    # Old broker
    old_connection = pika.BlockingConnection(
        pika.ConnectionParameters('old-rabbitmq.internal')
    )
    old_channel = old_connection.channel()
    old_channel.basic_publish('exchange', 'routing.key', message)
    old_connection.close()

    # Amazon MQ broker
    new_connection = create_amazon_mq_connection()
    new_channel = new_connection.channel()
    new_channel.basic_publish('exchange', 'routing.key', message)
    new_connection.close()

# Phase 2: Gradual consumer migration
# Point 10% of consumers to new broker
# Monitor performance and errors
# Increase to 50%, then 100%

# Phase 3: Switch publishers
# All new messages go to Amazon MQ only

# Phase 4: Drain old broker
# Wait for all messages to be processed
# Decommission old infrastructure
```

### From Self-Hosted ActiveMQ

```python
"""
ActiveMQ Migration Strategy

1. Backup configuration and messages
2. Create Amazon MQ ActiveMQ broker
3. Export queue/topic definitions
4. Import into Amazon MQ
5. Test with subset of traffic
6. Complete cutover
"""

# Network of brokers approach
# Connect old and new brokers temporarily
# Gradually migrate consumers and publishers
```

## High Availability

### Active/Standby Configuration

```python
import boto3

mq = boto3.client('mq', region_name='us-east-1')

# Create HA broker (Active/Standby)
response = mq.create_broker(
    BrokerName='ha-broker',
    EngineType='ACTIVEMQ',
    EngineVersion='5.17.6',
    HostInstanceType='mq.m5.large',
    DeploymentMode='ACTIVE_STANDBY_MULTI_AZ',  # HA mode
    PubliclyAccessible=False,
    Users=[
        {
            'Username': 'admin',
            'Password': 'SecurePassword123!'
        }
    ],
    SubnetIds=[
        'subnet-12345678',  # AZ 1
        'subnet-87654321'   # AZ 2
    ],
    SecurityGroups=['sg-12345678']
)

print(f"HA Broker created: {response['BrokerId']}")
```

### RabbitMQ Cluster

```python
import boto3

mq = boto3.client('mq', region_name='us-east-1')

# Create RabbitMQ cluster (3 nodes)
response = mq.create_broker(
    BrokerName='rabbitmq-cluster',
    EngineType='RABBITMQ',
    EngineVersion='3.11.20',
    HostInstanceType='mq.m5.large',
    DeploymentMode='CLUSTER_MULTI_AZ',  # 3-node cluster
    PubliclyAccessible=False,
    Users=[
        {
            'Username': 'admin',
            'Password': 'SecurePassword123!'
        }
    ],
    SubnetIds=[
        'subnet-12345678',
        'subnet-87654321',
        'subnet-11223344'
    ],
    SecurityGroups=['sg-12345678']
)

print(f"RabbitMQ Cluster created: {response['BrokerId']}")
```

## Terraform Configuration

```hcl
# terraform/amazon_mq.tf

resource "aws_mq_broker" "rabbitmq" {
  broker_name        = "production-rabbitmq"
  engine_type        = "RabbitMQ"
  engine_version     = "3.11.20"
  host_instance_type = "mq.m5.large"
  deployment_mode    = "CLUSTER_MULTI_AZ"

  publicly_accessible = false
  auto_minor_version_upgrade = true

  user {
    username       = "admin"
    password       = var.broker_password
    console_access = true
  }

  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id,
    aws_subnet.private_c.id
  ]

  security_groups = [aws_security_group.rabbitmq.id]

  logs {
    general = true
  }

  tags = {
    Environment = "production"
    Application = "messaging"
  }
}

resource "aws_mq_broker" "activemq" {
  broker_name        = "production-activemq"
  engine_type        = "ActiveMQ"
  engine_version     = "5.17.6"
  host_instance_type = "mq.m5.large"
  deployment_mode    = "ACTIVE_STANDBY_MULTI_AZ"

  publicly_accessible = false
  auto_minor_version_upgrade = true

  user {
    username       = "admin"
    password       = var.broker_password
    console_access = true
  }

  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id
  ]

  security_groups = [aws_security_group.activemq.id]

  logs {
    general = true
    audit   = true
  }

  tags = {
    Environment = "production"
    Application = "messaging"
  }
}

# Security group for RabbitMQ
resource "aws_security_group" "rabbitmq" {
  name        = "rabbitmq-broker-sg"
  description = "Security group for RabbitMQ broker"
  vpc_id      = aws_vpc.main.id

  # AMQP
  ingress {
    from_port   = 5671
    to_port     = 5671
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  # Web Console
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Outputs
output "rabbitmq_endpoint" {
  value = aws_mq_broker.rabbitmq.instances[0].endpoints[0]
}

output "activemq_endpoint" {
  value = aws_mq_broker.activemq.instances[0].endpoints[0]
}
```

## Summary

In this tutorial, you learned:
- Amazon MQ fundamentals and when to use it
- Differences between RabbitMQ and ActiveMQ
- Creating and configuring brokers
- Connecting with Python clients (pika and stomp.py)
- Migration strategies from self-hosted brokers
- High availability configurations
- Infrastructure as Code with Terraform

**Key Takeaways:**
- Use Amazon MQ for migrating existing broker-based apps
- RabbitMQ for advanced routing, ActiveMQ for JMS
- High availability with multi-AZ deployments
- Consider SQS/SNS for new greenfield projects

**Next Steps:**
- [Tutorial 06: Lambda Integration](../06_lambda_integration/README.md) - Serverless consumers
- [Tutorial 08: Production Patterns](../08_production_patterns/README.md) - Advanced patterns
