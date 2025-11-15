# Pattern 1.12: Breadth-First Search (BFS)

## Pattern Overview

### What is Breadth-First Search?
Breadth-First Search (BFS) is a graph/tree traversal algorithm that explores all nodes at the present depth before moving to nodes at the next depth level. It uses a queue data structure to track nodes to visit, guaranteeing the shortest path in unweighted graphs.

### When to Use It?
- Finding shortest path in unweighted graphs
- Level-order tree traversal
- Finding minimum steps/moves
- Exploring nearest neighbors first
- Finding all nodes at distance k
- Web crawling (nearby links first)
- Social network connections (friends, then friends-of-friends)
- Game states (minimum moves to win)

### Time/Space Complexity Benefits
- **Time Complexity**: O(V + E) for graphs (V vertices, E edges), O(n) for trees
- **Space Complexity**: O(w) where w is maximum width/level size
- **Advantage**: Guarantees shortest path in unweighted graphs
- **Disadvantage**: Uses more memory than DFS for deep graphs

### Visual Diagram

```
═══════════════════════════════════════════════════════════════════════════
🌊 METAPHOR: BFS AS RIPPLES IN WATER
═══════════════════════════════════════════════════════════════════════════

Imagine dropping a stone in calm water. The ripples expand outward in
concentric circles, reaching all points at the same distance simultaneously.
This is exactly how BFS works!

    Start (Stone Drop)
         ★
        ╱│╲
       ╱ │ ╲        Level 0: Origin (distance 0)
      ▓▓▓▓▓▓▓
     ╱   │   ╲
    ╱    │    ╲     Level 1: First ripple (distance 1)
   ○     ○     ○
  ╱│╲   ╱│╲   ╱│╲
 ╱ │ ╲ ╱ │ ╲ ╱ │ ╲  Level 2: Second ripple (distance 2)
○  ○  ○  ○  ○  ○  ○

Each "ripple" represents a level in BFS traversal. All nodes at the same
distance from the start are visited before moving to the next level.

═══════════════════════════════════════════════════════════════════════════
📊 DETAILED BFS TRAVERSAL WALKTHROUGH
═══════════════════════════════════════════════════════════════════════════

Tree Structure:
                    1
                   ╱ ╲
                  ╱   ╲
                 2     3
                ╱ ╲     ╲
               4   5     6
              ╱
             7

BFS Level-by-Level Exploration (Like Water Spreading):

LEVEL 0 (Distance 0):
┌─────────────────────────────────────────────────────────────┐
│ Queue: [1]                  Visited: {}                     │
│ Process: 1 ──► Visit node 1, add children 2 and 3          │
│ Result: 1                                                   │
└─────────────────────────────────────────────────────────────┘
         1★
        ╱ ╲
       2   3
      ╱ ╲   ╲
     4   5   6
    ╱
   7

LEVEL 1 (Distance 1 - First Wave):
┌─────────────────────────────────────────────────────────────┐
│ Queue: [2, 3]               Visited: {1}                    │
│ Process: 2 ──► Visit node 2, add children 4 and 5          │
│ Queue: [3, 4, 5]            Visited: {1, 2}                 │
│ Process: 3 ──► Visit node 3, add child 6                   │
│ Result: 2, 3                                                │
└─────────────────────────────────────────────────────────────┘
         1
        ╱ ╲
       2★  3★
      ╱ ╲   ╲
     4   5   6
    ╱
   7

LEVEL 2 (Distance 2 - Second Wave):
┌─────────────────────────────────────────────────────────────┐
│ Queue: [4, 5, 6]            Visited: {1, 2, 3}              │
│ Process: 4 ──► Visit node 4, add child 7                   │
│ Queue: [5, 6, 7]            Visited: {1, 2, 3, 4}           │
│ Process: 5 ──► Visit node 5 (leaf)                         │
│ Queue: [6, 7]               Visited: {1, 2, 3, 4, 5}        │
│ Process: 6 ──► Visit node 6 (leaf)                         │
│ Result: 4, 5, 6                                             │
└─────────────────────────────────────────────────────────────┘
         1
        ╱ ╲
       2   3
      ╱ ╲   ╲
     4★  5★  6★
    ╱
   7

LEVEL 3 (Distance 3 - Third Wave):
┌─────────────────────────────────────────────────────────────┐
│ Queue: [7]                  Visited: {1, 2, 3, 4, 5, 6}     │
│ Process: 7 ──► Visit node 7 (leaf)                         │
│ Result: 7                                                   │
└─────────────────────────────────────────────────────────────┘
         1
        ╱ ╲
       2   3
      ╱ ╲   ╲
     4   5   6
    ╱
   7★

Final BFS Order: 1 → 2 → 3 → 4 → 5 → 6 → 7
Each level is fully explored before moving to the next (like ripples!)

═══════════════════════════════════════════════════════════════════════════
🎯 QUEUE VISUALIZATION - THE HEART OF BFS
═══════════════════════════════════════════════════════════════════════════

The queue operates FIFO (First In, First Out) - like a line at a store:

Step 1: Initialize
   Front ──────────────► Back
   │                      │
   └──────────────────────┘
   Queue: [1]
   Action: START - Add root node

Step 2: Process 1, Add Children
   Front ──────────────► Back
   │                      │
   └──[ 2 ]───[ 3 ]───────┘
   Queue: [2, 3]
   Action: Visited 1, added its children 2, 3

Step 3: Process 2, Add Children
   Front ──────────────────────► Back
   │                              │
   └──[ 3 ]───[ 4 ]───[ 5 ]───────┘
   Queue: [3, 4, 5]
   Action: Visited 2, added its children 4, 5

Step 4: Process 3, Add Children
   Front ──────────────────────► Back
   │                              │
   └──[ 4 ]───[ 5 ]───[ 6 ]───────┘
   Queue: [4, 5, 6]
   Action: Visited 3, added its child 6

Step 5: Process 4, Add Children
   Front ──────────────────────► Back
   │                              │
   └──[ 5 ]───[ 6 ]───[ 7 ]───────┘
   Queue: [5, 6, 7]
   Action: Visited 4, added its child 7

Step 6: Process Remaining Leaves
   Queue: [6, 7] → [7] → []
   Action: Visit 5, 6, 7 (all leaves)

Notice: Nodes from the SAME LEVEL are processed together!
This guarantees we explore all distance-k nodes before distance-(k+1) nodes.

═══════════════════════════════════════════════════════════════════════════
🛤️  SHORTEST PATH VISUALIZATION (Why BFS Guarantees Shortest Path)
═══════════════════════════════════════════════════════════════════════════

Grid Example (finding shortest path from S to E):
  0   1   2   3   4
┌───┬───┬───┬───┬───┐
│ S │   │ ░ │   │   │  0  Legend:
├───┼───┼───┼───┼───┤     S = Start
│   │ ░ │ ░ │   │   │  1  E = End
├───┼───┼───┼───┼───┤     ░ = Wall/Obstacle
│   │   │   │ ░ │ E │  2  * = Path taken
├───┼───┼───┼───┼───┤     Numbers = Steps/Distance
│   │   │   │   │   │  3
└───┴───┴───┴───┴───┘

BFS Exploration (Step-by-Step):

After Step 0 (Start):
┌───┬───┬───┬───┬───┐
│ 0 │   │ ░ │   │   │  Queue: [(0,0)]
├───┼───┼───┼───┼───┤  Visited: {(0,0)}
│   │ ░ │ ░ │   │   │  Distance: 0
├───┼───┼───┼───┼───┤
│   │   │   │ ░ │   │
├───┼───┼───┼───┼───┤
│   │   │   │   │   │
└───┴───┴───┴───┴───┘

After Step 1 (First Wave):
┌───┬───┬───┬───┬───┐
│ 0 │ 1 │ ░ │   │   │  Queue: [(0,1), (1,0)]
├───┼───┼───┼───┼───┤  Visited: {(0,0), (0,1), (1,0)}
│ 1 │ ░ │ ░ │   │   │  Distance: 1
├───┼───┼───┼───┼───┤  (Explored all neighbors of start)
│   │   │   │ ░ │   │
├───┼───┼───┼───┼───┤
│   │   │   │   │   │
└───┴───┴───┴───┴───┘

After Step 2 (Second Wave):
┌───┬───┬───┬───┬───┐
│ 0 │ 1 │ ░ │   │   │  Queue: [(0,3), (2,0), (2,1)]
├───┼───┼───┼───┼───┤  Visited: {..., (0,3), (2,0), (2,1)}
│ 1 │ ░ │ ░ │   │   │  Distance: 2
├───┼───┼───┼───┼───┤
│ 2 │ 2 │   │ ░ │   │
├───┼───┼───┼───┼───┤
│   │   │   │   │   │
└───┴───┴───┴───┴───┘

After Step 3 (Third Wave):
┌───┬───┬───┬───┬───┐
│ 0 │ 1 │ ░ │ 3 │   │  Queue: [(0,4), (2,2), (3,0), (3,1)]
├───┼───┼───┼───┼───┤  Distance: 3
│ 1 │ ░ │ ░ │   │   │
├───┼───┼───┼───┼───┤
│ 2 │ 2 │ 3 │ ░ │   │
├───┼───┼───┼───┼───┤
│ 3 │ 3 │   │   │   │
└───┴───┴───┴───┴───┘

After Steps 4-7 (Continue expanding):
┌───┬───┬───┬───┬───┐
│ 0 │ 1 │ ░ │ 3 │ 4 │  Final shortest path distance: 8
├───┼───┼───┼───┼───┤
│ 1 │ ░ │ ░ │ 4 │ 5 │  Reconstruction:
├───┼───┼───┼───┼───┤  S(0,0) → (1,0) → (2,0) → (3,0)
│ 2 │ 2 │ 3 │ ░ │ 6 │  → (3,1) → (3,2) → (3,3) → (3,4)
├───┼───┼───┼───┼───┤  → (2,4) = E
│ 3 │ 3 │ 4 │ 5 │ 6 │  Total: 8 steps
└───┴───┴───┴───┴───┘

Path with markers:
┌───┬───┬───┬───┬───┐
│ * │   │ ░ │   │   │  BFS explores ALL cells at
├───┼───┼───┼───┼───┤  distance k BEFORE exploring
│ * │ ░ │ ░ │   │   │  any cell at distance k+1
├───┼───┼───┼───┼───┤
│ * │   │   │ ░ │ * │  This guarantees we find the
├───┼───┼───┼───┼───┤  SHORTEST path first!
│ * │ * │ * │ * │ * │
└───┴───┴───┴───┴───┘

═══════════════════════════════════════════════════════════════════════════
🌀 MULTI-SOURCE BFS VISUALIZATION (Advanced Pattern)
═══════════════════════════════════════════════════════════════════════════

Problem: Rotting Oranges spreading to fresh oranges

Initial State (Multiple rotten oranges = Multiple sources):
┌───┬───┬───┬───┬───┐
│ R │ F │ F │   │ F │  R = Rotten (source)
├───┼───┼───┼───┼───┤  F = Fresh
│ F │ F │   │ F │   │    = Empty
├───┼───┼───┼───┼───┤  Queue: [(0,0,0), (0,4,0)]
│   │ F │ R │   │ F │  (All rotten oranges start
├───┼───┼───┼───┼───┤   simultaneously!)
│ F │   │ F │ F │   │
└───┴───┴───┴───┴───┘

After Minute 1 (First wave from BOTH sources):
┌───┬───┬───┬───┬───┐
│ R │ 1 │ F │   │ 1 │  The rot spreads like
├───┼───┼───┼───┼───┤  multiple ripples from
│ 1 │ F │   │ 1 │   │  different stones!
├───┼───┼───┼───┼───┤
│   │ 1 │ R │   │ F │  Each number = minutes
├───┼───┼───┼───┼───┤  to rot from nearest source
│ F │   │ 1 │ F │   │
└───┴───┴───┴───┴───┘

After Minute 2 (Second wave):
┌───┬───┬───┬───┬───┐
│ R │ 1 │ 2 │   │ 1 │  Waves meet and overlap!
├───┼───┼───┼───┼───┤  Each cell is infected
│ 1 │ 2 │   │ 1 │   │  by the NEAREST rotten
├───┼───┼───┼───┼───┤  orange (minimum time)
│   │ 1 │ R │ 2 │ 2 │
├───┼───┼───┼───┼───┤
│ 2 │   │ 1 │ 2 │   │
└───┴───┴───┴───┴───┘

After Minute 3 (All infected):
┌───┬───┬───┬───┬───┐
│ R │ 1 │ 2 │   │ 1 │  Result: 3 minutes
├───┼───┼───┼───┼───┤  to rot all oranges
│ 1 │ 2 │   │ 1 │   │
├───┼───┼───┼───┼───┤  Multi-source BFS ensures
│   │ 1 │ R │ 2 │ 2 │  we find minimum time by
├───┼───┼───┼───┼───┤  processing all sources
│ 2 │   │ 1 │ 2 │   │  simultaneously!
└───┴───┴───┴───┴───┘

═══════════════════════════════════════════════════════════════════════════
💡 KEY INSIGHT: WHY BFS GUARANTEES SHORTEST PATH
═══════════════════════════════════════════════════════════════════════════

DFS Exploration (Might explore deep paths first):
    A
   ╱ ╲
  B   C
 ╱ ╲   ╲
D   E   F (target)

DFS might go: A → B → D → E → B → A → C → F (depth-first)
Path to F: 3 edges, but explored much more!

BFS Exploration (Level by level):
    A         Level 0: Explore A
   ╱ ╲
  B   C       Level 1: Explore B, C (BOTH before going deeper!)
 ╱ ╲   ╲
D   E   F     Level 2: Explore D, E, F

BFS goes: A → B → C (finish level 1) → D → E → F
Found F at level 2, guaranteed shortest path!

The queue ensures we MUST finish exploring all level-k nodes
before exploring ANY level-(k+1) nodes. This is why BFS finds
the shortest path first in unweighted graphs!

```

## Recognition Guidelines

### How to Identify This Pattern

Look for these **key indicators**:
1. Need **shortest path** in unweighted graph/grid
2. **Level-by-level** processing required
3. **Minimum steps/moves** problems
4. Find **nearest** or **closest** element
5. Problems involving:
   - "Shortest path"
   - "Minimum steps"
   - "Level order"
   - "Nearest neighbor"
   - "Minimum distance"
6. Graph/tree problems where order matters

### Key Phrases/Indicators
- "shortest path"
- "minimum steps"
- "minimum distance"
- "level order"
- "nearest"
- "closest"
- "minimum moves"
- "breadth-first"
- "layer by layer"

## Template/Pseudocode

### Basic BFS Template (Tree)

```python
from collections import deque

def bfs(root):
    # Step 1: Handle empty tree
    if not root:
        return

    # Step 2: Initialize queue
    queue = deque([root])

    # Step 3: Process level by level
    while queue:
        # Step 4: Get current node
        node = queue.popleft()

        # Step 5: Process current node
        process(node)

        # Step 6: Add children to queue
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
```

### BFS Template (Graph with Shortest Path)

```python
from collections import deque

def bfs(start, target):
    # Step 1: Initialize queue with (node, distance)
    queue = deque([(start, 0)])
    visited = {start}

    # Step 2: BFS traversal
    while queue:
        node, dist = queue.popleft()

        # Step 3: Check if reached target
        if node == target:
            return dist

        # Step 4: Explore neighbors
        for neighbor in get_neighbors(node):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))

    # Step 5: Target not reachable
    return -1
```

### Level-by-Level BFS Template

```python
from collections import deque

def bfs_by_level(root):
    if not root:
        return

    queue = deque([root])

    while queue:
        # Process entire level at once
        level_size = len(queue)

        for _ in range(level_size):
            node = queue.popleft()
            process(node)

            # Add next level nodes
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
```

---

## Problems

### Problem 1: Binary Tree Level Order Traversal (Medium)
**LeetCode Link**: [102. Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)

**Description**: Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).

#### Python Solution
```python
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def levelOrder(root: TreeNode) -> list[list[int]]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize result and queue
    result = []
    queue = deque([root])

    # Step 3: Process level by level
    while queue:
        # Step 4: Get current level size
        level_size = len(queue)
        current_level = []

        # Step 5: Process all nodes in current level
        for _ in range(level_size):
            # Step 6: Dequeue and process node
            node = queue.popleft()
            current_level.append(node.val)

            # Step 7: Enqueue children for next level
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        # Step 8: Add current level to result
        result.append(current_level)

    return result

# Example:
#       3
#      / \
#     9  20
#       /  \
#      15   7
#
# Output: [[3], [9, 20], [15, 7]]
```

#### TypeScript Solution
```typescript
class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
        this.val = val === undefined ? 0 : val;
        this.left = left === undefined ? null : left;
        this.right = right === undefined ? null : right;
    }
}

function levelOrder(root: TreeNode | null): number[][] {
    // Step 1: Handle empty tree
    if (!root) return [];

    // Step 2: Initialize
    const result: number[][] = [];
    const queue: TreeNode[] = [root];

    // Step 3: Level by level
    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentLevel: number[] = [];

        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;
            currentLevel.push(node.val);

            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        result.push(currentLevel);
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(w) - w is maximum width of tree

---

### Problem 2: Binary Tree Right Side View (Medium)
**LeetCode Link**: [199. Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/)

**Description**: Given the root of a binary tree, imagine yourself standing on the right side of it. Return the values of the nodes you can see ordered from top to bottom.

#### Python Solution
```python
from collections import deque

def rightSideView(root: TreeNode) -> list[int]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize result and queue
    result = []
    queue = deque([root])

    # Step 3: BFS level by level
    while queue:
        # Step 4: Process current level
        level_size = len(queue)

        for i in range(level_size):
            node = queue.popleft()

            # Step 5: Last node in level is visible from right
            if i == level_size - 1:
                result.append(node.val)

            # Step 6: Add children
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

    return result

# Visualization:
#      1         ← 1 visible
#    /   \
#   2     3      ← 3 visible (rightmost)
#    \     \
#     5     4    ← 4 visible (rightmost)
#
# Right side view: [1, 3, 4]
```

#### TypeScript Solution
```typescript
function rightSideView(root: TreeNode | null): number[] {
    if (!root) return [];

    const result: number[] = [];
    const queue: TreeNode[] = [root];

    while (queue.length > 0) {
        const levelSize = queue.length;

        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;

            // Rightmost node in level
            if (i === levelSize - 1) {
                result.push(node.val);
            }

            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit all nodes
- Space: O(w) - maximum width

---

### Problem 3: Minimum Depth of Binary Tree (Easy)
**LeetCode Link**: [111. Minimum Depth of Binary Tree](https://leetcode.com/problems/minimum-depth-of-binary-tree/)

**Description**: Given a binary tree, find its minimum depth. The minimum depth is the number of nodes along the shortest path from the root node down to the nearest leaf node.

#### Python Solution
```python
from collections import deque

def minDepth(root: TreeNode) -> int:
    # Step 1: Handle empty tree
    if not root:
        return 0

    # Step 2: BFS with (node, depth) pairs
    queue = deque([(root, 1)])

    # Step 3: BFS to find first leaf
    while queue:
        node, depth = queue.popleft()

        # Step 4: Found first leaf (BFS guarantees minimum depth)
        if not node.left and not node.right:
            return depth

        # Step 5: Add children with incremented depth
        if node.left:
            queue.append((node.left, depth + 1))
        if node.right:
            queue.append((node.right, depth + 1))

    return 0  # Should never reach here

# Why BFS is better than DFS for this problem:
# BFS finds the first (shallowest) leaf
# DFS might explore deep paths before finding shallow leaf
#
# Example:
#       2
#      /
#     3
#    /
#   4
#    \
#     5
#      \
#       6
# BFS immediately recognizes no right child at 2 is NOT a leaf
# Continues level by level until finding actual leaf
```

#### TypeScript Solution
```typescript
function minDepth(root: TreeNode | null): number {
    if (!root) return 0;

    const queue: Array<[TreeNode, number]> = [[root, 1]];

    while (queue.length > 0) {
        const [node, depth] = queue.shift()!;

        // First leaf found
        if (!node.left && !node.right) {
            return depth;
        }

        if (node.left) {
            queue.push([node.left, depth + 1]);
        }
        if (node.right) {
            queue.push([node.right, depth + 1]);
        }
    }

    return 0;
}
```

**Complexity Analysis**:
- Time: O(n) - worst case visit all nodes
- Space: O(w) - maximum width

---

### Problem 4: Rotting Oranges (Medium)
**LeetCode Link**: [994. Rotting Oranges](https://leetcode.com/problems/rotting-oranges/)

**Description**: Given a grid where 0 = empty, 1 = fresh orange, 2 = rotten orange. Every minute, rotten oranges rot adjacent (4-directional) fresh oranges. Return the minimum minutes until no fresh oranges remain, or -1 if impossible.

#### Python Solution
```python
from collections import deque

def orangesRotting(grid: list[list[int]]) -> int:
    # Step 1: Get dimensions and count fresh oranges
    rows, cols = len(grid), len(grid[0])
    fresh_count = 0
    queue = deque()

    # Step 2: Find all initially rotten oranges and count fresh
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c, 0))  # (row, col, time)
            elif grid[r][c] == 1:
                fresh_count += 1

    # Step 3: If no fresh oranges, already done
    if fresh_count == 0:
        return 0

    # Step 4: BFS from all rotten oranges simultaneously
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    max_time = 0

    while queue:
        r, c, time = queue.popleft()
        max_time = max(max_time, time)

        # Step 5: Try to rot adjacent fresh oranges
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 6: Check bounds and if fresh orange
            if (0 <= nr < rows and 0 <= nc < cols and
                grid[nr][nc] == 1):
                # Step 7: Rot the orange
                grid[nr][nc] = 2
                fresh_count -= 1
                queue.append((nr, nc, time + 1))

    # Step 8: Check if all fresh oranges rotted
    return max_time if fresh_count == 0 else -1

# Visualization:
# Time 0:     Time 1:     Time 2:
# 2 1 1       2 2 1       2 2 2
# 1 1 0  →    2 1 0  →    2 2 0
# 0 1 1       0 2 1       0 2 2
#
# Answer: 2 minutes
```

#### TypeScript Solution
```typescript
function orangesRotting(grid: number[][]): number {
    const rows = grid.length;
    const cols = grid[0].length;
    let freshCount = 0;
    const queue: Array<[number, number, number]> = [];

    // Find rotten oranges and count fresh
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 2) {
                queue.push([r, c, 0]);
            } else if (grid[r][c] === 1) {
                freshCount++;
            }
        }
    }

    if (freshCount === 0) return 0;

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let maxTime = 0;

    while (queue.length > 0) {
        const [r, c, time] = queue.shift()!;
        maxTime = Math.max(maxTime, time);

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (
                nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                grid[nr][nc] === 1
            ) {
                grid[nr][nc] = 2;
                freshCount--;
                queue.push([nr, nc, time + 1]);
            }
        }
    }

    return freshCount === 0 ? maxTime : -1;
}
```

**Complexity Analysis**:
- Time: O(m × n) - visit each cell once
- Space: O(m × n) - queue can hold all cells

---

### Problem 5: Word Ladder (Hard)
**LeetCode Link**: [127. Word Ladder](https://leetcode.com/problems/word-ladder/)

**Description**: Given two words `beginWord` and `endWord`, and a dictionary `wordList`, find the length of shortest transformation sequence from `beginWord` to `endWord` where:
- Only one letter can be changed at a time
- Each transformed word must exist in the word list

#### Python Solution
```python
from collections import deque

def ladderLength(beginWord: str, endWord: str, wordList: list[str]) -> int:
    # Step 1: Check if endWord in wordList
    word_set = set(wordList)
    if endWord not in word_set:
        return 0

    # Step 2: BFS with (word, steps) pairs
    queue = deque([(beginWord, 1)])
    visited = {beginWord}

    # Step 3: BFS for shortest path
    while queue:
        word, steps = queue.popleft()

        # Step 4: Found target
        if word == endWord:
            return steps

        # Step 5: Try changing each character
        for i in range(len(word)):
            # Step 6: Try all 26 letters
            for c in 'abcdefghijklmnopqrstuvwxyz':
                # Step 7: Create new word with character change
                next_word = word[:i] + c + word[i + 1:]

                # Step 8: Check if valid and unvisited
                if next_word in word_set and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, steps + 1))

    # Step 9: No path found
    return 0

# Example:
# beginWord = "hit"
# endWord = "cog"
# wordList = ["hot","dot","dog","lot","log","cog"]
#
# Transformation:
# hit → hot → dot → dog → cog
# Length = 5
#
# BFS explores:
# Level 1: hit
# Level 2: hot (1 change from hit)
# Level 3: dot, lot (1 change from hot)
# Level 4: dog, log (1 change from dot/lot)
# Level 5: cog (1 change from dog/log)
```

#### TypeScript Solution
```typescript
function ladderLength(
    beginWord: string,
    endWord: string,
    wordList: string[]
): number {
    const wordSet = new Set(wordList);
    if (!wordSet.has(endWord)) return 0;

    const queue: Array<[string, number]> = [[beginWord, 1]];
    const visited = new Set<string>([beginWord]);

    while (queue.length > 0) {
        const [word, steps] = queue.shift()!;

        if (word === endWord) return steps;

        for (let i = 0; i < word.length; i++) {
            for (let charCode = 97; charCode <= 122; charCode++) {
                const c = String.fromCharCode(charCode);
                const nextWord = word.slice(0, i) + c + word.slice(i + 1);

                if (wordSet.has(nextWord) && !visited.has(nextWord)) {
                    visited.add(nextWord);
                    queue.push([nextWord, steps + 1]);
                }
            }
        }
    }

    return 0;
}
```

**Complexity Analysis**:
- Time: O(m² × n) - m is word length, n is wordList size
- Space: O(m × n) - visited set and queue

---

### Problem 6: Shortest Path in Binary Matrix (Medium)
**LeetCode Link**: [1091. Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/)

**Description**: Given an `n x n` binary matrix grid where 1 = blocked, 0 = clear, return the length of the shortest clear path from top-left to bottom-right. A clear path allows 8-directional movement. Return -1 if no path exists.

#### Python Solution
```python
from collections import deque

def shortestPathBinaryMatrix(grid: list[list[int]]) -> int:
    # Step 1: Check if start or end is blocked
    n = len(grid)
    if grid[0][0] == 1 or grid[n - 1][n - 1] == 1:
        return -1

    # Step 2: Handle single cell grid
    if n == 1:
        return 1

    # Step 3: Initialize BFS
    # All 8 directions
    directions = [
        (-1, -1), (-1, 0), (-1, 1),
        (0, -1),           (0, 1),
        (1, -1),  (1, 0),  (1, 1)
    ]

    queue = deque([(0, 0, 1)])  # (row, col, distance)
    grid[0][0] = 1  # Mark as visited

    # Step 4: BFS for shortest path
    while queue:
        r, c, dist = queue.popleft()

        # Step 5: Try all 8 directions
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 6: Check if reached destination
            if nr == n - 1 and nc == n - 1:
                return dist + 1

            # Step 7: Check if valid and unvisited
            if (0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0):
                grid[nr][nc] = 1  # Mark visited
                queue.append((nr, nc, dist + 1))

    # Step 8: No path found
    return -1

# Visualization:
# Grid:           Path:
# 0 0 0           * * 0
# 1 1 0    →      1 1 *
# 0 0 0           0 0 *
#
# Shortest path length: 4
# Can move diagonally!
```

#### TypeScript Solution
```typescript
function shortestPathBinaryMatrix(grid: number[][]): number {
    const n = grid.length;

    if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) {
        return -1;
    }

    if (n === 1) return 1;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    const queue: Array<[number, number, number]> = [[0, 0, 1]];
    grid[0][0] = 1;

    while (queue.length > 0) {
        const [r, c, dist] = queue.shift()!;

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr === n - 1 && nc === n - 1) {
                return dist + 1;
            }

            if (
                nr >= 0 && nr < n && nc >= 0 && nc < n &&
                grid[nr][nc] === 0
            ) {
                grid[nr][nc] = 1;
                queue.push([nr, nc, dist + 1]);
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(n²) - visit each cell once
- Space: O(n²) - queue size

---

### Problem 7: Binary Tree Zigzag Level Order Traversal (Medium)
**LeetCode Link**: [103. Binary Tree Zigzag Level Order Traversal](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/)

**Description**: Given the root of a binary tree, return the zigzag level order traversal (left to right, then right to left for next level, alternating).

#### Python Solution
```python
from collections import deque

def zigzagLevelOrder(root: TreeNode) -> list[list[int]]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize result, queue, direction
    result = []
    queue = deque([root])
    left_to_right = True

    # Step 3: BFS level by level
    while queue:
        level_size = len(queue)
        current_level = []

        # Step 4: Process current level
        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)

            # Step 5: Add children
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        # Step 6: Reverse if right to left
        if not left_to_right:
            current_level.reverse()

        # Step 7: Add level and toggle direction
        result.append(current_level)
        left_to_right = not left_to_right

    return result
```

#### TypeScript Solution
```typescript
function zigzagLevelOrder(root: TreeNode | null): number[][] {
    if (!root) return [];

    const result: number[][] = [];
    const queue: TreeNode[] = [root];
    let leftToRight = true;

    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentLevel: number[] = [];

        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;
            currentLevel.push(node.val);

            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        if (!leftToRight) {
            currentLevel.reverse();
        }

        result.push(currentLevel);
        leftToRight = !leftToRight;
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit all nodes
- Space: O(w) - maximum width

---

### Problem 8: Walls and Gates (Medium)
**LeetCode Link**: [286. Walls and Gates](https://leetcode.com/problems/walls-and-gates/) (Premium)

**Description**: Fill each empty room with the distance to its nearest gate. Given a 2D grid where -1 = wall, 0 = gate, INF = empty room. Use 4-directional movement.

#### Python Solution
```python
from collections import deque

def wallsAndGates(rooms: list[list[int]]) -> None:
    """Modify rooms in-place."""
    # Step 1: Handle empty input
    if not rooms or not rooms[0]:
        return

    # Step 2: Get dimensions
    rows, cols = len(rooms), len(rooms[0])
    INF = 2147483647

    # Step 3: Find all gates and start BFS from all simultaneously
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            if rooms[r][c] == 0:
                queue.append((r, c, 0))  # (row, col, distance)

    # Step 4: BFS from all gates
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]

    while queue:
        r, c, dist = queue.popleft()

        # Step 5: Try all 4 directions
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 6: Check if valid empty room
            if (0 <= nr < rows and 0 <= nc < cols and
                rooms[nr][nc] == INF):
                # Step 7: Update distance
                rooms[nr][nc] = dist + 1
                queue.append((nr, nc, dist + 1))

# Example:
# Before:              After:
# INF -1  0  INF       3  -1  0  1
# INF INF INF -1  →    2   2  1 -1
# INF -1  INF -1       1  -1  2 -1
#  0  -1  INF INF      0  -1  3  4
#
# Each room shows distance to nearest gate
```

#### TypeScript Solution
```typescript
function wallsAndGates(rooms: number[][]): void {
    if (!rooms || !rooms[0]) return;

    const rows = rooms.length;
    const cols = rooms[0].length;
    const INF = 2147483647;

    const queue: Array<[number, number, number]> = [];

    // Find all gates
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (rooms[r][c] === 0) {
                queue.push([r, c, 0]);
            }
        }
    }

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    while (queue.length > 0) {
        const [r, c, dist] = queue.shift()!;

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (
                nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                rooms[nr][nc] === INF
            ) {
                rooms[nr][nc] = dist + 1;
                queue.push([nr, nc, dist + 1]);
            }
        }
    }
}
```

**Complexity Analysis**:
- Time: O(m × n) - visit each cell once
- Space: O(m × n) - queue size

---

### Problem 9: Open the Lock (Medium)
**LeetCode Link**: [752. Open the Lock](https://leetcode.com/problems/open-the-lock/)

**Description**: You have a lock with 4 circular wheels, each with digits 0-9. Starting from "0000", find the minimum turns to reach target, avoiding deadends. Each turn rotates one wheel by 1.

#### Python Solution
```python
from collections import deque

def openLock(deadends: list[str], target: str) -> int:
    # Step 1: Convert deadends to set for O(1) lookup
    dead_set = set(deadends)

    # Step 2: Check if start is deadend
    if "0000" in dead_set:
        return -1

    # Step 3: BFS with (combination, moves) pairs
    queue = deque([("0000", 0)])
    visited = {"0000"}

    def get_neighbors(combo):
        """Generate all possible next combinations."""
        neighbors = []
        for i in range(4):
            digit = int(combo[i])

            # Turn wheel up (9 → 0 wraps)
            new_digit = (digit + 1) % 10
            neighbors.append(combo[:i] + str(new_digit) + combo[i + 1:])

            # Turn wheel down (0 → 9 wraps)
            new_digit = (digit - 1) % 10
            neighbors.append(combo[:i] + str(new_digit) + combo[i + 1:])

        return neighbors

    # Step 4: BFS for shortest path
    while queue:
        combo, moves = queue.popleft()

        # Step 5: Found target
        if combo == target:
            return moves

        # Step 6: Try all possible turns
        for neighbor in get_neighbors(combo):
            # Step 7: Check if valid and unvisited
            if neighbor not in visited and neighbor not in dead_set:
                visited.add(neighbor)
                queue.append((neighbor, moves + 1))

    # Step 8: Target unreachable
    return -1

# Example:
# deadends = ["0201","0101","0102","1212","2002"]
# target = "0202"
#
# Path: 0000 → 0001 → 0002 → 0102 → 0202
# Moves: 4... wait, 0102 is deadend!
# Actual: 0000 → 0100 → 0200 → 0201 → 0202... 0201 is deadend!
# Find alternative path avoiding deadends
```

#### TypeScript Solution
```typescript
function openLock(deadends: string[], target: string): number {
    const deadSet = new Set(deadends);

    if (deadSet.has("0000")) return -1;

    const queue: Array<[string, number]> = [["0000", 0]];
    const visited = new Set<string>(["0000"]);

    function getNeighbors(combo: string): string[] {
        const neighbors: string[] = [];

        for (let i = 0; i < 4; i++) {
            const digit = parseInt(combo[i]);

            // Turn up
            const up = (digit + 1) % 10;
            neighbors.push(combo.slice(0, i) + up + combo.slice(i + 1));

            // Turn down
            const down = (digit - 1 + 10) % 10;
            neighbors.push(combo.slice(0, i) + down + combo.slice(i + 1));
        }

        return neighbors;
    }

    while (queue.length > 0) {
        const [combo, moves] = queue.shift()!;

        if (combo === target) return moves;

        for (const neighbor of getNeighbors(combo)) {
            if (!visited.has(neighbor) && !deadSet.has(neighbor)) {
                visited.add(neighbor);
                queue.push([neighbor, moves + 1]);
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(10^4 × 8) = O(1) - at most 10,000 combinations, 8 neighbors each
- Space: O(10^4) - visited set size

---

### Problem 10: Symmetric Tree (Easy)
**LeetCode Link**: [101. Symmetric Tree](https://leetcode.com/problems/symmetric-tree/)

**Description**: Given the root of a binary tree, check whether it is a mirror of itself (symmetric around its center).

#### Python Solution
```python
from collections import deque

def isSymmetric(root: TreeNode) -> bool:
    # Step 1: Empty tree is symmetric
    if not root:
        return True

    # Step 2: BFS with pairs of nodes to compare
    queue = deque([(root.left, root.right)])

    # Step 3: Process pairs
    while queue:
        left, right = queue.popleft()

        # Step 4: Both null - symmetric so far
        if not left and not right:
            continue

        # Step 5: One null or values differ - not symmetric
        if not left or not right or left.val != right.val:
            return False

        # Step 6: Add children in mirror order
        # Left's left vs Right's right
        queue.append((left.left, right.right))
        # Left's right vs Right's left
        queue.append((left.right, right.left))

    # Step 7: All pairs matched
    return True

# Visualization:
#       1
#      / \
#     2   2
#    / \ / \
#   3  4 4  3
#
# Symmetric ✓
# Compare: (2,2), (3,3), (4,4)
#
#       1
#      / \
#     2   2
#      \   \
#       3   3
#
# Not symmetric ✗
# Left has right child, Right has right child (should be left)
```

#### TypeScript Solution
```typescript
function isSymmetric(root: TreeNode | null): boolean {
    if (!root) return true;

    const queue: Array<[TreeNode | null, TreeNode | null]> = [
        [root.left, root.right]
    ];

    while (queue.length > 0) {
        const [left, right] = queue.shift()!;

        if (!left && !right) continue;

        if (!left || !right || left.val !== right.val) {
            return false;
        }

        queue.push([left.left, right.right]);
        queue.push([left.right, right.left]);
    }

    return true;
}
```

**Complexity Analysis**:
- Time: O(n) - visit all nodes
- Space: O(w) - width of tree

---

### Problem 11: Perfect Squares (Medium)
**LeetCode Link**: [279. Perfect Squares](https://leetcode.com/problems/perfect-squares/)

**Description**: Given an integer `n`, return the least number of perfect square numbers that sum to `n`. For example, 12 = 4 + 4 + 4 (three squares).

#### Python Solution
```python
from collections import deque
import math

def numSquares(n: int) -> int:
    # Step 1: Generate all perfect squares <= n
    squares = []
    i = 1
    while i * i <= n:
        squares.append(i * i)
        i += 1

    # Step 2: BFS to find minimum squares needed
    # (current_sum, count) pairs
    queue = deque([(0, 0)])
    visited = {0}

    # Step 3: BFS for shortest path to n
    while queue:
        current_sum, count = queue.popleft()

        # Step 4: Try adding each perfect square
        for square in squares:
            next_sum = current_sum + square

            # Step 5: Found target
            if next_sum == n:
                return count + 1

            # Step 6: Continue BFS if not visited
            if next_sum < n and next_sum not in visited:
                visited.add(next_sum)
                queue.append((next_sum, count + 1))

    return 0  # Should never reach here

# Why BFS works:
# We're finding shortest path from 0 to n
# Each "edge" is adding a perfect square
# BFS guarantees minimum number of squares
#
# Example: n = 12
# Level 0: 0
# Level 1: 1, 4, 9 (add each square once)
# Level 2: 2, 5, 8, 10, 13... (add squares to level 1)
# Level 3: 3, 6, 9, 12 ✓ (found 12 at level 3)
# Answer: 3 squares (4 + 4 + 4)
```

#### TypeScript Solution
```typescript
function numSquares(n: number): number {
    // Generate perfect squares
    const squares: number[] = [];
    for (let i = 1; i * i <= n; i++) {
        squares.push(i * i);
    }

    const queue: Array<[number, number]> = [[0, 0]];
    const visited = new Set<number>([0]);

    while (queue.length > 0) {
        const [currentSum, count] = queue.shift()!;

        for (const square of squares) {
            const nextSum = currentSum + square;

            if (nextSum === n) {
                return count + 1;
            }

            if (nextSum < n && !visited.has(nextSum)) {
                visited.add(nextSum);
                queue.push([nextSum, count + 1]);
            }
        }
    }

    return 0;
}
```

**Complexity Analysis**:
- Time: O(n × √n) - n states, √n squares to try
- Space: O(n) - visited set

---

### Problem 12: Snakes and Ladders (Medium)
**LeetCode Link**: [909. Snakes and Ladders](https://leetcode.com/problems/snakes-and-ladders/)

**Description**: Given an `n x n` board with snakes and ladders, return the minimum number of moves to reach square n². From square x, you can move to x+1 through x+6 (dice roll). Snakes/ladders teleport you.

#### Python Solution
```python
from collections import deque

def snakesAndLadders(board: list[list[int]]) -> int:
    # Step 1: Get board size
    n = len(board)

    def get_coordinates(square):
        """Convert square number to (row, col) on board."""
        # Square 1 is at bottom-left
        square -= 1  # Convert to 0-indexed
        row = n - 1 - (square // n)
        col = square % n

        # Boustrophedon: alternate row directions
        if (n - 1 - row) % 2 == 1:
            col = n - 1 - col

        return row, col

    # Step 2: BFS for shortest path
    queue = deque([(1, 0)])  # (square, moves)
    visited = {1}

    # Step 3: BFS
    while queue:
        square, moves = queue.popleft()

        # Step 4: Try dice rolls 1-6
        for dice in range(1, 7):
            next_square = square + dice

            # Step 5: Reached end
            if next_square == n * n:
                return moves + 1

            # Step 6: Check if valid square
            if next_square > n * n:
                continue

            # Step 7: Check for snake or ladder
            row, col = get_coordinates(next_square)
            if board[row][col] != -1:
                next_square = board[row][col]

            # Step 8: Add to queue if unvisited
            if next_square not in visited:
                visited.add(next_square)
                queue.append((next_square, moves + 1))

    # Step 9: Cannot reach end
    return -1

# Visualization of board numbering (n=5):
# 21 22 23 24 25
# 20 19 18 17 16
# 11 12 13 14 15
# 10  9  8  7  6
#  1  2  3  4  5
```

#### TypeScript Solution
```typescript
function snakesAndLadders(board: number[][]): number {
    const n = board.length;

    function getCoordinates(square: number): [number, number] {
        square -= 1;
        const row = n - 1 - Math.floor(square / n);
        let col = square % n;

        if ((n - 1 - row) % 2 === 1) {
            col = n - 1 - col;
        }

        return [row, col];
    }

    const queue: Array<[number, number]> = [[1, 0]];
    const visited = new Set<number>([1]);

    while (queue.length > 0) {
        const [square, moves] = queue.shift()!;

        for (let dice = 1; dice <= 6; dice++) {
            let nextSquare = square + dice;

            if (nextSquare === n * n) {
                return moves + 1;
            }

            if (nextSquare > n * n) continue;

            const [row, col] = getCoordinates(nextSquare);
            if (board[row][col] !== -1) {
                nextSquare = board[row][col];
            }

            if (!visited.has(nextSquare)) {
                visited.add(nextSquare);
                queue.push([nextSquare, moves + 1]);
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(n²) - at most n² squares
- Space: O(n²) - visited set

---

### Problem 13: Bus Routes (Hard)
**LeetCode Link**: [815. Bus Routes](https://leetcode.com/problems/bus-routes/)

**Description**: Given an array `routes` where `routes[i]` is a bus route (list of stops), return the minimum number of buses to take to travel from `source` to `target`. Return -1 if impossible.

#### Python Solution
```python
from collections import deque, defaultdict

def numBusesToDestination(routes: list[list[int]], source: int, target: int) -> int:
    # Step 1: Already at target
    if source == target:
        return 0

    # Step 2: Build stop to routes mapping
    stop_to_routes = defaultdict(set)
    for route_idx, route in enumerate(routes):
        for stop in route:
            stop_to_routes[stop].add(route_idx)

    # Step 3: BFS on routes (not stops!)
    # (current_stop, buses_taken) pairs
    queue = deque([(source, 0)])
    visited_stops = {source}
    visited_routes = set()

    # Step 4: BFS
    while queue:
        stop, buses = queue.popleft()

        # Step 5: Try all routes passing through current stop
        for route_idx in stop_to_routes[stop]:
            # Step 6: Skip if route already used
            if route_idx in visited_routes:
                continue

            visited_routes.add(route_idx)

            # Step 7: Explore all stops on this route
            for next_stop in routes[route_idx]:
                # Step 8: Found target
                if next_stop == target:
                    return buses + 1

                # Step 9: Add unvisited stops
                if next_stop not in visited_stops:
                    visited_stops.add(next_stop)
                    queue.append((next_stop, buses + 1))

    # Step 10: Target unreachable
    return -1

# Example:
# routes = [[1,2,7],[3,6,7]]
# source = 1, target = 6
#
# Step 1: Start at stop 1 (0 buses)
# Step 2: Take route 0, reach stops 1,2,7 (1 bus)
# Step 3: From stop 7, take route 1, reach stops 3,6,7 (2 buses)
# Step 4: Found target 6 after 2 buses
```

#### TypeScript Solution
```typescript
function numBusesToDestination(
    routes: number[][],
    source: number,
    target: number
): number {
    if (source === target) return 0;

    // Build stop to routes mapping
    const stopToRoutes = new Map<number, Set<number>>();
    for (let i = 0; i < routes.length; i++) {
        for (const stop of routes[i]) {
            if (!stopToRoutes.has(stop)) {
                stopToRoutes.set(stop, new Set());
            }
            stopToRoutes.get(stop)!.add(i);
        }
    }

    const queue: Array<[number, number]> = [[source, 0]];
    const visitedStops = new Set<number>([source]);
    const visitedRoutes = new Set<number>();

    while (queue.length > 0) {
        const [stop, buses] = queue.shift()!;

        for (const routeIdx of stopToRoutes.get(stop) || []) {
            if (visitedRoutes.has(routeIdx)) continue;

            visitedRoutes.add(routeIdx);

            for (const nextStop of routes[routeIdx]) {
                if (nextStop === target) {
                    return buses + 1;
                }

                if (!visitedStops.has(nextStop)) {
                    visitedStops.add(nextStop);
                    queue.push([nextStop, buses + 1]);
                }
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(N × S) - N routes, S stops per route
- Space: O(N × S) - mappings and visited sets

---

### Problem 14: All Nodes Distance K in Binary Tree (Medium)
**LeetCode Link**: [863. All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/)

**Description**: Given the root of a binary tree, a target node, and an integer K, return a list of all nodes that are distance K from the target node. The distance between two nodes is the number of edges between them.

#### Python Solution
```python
from collections import deque, defaultdict

def distanceK(root: TreeNode, target: TreeNode, k: int) -> list[int]:
    # Step 1: Build graph (tree → undirected graph)
    # Convert tree to graph so we can traverse in all directions from target
    graph = defaultdict(list)

    def build_graph(node, parent):
        """Build adjacency list representation of tree."""
        if not node:
            return

        # Step 2: Add bidirectional edges
        if parent:
            graph[node.val].append(parent.val)
            graph[parent.val].append(node.val)

        # Step 3: Recursively build for children
        build_graph(node.left, node)
        build_graph(node.right, node)

    build_graph(root, None)

    # Step 4: BFS from target to find nodes at distance k
    queue = deque([(target.val, 0)])  # (node_val, distance)
    visited = {target.val}
    result = []

    # Step 5: BFS traversal
    while queue:
        node_val, dist = queue.popleft()

        # Step 6: Found node at distance k
        if dist == k:
            result.append(node_val)
            continue  # No need to explore further from this node

        # Step 7: Explore neighbors
        for neighbor in graph[node_val]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))

    return result

# Visualization:
#        3
#       / \
#      5   1
#     / \   \
#    6   2   0
#       / \
#      7   4
#
# target = 5, k = 2
#
# Graph representation (all edges bidirectional):
#   3 ↔ 5, 3 ↔ 1
#   5 ↔ 6, 5 ↔ 2
#   1 ↔ 0
#   2 ↔ 7, 2 ↔ 4
#
# BFS from target (5):
# Distance 0: [5]
# Distance 1: [3, 6, 2]
# Distance 2: [1, 7, 4] ← Answer!
#
# Like ripples spreading from stone dropped at node 5,
# reaching nodes 1, 7, 4 at the second wave!
```

#### TypeScript Solution
```typescript
function distanceK(
    root: TreeNode | null,
    target: TreeNode | null,
    k: number
): number[] {
    if (!root || !target) return [];

    // Build graph
    const graph = new Map<number, number[]>();

    function buildGraph(node: TreeNode | null, parent: TreeNode | null): void {
        if (!node) return;

        if (parent) {
            if (!graph.has(node.val)) graph.set(node.val, []);
            if (!graph.has(parent.val)) graph.set(parent.val, []);
            graph.get(node.val)!.push(parent.val);
            graph.get(parent.val)!.push(node.val);
        }

        buildGraph(node.left, node);
        buildGraph(node.right, node);
    }

    buildGraph(root, null);

    // BFS from target
    const queue: Array<[number, number]> = [[target.val, 0]];
    const visited = new Set<number>([target.val]);
    const result: number[] = [];

    while (queue.length > 0) {
        const [nodeVal, dist] = queue.shift()!;

        if (dist === k) {
            result.push(nodeVal);
            continue;
        }

        for (const neighbor of graph.get(nodeVal) || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([neighbor, dist + 1]);
            }
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - build graph O(n) + BFS O(n)
- Space: O(n) - graph storage and queue

---

### Problem 15: Shortest Bridge (Medium)
**LeetCode Link**: [934. Shortest Bridge](https://leetcode.com/problems/shortest-bridge/)

**Description**: In a 2D grid of 0s and 1s, there are exactly two islands. Flip 0s to 1s to connect the islands. Return the minimum number of 0s you must flip.

#### Python Solution
```python
from collections import deque

def shortestBridge(grid: list[list[int]]) -> int:
    n = len(grid)

    # Step 1: Find first island using DFS and mark it
    def dfs(r, c, queue):
        """Find all cells of first island and add to queue."""
        if (r < 0 or r >= n or c < 0 or c >= n or
            grid[r][c] != 1):
            return

        # Step 2: Mark as visited (use 2 to distinguish from second island)
        grid[r][c] = 2
        queue.append((r, c, 0))  # Add to BFS queue

        # Step 3: Explore all 4 directions
        dfs(r + 1, c, queue)
        dfs(r - 1, c, queue)
        dfs(r, c + 1, queue)
        dfs(r, c - 1, queue)

    # Step 4: Find any cell of first island
    queue = deque()
    found = False

    for r in range(n):
        if found:
            break
        for c in range(n):
            if grid[r][c] == 1:
                # Step 5: Mark entire first island with DFS
                dfs(r, c, queue)
                found = True
                break

    # Step 6: BFS from first island to find second island
    # queue already contains all cells of first island
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]

    while queue:
        r, c, dist = queue.popleft()

        # Step 7: Explore neighbors
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 8: Check bounds
            if nr < 0 or nr >= n or nc < 0 or nc >= n:
                continue

            # Step 9: Found second island!
            if grid[nr][nc] == 1:
                return dist

            # Step 10: Continue expanding through water
            if grid[nr][nc] == 0:
                grid[nr][nc] = 2  # Mark as visited
                queue.append((nr, nc, dist + 1))

    return -1  # Should never reach here

# Visualization:
# Initial grid:
# 0 1 0      First island at (0,1)
# 0 0 0
# 0 0 1      Second island at (2,2)
#
# Step 1: Find first island with DFS
# 0 2 0      Mark first island as '2'
# 0 0 0
# 0 0 1
#
# Step 2: BFS expansion (like ripples from island)
# Wave 0: Start from island cell (0,1)
# Wave 1: Expand to water (0,0), (0,2), (1,1)
# Wave 2: Continue expanding...
# Until we hit second island!
#
# Answer: 2 (need to flip 2 zeros to connect islands)
```

#### TypeScript Solution
```typescript
function shortestBridge(grid: number[][]): number {
    const n = grid.length;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    function dfs(r: number, c: number, queue: Array<[number, number, number]>): void {
        if (r < 0 || r >= n || c < 0 || c >= n || grid[r][c] !== 1) {
            return;
        }

        grid[r][c] = 2;
        queue.push([r, c, 0]);

        dfs(r + 1, c, queue);
        dfs(r - 1, c, queue);
        dfs(r, c + 1, queue);
        dfs(r, c - 1, queue);
    }

    // Find first island
    const queue: Array<[number, number, number]> = [];
    let found = false;

    for (let r = 0; r < n && !found; r++) {
        for (let c = 0; c < n && !found; c++) {
            if (grid[r][c] === 1) {
                dfs(r, c, queue);
                found = true;
            }
        }
    }

    // BFS from first island
    while (queue.length > 0) {
        const [r, c, dist] = queue.shift()!;

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;

            if (grid[nr][nc] === 1) return dist;

            if (grid[nr][nc] === 0) {
                grid[nr][nc] = 2;
                queue.push([nr, nc, dist + 1]);
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(n²) - DFS O(n²) + BFS O(n²)
- Space: O(n²) - queue size in worst case

---

### Problem 16: As Far from Land as Possible (Medium)
**LeetCode Link**: [1162. As Far from Land as Possible](https://leetcode.com/problems/as-far-from-land-as-possible/)

**Description**: Given an `n x n` grid containing only 0s (water) and 1s (land), find a water cell such that its distance to the nearest land cell is maximized. Return the maximum distance. If no land or no water exists, return -1.

#### Python Solution
```python
from collections import deque

def maxDistance(grid: list[list[int]]) -> int:
    # Step 1: Get dimensions
    n = len(grid)

    # Step 2: Multi-source BFS - start from ALL land cells
    queue = deque()

    for r in range(n):
        for c in range(n):
            if grid[r][c] == 1:
                queue.append((r, c, 0))  # (row, col, distance)

    # Step 3: Check if all land or all water
    if len(queue) == 0 or len(queue) == n * n:
        return -1

    # Step 4: BFS from all land cells simultaneously
    # Like multiple stones dropped in water - ripples spreading!
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    max_dist = 0

    while queue:
        r, c, dist = queue.popleft()
        max_dist = max(max_dist, dist)

        # Step 5: Explore 4 directions
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 6: Check bounds and if water
            if (0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0):
                # Step 7: Mark as visited and add to queue
                grid[nr][nc] = dist + 1  # Store distance in grid
                queue.append((nr, nc, dist + 1))

    return max_dist

# Visualization - Multi-source BFS like multiple ripples!
#
# Initial:        After Wave 1:   After Wave 2:   Final:
# 1 0 0           1 1 0           1 1 2           1 1 2
# 0 0 0    →      1 0 0    →      1 2 0    →      1 2 3
# 0 0 1           0 0 1           0 1 1           2 1 1
#
# Land cells (1s) start spreading simultaneously
# Each wave reaches water cells farther away
# Maximum distance = 3 (top-right corner)
#
# Think of it as: Where can you be in the ocean to be
# FARTHEST from any island? That's the answer!
```

#### TypeScript Solution
```typescript
function maxDistance(grid: number[][]): number {
    const n = grid.length;
    const queue: Array<[number, number, number]> = [];

    // Find all land cells
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c] === 1) {
                queue.push([r, c, 0]);
            }
        }
    }

    // Check if all land or all water
    if (queue.length === 0 || queue.length === n * n) {
        return -1;
    }

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let maxDist = 0;

    while (queue.length > 0) {
        const [r, c, dist] = queue.shift()!;
        maxDist = Math.max(maxDist, dist);

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0) {
                grid[nr][nc] = dist + 1;
                queue.push([nr, nc, dist + 1]);
            }
        }
    }

    return maxDist;
}
```

**Complexity Analysis**:
- Time: O(n²) - visit each cell once
- Space: O(n²) - queue size

---

### Problem 17: Jump Game III (Medium)
**LeetCode Link**: [1306. Jump Game III](https://leetcode.com/problems/jump-game-iii/)

**Description**: Given an array of non-negative integers `arr`, you are initially at index `start`. When at index `i`, you can jump to `i + arr[i]` or `i - arr[i]`. Return true if you can reach any index with value 0.

#### Python Solution
```python
from collections import deque

def canReach(arr: list[int], start: int) -> bool:
    # Step 1: BFS to explore all reachable indices
    n = len(arr)
    queue = deque([start])
    visited = {start}

    # Step 2: BFS traversal
    while queue:
        idx = queue.popleft()

        # Step 3: Found zero!
        if arr[idx] == 0:
            return True

        # Step 4: Try both jumps (forward and backward)
        jump_distance = arr[idx]

        # Jump forward: i + arr[i]
        next_idx = idx + jump_distance
        if next_idx < n and next_idx not in visited:
            visited.add(next_idx)
            queue.append(next_idx)

        # Jump backward: i - arr[i]
        prev_idx = idx - jump_distance
        if prev_idx >= 0 and prev_idx not in visited:
            visited.add(prev_idx)
            queue.append(prev_idx)

    # Step 5: Cannot reach any zero
    return False

# Visualization:
# arr = [4, 2, 3, 0, 3, 1, 2], start = 5
#
# Index:  0  1  2  3  4  5  6
# Value: [4, 2, 3, 0, 3, 1, 2]
#              ↑        ↑
#            zero     start
#
# BFS Exploration (like exploring a graph):
# Level 0: Start at index 5 (value=1)
#   Can jump to: 5+1=6 or 5-1=4
#
# Level 1: Explore indices [6, 4]
#   From 6 (value=2): jump to 6+2=8 (invalid) or 6-2=4
#   From 4 (value=3): jump to 4+3=7 (invalid) or 4-3=1
#
# Level 2: Explore indices [1]
#   From 1 (value=2): jump to 1+2=3 or 1-2=-1 (invalid)
#
# Level 3: Explore index 3
#   arr[3] = 0 ✓ Found!
#
# Return: True
#
# Think of each index as a node, jumps as edges.
# BFS explores all reachable indices level by level!
```

#### TypeScript Solution
```typescript
function canReach(arr: number[], start: number): boolean {
    const n = arr.length;
    const queue: number[] = [start];
    const visited = new Set<number>([start]);

    while (queue.length > 0) {
        const idx = queue.shift()!;

        if (arr[idx] === 0) return true;

        const jumpDistance = arr[idx];

        // Jump forward
        const nextIdx = idx + jumpDistance;
        if (nextIdx < n && !visited.has(nextIdx)) {
            visited.add(nextIdx);
            queue.push(nextIdx);
        }

        // Jump backward
        const prevIdx = idx - jumpDistance;
        if (prevIdx >= 0 && !visited.has(prevIdx)) {
            visited.add(prevIdx);
            queue.push(prevIdx);
        }
    }

    return false;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each index at most once
- Space: O(n) - visited set and queue

---

### Problem 18: Minimum Knight Moves (Medium)
**LeetCode Link**: [1197. Minimum Knight Moves](https://leetcode.com/problems/minimum-knight-moves/) (Premium)

**Description**: In an infinite chess board, a knight starts at (0, 0) and wants to reach (x, y). Return the minimum number of moves required. The knight can move in an "L" shape: 2 squares in one direction and 1 square perpendicular.

#### Python Solution
```python
from collections import deque

def minKnightMoves(x: int, y: int) -> int:
    # Step 1: Handle edge case
    if x == 0 and y == 0:
        return 0

    # Step 2: Use symmetry - work in first quadrant only
    x, y = abs(x), abs(y)

    # Step 3: All 8 possible knight moves
    moves = [
        (2, 1), (2, -1), (-2, 1), (-2, -1),
        (1, 2), (1, -2), (-1, 2), (-1, -2)
    ]

    # Step 4: BFS from origin
    queue = deque([(0, 0, 0)])  # (x, y, distance)
    visited = {(0, 0)}

    # Step 5: BFS for shortest path
    while queue:
        curr_x, curr_y, dist = queue.popleft()

        # Step 6: Try all 8 knight moves
        for dx, dy in moves:
            next_x = curr_x + dx
            next_y = curr_y + dy

            # Step 7: Found target
            if next_x == x and next_y == y:
                return dist + 1

            # Step 8: Pruning - stay within reasonable bounds
            # Allow going slightly negative to handle edge cases
            if (next_x, next_y) not in visited and \
               -2 <= next_x <= x + 2 and -2 <= next_y <= y + 2:
                visited.add((next_x, next_y))
                queue.append((next_x, next_y, dist + 1))

    return -1  # Should never reach here

# Visualization:
# Finding path from (0,0) to (2,1)
#
# Knight move pattern (from any position):
#     -2  -1   0  +1  +2
# +2   *       *       *
# +1       *       *
#  0           K          K = Knight position
# -1       *       *
# -2   *       *       *
#
# BFS Exploration (like ripples, but in L-shapes!):
# Distance 0: (0,0) - Start
# Distance 1: 8 positions around (0,0) via L-moves
#   (2,1), (2,-1), (1,2), (1,-2), etc.
# Distance 2: All positions reachable in 2 L-moves
#
# For target (2,1): Found at distance 1!
# For target (5,5): BFS explores level by level
#
# Think: Instead of straight lines or diagonals,
# the "ripples" move in L-shaped patterns!
```

#### TypeScript Solution
```typescript
function minKnightMoves(x: number, y: number): number {
    if (x === 0 && y === 0) return 0;

    x = Math.abs(x);
    y = Math.abs(y);

    const moves = [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];

    const queue: Array<[number, number, number]> = [[0, 0, 0]];
    const visited = new Set<string>(['0,0']);

    while (queue.length > 0) {
        const [currX, currY, dist] = queue.shift()!;

        for (const [dx, dy] of moves) {
            const nextX = currX + dx;
            const nextY = currY + dy;

            if (nextX === x && nextY === y) {
                return dist + 1;
            }

            const key = `${nextX},${nextY}`;
            if (!visited.has(key) &&
                nextX >= -2 && nextX <= x + 2 &&
                nextY >= -2 && nextY <= y + 2) {
                visited.add(key);
                queue.push([nextX, nextY, dist + 1]);
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(max(|x|, |y|)²) - BFS exploration area
- Space: O(max(|x|, |y|)²) - visited set

---

### Problem 19: Pacific Atlantic Water Flow (Medium)
**LeetCode Link**: [417. Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/)

**Description**: Given an `m x n` matrix of heights, water can flow to neighboring cells if their height is less than or equal to the current cell. The Pacific ocean touches the left and top edges, Atlantic touches right and bottom. Return cells that can flow to both oceans.

#### Python Solution
```python
from collections import deque

def pacificAtlantic(heights: list[list[int]]) -> list[list[int]]:
    # Step 1: Handle empty input
    if not heights or not heights[0]:
        return []

    m, n = len(heights), len(heights[0])

    # Step 2: BFS from ocean borders (reverse thinking!)
    # Instead of "can water flow FROM cell TO ocean?"
    # Ask: "can water flow FROM ocean TO cell?"

    def bfs(starts):
        """BFS from multiple starting points (ocean borders)."""
        queue = deque(starts)
        reachable = set(starts)
        directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]

        while queue:
            r, c = queue.popleft()

            # Step 3: Explore neighbors (water flows uphill in reverse)
            for dr, dc in directions:
                nr, nc = r + dr, c + dc

                # Step 4: Check bounds and if not visited
                if (0 <= nr < m and 0 <= nc < n and
                    (nr, nc) not in reachable and
                    heights[nr][nc] >= heights[r][c]):  # Water can flow from ocean
                    reachable.add((nr, nc))
                    queue.append((nr, nc))

        return reachable

    # Step 5: Find all cells reachable from Pacific (top + left borders)
    pacific_starts = []
    for r in range(m):
        pacific_starts.append((r, 0))  # Left border
    for c in range(n):
        pacific_starts.append((0, c))  # Top border

    pacific_reachable = bfs(pacific_starts)

    # Step 6: Find all cells reachable from Atlantic (bottom + right borders)
    atlantic_starts = []
    for r in range(m):
        atlantic_starts.append((r, n - 1))  # Right border
    for c in range(n):
        atlantic_starts.append((m - 1, c))  # Bottom border

    atlantic_reachable = bfs(atlantic_starts)

    # Step 7: Find intersection (cells reachable from BOTH oceans)
    result = []
    for r in range(m):
        for c in range(n):
            if (r, c) in pacific_reachable and (r, c) in atlantic_reachable:
                result.append([r, c])

    return result

# Visualization:
# Grid:
#   1  2  2  3  5
#   3  2  3  4  4
#   2  4  5  3  1
#   6  7  1  4  5
#   5  1  1  2  4
#
# Pacific Ocean (top & left):  P P P P P
#                              P
#                              P
#                              P
#                              P
#
# Atlantic Ocean (bottom & right):
#                                      A
#                                      A
#                                      A
#                                      A
#                              A A A A A
#
# BFS from Pacific border (like water flowing inland):
# Wave spreads from borders uphill (reverse flow)
# Marks all cells that water CAN REACH from Pacific
#
# BFS from Atlantic border:
# Similarly marks all cells reachable from Atlantic
#
# Intersection = cells that can reach BOTH oceans!
#
# Think: Two sets of ripples spreading from opposite shores,
# finding where they overlap!
```

#### TypeScript Solution
```typescript
function pacificAtlantic(heights: number[][]): number[][] {
    if (!heights || !heights[0]) return [];

    const m = heights.length;
    const n = heights[0].length;

    function bfs(starts: Array<[number, number]>): Set<string> {
        const queue: Array<[number, number]> = [...starts];
        const reachable = new Set<string>();
        starts.forEach(([r, c]) => reachable.add(`${r},${c}`));

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        while (queue.length > 0) {
            const [r, c] = queue.shift()!;

            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;

                if (nr >= 0 && nr < m && nc >= 0 && nc < n &&
                    !reachable.has(key) &&
                    heights[nr][nc] >= heights[r][c]) {
                    reachable.add(key);
                    queue.push([nr, nc]);
                }
            }
        }

        return reachable;
    }

    // Pacific borders
    const pacificStarts: Array<[number, number]> = [];
    for (let r = 0; r < m; r++) pacificStarts.push([r, 0]);
    for (let c = 0; c < n; c++) pacificStarts.push([0, c]);

    // Atlantic borders
    const atlanticStarts: Array<[number, number]> = [];
    for (let r = 0; r < m; r++) atlanticStarts.push([r, n - 1]);
    for (let c = 0; c < n; c++) atlanticStarts.push([m - 1, c]);

    const pacificReachable = bfs(pacificStarts);
    const atlanticReachable = bfs(atlanticStarts);

    // Find intersection
    const result: number[][] = [];
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            const key = `${r},${c}`;
            if (pacificReachable.has(key) && atlanticReachable.has(key)) {
                result.push([r, c]);
            }
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(m × n) - BFS visits each cell at most twice
- Space: O(m × n) - reachable sets

---

### Problem 20: Minimum Genetic Mutation (Medium)
**LeetCode Link**: [433. Minimum Genetic Mutation](https://leetcode.com/problems/minimum-genetic-mutation/)

**Description**: A gene string can be represented by an 8-character string using 'A', 'C', 'G', 'T'. A mutation is a single character change. Given start, end, and a gene bank, find the minimum mutations needed from start to end. Each mutation must be in the bank.

#### Python Solution
```python
from collections import deque

def minMutation(start: str, end: str, bank: list[str]) -> int:
    # Step 1: Check if end is even possible
    bank_set = set(bank)
    if end not in bank_set:
        return -1

    # Step 2: BFS for shortest path (like Word Ladder!)
    queue = deque([(start, 0)])  # (gene, mutations)
    visited = {start}

    # Step 3: Possible characters for mutation
    chars = ['A', 'C', 'G', 'T']

    # Step 4: BFS traversal
    while queue:
        gene, mutations = queue.popleft()

        # Step 5: Found target
        if gene == end:
            return mutations

        # Step 6: Try mutating each position
        for i in range(8):
            # Step 7: Try each character at position i
            for char in chars:
                # Step 8: Create mutated gene
                mutated = gene[:i] + char + gene[i + 1:]

                # Step 9: Check if valid and unvisited
                if mutated in bank_set and mutated not in visited:
                    visited.add(mutated)
                    queue.append((mutated, mutations + 1))

    # Step 10: Cannot reach end
    return -1

# Visualization - Think of it as a graph!
# start = "AACCGGTT"
# end   = "AACCGGTA"
# bank  = ["AACCGGTA", "AACCGCTA", "AAACGGTA"]
#
# Each gene is a node, one-mutation difference is an edge:
#
#   AACCGGTT (start)
#      │
#      │ (1 mutation: T→A at position 7)
#      ↓
#   AACCGGTA (end) ✓
#
# Shortest path = 1 mutation
#
# More complex example:
# start = "AACCGGTT"
# end   = "AAACGGTA"
# bank  = ["AACCGGTA", "AACCGCTA", "AAACGGTA"]
#
# Graph structure:
#         AACCGGTT (start)
#            ╱    ╲
#   (pos 6: G→C) (pos 7: T→A)
#          ╱        ╲
#    AACCGCTA     AACCGGTA
#        │            │
#   (pos 2: C→A) (pos 2: C→A)
#        │            │
#         ╲          ╱
#          AAACGGTA (end)
#
# BFS explores level by level:
# Level 0: AACCGGTT
# Level 1: AACCGGTA, AACCGCTA
# Level 2: AAACGGTA ✓ (found via either path, returns 2)
#
# Like ripples spreading through mutation space!
```

#### TypeScript Solution
```typescript
function minMutation(start: string, end: string, bank: string[]): number {
    const bankSet = new Set(bank);
    if (!bankSet.has(end)) return -1;

    const queue: Array<[string, number]> = [[start, 0]];
    const visited = new Set<string>([start]);
    const chars = ['A', 'C', 'G', 'T'];

    while (queue.length > 0) {
        const [gene, mutations] = queue.shift()!;

        if (gene === end) return mutations;

        for (let i = 0; i < 8; i++) {
            for (const char of chars) {
                const mutated = gene.slice(0, i) + char + gene.slice(i + 1);

                if (bankSet.has(mutated) && !visited.has(mutated)) {
                    visited.add(mutated);
                    queue.push([mutated, mutations + 1]);
                }
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(8 × 4 × N) = O(N) where N is bank size
- Space: O(N) - visited set and queue

---

### Problem 21: Word Ladder II (Hard)
**LeetCode Link**: [126. Word Ladder II](https://leetcode.com/problems/word-ladder-ii/)

**Description**: Given two words `beginWord` and `endWord`, and a dictionary, find ALL shortest transformation sequences from `beginWord` to `endWord`. Each transformed word must exist in the dictionary.

#### Python Solution
```python
from collections import deque, defaultdict

def findLadders(
    beginWord: str,
    endWord: str,
    wordList: list[str]
) -> list[list[str]]:
    # Step 1: Check if endWord exists
    word_set = set(wordList)
    if endWord not in word_set:
        return []

    # Step 2: BFS to build graph and find shortest path length
    # Build parent relationships for backtracking
    parents = defaultdict(list)  # child -> [parent1, parent2, ...]

    queue = deque([beginWord])
    current_level = {beginWord}
    found = False

    # Step 3: BFS level by level
    while queue and not found:
        # Step 4: Process entire level
        next_level = set()
        for _ in range(len(queue)):
            word = queue.popleft()

            # Step 5: Try all one-letter changes
            for i in range(len(word)):
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    next_word = word[:i] + c + word[i + 1:]

                    if next_word in word_set:
                        # Step 6: Found endWord at this level
                        if next_word == endWord:
                            found = True
                            parents[next_word].append(word)

                        # Step 7: Not visited at previous levels
                        if next_word not in current_level:
                            if next_word not in next_level:
                                next_level.add(next_word)
                                queue.append(next_word)
                            # Step 8: Track parent for backtracking
                            parents[next_word].append(word)

        # Step 9: Mark current level as visited
        current_level = next_level

    # Step 10: Backtrack to find all paths
    result = []

    def backtrack(word, path):
        """Build paths from endWord back to beginWord."""
        if word == beginWord:
            result.append([beginWord] + path)
            return

        for parent in parents[word]:
            backtrack(parent, [word] + path)

    if found:
        backtrack(endWord, [])

    # Step 11: Reverse paths (we built them backwards)
    return [path[::-1] for path in result]

# Visualization:
# beginWord = "hit"
# endWord = "cog"
# wordList = ["hot","dot","dog","lot","log","cog"]
#
# BFS builds this graph (showing parent relationships):
#
# Level 0:     hit
#               │
# Level 1:     hot
#             ╱   ╲
# Level 2:  dot   lot
#            │     │
# Level 3:  dog   log
#             ╲   ╱
# Level 4:     cog
#
# Backtracking from cog finds TWO paths:
# Path 1: hit → hot → dot → dog → cog
# Path 2: hit → hot → lot → log → cog
#
# Both have length 5 (shortest possible)
#
# Like water ripples that can split and take multiple
# routes, we find ALL shortest routes!
```

#### TypeScript Solution
```typescript
function findLadders(
    beginWord: string,
    endWord: string,
    wordList: string[]
): string[][] {
    const wordSet = new Set(wordList);
    if (!wordSet.has(endWord)) return [];

    const parents = new Map<string, string[]>();
    const queue: string[] = [beginWord];
    let currentLevel = new Set([beginWord]);
    let found = false;

    while (queue.length > 0 && !found) {
        const nextLevel = new Set<string>();
        const levelSize = queue.length;

        for (let i = 0; i < levelSize; i++) {
            const word = queue.shift()!;

            for (let j = 0; j < word.length; j++) {
                for (let charCode = 97; charCode <= 122; charCode++) {
                    const c = String.fromCharCode(charCode);
                    const nextWord = word.slice(0, j) + c + word.slice(j + 1);

                    if (wordSet.has(nextWord)) {
                        if (nextWord === endWord) {
                            found = true;
                        }

                        if (!currentLevel.has(nextWord)) {
                            if (!nextLevel.has(nextWord)) {
                                nextLevel.add(nextWord);
                                queue.push(nextWord);
                            }

                            if (!parents.has(nextWord)) {
                                parents.set(nextWord, []);
                            }
                            parents.get(nextWord)!.push(word);
                        }
                    }
                }
            }
        }

        currentLevel = nextLevel;
    }

    const result: string[][] = [];

    function backtrack(word: string, path: string[]): void {
        if (word === beginWord) {
            result.push([beginWord, ...path]);
            return;
        }

        for (const parent of parents.get(word) || []) {
            backtrack(parent, [word, ...path]);
        }
    }

    if (found) {
        backtrack(endWord, []);
    }

    return result.map(path => path.reverse());
}
```

**Complexity Analysis**:
- Time: O(N × L² × 26) where N = wordList size, L = word length
- Space: O(N × L) - parent map and paths

---

### Problem 22: Sliding Puzzle (Hard)
**LeetCode Link**: [773. Sliding Puzzle](https://leetcode.com/problems/sliding-puzzle/)

**Description**: On a 2x3 board, tiles are numbered 1-5 and one tile is 0 (empty). A move swaps 0 with an adjacent tile. Return the minimum moves to reach the solved state [[1,2,3],[4,5,0]], or -1 if impossible.

#### Python Solution
```python
from collections import deque

def slidingPuzzle(board: list[list[int]]) -> int:
    # Step 1: Convert board to string for easy comparison
    start = ''.join(str(num) for row in board for num in row)
    target = '123450'

    if start == target:
        return 0

    # Step 2: Define valid moves for each position (index in flattened board)
    # Board positions:  0 1 2
    #                   3 4 5
    neighbors = {
        0: [1, 3],     # Position 0 can swap with 1 (right) or 3 (down)
        1: [0, 2, 4],  # Position 1 can swap with 0, 2, 4
        2: [1, 5],
        3: [0, 4],
        4: [1, 3, 5],
        5: [2, 4]
    }

    # Step 3: BFS to find shortest path
    queue = deque([(start, 0)])  # (state, moves)
    visited = {start}

    # Step 4: BFS traversal
    while queue:
        state, moves = queue.popleft()

        # Step 5: Find position of 0 (empty tile)
        zero_pos = state.index('0')

        # Step 6: Try swapping with each valid neighbor
        for next_pos in neighbors[zero_pos]:
            # Step 7: Create new state by swapping
            state_list = list(state)
            state_list[zero_pos], state_list[next_pos] = \
                state_list[next_pos], state_list[zero_pos]
            next_state = ''.join(state_list)

            # Step 8: Found solution!
            if next_state == target:
                return moves + 1

            # Step 9: Add to queue if unvisited
            if next_state not in visited:
                visited.add(next_state)
                queue.append((next_state, moves + 1))

    # Step 10: No solution exists
    return -1

# Visualization - State Space Search:
# Each board configuration is a STATE
# Each valid swap creates an EDGE to a new state
# BFS finds shortest path through state space!
#
# Initial: [[4,1,2],    Target: [[1,2,3],
#           [5,0,3]]             [4,5,0]]
#
# State representation: "412503" → "123450"
#
# BFS explores state tree:
# Level 0: "412503"
#          ╱     ╲
# Level 1: "402513"  "412530" (swap 0 with neighbors)
#          ╱  │  ╲
# Level 2: ... ... ... (all possible next states)
#
# Each level = one more swap
# BFS guarantees minimum swaps to reach target!
#
# State space graph (partial):
#   412503 → 402513 → 420513 → ...
#     ↓       ↓       ↓
#   412530 → 410532 → 140532 → ...
#
# Think of it as: ripples spreading through the space
# of all possible board configurations!
```

#### TypeScript Solution
```typescript
function slidingPuzzle(board: number[][]): number {
    const start = board.flat().join('');
    const target = '123450';

    if (start === target) return 0;

    const neighbors: Record<number, number[]> = {
        0: [1, 3],
        1: [0, 2, 4],
        2: [1, 5],
        3: [0, 4],
        4: [1, 3, 5],
        5: [2, 4]
    };

    const queue: Array<[string, number]> = [[start, 0]];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
        const [state, moves] = queue.shift()!;
        const zeroPos = state.indexOf('0');

        for (const nextPos of neighbors[zeroPos]) {
            const stateArr = state.split('');
            [stateArr[zeroPos], stateArr[nextPos]] =
                [stateArr[nextPos], stateArr[zeroPos]];
            const nextState = stateArr.join('');

            if (nextState === target) return moves + 1;

            if (!visited.has(nextState)) {
                visited.add(nextState);
                queue.push([nextState, moves + 1]);
            }
        }
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(6!) = O(720) - at most 720 unique board states
- Space: O(6!) - visited set and queue

---

### Problem 23: Cut Off Trees for Golf Event (Hard)
**LeetCode Link**: [675. Cut Off Trees for Golf Event](https://leetcode.com/problems/cut-off-trees-for-golf-event/)

**Description**: You are in a forest represented by a matrix where 0 = obstacle, 1 = walkable, >1 = tree with that height. You must cut all trees in ascending height order. Return minimum steps to cut all trees, or -1 if impossible.

#### Python Solution
```python
from collections import deque

def cutOffTree(forest: list[list[int]]) -> int:
    # Step 1: Get dimensions
    m, n = len(forest), len(forest[0])

    # Step 2: Find all trees and sort by height
    trees = []
    for r in range(m):
        for c in range(n):
            if forest[r][c] > 1:
                trees.append((forest[r][c], r, c))

    trees.sort()  # Sort by height (ascending)

    # Step 3: BFS to find shortest path between two points
    def bfs(start_r, start_c, end_r, end_c):
        """Find shortest path from start to end."""
        if start_r == end_r and start_c == end_c:
            return 0

        queue = deque([(start_r, start_c, 0)])
        visited = {(start_r, start_c)}
        directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]

        while queue:
            r, c, dist = queue.popleft()

            for dr, dc in directions:
                nr, nc = r + dr, c + dc

                # Step 4: Found target
                if nr == end_r and nc == end_c:
                    return dist + 1

                # Step 5: Valid move (not obstacle, in bounds, unvisited)
                if (0 <= nr < m and 0 <= nc < n and
                    (nr, nc) not in visited and forest[nr][nc] != 0):
                    visited.add((nr, nc))
                    queue.append((nr, nc, dist + 1))

        # Step 6: Cannot reach target
        return -1

    # Step 7: Cut trees in order
    total_steps = 0
    curr_r, curr_c = 0, 0  # Start at top-left

    for height, tree_r, tree_c in trees:
        # Step 8: Find path from current position to next tree
        steps = bfs(curr_r, curr_c, tree_r, tree_c)

        if steps == -1:
            return -1  # Cannot reach this tree

        total_steps += steps
        curr_r, curr_c = tree_r, tree_c  # Move to tree position

    return total_steps

# Visualization:
# Forest:
# [1, 2, 3],   Trees: height 2 at (0,1)
# [0, 0, 4],          height 3 at (0,2)
# [7, 6, 5]           height 4 at (1,2)
#                     height 5 at (2,2)
#                     height 6 at (2,1)
#                     height 7 at (2,0)
#
# Must cut in height order: 2 → 3 → 4 → 5 → 6 → 7
#
# Step-by-step:
# 1. Start at (0,0), walk to tree 2 at (0,1): 1 step
#    Path: (0,0) → (0,1)
#
# 2. From (0,1), walk to tree 3 at (0,2): 1 step
#    Path: (0,1) → (0,2)
#
# 3. From (0,2), walk to tree 4 at (1,2): 1 step
#    Path: (0,2) → (1,2)
#
# 4. From (1,2), walk to tree 5 at (2,2): 1 step
#    Path: (1,2) → (2,2)
#
# 5. From (2,2), walk to tree 6 at (2,1): 1 step
#    Path: (2,2) → (2,1)
#
# 6. From (2,1), walk to tree 7 at (2,0): 1 step
#    Path: (2,1) → (2,0)
#
# Total: 6 steps
#
# Each segment uses BFS to find shortest path!
# Think: Multiple BFS ripples, one for each tree-to-tree journey
```

#### TypeScript Solution
```typescript
function cutOffTree(forest: number[][]): number {
    const m = forest.length;
    const n = forest[0].length;

    // Find and sort trees
    const trees: Array<[number, number, number]> = [];
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            if (forest[r][c] > 1) {
                trees.push([forest[r][c], r, c]);
            }
        }
    }

    trees.sort((a, b) => a[0] - b[0]);

    // BFS between two points
    function bfs(
        startR: number,
        startC: number,
        endR: number,
        endC: number
    ): number {
        if (startR === endR && startC === endC) return 0;

        const queue: Array<[number, number, number]> = [[startR, startC, 0]];
        const visited = new Set<string>([`${startR},${startC}`]);
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        while (queue.length > 0) {
            const [r, c, dist] = queue.shift()!;

            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr === endR && nc === endC) return dist + 1;

                const key = `${nr},${nc}`;
                if (nr >= 0 && nr < m && nc >= 0 && nc < n &&
                    !visited.has(key) && forest[nr][nc] !== 0) {
                    visited.add(key);
                    queue.push([nr, nc, dist + 1]);
                }
            }
        }

        return -1;
    }

    // Cut trees in order
    let totalSteps = 0;
    let [currR, currC] = [0, 0];

    for (const [height, treeR, treeC] of trees) {
        const steps = bfs(currR, currC, treeR, treeC);

        if (steps === -1) return -1;

        totalSteps += steps;
        [currR, currC] = [treeR, treeC];
    }

    return totalSteps;
}
```

**Complexity Analysis**:
- Time: O(m² × n² × T) where T is number of trees (BFS for each tree)
- Space: O(m × n) - visited set in each BFS

---

## Summary

Breadth-First Search is essential for shortest path and level-based problems. Key takeaways:

1. **Core Principle**:
   - Explore **level by level**
   - Use **queue** (FIFO) data structure
   - Guarantees **shortest path** in unweighted graphs

2. **When to Use BFS vs DFS**:
   - **BFS**: Shortest path, level order, minimum steps
   - **DFS**: All paths, backtracking, using less memory

3. **Common Patterns**:
   - **Multi-source BFS**: Start from all sources simultaneously (rotting oranges, walls and gates)
   - **Level-tracking**: Process entire level at once
   - **Bidirectional BFS**: Search from both ends (advanced optimization)
   - **State-space BFS**: Nodes represent states, not positions (word ladder, perfect squares)

4. **Implementation Tips**:
   - Use `collections.deque` for O(1) append/pop
   - Track visited to avoid cycles
   - Store distance/level with each node
   - For grid problems, mark visited in-place or use set

5. **Optimization Techniques**:
   - **Early termination**: Return when target found
   - **Bidirectional BFS**: Meet in middle
   - **A* search**: Use heuristic for directed search

**Practice Strategy**:
- Master basic tree level-order traversal
- Practice grid BFS (shortest path, rotting oranges)
- Solve state-space BFS (word ladder, lock puzzles)
- Try multi-source BFS problems
- Combine BFS with other techniques

Remember: BFS is your go-to algorithm for finding the shortest path in unweighted graphs and processing data level by level!
