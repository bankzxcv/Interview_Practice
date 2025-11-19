# Tutorial 02: Request-Reply Pattern

## Overview

Request-reply is a fundamental messaging pattern for building RPC-style microservices. NATS makes this pattern simple and efficient by providing built-in support for request-reply semantics. Unlike traditional HTTP REST APIs, NATS request-reply is lightweight, supports automatic load balancing, and can work across distributed clusters.

## Learning Objectives

- Implement request-reply (RPC) pattern in NATS
- Build synchronous and asynchronous request handlers
- Handle timeouts and errors gracefully
- Create multiple responders for load balancing
- Understand use cases for microservices
- Compare with HTTP-based RPC
- Test fault tolerance scenarios

## Prerequisites

- Completed Tutorial 01 (Basic Pub/Sub)
- NATS server running (Docker)
- Python 3.8+ with nats-py installed
- Understanding of async/await

## Architecture

```
┌────────────┐   1. Request    ┌──────────────┐
│  Client A  │───────────────> │ NATS Server  │
└────────────┘                 └──────────────┘
      ▲                               │
      │                               │ 2. Routes to
      │                               │    responder
      │                               ▼
      │                        ┌──────────────┐
      │                        │ Responder 1  │
      │                        │ (Service A)  │
      │ 4. Reply               └──────────────┘
      │    returned                   │
      │                               │ 3. Sends
      └───────────────────────────────┘    reply

Subject Pattern:
  Request: "service.method" (e.g., "user.get")
  Reply:   "_INBOX.{unique-id}" (auto-generated)
```

## How Request-Reply Works

1. **Client** sends request to a subject (e.g., `user.get`)
2. **Client** generates unique reply subject (e.g., `_INBOX.abc123`)
3. **Responder** receives request with reply subject
4. **Responder** processes and publishes response to reply subject
5. **Client** receives response on unique inbox
6. **Cleanup** happens automatically

## Step 1: Basic Request-Reply

### Responder (Server)

Create `responder.py`:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("User Service - Responder started")
    print("Listening on: user.get")

    async def request_handler(msg):
        # Parse request
        subject = msg.subject
        reply = msg.reply
        data = json.loads(msg.data.decode())

        print(f"\n[Request] Subject: {subject}")
        print(f"  Data: {data}")
        print(f"  Reply to: {reply}")

        # Simulate database lookup
        user_id = data.get("user_id")
        await asyncio.sleep(0.1)  # Simulate processing

        # Create response
        response = {
            "user_id": user_id,
            "name": f"User {user_id}",
            "email": f"user{user_id}@example.com",
            "status": "active"
        }

        # Send reply
        await nc.publish(reply, json.dumps(response).encode())
        print(f"  [Response sent]")

    # Subscribe to request subject
    await nc.subscribe("user.get", cb=request_handler)

    print("\nWaiting for requests (Ctrl+C to exit)...")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

### Requester (Client)

Create `requester.py`:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("User Service - Client")

    # Make request
    request = {
        "user_id": 12345
    }

    print(f"\nSending request: {request}")

    try:
        # Send request and wait for response (default 1 second timeout)
        response = await nc.request(
            "user.get",
            json.dumps(request).encode(),
            timeout=2  # 2 second timeout
        )

        # Parse response
        user_data = json.loads(response.data.decode())
        print(f"\nResponse received:")
        print(f"  User ID: {user_data['user_id']}")
        print(f"  Name: {user_data['name']}")
        print(f"  Email: {user_data['email']}")
        print(f"  Status: {user_data['status']}")

    except asyncio.TimeoutError:
        print("ERROR: Request timed out (no responder available)")
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Run them:

```bash
# Terminal 1 - Start responder
python responder.py

# Terminal 2 - Make request
python requester.py
```

## Step 2: Multiple Concurrent Requests

Create `concurrent_requests.py`:

```python
import asyncio
import nats
import json
import time

async def make_request(nc, user_id):
    """Make a single request"""
    request = {"user_id": user_id}

    start = time.time()
    response = await nc.request(
        "user.get",
        json.dumps(request).encode(),
        timeout=2
    )
    duration = time.time() - start

    user_data = json.loads(response.data.decode())
    print(f"User {user_id}: {user_data['name']} ({duration:.3f}s)")

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("Making 10 concurrent requests...")

    start = time.time()

    # Make 10 requests concurrently
    tasks = [make_request(nc, i) for i in range(1, 11)]
    await asyncio.gather(*tasks)

    total_time = time.time() - start
    print(f"\nTotal time: {total_time:.3f}s")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 3: Multiple Responders (Load Balancing)

NATS automatically load-balances requests across multiple responders.

Create `multiple_responders.py`:

```python
import asyncio
import nats
import json
import sys

async def run_responder(responder_id):
    nc = await nats.connect("nats://localhost:4222")

    print(f"[Responder {responder_id}] Started")

    async def handler(msg):
        data = json.loads(msg.data.decode())
        print(f"[Responder {responder_id}] Processing user_id: {data['user_id']}")

        # Simulate processing
        await asyncio.sleep(0.1)

        response = {
            "user_id": data["user_id"],
            "name": f"User {data['user_id']}",
            "processed_by": f"Responder-{responder_id}"
        }

        await nc.publish(msg.reply, json.dumps(response).encode())

    await nc.subscribe("user.get", cb=handler)
    await asyncio.Future()

async def main():
    responder_id = sys.argv[1] if len(sys.argv) > 1 else "1"

    try:
        await run_responder(responder_id)
    except KeyboardInterrupt:
        print(f"\n[Responder {responder_id}] Shutting down")

if __name__ == '__main__':
    asyncio.run(main())
```

Run multiple responders:

```bash
# Terminal 1
python multiple_responders.py 1

# Terminal 2
python multiple_responders.py 2

# Terminal 3
python multiple_responders.py 3

# Terminal 4 - Make concurrent requests
python concurrent_requests.py
```

You'll see requests distributed across all responders.

## Step 4: Error Handling and Validation

Create `robust_responder.py`:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("Robust User Service - Started")

    async def handler(msg):
        try:
            # Parse request
            data = json.loads(msg.data.decode())

            # Validate request
            if "user_id" not in data:
                error_response = {
                    "error": "Missing required field: user_id",
                    "status": "error"
                }
                await nc.publish(msg.reply, json.dumps(error_response).encode())
                return

            user_id = data["user_id"]

            # Validate user_id
            if not isinstance(user_id, int) or user_id <= 0:
                error_response = {
                    "error": "Invalid user_id: must be positive integer",
                    "status": "error"
                }
                await nc.publish(msg.reply, json.dumps(error_response).encode())
                return

            # Simulate database lookup
            await asyncio.sleep(0.1)

            # Simulate user not found
            if user_id > 1000:
                error_response = {
                    "error": f"User {user_id} not found",
                    "status": "not_found"
                }
                await nc.publish(msg.reply, json.dumps(error_response).encode())
                return

            # Success response
            response = {
                "user_id": user_id,
                "name": f"User {user_id}",
                "email": f"user{user_id}@example.com",
                "status": "success"
            }

            await nc.publish(msg.reply, json.dumps(response).encode())
            print(f"✓ Processed user_id: {user_id}")

        except json.JSONDecodeError:
            error_response = {
                "error": "Invalid JSON in request",
                "status": "error"
            }
            await nc.publish(msg.reply, json.dumps(error_response).encode())

        except Exception as e:
            error_response = {
                "error": f"Internal server error: {str(e)}",
                "status": "error"
            }
            await nc.publish(msg.reply, json.dumps(error_response).encode())

    await nc.subscribe("user.get", cb=handler)

    print("Waiting for requests...\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Create `test_errors.py`:

```python
import asyncio
import nats
import json

async def test_request(nc, request, description):
    print(f"\nTest: {description}")
    print(f"  Request: {request}")

    try:
        response = await nc.request(
            "user.get",
            json.dumps(request).encode(),
            timeout=2
        )
        result = json.loads(response.data.decode())
        print(f"  Response: {result}")
    except asyncio.TimeoutError:
        print("  Response: TIMEOUT")

async def main():
    nc = await nats.connect("nats://localhost:4222")

    # Test cases
    await test_request(nc, {"user_id": 42}, "Valid request")
    await test_request(nc, {}, "Missing user_id")
    await test_request(nc, {"user_id": -5}, "Invalid user_id (negative)")
    await test_request(nc, {"user_id": "abc"}, "Invalid user_id (string)")
    await test_request(nc, {"user_id": 1001}, "User not found")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 5: Microservices Example

Create a simple microservices architecture with authentication and user services.

### Auth Service

Create `auth_service.py`:

```python
import asyncio
import nats
import json
import hashlib

# Fake user database
USERS = {
    "admin": "password123",
    "user1": "secret",
}

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("Auth Service - Started")

    async def authenticate(msg):
        data = json.loads(msg.data.decode())
        username = data.get("username")
        password = data.get("password")

        print(f"Auth request: {username}")

        # Verify credentials
        if username in USERS and USERS[username] == password:
            response = {
                "authenticated": True,
                "username": username,
                "token": hashlib.sha256(username.encode()).hexdigest()[:16]
            }
        else:
            response = {
                "authenticated": False,
                "error": "Invalid credentials"
            }

        await nc.publish(msg.reply, json.dumps(response).encode())

    await nc.subscribe("auth.login", cb=authenticate)
    print("Listening on: auth.login\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

### User Service (with Auth)

Create `user_service_with_auth.py`:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    print("User Service - Started")

    async def get_user(msg):
        data = json.loads(msg.data.decode())
        token = data.get("token")
        user_id = data.get("user_id")

        # Verify token by calling auth service
        auth_check = {"token": token}

        try:
            auth_response = await nc.request(
                "auth.verify",
                json.dumps(auth_check).encode(),
                timeout=1
            )
            auth_data = json.loads(auth_response.data.decode())

            if not auth_data.get("valid"):
                response = {"error": "Unauthorized"}
                await nc.publish(msg.reply, json.dumps(response).encode())
                return

        except asyncio.TimeoutError:
            response = {"error": "Auth service unavailable"}
            await nc.publish(msg.reply, json.dumps(response).encode())
            return

        # Return user data
        response = {
            "user_id": user_id,
            "name": f"User {user_id}",
            "email": f"user{user_id}@example.com"
        }

        await nc.publish(msg.reply, json.dumps(response).encode())

    await nc.subscribe("user.get", cb=get_user)
    print("Listening on: user.get\n")

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 6: Timeout Strategies

Create `timeout_examples.py`:

```python
import asyncio
import nats
import json

async def main():
    nc = await nats.connect("nats://localhost:4222")

    # Strategy 1: Fixed timeout
    print("\n1. Fixed timeout (2 seconds)")
    try:
        response = await nc.request("slow.service", b"request", timeout=2)
        print("  Response received")
    except asyncio.TimeoutError:
        print("  Timeout occurred")

    # Strategy 2: Retry with exponential backoff
    print("\n2. Retry with exponential backoff")
    for attempt in range(3):
        timeout = 1 * (2 ** attempt)  # 1s, 2s, 4s
        print(f"  Attempt {attempt + 1} (timeout: {timeout}s)")
        try:
            response = await nc.request("user.get", b'{"user_id": 1}', timeout=timeout)
            print("  Success!")
            break
        except asyncio.TimeoutError:
            print("  Timeout")
            if attempt == 2:
                print("  Max retries reached")

    # Strategy 3: Fallback response
    print("\n3. Fallback response on timeout")
    try:
        response = await nc.request("user.get", b'{"user_id": 1}', timeout=1)
        data = json.loads(response.data.decode())
    except asyncio.TimeoutError:
        print("  Using cached/default response")
        data = {"user_id": 1, "name": "Default User", "cached": True}

    print(f"  Result: {data}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Use Cases for Request-Reply

### 1. Microservices API
```
API Gateway ──request──> User Service
            <──reply───

Subject: "api.users.get"
Pattern: RPC-style service calls
```

### 2. Database Queries
```
App ──query──> Database Service
    <──result──

Subject: "db.query"
Pattern: Centralized database access
```

### 3. Distributed Caching
```
App ──lookup──> Cache Service
    <──value───

Subject: "cache.get"
Pattern: High-speed data retrieval
```

### 4. Health Checks
```
Monitor ──ping──> Service
        <──pong──

Subject: "service.health"
Pattern: Service monitoring
```

## Best Practices

1. **Timeout Configuration**
   - Set realistic timeouts based on SLAs
   - Implement retry logic with backoff
   - Use circuit breaker pattern for failing services

2. **Error Handling**
   - Always validate request data
   - Return meaningful error messages
   - Use status codes in responses

3. **Performance**
   - Keep request/response payloads small
   - Use queue groups for load balancing
   - Monitor request latencies

4. **Subject Naming**
   - Use clear, hierarchical names: `service.method`
   - Examples: `user.get`, `order.create`, `payment.process`

## NATS vs HTTP for RPC

| Aspect | NATS Request-Reply | HTTP REST |
|--------|-------------------|-----------|
| **Latency** | <1ms | 5-50ms |
| **Load Balancing** | Automatic | Requires load balancer |
| **Discovery** | Subject-based | Service registry needed |
| **Connection** | Persistent | Per-request |
| **Overhead** | Minimal | Headers/TLS handshake |
| **Streaming** | Built-in | Limited |

## Exercises

### Exercise 1: Calculator Service
Build a calculator service that responds to `calc.add`, `calc.subtract`, `calc.multiply`, `calc.divide` with proper error handling for division by zero.

### Exercise 2: Chain Requests
Create a workflow where Service A requests data from Service B, which in turn requests from Service C. Implement proper timeout and error handling.

### Exercise 3: Health Monitoring
Build a health check system where a monitor pings multiple services and reports their status.

## Troubleshooting

### No Response Received
- Ensure responder is running
- Check subject names match exactly
- Verify timeout is sufficient

### Timeout Errors
- Increase timeout value
- Check responder processing time
- Verify network connectivity

## Summary

You've learned:
- ✅ Request-reply (RPC) pattern implementation
- ✅ Synchronous and asynchronous request handling
- ✅ Timeout handling and retry strategies
- ✅ Multiple responders for load balancing
- ✅ Microservices communication patterns
- ✅ Error handling and validation

## Next Steps

- **Tutorial 03**: Queue groups for advanced load balancing
- **Tutorial 04**: JetStream for guaranteed delivery

---

**Estimated Time**: 2-3 hours
**Difficulty**: Beginner to Intermediate
