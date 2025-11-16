# Design Dropbox/Google Drive

## Problem Statement

Design a cloud file storage and synchronization service like Dropbox or Google Drive that allows users to store files, sync across devices, share with others, and handle conflict resolution.

## Requirements Clarification

### Functional Requirements

- Upload/download files
- Automatic sync across devices
- File sharing (view, edit permissions)
- File versioning
- Conflict resolution (offline edits)
- Desktop/mobile/web clients
- Real-time collaboration (multiple users editing)

### Non-Functional Requirements

- **High availability**: 99.99% uptime
- **Low latency**: Sync within seconds
- **Consistency**: Strong for metadata, eventual for file content
- **Scale**: 500M users, 1B files, 10 PB total storage
- **Reliability**: No data loss (99.999999999% durability)
- **Bandwidth optimization**: Delta sync (only changed blocks)

### Out of Scope

- Document editing (Google Docs functionality)
- Third-party integrations
- Team admin features

## Capacity Estimation

### Users & Storage

```
Users:
- 500M total users
- 100M daily active users (DAU)
- Average 2 devices per user (desktop + mobile)

Files:
- 1B files total
- Average file size: 10 KB (many small files)
- Total: 1B × 10 KB = 10 PB

Storage Distribution:
- 90% users: < 10 GB (free tier)
- 9% users: 10-100 GB
- 1% users: 100-1000 GB (power users)

Daily Activity:
- 10% of users upload/modify files daily
- 10M users × 5 files/day = 50M file operations/day
- Per second: 50M ÷ 86,400 = ~580 ops/sec
- Peak (3x): ~1,700 ops/sec
```

### Bandwidth

```
Uploads:
- 50M files/day × 100 KB average = 5 TB/day
- Per second: 5 TB ÷ 86,400 = 58 MB/sec

Downloads (2x uploads due to sync):
- 10 TB/day = 116 MB/sec

With delta sync (only changed blocks):
- Reduction: 80% (only 20% of file changed on average)
- Actual: 23 MB/sec upload, 46 MB/sec download
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
│  (Desktop Sync, Mobile App, Web Browser)                     │
│  - File watcher (detect local changes)                       │
│  - Sync engine (upload/download)                             │
│  - Conflict resolver                                         │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                     API Gateway / LB                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────────────────────────────────┐
       │                                                │
┌──────▼──────────┐                          ┌─────────▼─────────┐
│  Metadata       │                          │  Block Storage    │
│  Service        │                          │  Service          │
│  (File info,    │                          │  (Chunking,       │
│   permissions)  │                          │   Deduplication)  │
└──────┬──────────┘                          └─────────┬─────────┘
       │                                                │
       │                                        ┌───────▼──────────┐
       │                                        │  S3 / Object     │
       │                                        │  Storage         │
       │                                        └──────────────────┘
       │
┌──────▼─────────────────────────────────────────────────────────┐
│               Message Queue (Kafka / SQS)                       │
│  Topics: file-uploaded, file-modified, sync-needed             │
└──────┬─────────────────────────────────────────────────────────┘
       │
       ├─────────────┬─────────────────┬──────────────────┐
       │             │                 │                  │
┌──────▼──────┐ ┌────▼──────┐  ┌──────▼─────────┐  ┌────▼───────┐
│  Sync       │ │  Notif.   │  │  Version       │  │  Indexing  │
│  Coordinator│ │  Service  │  │  Service       │  │  Service   │
└─────────────┘ └───────────┘  └────────────────┘  └────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │  S3 / Blob   │  │  Redis Cache │       │
│  │ (Metadata,   │  │  (File       │  │ (Active      │       │
│  │  Users,      │  │   Blocks)    │  │  Sessions)   │       │
│  │  Sharing)    │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: Block-Level Storage (Chunking)

**Why?**
- Large files (1 GB) shouldn't be re-uploaded entirely for small changes
- Save bandwidth and storage
- Enable deduplication

**How it works:**

```python
# Split file into fixed-size blocks (4 MB each)
def chunk_file(file_path, chunk_size=4 * 1024 * 1024):
    """Split file into chunks and compute hashes."""
    chunks = []

    with open(file_path, 'rb') as f:
        chunk_index = 0
        while True:
            data = f.read(chunk_size)
            if not data:
                break

            # Compute hash (SHA-256)
            chunk_hash = hashlib.sha256(data).hexdigest()

            chunks.append({
                'index': chunk_index,
                'hash': chunk_hash,
                'size': len(data)
            })

            chunk_index += 1

    return chunks

# Example: 100 MB file → 25 chunks of 4 MB each
```

**Upload Process:**

```python
def upload_file(file_path):
    # 1. Chunk file locally
    chunks = chunk_file(file_path)

    # 2. Ask server which chunks already exist (deduplication)
    response = api.post('/files/prepare-upload', {
        'filename': os.path.basename(file_path),
        'chunks': chunks
    })

    missing_chunks = response['missing_chunks']  # Hashes not in server

    # 3. Upload only missing chunks
    for chunk in chunks:
        if chunk['hash'] in missing_chunks:
            data = read_chunk(file_path, chunk['index'])
            s3.upload(f"chunks/{chunk['hash']}", data)

    # 4. Commit file metadata
    api.post('/files/commit', {
        'filename': os.path.basename(file_path),
        'chunks': chunks  # List of hashes in order
    })
```

**Pros:**
- ✅ Bandwidth optimization (only upload changed chunks)
- ✅ Storage deduplication (same chunk stored once)
- ✅ Fast sync for large files
- ✅ Efficient versioning (store delta only)

**Cons:**
- ❌ Complexity (chunking, reassembly)
- ❌ More metadata to track
- ❌ Small files have overhead (< 4 MB)

**When to use:**
- Large files common (> 10 MB)
- Incremental updates frequent
- Storage/bandwidth cost important

**Alternative:**
- Whole-file storage: simpler but wastes bandwidth

### Decision 2: Metadata in SQL, Content in Object Storage

**Why PostgreSQL for metadata?**
- ACID transactions (sharing permissions, ownership)
- Complex queries (search, filtering)
- Relationships (users, files, folders, shares)

**Why S3 for file blocks?**
- Blob storage (key-value, no structure needed)
- 11 9's durability (99.999999999%)
- Unlimited scale
- Lifecycle policies (archival to Glacier)

**Pros:**
- ✅ Right tool for each use case
- ✅ PostgreSQL: strong consistency for critical metadata
- ✅ S3: cheap, durable, scalable for blobs

**Cons:**
- ❌ Two systems to manage
- ❌ Need to maintain consistency between them

**When to use:**
- Structured metadata + unstructured blobs
- Different consistency requirements
- Scale beyond single database

### Decision 3: File Versioning

**Why?**
- Users accidentally delete/overwrite files
- Rollback to previous version
- Collaboration requires history

**Approach:**

```sql
CREATE TABLE files (
  file_id UUID PRIMARY KEY,
  user_id UUID,
  path VARCHAR(500),  -- e.g., "/Documents/report.pdf"
  current_version_id UUID,  -- Points to latest version
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE file_versions (
  version_id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(file_id),
  version_number INT,
  size_bytes BIGINT,
  chunk_hashes TEXT[],  -- Array of chunk hashes
  created_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_file_versions ON file_versions(file_id, version_number DESC);
```

**Storage:**

```
Version 1: [chunk_A, chunk_B, chunk_C]
Version 2: [chunk_A, chunk_D, chunk_C]  (only chunk_B changed to chunk_D)

Storage: chunk_A, chunk_B, chunk_C, chunk_D (4 chunks, not 6)
Deduplication saves space!
```

**Pros:**
- ✅ Safety (can recover deleted files)
- ✅ Audit trail (who changed what when)
- ✅ With chunking, versions are cheap (only delta stored)

**Cons:**
- ❌ Storage grows over time
- ❌ Complexity in version management

**Optimization:**
- Limit versions (last 30 days only)
- Compress old versions
- Lifecycle policy (move to cold storage)

## Sync Algorithm

### Problem: Multi-Device Sync

```
User has:
- Desktop (Device A)
- Laptop (Device B)
- Phone (Device C)

Scenario:
1. User edits file on Desktop (offline)
2. User edits same file on Laptop (offline)
3. Both come online → conflict!
```

### Sync Protocol

```python
# Each device maintains:
# - Local file system
# - Local metadata DB (SQLite)
# - Sync state (last known server state)

class SyncEngine:
    def sync(self):
        # 1. Get changes from server since last sync
        last_sync_time = self.get_last_sync_time()
        server_changes = api.get_changes(since=last_sync_time)

        # 2. Get local changes since last sync
        local_changes = self.get_local_changes()

        # 3. Detect conflicts
        conflicts = self.detect_conflicts(server_changes, local_changes)

        # 4. Resolve conflicts
        for conflict in conflicts:
            self.resolve_conflict(conflict)

        # 5. Apply server changes locally
        for change in server_changes:
            self.apply_server_change(change)

        # 6. Upload local changes to server
        for change in local_changes:
            self.upload_local_change(change)

        # 7. Update sync state
        self.set_last_sync_time(now())

    def detect_conflicts(self, server_changes, local_changes):
        conflicts = []

        # If same file modified both locally and on server
        for local in local_changes:
            for server in server_changes:
                if local.file_id == server.file_id:
                    # Conflict if both modified after last sync
                    if (local.modified_at > self.last_sync_time and
                        server.modified_at > self.last_sync_time):
                        conflicts.append({
                            'file_id': local.file_id,
                            'local_version': local,
                            'server_version': server
                        })

        return conflicts

    def resolve_conflict(self, conflict):
        # Strategy 1: Last-Write-Wins (timestamp)
        if conflict['server_version'].modified_at > conflict['local_version'].modified_at:
            # Server wins - overwrite local
            self.download_file(conflict['file_id'])
        else:
            # Local wins - upload
            self.upload_file(conflict['file_id'])

        # Strategy 2: Keep both (Dropbox approach)
        # Rename one file to "file (conflicted copy).txt"
        self.rename_local(conflict['file_id'], add_suffix=" (conflicted copy)")
        self.download_file(conflict['file_id'])
```

**Pros of "Keep Both":**
- ✅ No data loss
- ✅ User decides later
- ✅ Safe default

**Cons:**
- ❌ Confusion (multiple copies)
- ❌ User burden to merge

## Database Design

### Files and Folders

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  storage_used_bytes BIGINT DEFAULT 0,
  storage_quota_bytes BIGINT DEFAULT 10737418240, -- 10 GB
  created_at TIMESTAMP
);

CREATE TABLE files (
  file_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  parent_folder_id UUID,  -- NULL for root
  name VARCHAR(255),
  path VARCHAR(1000),  -- Denormalized for fast lookup
  type VARCHAR(10),  -- file, folder
  current_version_id UUID,
  size_bytes BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,

  UNIQUE (user_id, path),
  INDEX idx_user_path (user_id, parent_folder_id),
  INDEX idx_updated (updated_at)
);

CREATE TABLE file_versions (
  version_id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(file_id),
  version_number INT,
  size_bytes BIGINT,
  chunk_hashes TEXT[],  -- PostgreSQL array
  checksum VARCHAR(64),  -- SHA-256 of entire file
  created_at TIMESTAMP
);

CREATE TABLE chunks (
  chunk_hash VARCHAR(64) PRIMARY KEY,  -- SHA-256
  size_bytes INT,
  s3_key VARCHAR(500),
  ref_count INT,  -- How many files reference this chunk
  created_at TIMESTAMP
);

-- When ref_count reaches 0, chunk can be deleted (garbage collection)
```

### Sharing

```sql
CREATE TABLE shares (
  share_id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(file_id),
  shared_by UUID REFERENCES users(user_id),
  shared_with UUID REFERENCES users(user_id),  -- NULL for public link
  permission VARCHAR(20),  -- view, edit
  share_link VARCHAR(100) UNIQUE,  -- e.g., "https://dropbox.com/s/abc123"
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

## Delta Sync (Bandwidth Optimization)

**Problem:** 1 GB video file, user changes 1 MB → don't re-upload 1 GB

**Solution: Rsync Algorithm**

```
1. Client chunks file into 4 MB blocks
2. Client sends list of block hashes to server
3. Server compares with previous version
4. Server responds: "I have blocks 0, 2-10. Send me blocks 1, 11."
5. Client uploads only missing/changed blocks
6. Server reassembles file
```

**Bandwidth Savings:**

```
Without delta sync: 1 GB upload
With delta sync: 1 MB upload (changed portion only)
Savings: 99.9%
```

**Implementation:**

```python
def delta_sync(file_path, file_id):
    # 1. Chunk file
    new_chunks = chunk_file(file_path)

    # 2. Get previous version's chunks
    previous_version = api.get_file_version(file_id)
    old_chunk_hashes = set(previous_version['chunk_hashes'])

    # 3. Identify changed chunks
    new_chunk_hashes = {c['hash'] for c in new_chunks}
    changed_chunks = new_chunk_hashes - old_chunk_hashes

    # 4. Upload only changed chunks
    for chunk in new_chunks:
        if chunk['hash'] in changed_chunks:
            upload_chunk(chunk)

    # 5. Create new version with updated chunk list
    api.create_version(file_id, {
        'chunks': [c['hash'] for c in new_chunks]
    })
```

## API Design

```
POST /api/v1/files/upload-url
Request:
{
  "filename": "document.pdf",
  "size": 5242880,
  "chunks": [
    {"index": 0, "hash": "abc123...", "size": 4194304},
    {"index": 1, "hash": "def456...", "size": 1048576}
  ]
}
Response:
{
  "file_id": "file-uuid",
  "missing_chunks": ["abc123..."],  // Already have def456
  "upload_urls": {
    "abc123...": "https://s3.amazonaws.com/presigned..."
  }
}

POST /api/v1/files/{file_id}/commit
# After chunks uploaded

GET /api/v1/files/{file_id}/download
Response:
{
  "download_url": "https://cdn.dropbox.com/..."
}

GET /api/v1/sync/changes?since=1234567890
Response:
{
  "changes": [
    {"file_id": "...", "action": "modified", "version_id": "..."},
    {"file_id": "...", "action": "deleted"}
  ],
  "timestamp": 1234567900
}

POST /api/v1/shares
Request:
{
  "file_id": "...",
  "permission": "view",
  "expires_in_days": 7
}
Response:
{
  "share_link": "https://dropbox.com/s/abc123"
}
```

## Notification Service

**Challenge:** Notify devices when files change

```python
# When file uploaded on Device A:
def on_file_upload(user_id, file_id):
    # 1. Get user's other devices
    devices = get_user_devices(user_id)

    # 2. Notify each device via WebSocket / Long Polling / Push
    for device in devices:
        if device.is_connected():
            websocket.send(device.connection_id, {
                "type": "file_changed",
                "file_id": file_id,
                "action": "modified"
            })

# Device B receives notification:
def on_notification(notification):
    if notification['type'] == 'file_changed':
        # Trigger sync
        sync_engine.sync()
```

**Alternatives:**
- Polling: Device checks every 60 seconds (simple, higher latency)
- Long Polling: Device holds request until change (medium latency)
- WebSocket: Persistent connection (real-time, complex)
- Push Notifications: OS-level push (mobile)

## Scaling Strategies

### 1. Metadata Sharding

```python
# Shard by user_id
def get_db_shard(user_id):
    return hash(user_id) % NUM_SHARDS

# All files for one user on same shard
# Optimizes queries like "list all my files"
```

### 2. CDN for Downloads

```
User requests file → CloudFront → S3
- Popular files cached at edge
- Reduces origin load
```

### 3. Chunk Deduplication

```
Global deduplication:
- Same file uploaded by 1000 users → stored once
- Saves 999x storage

Example:
- Ubuntu ISO uploaded by 100K users
- Size: 3 GB
- Without dedup: 3 GB × 100K = 300 TB
- With dedup: 3 GB
- Savings: 99.999%
```

## Bottlenecks & Solutions

### Bottleneck 1: Large File Uploads

**Problem:** 10 GB file, slow internet → upload takes hours, fails midway

**Solutions:**
- Resumable uploads (track uploaded chunks)
- Parallel chunk uploads (10 chunks × 10 parallel = 10x faster)
- Retry failed chunks only

### Bottleneck 2: Sync Storms

**Problem:** User opens laptop after 1 week → 1000 files changed → overwhelm network

**Solutions:**
- Prioritize recent files first
- Batch sync (don't sync all at once)
- Adaptive rate limiting

### Bottleneck 3: Metadata Query Performance

**Problem:** "List all files in folder" slow for users with millions of files

**Solutions:**
- Pagination (load 100 at a time)
- Index on (user_id, parent_folder_id)
- Cache folder listings in Redis

## Monitoring

```
Performance:
- Upload speed: p50 > 1 MB/sec
- Download speed: p50 > 5 MB/sec
- Sync latency: p50 < 5 seconds

Reliability:
- Data durability: 99.999999999% (11 9's from S3)
- Uptime: 99.99%
- Sync success rate: > 99.9%

Business:
- DAU: 100M
- Files uploaded per day: 50M
- Storage used: 10 PB

Alerts:
- Sync failure rate > 1%
- Upload failure rate > 0.5%
- Metadata DB query p99 > 500ms
```

## Cost Estimation

```
Storage (S3):
- 10 PB × $0.023/GB = $230K/month = $2.76M/year

Bandwidth (Egress):
- 10 TB/day × 30 days × $0.09/GB = $27K/month = $324K/year

Database (RDS PostgreSQL):
- $20K/month = $240K/year

Compute (API servers):
- $50K/month = $600K/year

Total: ~$4M/year (for 500M users = $0.008/user/year)

Revenue:
- 10% paid users (50M) × $10/month = $500M/month = $6B/year
- Profit margin: very healthy!
```

## Interview Talking Points

"Dropbox's key challenges are bandwidth optimization and sync conflicts. I'd use chunking (4 MB blocks) with delta sync to save 80%+ bandwidth. For storage, use S3 for blocks (11 9's durability) and PostgreSQL for metadata (ACID for sharing). For conflicts, use 'keep both' strategy (user decides). For scale, shard metadata by user_id and use global chunk deduplication."
