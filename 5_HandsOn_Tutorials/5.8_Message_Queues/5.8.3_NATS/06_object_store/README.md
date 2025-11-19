# Tutorial 06: JetStream Object Store

## Overview

NATS JetStream Object Store is a specialized storage layer for large payloads (files, documents, images, videos). Built on top of JetStream streams, it automatically handles chunking, reassembly, metadata management, and versioning. This enables you to store and distribute large objects without external storage systems like S3 or MinIO.

## Learning Objectives

- Create and manage object store buckets
- Store and retrieve large files
- Understand automatic chunking and reassembly
- Work with object metadata and links
- Implement version management
- Use object watchers for monitoring
- Build file distribution systems

## Prerequisites

- Completed Tutorial 04 (JetStream)
- Completed Tutorial 05 (Key-Value Store)
- NATS server with JetStream enabled
- Python 3.8+ with nats-py
- Basic file I/O knowledge

## Architecture

```
┌──────────────────────────────────────┐
│  Object Store Bucket "FILES"         │
│                                      │
│  Object: "documents/report.pdf"      │
│    Size: 5.2 MB                      │
│    Chunks: [1][2][3][4][5]...[42]   │
│    Metadata:                         │
│      - Content-Type: application/pdf │
│      - Uploaded: 2024-01-15         │
│      - Version: 3                    │
│    Description: "Q4 Report"          │
└──────────────────────────────────────┘
         │
         │ (automatic chunking)
         ▼
┌──────────────────────────────────────┐
│   JetStream Stream (under the hood)  │
│   Chunk Size: 128 KB default         │
└──────────────────────────────────────┘
```

## Step 1: Create Object Store Bucket

Create `create_object_store.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    print("Creating Object Store bucket...\n")

    # Create object store
    obj_store = await js.create_object_store(
        bucket="FILES",
        description="File storage bucket",
        max_bytes=10 * 1024 * 1024 * 1024,  # 10 GB max
        storage="file",  # File storage (persistent)
    )

    print(f"✓ Created Object Store: {obj_store.bucket}")

    # Get bucket info
    info = await obj_store.status()
    print(f"\nBucket Info:")
    print(f"  Bucket: {info.bucket}")
    print(f"  Description: {info.description}")
    print(f"  Size: {info.size} bytes")
    print(f"  Storage: {info.storage}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Run it:

```bash
python create_object_store.py

# Or use NATS CLI
nats object add FILES
```

## Step 2: Upload and Download Files

Create `upload_file.py`:

```python
import asyncio
import nats
import os

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Get or create object store
    try:
        obj_store = await js.object_store("FILES")
    except:
        obj_store = await js.create_object_store("FILES")

    print("Object Store File Upload\n")

    # Create a test file
    test_file = "test_document.txt"
    with open(test_file, "w") as f:
        f.write("Hello from NATS Object Store!\n" * 1000)

    file_size = os.path.getsize(test_file)
    print(f"Uploading: {test_file} ({file_size} bytes)\n")

    # Upload file
    with open(test_file, "rb") as f:
        info = await obj_store.put(
            "documents/test.txt",
            f,
            meta={
                "description": "Test document",
                "content-type": "text/plain",
                "uploaded-by": "tutorial"
            }
        )

    print(f"✓ Uploaded successfully!")
    print(f"  Name: {info.name}")
    print(f"  Size: {info.size} bytes")
    print(f"  Chunks: {info.nuid}")
    print(f"  Modified: {info.mtime}")

    # Clean up
    os.remove(test_file)
    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

Create `download_file.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    obj_store = await js.object_store("FILES")

    print("Object Store File Download\n")

    # Download file
    object_name = "documents/test.txt"
    output_file = "downloaded_test.txt"

    print(f"Downloading: {object_name}")

    # Get object
    result = await obj_store.get(object_name)

    # Write to file
    with open(output_file, "wb") as f:
        f.write(result.data)

    print(f"✓ Downloaded to: {output_file}")
    print(f"  Size: {len(result.data)} bytes")
    print(f"  Metadata: {result.info.metadata}")

    # Read and display first few lines
    with open(output_file, "r") as f:
        lines = f.readlines()[:5]
        print(f"\nFirst 5 lines:")
        for line in lines:
            print(f"  {line.strip()}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 3: Working with Large Files

Create `large_file_upload.py`:

```python
import asyncio
import nats
import os
import hashlib

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    obj_store = await js.object_store("FILES")

    print("Large File Upload Test\n")

    # Create a 10 MB test file
    test_file = "large_file.bin"
    file_size = 10 * 1024 * 1024  # 10 MB

    print(f"Creating {file_size / 1024 / 1024:.1f} MB test file...")

    # Generate file with random data
    with open(test_file, "wb") as f:
        chunk_size = 1024 * 1024  # 1 MB chunks
        for i in range(file_size // chunk_size):
            data = os.urandom(chunk_size)
            f.write(data)
            if (i + 1) % 2 == 0:
                print(f"  Written {(i + 1) * chunk_size / 1024 / 1024:.1f} MB...")

    # Calculate checksum
    print("\nCalculating checksum...")
    with open(test_file, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    print(f"SHA256: {file_hash}\n")

    # Upload file
    print("Uploading to Object Store...")

    with open(test_file, "rb") as f:
        info = await obj_store.put(
            "files/large_file.bin",
            f,
            meta={
                "sha256": file_hash,
                "content-type": "application/octet-stream"
            }
        )

    print(f"✓ Upload complete!")
    print(f"  Size: {info.size / 1024 / 1024:.2f} MB")
    print(f"  Chunks: {info.chunks}")

    # Download and verify
    print("\nDownloading and verifying...")
    result = await obj_store.get("files/large_file.bin")

    download_hash = hashlib.sha256(result.data).hexdigest()
    print(f"Downloaded SHA256: {download_hash}")

    if download_hash == file_hash:
        print("✓ Checksum verification PASSED")
    else:
        print("✗ Checksum verification FAILED")

    # Clean up
    os.remove(test_file)

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 4: Object Metadata and Information

Create `object_info.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    obj_store = await js.object_store("FILES")

    print("Object Store - List and Info\n")

    # List all objects
    print("=== All Objects ===\n")

    objects = []
    async for info in await obj_store.list():
        objects.append(info)
        print(f"Name: {info.name}")
        print(f"  Size: {info.size:,} bytes")
        print(f"  Modified: {info.mtime}")
        print(f"  Digest: {info.digest}")
        if info.metadata:
            print(f"  Metadata: {info.metadata}")
        print()

    print(f"Total objects: {len(objects)}\n")

    # Get specific object info (without downloading)
    if objects:
        object_name = objects[0].name
        print(f"=== Detailed Info: {object_name} ===\n")

        info = await obj_store.info(object_name)
        print(f"  Name: {info.name}")
        print(f"  Size: {info.size:,} bytes")
        print(f"  Chunks: {info.chunks}")
        print(f"  Digest: {info.digest}")
        print(f"  Modified: {info.mtime}")
        print(f"  Deleted: {info.deleted}")
        if info.metadata:
            for key, value in info.metadata.items():
                print(f"  {key}: {value}")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 5: Object Links and References

Object links allow you to reference objects without copying data.

Create `object_links.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    obj_store = await js.object_store("FILES")

    print("Object Store Links\n")

    # Create original object
    original_name = "documents/original.txt"
    content = b"This is the original document content."

    import io
    await obj_store.put(original_name, io.BytesIO(content))
    print(f"✓ Created: {original_name}")

    # Get object info
    info = await obj_store.info(original_name)

    # Create link (reference)
    link_name = "documents/shortcut.txt"
    await obj_store.add_link(link_name, info)
    print(f"✓ Created link: {link_name} -> {original_name}")

    # Access via link
    result = await obj_store.get(link_name)
    print(f"\nContent via link:")
    print(f"  {result.data.decode()}")

    # List all objects
    print("\n=== Objects ===\n")
    async for obj_info in await obj_store.list():
        obj_type = "LINK" if hasattr(obj_info, 'links') else "FILE"
        print(f"{obj_type}: {obj_info.name} ({obj_info.size} bytes)")

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 6: Object Watchers

Create `object_watcher.py`:

```python
import asyncio
import nats

async def main():
    nc = await nats.connect("nats://localhost:4222")
    js = nc.jetstream()

    obj_store = await js.object_store("FILES")

    print("Object Store Watcher\n")

    # Create watcher
    watcher = await obj_store.watch()

    async def watch_objects():
        """Watch for object changes"""
        async for info in watcher:
            if info is None:
                continue

            if info.deleted:
                print(f"[DELETED] {info.name}")
            else:
                print(f"[UPDATED] {info.name}")
                print(f"  Size: {info.size:,} bytes")
                print(f"  Modified: {info.mtime}")
                if info.metadata:
                    print(f"  Metadata: {info.metadata}")
            print()

    # Start watching in background
    watch_task = asyncio.create_task(watch_objects())

    # Simulate changes
    await asyncio.sleep(2)

    print("Making changes...\n")

    import io
    await obj_store.put("test1.txt", io.BytesIO(b"File 1"))
    await asyncio.sleep(1)

    await obj_store.put("test2.txt", io.BytesIO(b"File 2"))
    await asyncio.sleep(1)

    await obj_store.delete("test1.txt")
    await asyncio.sleep(2)

    # Stop watching
    await watcher.stop()
    watch_task.cancel()

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Step 7: File Distribution System

Create `file_distribution.py`:

```python
import asyncio
import nats
import os
import time

class FileDistributor:
    """Distribute files across multiple clients"""

    def __init__(self, nc, bucket="DIST_FILES"):
        self.nc = nc
        self.bucket = bucket
        self.obj_store = None

    async def initialize(self):
        """Initialize object store"""
        js = self.nc.jetstream()

        try:
            self.obj_store = await js.object_store(self.bucket)
        except:
            self.obj_store = await js.create_object_store(self.bucket)

    async def publish_file(self, file_path, category="general"):
        """Publish file to object store"""
        filename = os.path.basename(file_path)
        object_name = f"{category}/{filename}"

        print(f"Publishing: {filename} ({category})")

        with open(file_path, "rb") as f:
            info = await self.obj_store.put(
                object_name,
                f,
                meta={
                    "category": category,
                    "filename": filename,
                    "uploaded": str(time.time())
                }
            )

        print(f"✓ Published: {object_name} ({info.size} bytes)")
        return info

    async def download_file(self, object_name, output_dir="."):
        """Download file from object store"""
        print(f"Downloading: {object_name}")

        result = await self.obj_store.get(object_name)

        # Get filename from metadata or object name
        filename = result.info.metadata.get("filename", object_name.split("/")[-1])
        output_path = os.path.join(output_dir, filename)

        with open(output_path, "wb") as f:
            f.write(result.data)

        print(f"✓ Downloaded: {output_path} ({len(result.data)} bytes)")
        return output_path

    async def list_files(self, category=None):
        """List files, optionally filtered by category"""
        files = []

        async for info in await self.obj_store.list():
            if category:
                obj_category = info.metadata.get("category", "")
                if obj_category != category:
                    continue

            files.append({
                "name": info.name,
                "size": info.size,
                "modified": info.mtime,
                "category": info.metadata.get("category", "unknown")
            })

        return files


async def main():
    nc = await nats.connect("nats://localhost:4222")

    distributor = FileDistributor(nc)
    await distributor.initialize()

    print("File Distribution System\n")

    # Create test files
    test_files = {
        "config.txt": "Config file content",
        "data.txt": "Data file content",
        "update.txt": "Update file content"
    }

    for filename, content in test_files.items():
        with open(filename, "w") as f:
            f.write(content)

    # Publish files
    print("=== Publishing Files ===\n")
    await distributor.publish_file("config.txt", "configs")
    await distributor.publish_file("data.txt", "data")
    await distributor.publish_file("update.txt", "updates")

    # List all files
    print("\n=== All Files ===\n")
    all_files = await distributor.list_files()
    for file_info in all_files:
        print(f"{file_info['name']} ({file_info['size']} bytes) - {file_info['category']}")

    # List by category
    print("\n=== Config Files ===\n")
    config_files = await distributor.list_files(category="configs")
    for file_info in config_files:
        print(f"{file_info['name']}")

    # Download files
    print("\n=== Downloading ===\n")
    os.makedirs("downloads", exist_ok=True)
    await distributor.download_file("configs/config.txt", "downloads")

    # Clean up
    for filename in test_files.keys():
        os.remove(filename)

    await nc.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Use Cases

### 1. Software Updates Distribution
```python
# Publish software updates
await obj_store.put("updates/v2.0.0/installer.exe", installer_file)
# Clients download and install
```

### 2. Document Management
```python
# Store documents with metadata
await obj_store.put("docs/report.pdf", pdf_file, meta={
    "author": "John Doe",
    "version": "1.0"
})
```

### 3. Media Storage
```python
# Store images, videos
await obj_store.put("media/video.mp4", video_file, meta={
    "duration": "120",
    "resolution": "1080p"
})
```

### 4. Configuration Distribution
```python
# Distribute config files to services
await obj_store.put("configs/app.yaml", config_file)
# Services watch and auto-update
```

## Object Store vs S3/MinIO

| Feature | NATS Object Store | S3/MinIO |
|---------|-------------------|----------|
| **Integration** | Built-in | External |
| **Deployment** | Part of NATS | Separate service |
| **Versioning** | Via JetStream | Native |
| **Chunking** | Automatic | Manual |
| **Watch** | Built-in | Event notifications |
| **Scale** | GB to TB | TB to PB |
| **Use Case** | Config, updates | Large-scale storage |

## Best Practices

1. **Bucket Organization**
   - Use separate buckets for different purposes
   - Implement naming conventions
   - Set appropriate size limits

2. **Metadata**
   - Store content type, version, checksums
   - Use metadata for searching/filtering
   - Keep metadata small

3. **Performance**
   - Use appropriate chunk sizes (default: 128KB)
   - Monitor storage usage
   - Clean up old versions

4. **Security**
   - Use NATS authentication
   - Encrypt sensitive files before upload
   - Implement access controls

## Troubleshooting

### Object Not Found
```bash
# List all objects
nats object ls FILES

# Get object info
nats object info FILES <object-name>
```

### Upload Fails
- Check bucket size limits
- Verify JetStream is enabled
- Check disk space

## Summary

You've learned:
- ✅ Object store bucket creation
- ✅ File upload and download
- ✅ Automatic chunking for large files
- ✅ Object metadata management
- ✅ Object links and references
- ✅ Object watchers
- ✅ File distribution systems

## Next Steps

- **Tutorial 07**: NATS clustering for high availability
- **Tutorial 08**: Kubernetes deployment

---

**Estimated Time**: 2-3 hours
**Difficulty**: Intermediate
