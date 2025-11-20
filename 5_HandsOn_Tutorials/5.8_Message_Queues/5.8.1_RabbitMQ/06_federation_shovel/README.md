# Tutorial 06: RabbitMQ Federation and Shovel

## Objectives

By the end of this tutorial, you will:
- Understand the difference between Federation and Shovel
- Set up exchange and queue federation across RabbitMQ instances
- Configure the Shovel plugin for message forwarding
- Implement multi-datacenter messaging architectures
- Handle topology patterns for distributed systems
- Configure bidirectional federation
- Monitor federated links and shovels
- Implement disaster recovery patterns

## Prerequisites

- Docker and Docker Compose installed
- Python 3.8+ installed
- Completed Tutorial 01 (Basic Setup)
- Completed Tutorial 05 (Clustering) recommended
- Understanding of RabbitMQ exchanges and queues
- Basic networking knowledge

## Federation vs Shovel: When to Use What?

### Federation
**Use Case**: Loosely-coupled message distribution across datacenters

**Characteristics**:
- Replicates exchanges or queues across brokers
- Preserves message topology
- Supports complex routing patterns
- Automatic link management
- Better for publish/subscribe patterns

### Shovel
**Use Case**: Point-to-point message forwarding

**Characteristics**:
- Moves messages from source to destination
- Simpler configuration
- More control over message flow
- Better for work queue migration
- Can transform messages in transit

### Architecture Comparison

```
FEDERATION (Broadcast Pattern)
┌──────────────┐         ┌──────────────┐
│  DC-WEST     │         │   DC-EAST    │
│              │         │              │
│  Exchange A  │◄───────►│  Exchange A  │
│      │       │         │      │       │
│      ▼       │         │      ▼       │
│   Queue 1    │         │   Queue 2    │
│   Queue 2    │         │   Queue 3    │
└──────────────┘         └──────────────┘
  Messages published to either exchange
  are replicated to both datacenters

SHOVEL (Point-to-Point)
┌──────────────┐         ┌──────────────┐
│  DC-WEST     │         │   DC-EAST    │
│              │         │              │
│  Queue A     │────────►│  Queue B     │
│              │         │              │
└──────────────┘         └──────────────┘
  Messages in Queue A are moved to Queue B
```

## Step-by-Step Instructions

### Step 1: Create Multi-Broker Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # RabbitMQ Broker - West Datacenter
  rabbitmq-west:
    image: rabbitmq:3.12-management
    container_name: rabbitmq-west
    hostname: rabbitmq-west
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_ERLANG_COOKIE: 'federation_cookie_secret'
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_west_data:/var/lib/rabbitmq
      - ./rabbitmq-west.conf:/etc/rabbitmq/rabbitmq.conf:ro
      - ./enabled_plugins:/etc/rabbitmq/enabled_plugins:ro
    networks:
      - federation_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ Broker - East Datacenter
  rabbitmq-east:
    image: rabbitmq:3.12-management
    container_name: rabbitmq-east
    hostname: rabbitmq-east
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_ERLANG_COOKIE: 'federation_cookie_secret'
    ports:
      - "5673:5672"
      - "15673:15672"
    volumes:
      - rabbitmq_east_data:/var/lib/rabbitmq
      - ./rabbitmq-east.conf:/etc/rabbitmq/rabbitmq.conf:ro
      - ./enabled_plugins:/etc/rabbitmq/enabled_plugins:ro
    networks:
      - federation_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ Broker - Central
  rabbitmq-central:
    image: rabbitmq:3.12-management
    container_name: rabbitmq-central
    hostname: rabbitmq-central
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_ERLANG_COOKIE: 'federation_cookie_secret'
    ports:
      - "5674:5672"
      - "15674:15672"
    volumes:
      - rabbitmq_central_data:/var/lib/rabbitmq
      - ./rabbitmq-central.conf:/etc/rabbitmq/rabbitmq.conf:ro
      - ./enabled_plugins:/etc/rabbitmq/enabled_plugins:ro
    networks:
      - federation_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  rabbitmq_west_data:
  rabbitmq_east_data:
  rabbitmq_central_data:

networks:
  federation_network:
    driver: bridge
```

### Step 2: Enable Federation and Shovel Plugins

Create `enabled_plugins`:

```erlang
[rabbitmq_management,rabbitmq_federation,rabbitmq_federation_management,rabbitmq_shovel,rabbitmq_shovel_management].
```

### Step 3: Create RabbitMQ Configurations

Create `rabbitmq-west.conf`:

```ini
# Management
management.tcp.port = 15672

# Logging
log.console.level = info
```

Create `rabbitmq-east.conf`:

```ini
# Management
management.tcp.port = 15672

# Logging
log.console.level = info
```

Create `rabbitmq-central.conf`:

```ini
# Management
management.tcp.port = 15672

# Logging
log.console.level = info
```

### Step 4: Start All Brokers

```bash
# Start all RabbitMQ instances
docker-compose up -d

# Wait for all services to be healthy
sleep 20

# Verify all are running
docker-compose ps

# Check plugins are enabled
docker exec rabbitmq-west rabbitmq-plugins list
```

### Step 5: Configure Exchange Federation

Create `setup_federation.py`:

```python
#!/usr/bin/env python3
import requests
from requests.auth import HTTPBasicAuth
import json

class FederationSetup:
    """Setup RabbitMQ Federation"""

    def __init__(self):
        self.brokers = {
            'west': {'url': 'http://localhost:15672', 'amqp': 'amqp://admin:password@rabbitmq-west:5672'},
            'east': {'url': 'http://localhost:15673', 'amqp': 'amqp://admin:password@rabbitmq-east:5672'},
            'central': {'url': 'http://localhost:15674', 'amqp': 'amqp://admin:password@rabbitmq-central:5672'}
        }
        self.auth = HTTPBasicAuth('admin', 'password')
        self.headers = {'content-type': 'application/json'}

    def create_exchange(self, broker, exchange_name, exchange_type='topic'):
        """Create exchange on broker"""
        url = f"{self.brokers[broker]['url']}/api/exchanges/%2F/{exchange_name}"

        config = {
            'type': exchange_type,
            'durable': True,
            'auto_delete': False
        }

        response = requests.put(url, json=config, auth=self.auth, headers=self.headers)

        if response.status_code in [201, 204]:
            print(f"✓ Created exchange '{exchange_name}' on {broker}")
            return True
        else:
            print(f"✗ Failed to create exchange on {broker}: {response.text}")
            return False

    def setup_upstream(self, broker, upstream_name, upstream_uri):
        """Configure federation upstream"""
        url = f"{self.brokers[broker]['url']}/api/parameters/federation-upstream/%2F/{upstream_name}"

        config = {
            'value': {
                'uri': upstream_uri,
                'ack-mode': 'on-confirm',
                'trust-user-id': False,
                'max-hops': 1
            }
        }

        response = requests.put(url, json=config, auth=self.auth, headers=self.headers)

        if response.status_code in [201, 204]:
            print(f"✓ Created upstream '{upstream_name}' on {broker}")
            return True
        else:
            print(f"✗ Failed to create upstream: {response.text}")
            return False

    def setup_federation_policy(self, broker, policy_name, pattern, upstream):
        """Configure federation policy"""
        url = f"{self.brokers[broker]['url']}/api/policies/%2F/{policy_name}"

        config = {
            'pattern': pattern,
            'definition': {
                'federation-upstream': upstream
            },
            'apply-to': 'exchanges',
            'priority': 10
        }

        response = requests.put(url, json=config, auth=self.auth, headers=self.headers)

        if response.status_code in [201, 204]:
            print(f"✓ Created federation policy '{policy_name}' on {broker}")
            return True
        else:
            print(f"✗ Failed to create policy: {response.text}")
            return False

    def setup_bidirectional_federation(self):
        """Setup bidirectional federation between West and East"""
        print("\n=== Setting up Bidirectional Federation ===\n")

        # Create exchanges on both brokers
        exchange_name = 'federated_exchange'

        self.create_exchange('west', exchange_name, 'topic')
        self.create_exchange('east', exchange_name, 'topic')

        # West -> East
        print("\nConfiguring West -> East federation:")
        self.setup_upstream('west', 'east-upstream', self.brokers['east']['amqp'])
        self.setup_federation_policy('west', 'federate-to-east', '^federated_', 'east-upstream')

        # East -> West
        print("\nConfiguring East -> West federation:")
        self.setup_upstream('east', 'west-upstream', self.brokers['west']['amqp'])
        self.setup_federation_policy('east', 'federate-to-west', '^federated_', 'west-upstream')

        print("\n✓ Bidirectional federation setup complete!")

    def setup_hub_spoke_federation(self):
        """Setup hub-and-spoke federation with Central as hub"""
        print("\n=== Setting up Hub-and-Spoke Federation ===\n")

        exchange_name = 'hub_exchange'

        # Create exchange on all brokers
        for broker in ['west', 'east', 'central']:
            self.create_exchange(broker, exchange_name, 'fanout')

        # West -> Central
        print("\nConfiguring West -> Central:")
        self.setup_upstream('west', 'central-upstream', self.brokers['central']['amqp'])
        self.setup_federation_policy('west', 'to-central', '^hub_', 'central-upstream')

        # East -> Central
        print("\nConfiguring East -> Central:")
        self.setup_upstream('east', 'central-upstream', self.brokers['central']['amqp'])
        self.setup_federation_policy('east', 'to-central', '^hub_', 'central-upstream')

        # Central -> West
        print("\nConfiguring Central -> West:")
        self.setup_upstream('central', 'west-upstream', self.brokers['west']['amqp'])

        # Central -> East
        print("\nConfiguring Central -> East:")
        self.setup_upstream('central', 'east-upstream', self.brokers['east']['amqp'])

        # Policy for Central to federate to both
        url = f"{self.brokers['central']['url']}/api/policies/%2F/spoke-federation"
        config = {
            'pattern': '^hub_',
            'definition': {
                'federation-upstream-set': 'all'
            },
            'apply-to': 'exchanges',
            'priority': 10
        }
        requests.put(url, json=config, auth=self.auth, headers=self.headers)

        print("\n✓ Hub-and-spoke federation setup complete!")

    def verify_federation(self):
        """Verify federation links"""
        print("\n=== Verifying Federation Links ===\n")

        for broker_name, broker in self.brokers.items():
            url = f"{broker['url']}/api/federation-links"
            response = requests.get(url, auth=self.auth)

            if response.status_code == 200:
                links = response.json()
                print(f"{broker_name.upper()} - Active Federation Links: {len(links)}")
                for link in links:
                    print(f"  - {link.get('exchange', 'N/A')} -> {link.get('upstream', 'N/A')} [{link.get('status', 'unknown')}]")
            else:
                print(f"✗ Failed to get federation links from {broker_name}")
            print()

if __name__ == '__main__':
    setup = FederationSetup()

    # Setup bidirectional federation
    setup.setup_bidirectional_federation()

    # Setup hub-and-spoke
    setup.setup_hub_spoke_federation()

    # Verify
    setup.verify_federation()
```

### Step 6: Configure Shovel

Create `setup_shovel.py`:

```python
#!/usr/bin/env python3
import requests
from requests.auth import HTTPBasicAuth
import json

class ShovelSetup:
    """Setup RabbitMQ Shovel"""

    def __init__(self):
        self.brokers = {
            'west': 'http://localhost:15672',
            'east': 'http://localhost:15673',
            'central': 'http://localhost:15674'
        }
        self.auth = HTTPBasicAuth('admin', 'password')
        self.headers = {'content-type': 'application/json'}

    def create_queue(self, broker, queue_name):
        """Create queue on broker"""
        url = f"{self.brokers[broker]}/api/queues/%2F/{queue_name}"

        config = {
            'durable': True,
            'auto_delete': False
        }

        response = requests.put(url, json=config, auth=self.auth, headers=self.headers)

        if response.status_code in [201, 204]:
            print(f"✓ Created queue '{queue_name}' on {broker}")
            return True
        else:
            print(f"✗ Failed to create queue: {response.text}")
            return False

    def setup_static_shovel(self, source_broker, shovel_name, src_queue, dest_uri, dest_queue):
        """Configure static shovel"""
        url = f"{self.brokers[source_broker]}/api/parameters/shovel/%2F/{shovel_name}"

        config = {
            'value': {
                'src-protocol': 'amqp091',
                'src-uri': 'amqp://admin:password@rabbitmq-west:5672',
                'src-queue': src_queue,
                'dest-protocol': 'amqp091',
                'dest-uri': dest_uri,
                'dest-queue': dest_queue,
                'ack-mode': 'on-confirm',
                'src-delete-after': 'never'
            }
        }

        response = requests.put(url, json=config, auth=self.auth, headers=self.headers)

        if response.status_code in [201, 204]:
            print(f"✓ Created shovel '{shovel_name}' on {source_broker}")
            return True
        else:
            print(f"✗ Failed to create shovel: {response.text}")
            return False

    def setup_dynamic_shovel(self, broker, shovel_name, src_exchange, dest_uri, dest_exchange, routing_key):
        """Configure dynamic shovel with exchange"""
        url = f"{self.brokers[broker]}/api/parameters/shovel/%2F/{shovel_name}"

        config = {
            'value': {
                'src-protocol': 'amqp091',
                'src-uri': f'amqp://admin:password@rabbitmq-{broker}:5672',
                'src-exchange': src_exchange,
                'src-exchange-key': routing_key,
                'dest-protocol': 'amqp091',
                'dest-uri': dest_uri,
                'dest-exchange': dest_exchange,
                'dest-exchange-key': routing_key,
                'ack-mode': 'on-confirm',
                'reconnect-delay': 5
            }
        }

        response = requests.put(url, json=config, auth=self.auth, headers=self.headers)

        if response.status_code in [201, 204]:
            print(f"✓ Created dynamic shovel '{shovel_name}' on {broker}")
            return True
        else:
            print(f"✗ Failed to create shovel: {response.text}")
            return False

    def setup_queue_migration_shovel(self):
        """Setup shovel for queue migration"""
        print("\n=== Setting up Queue Migration Shovel ===\n")

        # Create source and destination queues
        self.create_queue('west', 'source_queue')
        self.create_queue('east', 'destination_queue')

        # Create shovel
        self.setup_static_shovel(
            source_broker='west',
            shovel_name='queue-migration',
            src_queue='source_queue',
            dest_uri='amqp://admin:password@rabbitmq-east:5672',
            dest_queue='destination_queue'
        )

        print("\n✓ Queue migration shovel setup complete!")

    def setup_backup_shovel(self):
        """Setup shovel for backup/archival"""
        print("\n=== Setting up Backup Shovel ===\n")

        # Create queues
        self.create_queue('west', 'production_queue')
        self.create_queue('central', 'backup_queue')

        # Create backup shovel
        self.setup_static_shovel(
            source_broker='west',
            shovel_name='backup-shovel',
            src_queue='production_queue',
            dest_uri='amqp://admin:password@rabbitmq-central:5672',
            dest_queue='backup_queue'
        )

        print("\n✓ Backup shovel setup complete!")

    def verify_shovels(self):
        """Verify shovel status"""
        print("\n=== Verifying Shovels ===\n")

        for broker_name, broker_url in self.brokers.items():
            url = f"{broker_url}/api/shovels"
            response = requests.get(url, auth=self.auth)

            if response.status_code == 200:
                shovels = response.json()
                print(f"{broker_name.upper()} - Active Shovels: {len(shovels)}")
                for shovel in shovels:
                    print(f"  - {shovel.get('name', 'N/A')} [{shovel.get('state', 'unknown')}]")
            else:
                print(f"✗ Failed to get shovels from {broker_name}")
            print()

if __name__ == '__main__':
    setup = ShovelSetup()

    # Setup queue migration
    setup.setup_queue_migration_shovel()

    # Setup backup
    setup.setup_backup_shovel()

    # Verify
    setup.verify_shovels()
```

### Step 7: Create Federation Test Publisher

Create `federation_publisher.py`:

```python
#!/usr/bin/env python3
import pika
import json
import time
from datetime import datetime
import sys

def publish_to_federated_exchange(broker_name, host, port):
    """Publish messages to federated exchange"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host=host,
        port=port,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    exchange_name = 'federated_exchange'

    print(f"\nPublishing to {broker_name} ({host}:{port})")
    print(f"Exchange: {exchange_name}\n")

    for i in range(1, 11):
        message = {
            'id': i,
            'source': broker_name,
            'text': f'Federated message #{i} from {broker_name}',
            'timestamp': datetime.now().isoformat()
        }

        routing_key = f'test.{broker_name}.message'

        channel.basic_publish(
            exchange=exchange_name,
            routing_key=routing_key,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )

        print(f"✓ Sent: {message['text']}")
        time.sleep(0.5)

    connection.close()
    print(f"\n✓ Published 10 messages to {broker_name}\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python federation_publisher.py [west|east|central]")
        sys.exit(1)

    broker = sys.argv[1].lower()

    brokers = {
        'west': ('localhost', 5672),
        'east': ('localhost', 5673),
        'central': ('localhost', 5674)
    }

    if broker not in brokers:
        print(f"Invalid broker. Choose: {', '.join(brokers.keys())}")
        sys.exit(1)

    host, port = brokers[broker]
    publish_to_federated_exchange(broker, host, port)
```

### Step 8: Create Federation Test Consumer

Create `federation_consumer.py`:

```python
#!/usr/bin/env python3
import pika
import json
import sys

def consume_from_federated_exchange(broker_name, host, port):
    """Consume from federated exchange"""

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host=host,
        port=port,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Create exchange
    exchange_name = 'federated_exchange'
    channel.exchange_declare(
        exchange=exchange_name,
        exchange_type='topic',
        durable=True
    )

    # Create exclusive queue
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    # Bind to all routing keys
    channel.queue_bind(
        exchange=exchange_name,
        queue=queue_name,
        routing_key='test.#'
    )

    def callback(ch, method, properties, body):
        message = json.loads(body)
        print(f"[{broker_name}] Received from {message['source']}: {message['text']}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=False
    )

    print(f"\n[{broker_name}] Waiting for federated messages...")
    print(f"Connected to {host}:{port}")
    print("Press CTRL+C to exit\n")

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print(f"\n✓ {broker_name} consumer stopped")
        channel.stop_consuming()

    connection.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python federation_consumer.py [west|east|central]")
        sys.exit(1)

    broker = sys.argv[1].lower()

    brokers = {
        'west': ('localhost', 5672),
        'east': ('localhost', 5673),
        'central': ('localhost', 5674)
    }

    if broker not in brokers:
        print(f"Invalid broker. Choose: {', '.join(brokers.keys())}")
        sys.exit(1)

    host, port = brokers[broker]
    consume_from_federated_exchange(broker, host, port)
```

### Step 9: Create Shovel Test

Create `test_shovel.py`:

```python
#!/usr/bin/env python3
import pika
import json
import time
from datetime import datetime

def test_queue_shovel():
    """Test queue-to-queue shovel"""

    print("=== Testing Queue Shovel ===\n")

    # Publish to source queue (West)
    print("Step 1: Publishing messages to source queue (West)...")

    credentials = pika.PlainCredentials('admin', 'password')
    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5672,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    for i in range(1, 6):
        message = {
            'id': i,
            'text': f'Shoveled message #{i}',
            'timestamp': datetime.now().isoformat()
        }

        channel.basic_publish(
            exchange='',
            routing_key='source_queue',
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=2)
        )

        print(f"  ✓ Sent message #{i} to source_queue")

    connection.close()

    print("\nStep 2: Waiting for shovel to transfer messages...")
    time.sleep(5)

    # Check destination queue (East)
    print("\nStep 3: Checking destination queue (East)...")

    parameters = pika.ConnectionParameters(
        host='localhost',
        port=5673,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Check message count
    queue_info = channel.queue_declare(queue='destination_queue', passive=True)
    message_count = queue_info.method.message_count

    print(f"  Messages in destination_queue: {message_count}")

    if message_count > 0:
        print("\n✓ Shovel is working! Messages transferred successfully")
    else:
        print("\n✗ No messages found in destination queue")

    connection.close()

if __name__ == '__main__':
    test_queue_shovel()
```

## Verification and Monitoring

### Check Federation Status

```bash
# View federation links
docker exec rabbitmq-west rabbitmqctl eval 'rabbit_federation_status:status().'

# Via Management API
curl -u admin:password http://localhost:15672/api/federation-links

# View federation upstreams
curl -u admin:password http://localhost:15672/api/parameters/federation-upstream
```

### Check Shovel Status

```bash
# View shovel status
docker exec rabbitmq-west rabbitmqctl shovel_status

# Via Management API
curl -u admin:password http://localhost:15672/api/shovels

# View shovel parameters
curl -u admin:password http://localhost:15672/api/parameters/shovel
```

### Monitor Message Flow

```bash
# Check message rates on exchanges
curl -u admin:password http://localhost:15672/api/exchanges/%2F/federated_exchange

# Check queue depths
docker exec rabbitmq-west rabbitmqctl list_queues name messages

# Monitor federation link traffic
# Watch Management UI -> Admin -> Federation Status
```

## Troubleshooting

### Issue 1: Federation Link Not Establishing

**Symptoms:**
Federation status shows "starting" or "error"

**Solution:**
```bash
# Check network connectivity
docker exec rabbitmq-west ping rabbitmq-east

# Verify credentials
curl -u admin:password http://localhost:15673/api/overview

# Check federation plugin
docker exec rabbitmq-west rabbitmq-plugins list | grep federation

# View detailed errors in logs
docker logs rabbitmq-west | grep -i federation
```

### Issue 2: Duplicate Messages in Federation

**Symptoms:**
Messages appear multiple times on federated exchanges

**Cause:**
Bidirectional federation without proper max-hops setting

**Solution:**
```python
# Ensure max-hops is set to 1 in upstream configuration
'max-hops': 1
```

### Issue 3: Shovel Not Starting

**Symptoms:**
Shovel status shows "terminated" or "error"

**Solution:**
```bash
# Check shovel logs
docker logs rabbitmq-west | grep -i shovel

# Verify source and destination URIs
curl -u admin:password http://localhost:15672/api/parameters/shovel

# Test connectivity manually
docker exec rabbitmq-west rabbitmqadmin publish exchange=amq.default routing_key=source_queue payload="test"
```

## Best Practices

### 1. Choose the Right Tool

```
✅ Use Federation for:
  - Multi-datacenter publish/subscribe
  - Complex routing patterns
  - Loose coupling between sites

✅ Use Shovel for:
  - Queue migration
  - Point-to-point transfers
  - Message aggregation
  - Backup/archival
```

### 2. Set Proper max-hops

```python
# Prevent infinite federation loops
'max-hops': 1  # For direct federation
'max-hops': 2  # For hub-and-spoke with one intermediate
```

### 3. Use Acknowledgments Wisely

```python
# For critical messages
'ack-mode': 'on-confirm'  # Wait for confirmation

# For high throughput (less safe)
'ack-mode': 'on-publish'  # Don't wait
```

### 4. Monitor Link Health

```bash
# Set up alerts for:
# - Federation link status != 'running'
# - Shovel status != 'running'
# - Message backlog on federated queues
```

### 5. Handle Network Partitions

```python
# Configure reconnect delay for shovels
'reconnect-delay': 5  # seconds

# Federation automatically reconnects
# No additional configuration needed
```

## Use Case Patterns

### Pattern 1: Multi-Region Event Distribution

```
Application in West publishes event
  ↓
Federated exchange
  ↓
Event replicated to East and Central
  ↓
Local consumers in each region process events
```

### Pattern 2: Centralized Log Aggregation

```
Logs from West → Shovel → Central backup
Logs from East → Shovel → Central backup
  ↓
Central analysis and archival
```

### Pattern 3: Disaster Recovery

```
Production (West) → Federation → DR (East)
  ↓
If West fails, consumers connect to East
  ↓
Messages available in both locations
```

## Key Takeaways

1. ✅ **Federation** is for distributed publish/subscribe patterns
2. ✅ **Shovel** is for point-to-point message forwarding
3. ✅ Set **max-hops** to prevent federation loops
4. ✅ Use **on-confirm** ack mode for critical messages
5. ✅ Monitor **link status** continuously
6. ✅ Test **failover scenarios** regularly
7. ✅ Choose topology based on **use case requirements**

## Next Steps

1. Implement federation for your multi-region setup
2. Test failover scenarios
3. Monitor federation link performance
4. Explore **Tutorial 07: Monitoring and Management** for production observability
5. Learn **Tutorial 08: Kubernetes Deployment** for cloud-native deployments

## Additional Resources

- [RabbitMQ Federation Guide](https://www.rabbitmq.com/federation.html)
- [RabbitMQ Shovel Plugin](https://www.rabbitmq.com/shovel.html)
- [Distributed RabbitMQ Brokers](https://www.rabbitmq.com/distributed.html)
- [Federation Plugin Reference](https://www.rabbitmq.com/federation-reference.html)

---

**Congratulations!** You've mastered RabbitMQ Federation and Shovel for distributed messaging!
