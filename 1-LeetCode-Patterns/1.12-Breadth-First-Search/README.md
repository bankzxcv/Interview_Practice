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
BFS Traversal Example:

Tree:           1
               / \
              2   3
             / \   \
            4   5   6

BFS Order (Level-by-level): 1 → 2 → 3 → 4 → 5 → 6

Queue States:
Step 1: [1]           Visit 1, add children
Step 2: [2, 3]        Visit 2, add children
Step 3: [3, 4, 5]     Visit 3, add children
Step 4: [4, 5, 6]     Visit 4 (leaf)
Step 5: [5, 6]        Visit 5 (leaf)
Step 6: [6]           Visit 6 (leaf)
Step 7: []            Done

Shortest Path Example:
    A --- B
    |     |
    C --- D

BFS from A to D: A → B → D (distance = 2)
Not: A → C → D (distance = 2, but visited later)
BFS guarantees shortest path!
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
