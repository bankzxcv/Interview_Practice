# Design WhatsApp/Messenger

## Problem Statement

Design a real-time messaging application like WhatsApp that supports one-on-one chat, group messaging, message delivery tracking (sent/delivered/read), media sharing, and end-to-end encryption.

## Requirements Clarification

### Functional Requirements

- Send/receive text messages in real-time
- One-on-one and group chats
- Message status (sent, delivered, read)
- Media sharing (images, videos, documents)
- Online/offline status
- Last seen timestamp
- Message history
- End-to-end encryption

### Non-Functional Requirements

- **Low latency**: Message delivery < 200ms
- **High availability**: 99.99% uptime
- **Consistency**: Message ordering guaranteed
- **Scale**: 2B users, 100B messages/day
- **Real-time**: WebSocket connections
- **Privacy**: End-to-end encryption (E2EE)

### Out of Scope

- Voice/video calls
- Stories/Status
- Payment features
- Bots/Business API

## Capacity Estimation

### Users & Traffic

```
Users:
- 2B total users
- 500M daily active users (DAU)
- 50M concurrent connections (peak)

Messages:
- 100B messages/day
- Per second: 100B ÷ 86,400 = ~1.16M messages/sec
- Peak (3x): ~3.5M messages/sec

Per User:
- Average 40 messages sent per day
- Average 80 messages received per day (groups count multiple)
```

### Storage (5 Years)

```
Messages per day: 100B
Total messages: 100B × 365 × 5 = 182.5 trillion messages

Message Size:
- Text: 100 bytes average
- Metadata: user_id, chat_id, timestamp, status: 100 bytes
- Total per message: 200 bytes

Text Storage: 182.5T × 200 bytes = 36.5 PB

Media:
- 20% of messages have media
- Average media size: 500 KB (compressed)
- Media messages: 182.5T × 0.2 = 36.5T
- Total media: 36.5T × 500 KB = 18,250 PB = 18 EB

Total Storage: ~18 PB (with compression + deduplication)

User Data:
- 2B users × 5 KB (profile, contacts) = 10 TB
```

### Bandwidth

```
Messages: 1.16M/sec × 200 bytes = 232 MB/sec
Media: 1.16M/sec × 0.2 × 500 KB = 116 GB/sec

With compression (50% reduction): ~58 GB/sec
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
│  (iOS, Android, Web, Desktop)                                │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                     Load Balancer                             │
│  (AWS ALB with WebSocket support)                            │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                  WebSocket Gateway                            │
│  - Maintains persistent connections (50M connections)        │
│  - Routes messages to recipients                             │
│  - Connection registry in Redis                              │
└────────────────┬─────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────────────────────────────────┐
       │                                                │
┌──────▼──────────┐                          ┌─────────▼─────────┐
│  Message        │                          │  Presence Service │
│  Service        │                          │  (Online/Offline) │
└──────┬──────────┘                          └───────────────────┘
       │
       │
┌──────▼─────────────────────────────────────────────────────────┐
│               Message Queue (Kafka)                             │
│  Topics: message-sent, message-delivered, message-read         │
└──────┬─────────────────────────────────────────────────────────┘
       │
       └─────────┬────────────────┬──────────────────┐
                 │                │                  │
       ┌─────────▼───────┐ ┌─────▼──────┐  ┌───────▼────────┐
       │  Delivery       │ │  Media     │  │  Notification  │
       │  Service        │ │  Service   │  │  Service       │
       └─────────────────┘ └────────────┘  └────────────────┘
                                │
                         ┌──────▼───────┐
                         │  CDN + S3    │
                         │  (Media)     │
                         └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │   Cassandra  │  │  Redis       │       │
│  │ (Users,      │  │ (Messages,   │  │ (Connections,│       │
│  │  Contacts)   │  │  Chat Rooms) │  │  Presence)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: WebSocket for Real-Time Messaging

**Why?**
- Persistent bidirectional connection
- Server can push messages to client instantly
- Lower overhead than HTTP polling

**Pros:**
- ✅ Real-time message delivery (< 200ms)
- ✅ Server push capability
- ✅ Efficient for chat (many small messages)
- ✅ Stateful connection (maintains context)

**Cons:**
- ❌ Scaling challenge (50M concurrent connections)
- ❌ Connection management complexity (reconnection)
- ❌ Load balancer needs sticky sessions
- ❌ Higher memory usage (1 KB per connection = 50 GB)

**When to use:**
- Real-time bidirectional communication
- Frequent updates (chat, gaming, collaboration)
- Low latency required (< 1 second)

**Alternative:**
- HTTP Long Polling: simpler but higher latency/cost
- Server-Sent Events (SSE): one-way only
- gRPC Streaming: good for microservices

### Decision 2: End-to-End Encryption (Signal Protocol)

**Why?**
- Privacy requirement (WhatsApp's core value)
- Messages encrypted on sender device, decrypted on recipient device
- Server cannot read messages (zero-knowledge)

**How it works:**

```
1. Key Exchange (First Time):
   - Alice generates key pair (public_A, private_A)
   - Bob generates key pair (public_B, private_B)
   - Exchange public keys via server
   - Derive shared secret using Diffie-Hellman

2. Sending Message:
   - Alice encrypts message with shared secret
   - Server receives encrypted blob (cannot decrypt)
   - Server routes to Bob
   - Bob decrypts with shared secret

3. Forward Secrecy:
   - Generate new keys for each message
   - Compromise of one key doesn't expose past messages
```

**Pros:**
- ✅ True privacy (server cannot read)
- ✅ Regulatory compliance (GDPR)
- ✅ User trust
- ✅ Protection against server breach

**Cons:**
- ❌ Cannot search messages on server
- ❌ Complex key management
- ❌ Group messaging complexity (multi-party E2EE)
- ❌ Cannot support web client easily (need private key)

**When to use:**
- Privacy-focused applications
- Regulatory requirements (healthcare, finance)
- User trust critical

**Alternative:**
- Server-side encryption: easier but server can read
- No encryption: simplest but privacy concerns

### Decision 3: Cassandra for Message Storage

**Why Cassandra?**
- Write-heavy (100B messages/day = 1.16M writes/sec)
- Time-series data (sorted by timestamp)
- Partition by chat_id for locality
- Linear scalability
- No complex joins needed

**Schema:**

```cql
CREATE TABLE messages (
  chat_id UUID,
  message_id UUID,
  timestamp TIMESTAMP,
  sender_id UUID,
  encrypted_content BLOB,  -- E2EE encrypted message
  media_url TEXT,
  status TEXT,  -- sent, delivered, read

  PRIMARY KEY (chat_id, timestamp, message_id)
) WITH CLUSTERING ORDER BY (timestamp DESC);

-- Recent messages index
CREATE TABLE user_chats (
  user_id UUID,
  chat_id UUID,
  last_message_time TIMESTAMP,
  unread_count INT,

  PRIMARY KEY (user_id, last_message_time, chat_id)
) WITH CLUSTERING ORDER BY (last_message_time DESC);
```

**Pros:**
- ✅ Handles 1M+ writes/sec
- ✅ Partition by chat_id = all messages in one chat together
- ✅ Clustering by timestamp = efficient time-range queries
- ✅ Automatic replication and fault tolerance

**Cons:**
- ❌ No full-text search (need Elasticsearch)
- ❌ No complex queries (application-level joins)
- ❌ Eventual consistency (default)

**When to use:**
- Time-series data
- Write-heavy workload
- Need linear scalability
- Eventual consistency acceptable

**Alternative:**
- MongoDB: easier queries but less scalable
- PostgreSQL: ACID but doesn't scale to WhatsApp size

## Message Flow

### 1. Send Message (Alice → Bob)

```python
# Client (Alice)
def send_message(chat_id, recipient_id, plaintext):
    # 1. Encrypt message locally
    shared_key = get_shared_key(recipient_id)
    encrypted = encrypt(plaintext, shared_key)

    # 2. Send via WebSocket
    ws.send({
        "type": "message",
        "chat_id": chat_id,
        "recipient_id": recipient_id,
        "encrypted_content": encrypted,
        "client_timestamp": now()
    })

# Server - WebSocket Gateway
def handle_message(sender_ws, message):
    # 1. Generate message_id
    message_id = uuid.uuid4()
    server_timestamp = now()

    # 2. Store message
    cassandra.execute("""
        INSERT INTO messages (chat_id, message_id, timestamp, sender_id, encrypted_content)
        VALUES (?, ?, ?, ?, ?)
    """, message['chat_id'], message_id, server_timestamp,
         sender_ws.user_id, message['encrypted_content'])

    # 3. Send ACK to sender (message sent ✓)
    sender_ws.send({
        "type": "ack",
        "message_id": message_id,
        "status": "sent"
    })

    # 4. Deliver to recipient
    recipient_ws = connection_registry.get(message['recipient_id'])

    if recipient_ws and recipient_ws.is_connected():
        # Recipient online - deliver immediately
        recipient_ws.send({
            "type": "message",
            "message_id": message_id,
            "chat_id": message['chat_id'],
            "sender_id": sender_ws.user_id,
            "encrypted_content": message['encrypted_content'],
            "timestamp": server_timestamp
        })

        # Send delivery receipt to sender (message delivered ✓✓)
        sender_ws.send({
            "type": "delivery_receipt",
            "message_id": message_id,
            "status": "delivered"
        })
    else:
        # Recipient offline - queue for delivery
        kafka.publish("message-pending", {
            "message_id": message_id,
            "recipient_id": message['recipient_id']
        })

        # Send push notification
        send_push_notification(message['recipient_id'], {
            "title": "New message",
            "body": "You have a new message"  # Cannot show content (E2EE)
        })
```

### 2. Delivery and Read Receipts

```python
# Client (Bob) - When message received
def on_message_received(message):
    # 1. Display message
    display_message(message)

    # 2. Send delivery receipt
    ws.send({
        "type": "delivery_receipt",
        "message_id": message['message_id']
    })

# Client (Bob) - When message read (user opens chat)
def on_message_read(message):
    ws.send({
        "type": "read_receipt",
        "message_id": message['message_id']
    })

# Server - Forward receipts
def handle_receipt(message_id, status):
    # 1. Get original sender
    message = cassandra.execute("""
        SELECT sender_id FROM messages WHERE message_id = ?
    """, message_id)

    sender_id = message['sender_id']

    # 2. Forward receipt to sender
    sender_ws = connection_registry.get(sender_id)
    if sender_ws:
        sender_ws.send({
            "type": "receipt",
            "message_id": message_id,
            "status": status  # delivered or read
        })

    # 3. Update message status
    cassandra.execute("""
        UPDATE messages SET status = ?
        WHERE message_id = ?
    """, status, message_id)
```

## Presence Service (Online/Offline)

```python
# Redis data structure
# Key: user:{user_id}:presence
# Value: {status: "online", last_seen: timestamp}

def update_presence(user_id, status):
    """Called when user connects/disconnects."""

    if status == "online":
        redis.setex(f"user:{user_id}:presence", 3600, json.dumps({
            "status": "online",
            "last_seen": now()
        }))
    else:
        redis.set(f"user:{user_id}:presence", json.dumps({
            "status": "offline",
            "last_seen": now()
        }))

    # Notify contacts about presence change
    contacts = get_contacts(user_id)
    for contact_id in contacts:
        contact_ws = connection_registry.get(contact_id)
        if contact_ws:
            contact_ws.send({
                "type": "presence",
                "user_id": user_id,
                "status": status,
                "last_seen": now()
            })

def get_presence(user_id):
    """Get user's online status."""
    data = redis.get(f"user:{user_id}:presence")

    if not data:
        return {"status": "offline", "last_seen": None}

    presence = json.loads(data)

    # Check if still online (TTL not expired)
    if presence['status'] == 'online':
        if redis.ttl(f"user:{user_id}:presence") > 0:
            return presence
        else:
            return {"status": "offline", "last_seen": presence['last_seen']}

    return presence
```

**Design Critique:**

**Why Redis with TTL?**
- ✅ Fast reads (< 5ms)
- ✅ Automatic expiry (if client doesn't heartbeat, auto-offline)
- ✅ In-memory for low latency

**Why notify contacts?**
- ✅ Real-time presence updates
- ❌ Network overhead (if user has 1000 contacts)
- **Optimization:** Only notify if contact has chat open

## Group Messaging

### Approach 1: Fan-Out on Write

```python
def send_group_message(group_id, sender_id, message):
    # 1. Get group members
    members = get_group_members(group_id)  # e.g., 256 members

    # 2. Store message once
    message_id = uuid.uuid4()
    cassandra.execute("""
        INSERT INTO messages (chat_id, message_id, sender_id, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, group_id, message_id, sender_id, message, now())

    # 3. Deliver to each member
    for member_id in members:
        # Skip sender
        if member_id == sender_id:
            continue

        # Try immediate delivery
        member_ws = connection_registry.get(member_id)
        if member_ws:
            member_ws.send({
                "type": "message",
                "chat_id": group_id,
                "message_id": message_id,
                "sender_id": sender_id,
                "content": message
            })
        else:
            # Queue for later delivery
            kafka.publish("message-pending", {
                "message_id": message_id,
                "recipient_id": member_id
            })
```

**Pros:**
- ✅ Simple implementation
- ✅ Message stored once (efficient storage)
- ✅ Delivery guaranteed (via queue)

**Cons:**
- ❌ Slow for large groups (1000+ members)
- ❌ Sender waits for all deliveries

**Optimization:**
```python
# Async delivery via Kafka
kafka.publish("group-message", {
    "group_id": group_id,
    "message_id": message_id
})

# Workers deliver to members in parallel
```

### E2EE for Group Messages

**Challenge:** How to encrypt for 256 members?

**Approach: Sender Keys (Signal Protocol)**

```
1. Group creator generates group key
2. Group key encrypted with each member's public key
3. Message encrypted with group key (once)
4. Each member decrypts group key with their private key
5. Then decrypts message with group key

Message size = encrypted_message + (encrypted_group_key × num_members)
```

**Alternative: Pairwise Encryption**
```
Encrypt message 256 times (once per member)
More secure but 256x storage and bandwidth
```

WhatsApp uses sender keys for efficiency.

## Media Handling

```python
def send_media(chat_id, media_file):
    # 1. Client encrypts media locally
    encrypted_media = encrypt(media_file, shared_key)

    # 2. Upload to S3 (get presigned URL from server)
    presigned_url = get_upload_url(chat_id)
    upload_to_s3(presigned_url, encrypted_media)

    # 3. Send message with media URL
    send_message(chat_id, {
        "type": "media",
        "media_url": f"https://cdn.whatsapp.com/{file_id}",
        "media_type": "image",
        "thumbnail": base64_encode(thumbnail)  # Small preview
    })

# Recipient
def download_media(media_url):
    # 1. Download from CDN
    encrypted_media = download(media_url)

    # 2. Decrypt locally
    media_file = decrypt(encrypted_media, shared_key)

    return media_file
```

**Design Critique:**

**Why upload to S3 separately?**
- ✅ WebSocket not ideal for large files
- ✅ CDN caching for media
- ✅ Parallel upload (doesn't block WebSocket)

**Why send thumbnail in message?**
- ✅ Instant preview (no download)
- ✅ Better UX
- ❌ Larger message size

## Database Design

### PostgreSQL (Users, Contacts)

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_phone (phone_number)
);

CREATE TABLE contacts (
  user_id UUID REFERENCES users(user_id),
  contact_id UUID REFERENCES users(user_id),
  added_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (user_id, contact_id),
  INDEX idx_user (user_id)
);

CREATE TABLE groups (
  group_id UUID PRIMARY KEY,
  name VARCHAR(100),
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES groups(group_id),
  user_id UUID REFERENCES users(user_id),
  joined_at TIMESTAMP DEFAULT NOW(),
  role VARCHAR(20), -- admin, member

  PRIMARY KEY (group_id, user_id)
);
```

## API Design

```
POST /api/v1/messages
Authorization: Bearer <token>
Request:
{
  "chat_id": "abc123",
  "recipient_id": "user456",
  "encrypted_content": "base64_encrypted_blob",
  "media_url": null
}

GET /api/v1/messages/{chat_id}?limit=50&before={timestamp}
Response:
{
  "messages": [
    {
      "message_id": "msg123",
      "sender_id": "user456",
      "encrypted_content": "...",
      "timestamp": "2024-01-01T12:00:00Z",
      "status": "read"
    }
  ],
  "has_more": true
}

GET /api/v1/presence/{user_id}
Response:
{
  "status": "online",
  "last_seen": "2024-01-01T12:00:00Z"
}

POST /api/v1/media/upload-url
Response:
{
  "upload_url": "https://s3.amazonaws.com/whatsapp-media/presigned...",
  "file_id": "abc123"
}
```

## Scaling Strategies

### 1. WebSocket Gateway Clustering

```
50M concurrent connections
Per server: 50K connections (1 GB memory)
Servers needed: 50M ÷ 50K = 1,000 servers

Connection Registry (Redis Cluster):
- Key: user_id → gateway_server_id
- When message arrives, lookup recipient's server
- Route message to correct gateway
```

### 2. Message Sharding

```python
# Shard Cassandra by chat_id
def get_shard(chat_id):
    return hash(chat_id) % NUM_SHARDS

# Each shard handles subset of chats
# Messages for same chat always on same shard (locality)
```

### 3. Geo-Distributed Deployments

```
- US Region: Serves North America
- EU Region: Serves Europe
- Asia Region: Serves Asia

Users connect to nearest region (lowest latency)
Messages routed across regions if needed
```

## Bottlenecks & Solutions

### Bottleneck 1: WebSocket Connection Overhead

**Problem:** 50M connections × 1 KB = 50 GB memory

**Solutions:**
- Compress connection state
- Shared memory across connections
- Scale horizontally (1000+ servers)

### Bottleneck 2: Message Delivery Lag for Offline Users

**Problem:** User offline for hours → 1000s of messages queued

**Solutions:**
- Batch delivery on reconnection
- Sync protocol (delta sync)
- Limit message history fetched (last 7 days by default)

### Bottleneck 3: Group Message Fan-Out

**Problem:** 1000-member group → 1000 deliveries

**Solutions:**
- Async delivery via Kafka workers
- Prioritize active users (online members first)
- Rate limit group message sends

## Monitoring

```
Performance:
- Message latency: p50 < 100ms, p99 < 500ms
- WebSocket connection success rate: > 99%
- Message delivery rate: > 99.9%

Availability:
- Uptime: 99.99%
- WebSocket gateway uptime: 99.99%

Business:
- DAU: 500M
- Messages per user per day: 40
- Group message percentage: 60%

Alerts:
- Message latency p99 > 1s
- Connection drop rate > 1%
- Kafka lag > 10,000 messages
```

## Interview Talking Points

"The key challenge is real-time delivery at scale with E2EE. I'd use WebSocket for persistent connections, Cassandra for message storage (time-series, write-heavy), and Signal Protocol for E2EE. Trade-off is complexity of E2EE vs privacy. For groups, use sender keys to encrypt once per message vs once per member."
