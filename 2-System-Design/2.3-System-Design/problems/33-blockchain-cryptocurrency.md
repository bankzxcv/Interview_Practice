# Design Blockchain/Cryptocurrency System

## Problem Statement

Design a blockchain-based cryptocurrency like Bitcoin with consensus mechanism, distributed ledger, mining, and transaction validation.

## Key Components

### 1. Block Structure
```python
class Block:
    def __init__(self, index, transactions, previous_hash, timestamp, nonce=0):
        self.index = index
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.timestamp = timestamp
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        data = f"{self.index}{self.transactions}{self.previous_hash}{self.timestamp}{self.nonce}"
        return hashlib.sha256(data.encode()).hexdigest()
```

### 2. Proof of Work
```python
def mine_block(block, difficulty=4):
    target = "0" * difficulty  # e.g., "0000"

    while not block.hash.startswith(target):
        block.nonce += 1
        block.hash = block.calculate_hash()

    return block  # Found valid hash!
```

### 3. Consensus (Longest Chain Wins)
```python
def resolve_conflicts(blockchain, network):
    longest_chain = blockchain
    max_length = len(blockchain)

    for node in network.nodes:
        chain = node.get_blockchain()

        if len(chain) > max_length and is_valid_chain(chain):
            longest_chain = chain
            max_length = len(chain)

    return longest_chain
```

## Interview Talking Points
"Blockchain uses hash chain (each block references previous), Proof-of-Work for consensus (mine until hash starts with 0000), and distributed ledger (all nodes have copy). Longest valid chain wins. Transactions signed with private key, verified with public key. For scale, use sharding or layer-2 solutions."
