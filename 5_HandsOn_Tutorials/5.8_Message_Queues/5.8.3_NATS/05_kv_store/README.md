# Tutorial 05: JetStream Key-Value Store

## Overview

NATS JetStream includes a built-in distributed Key-Value (KV) store built on top of streams. This provides a simple, fast, and distributed way to store configuration, feature flags, session data, or any key-value pairs with built-in versioning, TTL, and watchers. Unlike external KV stores like Redis or etcd, NATS KV is embedded in your messaging infrastructure.

## Learning Objectives

- Create and manage KV buckets
- Perform CRUD operations (Create, Read, Update, Delete)
- Watch for key changes in real-time
- Use key history and revisions
- Configure TTL (time-to-live) for keys
- Implement distributed configuration patterns
- Compare NATS KV with other KV stores

## Prerequisites

- Completed Tutorial 04 (JetStream)
- NATS server with JetStream enabled
- Python 3.8+ with nats-py
- Understanding of key-value stores

## Architecture

```
┌─────────────────────────────────────┐
│     JetStream KV Bucket "CONFIG"     │
│                                      │
│  Internally: Stream + Special Keys  │
│                                      │
│  Key: "app.timeout"                 │
│    Value: "30"                      │
│    Revision: 5                      │
│    History: [v1, v2, v3, v4, v5]   │
│                                      │
│  Key: "feature.new_ui"              │
│    Value: "enabled"                 │
│    Revision: 2                      │
│    TTL: 3600s                       │
└─────────────────────────────────────┘
         │
         ├──────┬──────┬──────┐
         ▼      ▼      ▼      ▼
      App-1  App-2  App-3  Watcher
      (get)  (put)  (get)  (watch)
```

## Step 1: Create KV Bucket

Create `create_kv_bucket.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    print("Creating KV bucket...\n")

    # Create KV bucket
    kv = await js.create_key_value(
        bucket="CONFIG",
        description="Application configuration",
        max_value_size=1024,  # 1KB max per value
        history=10,            # Keep last 10 revisions
        ttl=None,             # No TTL by default (keys don't expire)
    )

    print(f"✓ Created KV bucket: {kv.bucket}")

    # Get bucket info
    status = await kv.status()
    print(f"\nBucket Info:")
    print(f"  Bucket: {status.bucket}")
    print(f"  Values: {status.values}")
    print(f"  History: {status.history}")
    print(f"  TTL: {status.ttl}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Run it:

```bash
python create_kv_bucket.py

# Or use NATS CLI
nats kv add CONFIG --history 10
```

## Step 2: Basic CRUD Operations

Create `kv_crud.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Get or create KV bucket
    try:
        kv = await js.key_value("CONFIG")
    except:
        kv = await js.create_key_value("CONFIG")

    print("=== CREATE ===\n")

    # PUT - Create/Update key
    rev1 = await kv.put("app.timeout", b"30")
    print(f"Put 'app.timeout' = '30', revision: {rev1}")

    rev2 = await kv.put("app.max_connections", b"100")
    print(f"Put 'app.max_connections' = '100', revision: {rev2}")

    rev3 = await kv.put("feature.new_ui", b"enabled")
    print(f"Put 'feature.new_ui' = 'enabled', revision: {rev3}")

    print("\n=== READ ===\n")

    # GET - Retrieve key
    entry = await kv.get("app.timeout")
    print(f"Get 'app.timeout':")
    print(f"  Value: {entry.value.decode()}")
    print(f"  Revision: {entry.revision}")
    print(f"  Created: {entry.created}")

    print("\n=== UPDATE ===\n")

    # UPDATE - Put updates existing key
    rev4 = await kv.put("app.timeout", b"60")
    print(f"Updated 'app.timeout' = '60', revision: {rev4}")

    # Verify update
    entry = await kv.get("app.timeout")
    print(f"New value: {entry.value.decode()}, revision: {entry.revision}")

    print("\n=== DELETE ===\n")

    # DELETE - Remove key
    await kv.delete("feature.new_ui")
    print("Deleted 'feature.new_ui'")

    # Verify deletion
    try:
        entry = await kv.get("feature.new_ui")
        print(f"Entry still exists but marked deleted: {entry.value is None}")
    except Exception as e:
        print(f"Entry not found: {e}")

    print("\n=== LIST KEYS ===\n")

    # List all keys
    keys = await kv.keys()
    print(f"Keys in bucket: {keys}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 3: History and Revisions

Create `kv_history.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    kv = await js.key_value("CONFIG")

    print("Creating version history for 'app.timeout'...\n")

    # Create multiple revisions
    values = ["10", "20", "30", "40", "50"]

    for value in values:
        rev = await kv.put("app.timeout", value.encode())
        print(f"Revision {rev}: app.timeout = {value}")

    print("\n=== HISTORY ===\n")

    # Get history of key
    history = []
    async for entry in await kv.history("app.timeout"):
        history.append(entry)
        print(f"Revision {entry.revision}:")
        print(f"  Value: {entry.value.decode() if entry.value else 'DELETED'}")
        print(f"  Created: {entry.created}")
        print(f"  Operation: {entry.operation}")

    print(f"\nTotal revisions: {len(history)}")

    # Get current value
    current = await kv.get("app.timeout")
    print(f"\nCurrent value: {current.value.decode()}")
    print(f"Current revision: {current.revision}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 4: Watch for Changes

Watchers let you receive real-time notifications when keys change.

Create `kv_watcher.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    kv = await js.key_value("CONFIG")

    print("Starting watcher for all keys...\n")

    # Watch all keys
    watcher = await kv.watchall()

    async def watch_updates():
        """Process watch updates"""
        async for entry in watcher:
            if entry is None:
                continue

            print(f"[WATCH] Key: {entry.key}")
            print(f"  Value: {entry.value.decode() if entry.value else 'DELETED'}")
            print(f"  Revision: {entry.revision}")
            print(f"  Operation: {entry.operation}")
            print()

    # Run watcher in background
    watch_task = asyncio.create_task(watch_updates())

    # Simulate updates
    await asyncio.sleep(2)

    print("Making changes to KV store...\n")

    await kv.put("app.timeout", b"100")
    await asyncio.sleep(1)

    await kv.put("app.max_connections", b"500")
    await asyncio.sleep(1)

    await kv.put("feature.dark_mode", b"enabled")
    await asyncio.sleep(1)

    await kv.delete("feature.dark_mode")
    await asyncio.sleep(2)

    # Stop watcher
    await watcher.stop()
    watch_task.cancel()

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Create `kv_specific_watcher.py` to watch specific keys:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    kv = await js.key_value("CONFIG")

    print("Watching for changes to 'app.timeout'...\n")

    # Watch specific key
    watcher = await kv.watch("app.timeout")

    count = 0

    async for entry in watcher:
        if entry is None:
            continue

        count += 1
        value = entry.value.decode() if entry.value else "DELETED"
        print(f"[{count}] app.timeout changed to: {value} (rev {entry.revision})")

        if count >= 5:  # Stop after 5 updates
            break

    await watcher.stop()
    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 5: TTL (Time-to-Live)

Create `kv_with_ttl.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    print("Creating KV bucket with TTL...\n")

    # Create bucket with TTL
    kv = await js.create_key_value(
        bucket="SESSION",
        description="User sessions with TTL",
        ttl=10,  # 10 seconds TTL
        history=1
    )

    print(f"✓ Created bucket 'SESSION' with 10s TTL\n")

    # Add session data
    await kv.put("session.user123", b"token-abc-xyz")
    print("Put session.user123")

    # Get immediately
    entry = await kv.get("session.user123")
    print(f"Value: {entry.value.decode()}\n")

    print("Waiting 5 seconds...")
    await asyncio.sleep(5)

    # Still exists
    entry = await kv.get("session.user123")
    print(f"After 5s - Value: {entry.value.decode()}\n")

    print("Waiting another 6 seconds (11s total)...")
    await asyncio.sleep(6)

    # Should be deleted by TTL
    try:
        entry = await kv.get("session.user123")
        print(f"Value: {entry.value}")
    except Exception as e:
        print(f"Key expired (TTL): {e}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 6: Distributed Configuration Example

Create `config_manager.py`:

```python
import asyncio
import nats
import json

class ConfigManager:
    """Distributed configuration manager using NATS KV"""

    def __init__(self, nc, bucket_name="APP_CONFIG"):
        self.nc = nc
        self.bucket_name = bucket_name
        self.kv = None
        self.cache = {}
        self.watcher = None

    async def initialize(self):
        """Initialize KV bucket"""
        js = self.nc.jetstream()

        try:
            self.kv = await js.key_value(self.bucket_name)
        except:
            self.kv = await js.create_key_value(
                bucket=self.bucket_name,
                history=5
            )

        # Start watching for changes
        self.watcher = await self.kv.watchall()
        asyncio.create_task(self._watch_changes())

    async def _watch_changes(self):
        """Watch for configuration changes"""
        async for entry in self.watcher:
            if entry is None:
                continue

            key = entry.key
            if entry.value:
                value = entry.value.decode()
                self.cache[key] = value
                print(f"[CONFIG UPDATE] {key} = {value}")
            else:
                self.cache.pop(key, None)
                print(f"[CONFIG DELETE] {key}")

    async def set(self, key, value):
        """Set configuration value"""
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        await self.kv.put(key, str(value).encode())

    async def get(self, key, default=None):
        """Get configuration value"""
        try:
            entry = await self.kv.get(key)
            value = entry.value.decode()

            # Try to parse as JSON
            try:
                return json.loads(value)
            except:
                return value
        except:
            return default

    async def delete(self, key):
        """Delete configuration value"""
        await self.kv.delete(key)

    async def get_all(self):
        """Get all configuration values"""
        config = {}
        keys = await self.kv.keys()

        for key in keys:
            try:
                value = await self.get(key)
                config[key] = value
            except:
                pass

        return config

    async def close(self):
        """Close watcher and connection"""
        if self.watcher:
            await self.watcher.stop()


async def main():
    nc = await nats.connect("nats://localhost:4222")

    # Create config manager
    config = ConfigManager(nc)
    await config.initialize()

    print("Configuration Manager initialized\n")

    # Set configuration values
    await config.set("database.host", "localhost")
    await config.set("database.port", 5432)
    await config.set("features", {"dark_mode": True, "beta": False})
    await config.set("max_connections", 100)

    await asyncio.sleep(1)

    # Get configuration values
    print("\n=== Reading Configuration ===\n")
    db_host = await config.get("database.host")
    print(f"database.host: {db_host}")

    features = await config.get("features")
    print(f"features: {features}")

    # Get all config
    print("\n=== All Configuration ===\n")
    all_config = await config.get_all()
    for key, value in all_config.items():
        print(f"  {key}: {value}")

    # Update value
    print("\n=== Updating Configuration ===\n")
    await config.set("max_connections", 200)

    await asyncio.sleep(1)

    # Clean up
    await config.close()
    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 7: Feature Flags System

Create `feature_flags.py`:

```python
import asyncio
import nats

class FeatureFlags:
    """Feature flag management with NATS KV"""

    def __init__(self, nc):
        self.nc = nc
        self.kv = None

    async def initialize(self):
        """Initialize feature flags bucket"""
        js = self.nc.jetstream()

        try:
            self.kv = await js.key_value("FEATURE_FLAGS")
        except:
            self.kv = await js.create_key_value(
                bucket="FEATURE_FLAGS",
                description="Feature flags",
                history=10
            )

    async def enable(self, feature_name):
        """Enable a feature"""
        await self.kv.put(f"feature.{feature_name}", b"enabled")
        print(f"✓ Enabled feature: {feature_name}")

    async def disable(self, feature_name):
        """Disable a feature"""
        await self.kv.put(f"feature.{feature_name}", b"disabled")
        print(f"✗ Disabled feature: {feature_name}")

    async def is_enabled(self, feature_name):
        """Check if feature is enabled"""
        try:
            entry = await self.kv.get(f"feature.{feature_name}")
            return entry.value.decode() == "enabled"
        except:
            return False  # Default: disabled

    async def list_features(self):
        """List all features and their status"""
        keys = await self.kv.keys()
        features = {}

        for key in keys:
            if key.startswith("feature."):
                feature_name = key.replace("feature.", "")
                enabled = await self.is_enabled(feature_name)
                features[feature_name] = enabled

        return features


async def main():
    nc = await nats.connect("nats://localhost:4222")

    ff = FeatureFlags(nc)
    await ff.initialize()

    print("Feature Flags System\n")

    # Enable features
    await ff.enable("dark_mode")
    await ff.enable("new_ui")
    await ff.enable("beta_api")

    # Disable one
    await ff.disable("beta_api")

    print("\n=== Feature Status ===\n")

    # Check features
    dark_mode = await ff.is_enabled("dark_mode")
    print(f"Dark Mode: {'✓ Enabled' if dark_mode else '✗ Disabled'}")

    new_ui = await ff.is_enabled("new_ui")
    print(f"New UI: {'✓ Enabled' if new_ui else '✗ Disabled'}")

    beta_api = await ff.is_enabled("beta_api")
    print(f"Beta API: {'✓ Enabled' if beta_api else '✗ Disabled'}")

    # List all features
    print("\n=== All Features ===\n")
    features = await ff.list_features()
    for name, enabled in features.items():
        status = "✓ Enabled" if enabled else "✗ Disabled"
        print(f"  {name}: {status}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Use Cases

### 1. Distributed Configuration
```python
# Share config across microservices
await kv.put("db.connection_string", connection.encode())
await kv.put("api.rate_limit", b"1000")
```

### 2. Service Discovery
```python
# Register services
await kv.put("service.api.instance1", b"http://10.0.1.5:8080")
await kv.put("service.api.instance2", b"http://10.0.1.6:8080")
```

### 3. Session Storage
```python
# Store user sessions
kv_session = await js.create_key_value("SESSIONS", ttl=3600)
await kv_session.put(f"session.{user_id}", token.encode())
```

### 4. Distributed Locks
```python
# Simple distributed locking
try:
    await kv.create("lock.resource1", b"locked")
    # Do work
finally:
    await kv.delete("lock.resource1")
```

## NATS KV vs Other KV Stores

| Feature | NATS KV | Redis | etcd |
|---------|---------|-------|------|
| **Integration** | Built-in | External | External |
| **Consistency** | Eventually consistent | Depends | Strong |
| **Versioning** | Built-in | No | Yes |
| **Watch** | Yes | Pub/Sub | Yes |
| **TTL** | Yes | Yes | Yes |
| **Clustering** | Via JetStream | Yes | Yes |
| **Use Case** | Config, flags | Cache, queues | Config, coordination |

## Best Practices

1. **Bucket Design**
   - Use separate buckets for different concerns
   - Set appropriate history limits
   - Use TTL for ephemeral data

2. **Key Naming**
   - Use hierarchical naming: `app.service.config`
   - Keep keys under 256 characters
   - Use consistent naming conventions

3. **Performance**
   - Cache frequently accessed values
   - Use watchers for real-time updates
   - Avoid excessive history depth

4. **Security**
   - Use NATS accounts for multi-tenancy
   - Implement access controls
   - Encrypt sensitive values before storing

## Troubleshooting

### Bucket Not Found
```bash
# List all buckets
nats kv ls

# Check bucket status
nats kv status CONFIG
```

### Key Not Found
```python
try:
    entry = await kv.get("missing.key")
except Exception as e:
    print(f"Key not found: {e}")
```

## Summary

You've learned:
- ✅ KV bucket creation and management
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Real-time key watchers
- ✅ History and versioning
- ✅ TTL configuration
- ✅ Distributed configuration patterns
- ✅ Feature flag systems

## Next Steps

- **Tutorial 06**: Object Store for large payloads
- **Tutorial 07**: Clustering for high availability

---

**Estimated Time**: 2-3 hours
**Difficulty**: Intermediate
