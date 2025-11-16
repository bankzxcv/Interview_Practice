# Design Distributed File System (HDFS/GFS)

## Problem Statement

Design a distributed file system like HDFS (Hadoop Distributed File System) or GFS (Google File System) that stores petabytes of data across thousands of commodity servers with fault tolerance.

## Requirements

- Store petabyte-scale data
- Fault tolerance (handle node failures)
- High throughput (optimized for large files)
- Replication (3x default)
- Write-once, read-many workload
- Handle commodity hardware failures

## Architecture

```
Client → NameNode (metadata) → DataNodes (actual data blocks)
             ↓
        Metadata DB
```

## Key Concepts

### 1. Block-Based Storage

```python
# Split large files into 64MB/128MB blocks
file_size = 10 GB
block_size = 128 MB
num_blocks = ceil(file_size / block_size)  # 80 blocks

# Each block replicated 3x on different nodes
blocks = {
  'block_0': ['datanode1', 'datanode5', 'datanode9'],
  'block_1': ['datanode2', 'datanode6', 'datanode10'],
  # ...
}
```

### 2. NameNode (Master)

```python
class NameNode:
    def __init__(self):
        self.namespace = {}  # path → file metadata
        self.block_locations = {}  # block_id → [datanode_ids]

    def create_file(self, path, size):
        # Calculate blocks needed
        num_blocks = ceil(size / BLOCK_SIZE)

        # Allocate blocks on datanodes
        block_ids = []
        for i in range(num_blocks):
            block_id = uuid.uuid4()

            # Choose 3 datanodes (different racks for fault tolerance)
            datanodes = self.choose_datanodes(count=3, rack_aware=True)

            self.block_locations[block_id] = datanodes
            block_ids.append(block_id)

        # Store metadata
        self.namespace[path] = {
            'size': size,
            'blocks': block_ids,
            'replication': 3,
            'created_at': now()
        }

        return block_ids

    def choose_datanodes(self, count=3, rack_aware=True):
        # Rack awareness: place replicas on different racks
        # Replica 1: Random node in cluster
        # Replica 2: Different rack from Replica 1
        # Replica 3: Same rack as Replica 2, different node

        available = self.get_healthy_datanodes()

        rack1_node = random.choice(available)
        rack1 = rack1_node.rack

        # Different rack
        rack2_nodes = [n for n in available if n.rack != rack1]
        rack2_node = random.choice(rack2_nodes)
        rack2 = rack2_node.rack

        # Same rack as replica 2, different node
        rack2_other = [n for n in available if n.rack == rack2 and n != rack2_node]
        rack2_other_node = random.choice(rack2_other)

        return [rack1_node, rack2_node, rack2_other_node]
```

### 3. DataNode (Worker)

```python
class DataNode:
    def __init__(self, node_id):
        self.node_id = node_id
        self.blocks = {}  # block_id → local file path

    def write_block(self, block_id, data):
        # Write to local disk
        path = f"/data/{block_id}"

        with open(path, 'wb') as f:
            f.write(data)

        self.blocks[block_id] = path

        # Replicate to next datanode in pipeline
        next_datanode = get_next_in_pipeline()
        if next_datanode:
            next_datanode.write_block(block_id, data)

        # Checksum for integrity
        checksum = compute_checksum(data)
        store_checksum(block_id, checksum)

    def read_block(self, block_id):
        path = self.blocks[block_id]

        with open(path, 'rb') as f:
            data = f.read()

        # Verify checksum
        if not verify_checksum(block_id, data):
            raise CorruptBlockError()

        return data

    def heartbeat(self):
        # Send to NameNode every 3 seconds
        namenode.report_heartbeat(self.node_id, self.blocks.keys())
```

### 4. Write Pipeline

```python
def write_file(path, data):
    # 1. Client asks NameNode for block allocation
    blocks = namenode.create_file(path, len(data))

    # 2. For each block, write via pipeline
    offset = 0
    for block in blocks:
        block_data = data[offset:offset + BLOCK_SIZE]

        # Get datanodes for this block
        datanodes = namenode.get_block_locations(block.id)

        # Setup pipeline (chain writes)
        pipeline = create_pipeline(datanodes)  # [dn1, dn2, dn3]

        # Write to first datanode (it forwards to others)
        pipeline[0].write_block(block.id, block_data)

        offset += BLOCK_SIZE

# Pipeline replication (not fanout)
# Client → DN1 → DN2 → DN3
# Ack: DN3 → DN2 → DN1 → Client
```

### 5. Fault Tolerance

```python
class NameNode:
    def detect_failures(self):
        # Heartbeat timeout = 10 seconds
        for datanode in self.datanodes:
            if time.time() - datanode.last_heartbeat > 10:
                # Mark as dead
                self.mark_datanode_dead(datanode)

                # Re-replicate under-replicated blocks
                self.re_replicate_blocks(datanode)

    def re_replicate_blocks(self, failed_datanode):
        # Find blocks that were on failed datanode
        under_replicated = []

        for block_id, datanodes in self.block_locations.items():
            if failed_datanode in datanodes:
                # Remove failed datanode
                datanodes.remove(failed_datanode)

                if len(datanodes) < 3:  # Under-replicated
                    under_replicated.append(block_id)

        # Re-replicate
        for block_id in under_replicated:
            # Choose new datanode
            new_datanode = self.choose_datanode(exclude=datanodes)

            # Copy from existing replica
            source = datanodes[0]
            source.copy_block(block_id, new_datanode)

            # Update metadata
            self.block_locations[block_id].append(new_datanode)
```

## Optimizations

### 1. Append-Only (Sequential Writes)

```python
# HDFS optimized for large sequential writes
# NOT optimized for random writes or small files

# Good: 1GB video file → 8 blocks of 128MB (sequential)
# Bad: 100K small files of 10KB each (metadata overhead)
```

### 2. Read Locality

```python
# For MapReduce, schedule tasks on nodes with data
def schedule_map_task(input_block):
    # Prefer local datanode
    datanodes = namenode.get_block_locations(input_block)

    # Choose datanode with this block
    chosen = datanodes[0]  # Prefer first replica

    # Launch task on this node (no network transfer!)
    chosen.run_map_task(input_block)
```

## Monitoring

```
Capacity:
- Total storage: 10 PB
- Used: 7 PB (70%)
- Blocks: 80M
- Replication factor: 3x

Health:
- Under-replicated blocks: 0
- Corrupt blocks: 0
- Dead datanodes: 0

Performance:
- Write throughput: 1 GB/sec per datanode
- Read throughput: 3 GB/sec (from multiple replicas)
```

## Interview Talking Points

"Distributed file system splits files into large blocks (128MB), replicates 3x across datanodes with rack awareness (2 racks). NameNode stores metadata, DataNodes store blocks. Write pipeline: client → DN1 → DN2 → DN3 (chain). Heartbeat every 3s, re-replicate if node fails. Optimized for large sequential reads/writes, not random access. For MapReduce, schedule tasks on nodes with data (locality)."
