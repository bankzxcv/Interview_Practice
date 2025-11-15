# Pattern 1.11: Depth-First Search (DFS)

## Pattern Overview

### What is Depth-First Search?
Depth-First Search (DFS) is a graph/tree traversal algorithm that explores as far as possible along each branch before backtracking. It uses a stack (either explicit or via recursion) to track the path and systematically explores all vertices/nodes.

### When to Use It?
- Exploring all paths in a graph or tree
- Finding connected components
- Detecting cycles in graphs
- Topological sorting
- Solving maze/puzzle problems
- Backtracking problems
- Finding paths between nodes
- Tree/graph validation problems

### Time/Space Complexity Benefits
- **Time Complexity**: O(V + E) for graphs (V vertices, E edges), O(n) for trees
- **Space Complexity**:
  - Recursive: O(h) where h is maximum depth (call stack)
  - Iterative: O(h) for explicit stack
  - Worst case: O(n) for skewed trees/graphs

### Visual Diagram

#### 🗺️ Cave Exploration Metaphor - How DFS Works

Imagine you're exploring a cave system with multiple tunnels. DFS is like following each tunnel to its absolute end before backtracking:

```
CAVE EXPLORATION WITH DFS:

         [Entrance]
            |
    ┌───────┴───────┐
    |               |
 Tunnel A       Tunnel B
    |               |
┌───┴───┐       ┌───┴───┐
|       |       |       |
Cave1  Cave2   Cave3  Cave4
       |               |
       └──Cave5     Cave6

DFS Exploration Path (like a spelunker with a rope):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Enter cave, go down Tunnel A (explore deeply!)
        Path: Entrance → Tunnel A

Step 2: At Tunnel A, go left to Cave1 (dead end)
        Path: Entrance → Tunnel A → Cave1 ✓
        Backtrack to Tunnel A

Step 3: From Tunnel A, go right to Cave2
        Path: Entrance → Tunnel A → Cave2

Step 4: Cave2 has deeper passage to Cave5 (keep going!)
        Path: Entrance → Tunnel A → Cave2 → Cave5 ✓
        Backtrack to Cave2, then Tunnel A, then Entrance

Step 5: Now try Tunnel B (first tunnel fully explored)
        Path: Entrance → Tunnel B

Step 6: From Tunnel B, go left to Cave3 (dead end)
        Path: Entrance → Tunnel B → Cave3 ✓
        Backtrack to Tunnel B

Step 7: From Tunnel B, go right to Cave4
        Path: Entrance → Tunnel B → Cave4

Step 8: Cave4 leads to Cave6 (final chamber)
        Path: Entrance → Tunnel B → Cave4 → Cave6 ✓

Complete exploration: Every tunnel followed to its end!
Full DFS Order: Entrance → A → Cave1 → Cave2 → Cave5 → B → Cave3 → Cave4 → Cave6
```

#### 📚 The Recursion Stack - DFS's Memory

The call stack acts like a stack of books - last book placed is first removed (LIFO):

```
TREE STRUCTURE:                    RECURSION STACK VISUALIZATION:
                                   (Read from bottom to top)
      1
     / \
    2   3                          ┌─────────────────────────────────┐
   / \   \                         │ Recursion Stack Growth & Shrink │
  4   5   6                        └─────────────────────────────────┘

Recursive Calls:                   Stack State at Each Step:

1. dfs(1)                          │ dfs(1)          │ ← START
   ├─ dfs(2)                       └─────────────────┘
   │  ├─ dfs(4)
   │  └─ dfs(5)
   └─ dfs(3)                       │ dfs(2)          │
      └─ dfs(6)                    │ dfs(1)          │
                                   └─────────────────┘

                                   │ dfs(4)          │ ← MAX DEPTH (3)
                                   │ dfs(2)          │
Step-by-Step Stack:                │ dfs(1)          │
                                   └─────────────────┘
[dfs(1)]                    ← Visit 1
[dfs(1), dfs(2)]           ← Visit 2 (go left)       │ dfs(2)          │ ← 4 returns
[dfs(1), dfs(2), dfs(4)]   ← Visit 4 (leaf)         │ dfs(1)          │
[dfs(1), dfs(2)]           ← 4 returns, pop         └─────────────────┘
[dfs(1), dfs(2), dfs(5)]   ← Visit 5 (leaf)
[dfs(1), dfs(2)]           ← 5 returns, pop         │ dfs(5)          │
[dfs(1)]                    ← 2 returns, pop         │ dfs(2)          │
[dfs(1), dfs(3)]           ← Visit 3 (go right)     │ dfs(1)          │
[dfs(1), dfs(3), dfs(6)]   ← Visit 6 (leaf)         └─────────────────┘
[dfs(1), dfs(3)]           ← 6 returns, pop
[dfs(1)]                    ← 3 returns, pop         │ dfs(3)          │
[]                          ← 1 returns, DONE        │ dfs(1)          │
                                                     └─────────────────┘

Notice: Stack grows as we go DEEPER, shrinks as we BACKTRACK
```

#### 🎯 Step-by-Step DFS Maze Traversal

Watch DFS navigate a maze, always going as deep as possible:

```
MAZE GRID:                         DFS EXPLORATION:
S = Start                          Numbers = visit order
E = Exit
# = Wall                           Start at S, find path to E
. = Path

  0 1 2 3 4                           0 1 2 3 4
0 S . # . .                         0 ① ② # . .
1 # . # . #                         1 # ③ # . #
2 . . . . #                         2 . ④ ⑤ ⑥ #
3 # . # . .                         3 # ⑦ # ⑧ ⑨
4 . . # . E                         4 . . # .⑩E

Step-by-Step DFS Navigation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step ①: Start at (0,0) - S
        Choices: Right(0,1), Down(blocked by wall)
        → Go RIGHT (explore first valid path)

Step ②: At (0,1)
        Choices: Right(blocked), Down(1,1), Up(out), Left(visited)
        → Go DOWN

Step ③: At (1,1)
        Choices: Down(2,1), all others blocked/visited
        → Go DOWN (keep going deep!)

Step ④: At (2,1)
        Choices: Right(2,2), Down(blocked), Left(2,0), Up(visited)
        → Go RIGHT

Step ⑤: At (2,2)
        Choices: Right(2,3), Down(blocked), Left(visited), Up(blocked)
        → Go RIGHT (continuing deep)

Step ⑥: At (2,3)
        Choices: Right(blocked), Down(3,3), Up(blocked), Left(visited)
        → Go DOWN

Step ⑦: BACKTRACK! (3,3) leads nowhere useful, return to (2,3)
        Then to (2,2), then try Down from (2,3)

Step ⑧: At (3,3)
        Choices: Down(4,3), Right(3,4), others blocked
        → Go RIGHT

Step ⑨: At (3,4)
        Choices: Down(4,4), others blocked
        → Go DOWN

Step ⑩: At (4,4) - FOUND EXIT E!

DFS explores: ① → ② → ③ → ④ → ⑤ → ⑥ → ⑧ → ⑨ → ⑩
              (Goes as DEEP as possible before backtracking)
```

#### 🔄 DFS vs BFS - Side by Side Comparison

```
Same tree, different exploration strategies:

TREE:                  1
                      /|\
                     2 3 4
                    /|   |\
                   5 6   7 8


DFS (Depth-First):                BFS (Breadth-First):
━━━━━━━━━━━━━━━━━                 ━━━━━━━━━━━━━━━━━━━━
Uses: STACK (LIFO)                Uses: QUEUE (FIFO)
Strategy: Go DEEP                 Strategy: Go WIDE

Visit Order:                      Visit Order:
  1 (start)                         1 (start)
  ├─ 2 (go deep left)              ├─ Level 1: 2, 3, 4
  │  ├─ 5 (deeper)                 └─ Level 2: 5, 6, 7, 8
  │  └─ 6 (backtrack to 2)
  ├─ 3 (backtrack to 1)            Order: 1→2→3→4→5→6→7→8
  └─ 4 (go deep right)             (Level by level)
     ├─ 7 (deeper)
     └─ 8 (backtrack to 4)

Order: 1→2→5→6→3→4→7→8
(Depth first)


VISUALIZATION WITH STEPS:

DFS Steps:                        BFS Steps:
━━━━━━━━━                         ━━━━━━━━━━

Step 1:  ①                        Step 1:  ①
        /|\                               /|\
       . . .                             . . .

Step 2:  ①                        Step 2:  ①
        /|\                               /|\
       ② . .                             ② ③ ④
      /|
     . .

Step 3:  ①                        Step 3:  ①
        /|\                               /|\
       ② . .                             ② ③ ④
      /|                                /|   |\
     ③ .                               ⑤ ⑥   ⑦ ⑧

Step 4:  ①
        /|\
       ② . .                       KEY DIFFERENCES:
      /|                           ════════════════
     ③ ④                           DFS: Like reading a book chapter by chapter
                                        (finish chapter 1 completely before 2)
Step 5:  ①
        /|\                        BFS: Like scanning all headlines first
       ② ⑤ .                           (read all chapter titles, then contents)
      /|
     ③ ④                           DFS: Better for: paths, mazes, puzzles
                                  BFS: Better for: shortest paths, levels
... continues

Final:   ①
        /|\
       ② ⑤ ⑥
      /|   |\
     ③ ④   ⑦ ⑧


MEMORY USAGE:                     PATH FINDING:
━━━━━━━━━━━                      ━━━━━━━━━━━━━

DFS Memory: O(height)             DFS: Finds A path (not necessarily shortest)
Max stack for tree above: 3          Good for: "Does path exist?"
  [1] → [1,2] → [1,2,5]
                                  BFS: Finds SHORTEST path
BFS Memory: O(width)                 Good for: "What's the shortest path?"
Max queue for tree above: 4
  [1] → [2,3,4] → [5,6,7,8]


WHEN TO USE EACH:
━━━━━━━━━━━━━━━
Use DFS when:                     Use BFS when:
✓ Need to explore all paths       ✓ Need shortest path
✓ Detecting cycles                ✓ Level-order traversal needed
✓ Backtracking problems           ✓ Finding closest/nearest
✓ Memory constrained (tall tree)  ✓ Memory constrained (wide tree)
✓ Topological sorting             ✓ Social network connections
```

#### 🌲 DFS Traversal Orders (Tree)

```
Tree:           1
               / \
              2   3
             / \
            4   5

PREORDER (Root → Left → Right):    Visit ROOT first, then explore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order: 1 → 2 → 4 → 5 → 3

Step 1:  ①              Visit 1 (root)
        / \
       .   .

Step 2:  ①              Visit 2 (left subtree root)
        / \
       ②   .
      / \
     .   .

Step 3:  ①              Visit 4 (leftmost leaf)
        / \
       ②   .
      / \
     ③   .

Step 4:  ①              Visit 5 (right child of 2)
        / \
       ②   .
      / \
     ③   ④

Step 5:  ①              Visit 3 (right subtree)
        / \
       ②   ⑤
      / \
     ③   ④

Use case: Creating a copy of tree, prefix expression


INORDER (Left → Root → Right):    Visit LEFT subtree, ROOT, then RIGHT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order: 4 → 2 → 5 → 1 → 3

Visit leftmost first: 4
Then its parent: 2
Then sibling: 5
Then root: 1
Then right: 3

Use case: BST traversal (gets sorted order), infix expression


POSTORDER (Left → Right → Root):   Visit children first, ROOT last
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order: 4 → 5 → 2 → 3 → 1

Visit all leaves first: 4, 5
Then their parent: 2
Then right leaf: 3
Finally root: 1

Use case: Deleting tree, postfix expression, calculating directory sizes
```

## Recognition Guidelines

### How to Identify This Pattern

Look for these **key indicators**:
1. Need to **explore all paths** or possibilities
2. **Backtracking** is required
3. Finding **connected components**
4. **Cycle detection** in graphs
5. Problems involving:
   - "Find all paths"
   - "Count islands/regions"
   - "Detect cycles"
   - "Validate structure"
   - "Clone graph"
6. Tree problems requiring full exploration

### Key Phrases/Indicators
- "explore all paths"
- "find connected components"
- "number of islands"
- "detect cycle"
- "validate tree/graph"
- "clone graph"
- "find all solutions"
- "backtrack"
- "depth-first"

## Template/Pseudocode

### Recursive DFS Template (Tree)

```python
def dfs(node):
    # Step 1: Base case
    if not node:
        return

    # Step 2: Process current node
    process(node)

    # Step 3: Recursively explore children
    dfs(node.left)
    dfs(node.right)
```

### Recursive DFS Template (Graph)

```python
def dfs(node, visited):
    # Step 1: Mark as visited
    visited.add(node)

    # Step 2: Process current node
    process(node)

    # Step 3: Explore neighbors
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(neighbor, visited)
```

### Iterative DFS Template

```python
def dfs_iterative(start):
    # Step 1: Initialize stack and visited set
    stack = [start]
    visited = set()

    # Step 2: Process until stack is empty
    while stack:
        # Step 3: Pop node from stack
        node = stack.pop()

        # Step 4: Skip if already visited
        if node in visited:
            continue

        # Step 5: Mark as visited and process
        visited.add(node)
        process(node)

        # Step 6: Add neighbors to stack
        for neighbor in get_neighbors(node):
            if neighbor not in visited:
                stack.append(neighbor)
```

---

## Problems

### Problem 1: Maximum Depth of Binary Tree (Easy)
**LeetCode Link**: [104. Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/)

**Description**: Given the root of a binary tree, return its maximum depth. The maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

#### Python Solution
```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def maxDepth(root: TreeNode) -> int:
    # Step 1: Base case - empty tree has depth 0
    if not root:
        return 0

    # Step 2: Recursively find depth of left subtree
    left_depth = maxDepth(root.left)

    # Step 3: Recursively find depth of right subtree
    right_depth = maxDepth(root.right)

    # Step 4: Max depth is 1 + max of subtree depths
    return 1 + max(left_depth, right_depth)

# Iterative DFS approach
def maxDepth_iterative(root: TreeNode) -> int:
    # Step 1: Handle empty tree
    if not root:
        return 0

    # Step 2: Use stack with (node, depth) pairs
    stack = [(root, 1)]
    max_depth = 0

    # Step 3: DFS traversal
    while stack:
        node, depth = stack.pop()

        # Step 4: Update max depth
        max_depth = max(max_depth, depth)

        # Step 5: Add children with incremented depth
        if node.left:
            stack.append((node.left, depth + 1))
        if node.right:
            stack.append((node.right, depth + 1))

    return max_depth
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

function maxDepth(root: TreeNode | null): number {
    // Step 1: Base case
    if (!root) return 0;

    // Step 2: Get depths of subtrees
    const leftDepth = maxDepth(root.left);
    const rightDepth = maxDepth(root.right);

    // Step 3: Return 1 + max depth
    return 1 + Math.max(leftDepth, rightDepth);
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack, h is height

---

### Problem 2: Path Sum (Easy)
**LeetCode Link**: [112. Path Sum](https://leetcode.com/problems/path-sum/)

**Description**: Given the root of a binary tree and an integer `targetSum`, return true if the tree has a root-to-leaf path such that adding up all the values along the path equals `targetSum`.

#### Python Solution
```python
def hasPathSum(root: TreeNode, targetSum: int) -> bool:
    # Step 1: Base case - empty tree
    if not root:
        return False

    # Step 2: Check if we're at a leaf node
    if not root.left and not root.right:
        # Step 3: Check if remaining sum equals leaf value
        return root.val == targetSum

    # Step 4: Subtract current value from target
    remaining = targetSum - root.val

    # Step 5: Recursively check left and right subtrees
    return (hasPathSum(root.left, remaining) or
            hasPathSum(root.right, remaining))

# Iterative approach
def hasPathSum_iterative(root: TreeNode, targetSum: int) -> bool:
    # Step 1: Handle empty tree
    if not root:
        return False

    # Step 2: Stack with (node, current_sum) pairs
    stack = [(root, root.val)]

    # Step 3: DFS traversal
    while stack:
        node, current_sum = stack.pop()

        # Step 4: Check if leaf with target sum
        if not node.left and not node.right and current_sum == targetSum:
            return True

        # Step 5: Add children with updated sum
        if node.right:
            stack.append((node.right, current_sum + node.right.val))
        if node.left:
            stack.append((node.left, current_sum + node.left.val))

    return False
```

#### TypeScript Solution
```typescript
function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
    // Step 1: Base case
    if (!root) return false;

    // Step 2: Check if leaf node
    if (!root.left && !root.right) {
        return root.val === targetSum;
    }

    // Step 3: Check subtrees with remaining sum
    const remaining = targetSum - root.val;
    return hasPathSum(root.left, remaining) ||
           hasPathSum(root.right, remaining);
}
```

**Complexity Analysis**:
- Time: O(n) - might visit all nodes
- Space: O(h) - recursion stack

---

### Problem 3: Same Tree (Easy)
**LeetCode Link**: [100. Same Tree](https://leetcode.com/problems/same-tree/)

**Description**: Given the roots of two binary trees `p` and `q`, write a function to check if they are the same or not. Two binary trees are considered the same if they are structurally identical and the nodes have the same value.

#### Python Solution
```python
def isSameTree(p: TreeNode, q: TreeNode) -> bool:
    # Step 1: Both null - same
    if not p and not q:
        return True

    # Step 2: One null, one not - different
    if not p or not q:
        return False

    # Step 3: Different values - different
    if p.val != q.val:
        return False

    # Step 4: Recursively check left and right subtrees
    return (isSameTree(p.left, q.left) and
            isSameTree(p.right, q.right))

# Visualization:
#     1         1
#    / \       / \
#   2   3     2   3
# Same ✓
#
#     1         1
#    /           \
#   2             2
# Different ✗
```

#### TypeScript Solution
```typescript
function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
    // Step 1: Both null
    if (!p && !q) return true;

    // Step 2: One null
    if (!p || !q) return false;

    // Step 3: Different values
    if (p.val !== q.val) return false;

    // Step 4: Check subtrees
    return isSameTree(p.left, q.left) &&
           isSameTree(p.right, q.right);
}
```

**Complexity Analysis**:
- Time: O(min(n, m)) - n and m are sizes of two trees
- Space: O(min(h1, h2)) - recursion stack

---

### Problem 4: Number of Islands (Medium)
**LeetCode Link**: [200. Number of Islands](https://leetcode.com/problems/number-of-islands/)

**Description**: Given an `m x n` 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

#### Python Solution
```python
def numIslands(grid: list[list[str]]) -> int:
    # Step 1: Handle empty grid
    if not grid or not grid[0]:
        return 0

    # Step 2: Get grid dimensions
    rows, cols = len(grid), len(grid[0])
    islands = 0

    def dfs(r, c):
        # Step 3: Check boundaries and if it's water or visited
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            grid[r][c] == '0'):
            return

        # Step 4: Mark current cell as visited (change to '0')
        grid[r][c] = '0'

        # Step 5: Explore all 4 directions
        dfs(r + 1, c)  # Down
        dfs(r - 1, c)  # Up
        dfs(r, c + 1)  # Right
        dfs(r, c - 1)  # Left

    # Step 6: Iterate through grid
    for r in range(rows):
        for c in range(cols):
            # Step 7: Found unvisited land - new island
            if grid[r][c] == '1':
                islands += 1
                dfs(r, c)  # Mark entire island as visited

    return islands

# Example:
# Grid:
# 1 1 0 0 0
# 1 1 0 0 0
# 0 0 1 0 0
# 0 0 0 1 1
#
# Islands: 3
# - Top-left 2x2 block
# - Single cell in middle
# - Bottom-right 1x2 block
```

#### TypeScript Solution
```typescript
function numIslands(grid: string[][]): number {
    // Step 1: Handle empty grid
    if (!grid || !grid[0]) return 0;

    // Step 2: Get dimensions
    const rows = grid.length;
    const cols = grid[0].length;
    let islands = 0;

    function dfs(r: number, c: number): void {
        // Step 3: Boundary and validity checks
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
            return;
        }

        // Step 4: Mark as visited
        grid[r][c] = '0';

        // Step 5: Explore neighbors
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    }

    // Step 6: Scan grid
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === '1') {
                islands++;
                dfs(r, c);
            }
        }
    }

    return islands;
}
```

**Complexity Analysis**:
- Time: O(m × n) - visit each cell once
- Space: O(m × n) - worst case recursion stack for all cells

---

### Problem 5: Clone Graph (Medium)
**LeetCode Link**: [133. Clone Graph](https://leetcode.com/problems/clone-graph/)

**Description**: Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains a value and a list of its neighbors.

#### Python Solution
```python
class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

def cloneGraph(node: Node) -> Node:
    # Step 1: Handle empty graph
    if not node:
        return None

    # Step 2: Map original nodes to cloned nodes
    cloned = {}

    def dfs(node):
        # Step 3: If already cloned, return clone
        if node in cloned:
            return cloned[node]

        # Step 4: Create clone of current node
        clone = Node(node.val)
        cloned[node] = clone

        # Step 5: Clone all neighbors
        for neighbor in node.neighbors:
            clone.neighbors.append(dfs(neighbor))

        return clone

    # Step 6: Start DFS from input node
    return dfs(node)

# Example:
# Original: 1 -- 2
#           |    |
#           4 -- 3
#
# Process:
# 1. Clone node 1
# 2. DFS to neighbors: 2, 4
# 3. Clone node 2, DFS to 1 (already cloned), 3
# 4. Clone node 3, DFS to 2 (already cloned), 4
# 5. Clone node 4, DFS to 1, 3 (both already cloned)
```

#### TypeScript Solution
```typescript
class Node {
    val: number;
    neighbors: Node[];
    constructor(val?: number, neighbors?: Node[]) {
        this.val = val === undefined ? 0 : val;
        this.neighbors = neighbors === undefined ? [] : neighbors;
    }
}

function cloneGraph(node: Node | null): Node | null {
    // Step 1: Handle empty graph
    if (!node) return null;

    // Step 2: Map for cloned nodes
    const cloned = new Map<Node, Node>();

    function dfs(node: Node): Node {
        // Step 3: Return if already cloned
        if (cloned.has(node)) {
            return cloned.get(node)!;
        }

        // Step 4: Create clone
        const clone = new Node(node.val);
        cloned.set(node, clone);

        // Step 5: Clone neighbors
        for (const neighbor of node.neighbors) {
            clone.neighbors.push(dfs(neighbor));
        }

        return clone;
    }

    return dfs(node);
}
```

**Complexity Analysis**:
- Time: O(V + E) - visit all vertices and edges
- Space: O(V) - store all cloned nodes

---

### Problem 6: Course Schedule (Medium)
**LeetCode Link**: [207. Course Schedule](https://leetcode.com/problems/course-schedule/)

**Description**: There are `numCourses` courses labeled from 0 to numCourses-1. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates you must take course `bi` before course `ai`. Return true if you can finish all courses (i.e., no cycle in the prerequisite graph).

#### Python Solution
```python
def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    # Step 1: Build adjacency list
    graph = [[] for _ in range(numCourses)]
    for course, prereq in prerequisites:
        graph[prereq].append(course)

    # Step 2: Track visiting states
    # 0 = unvisited, 1 = visiting (in current path), 2 = visited
    state = [0] * numCourses

    def has_cycle(course):
        # Step 3: Found cycle (node in current path)
        if state[course] == 1:
            return True

        # Step 4: Already fully processed
        if state[course] == 2:
            return False

        # Step 5: Mark as visiting
        state[course] = 1

        # Step 6: Check all neighbors
        for next_course in graph[course]:
            if has_cycle(next_course):
                return True

        # Step 7: Mark as visited
        state[course] = 2
        return False

    # Step 8: Check each course
    for course in range(numCourses):
        if has_cycle(course):
            return False

    return True

# Example:
# numCourses = 4, prerequisites = [[1,0],[2,1],[3,2]]
# Graph: 0 → 1 → 2 → 3
# No cycle, can finish ✓
#
# numCourses = 2, prerequisites = [[1,0],[0,1]]
# Graph: 0 ⇄ 1
# Cycle detected, cannot finish ✗
```

#### TypeScript Solution
```typescript
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
    // Step 1: Build adjacency list
    const graph: number[][] = Array.from({ length: numCourses }, () => []);
    for (const [course, prereq] of prerequisites) {
        graph[prereq].push(course);
    }

    // Step 2: Track states
    const state = new Array(numCourses).fill(0);

    function hasCycle(course: number): boolean {
        // Step 3: Cycle detected
        if (state[course] === 1) return true;

        // Step 4: Already processed
        if (state[course] === 2) return false;

        // Step 5: Mark as visiting
        state[course] = 1;

        // Step 6: Check neighbors
        for (const nextCourse of graph[course]) {
            if (hasCycle(nextCourse)) return true;
        }

        // Step 7: Mark as visited
        state[course] = 2;
        return false;
    }

    // Step 8: Check all courses
    for (let i = 0; i < numCourses; i++) {
        if (hasCycle(i)) return false;
    }

    return true;
}
```

**Complexity Analysis**:
- Time: O(V + E) - visit all courses and prerequisites
- Space: O(V + E) - graph and recursion stack

---

### Problem 7: Pacific Atlantic Water Flow (Medium)
**LeetCode Link**: [417. Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/)

**Description**: Given an `m x n` matrix of heights where water can flow to neighboring cells with equal or lower height, find all cells that can flow to both the Pacific ocean (top/left edges) and Atlantic ocean (bottom/right edges).

#### Python Solution
```python
def pacificAtlantic(heights: list[list[int]]) -> list[list[int]]:
    # Step 1: Handle empty input
    if not heights or not heights[0]:
        return []

    # Step 2: Get dimensions
    rows, cols = len(heights), len(heights[0])

    # Step 3: Track cells reachable from each ocean
    pacific = set()
    atlantic = set()

    def dfs(r, c, ocean, prev_height):
        # Step 4: Check boundaries and conditions
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            (r, c) in ocean or heights[r][c] < prev_height):
            return

        # Step 5: Mark as reachable from this ocean
        ocean.add((r, c))

        # Step 6: Explore neighbors (water flows from higher to lower)
        dfs(r + 1, c, ocean, heights[r][c])
        dfs(r - 1, c, ocean, heights[r][c])
        dfs(r, c + 1, ocean, heights[r][c])
        dfs(r, c - 1, ocean, heights[r][c])

    # Step 7: DFS from Pacific edges (top and left)
    for c in range(cols):
        dfs(0, c, pacific, heights[0][c])
    for r in range(rows):
        dfs(r, 0, pacific, heights[r][0])

    # Step 8: DFS from Atlantic edges (bottom and right)
    for c in range(cols):
        dfs(rows - 1, c, atlantic, heights[rows - 1][c])
    for r in range(rows):
        dfs(r, cols - 1, atlantic, heights[r][cols - 1])

    # Step 9: Find intersection (cells reachable from both)
    result = []
    for r in range(rows):
        for c in range(cols):
            if (r, c) in pacific and (r, c) in atlantic:
                result.append([r, c])

    return result

# Visualization:
# Pacific ~   ~   ~   ~   ~
#       ~  1   2   2   3  (5) ~
#       ~  3   2   3  (4) (4) ~
#       ~  2   4  (5)  3   1  ~
#       ~ (6) (7)  1   4   5  ~
#       ~ (5)  1   1   2   4  ~
#          ~   ~   ~   ~   ~  Atlantic
#
# Cells in () can reach both oceans
```

#### TypeScript Solution
```typescript
function pacificAtlantic(heights: number[][]): number[][] {
    if (!heights || !heights[0]) return [];

    const rows = heights.length;
    const cols = heights[0].length;

    const pacific = new Set<string>();
    const atlantic = new Set<string>();

    function dfs(r: number, c: number, ocean: Set<string>, prevHeight: number): void {
        const key = `${r},${c}`;
        if (
            r < 0 || r >= rows || c < 0 || c >= cols ||
            ocean.has(key) || heights[r][c] < prevHeight
        ) {
            return;
        }

        ocean.add(key);

        dfs(r + 1, c, ocean, heights[r][c]);
        dfs(r - 1, c, ocean, heights[r][c]);
        dfs(r, c + 1, ocean, heights[r][c]);
        dfs(r, c - 1, ocean, heights[r][c]);
    }

    // DFS from Pacific edges
    for (let c = 0; c < cols; c++) {
        dfs(0, c, pacific, heights[0][c]);
    }
    for (let r = 0; r < rows; r++) {
        dfs(r, 0, pacific, heights[r][0]);
    }

    // DFS from Atlantic edges
    for (let c = 0; c < cols; c++) {
        dfs(rows - 1, c, atlantic, heights[rows - 1][c]);
    }
    for (let r = 0; r < rows; r++) {
        dfs(r, cols - 1, atlantic, heights[r][cols - 1]);
    }

    // Find intersection
    const result: number[][] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = `${r},${c}`;
            if (pacific.has(key) && atlantic.has(key)) {
                result.push([r, c]);
            }
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(m × n) - visit each cell constant times
- Space: O(m × n) - two sets storing cells

---

### Problem 8: Surrounded Regions (Medium)
**LeetCode Link**: [130. Surrounded Regions](https://leetcode.com/problems/surrounded-regions/)

**Description**: Given an `m x n` matrix board containing 'X' and 'O', capture all regions that are surrounded by 'X'. A region is captured by flipping all 'O's into 'X's in that surrounded region. Regions on the border cannot be captured.

#### Python Solution
```python
def solve(board: list[list[str]]) -> None:
    """Modify board in-place."""
    # Step 1: Handle empty board
    if not board or not board[0]:
        return

    # Step 2: Get dimensions
    rows, cols = len(board), len(board[0])

    def dfs(r, c):
        # Step 3: Boundary checks and cell validation
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            board[r][c] != 'O'):
            return

        # Step 4: Mark border-connected 'O' as temporary 'T'
        board[r][c] = 'T'

        # Step 5: DFS to all neighbors
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    # Step 6: Mark all border-connected 'O's
    # Check first and last columns
    for r in range(rows):
        if board[r][0] == 'O':
            dfs(r, 0)
        if board[r][cols - 1] == 'O':
            dfs(r, cols - 1)

    # Check first and last rows
    for c in range(cols):
        if board[0][c] == 'O':
            dfs(0, c)
        if board[rows - 1][c] == 'O':
            dfs(rows - 1, c)

    # Step 7: Process entire board
    for r in range(rows):
        for c in range(cols):
            if board[r][c] == 'O':
                # Surrounded 'O', flip to 'X'
                board[r][c] = 'X'
            elif board[r][c] == 'T':
                # Border-connected, restore to 'O'
                board[r][c] = 'O'

# Example:
# Before:          After:
# X X X X          X X X X
# X O O X    →     X X X X
# X X O X          X X X X
# X O X X          X O X X
#
# Bottom 'O' touches border, not captured
# Middle 'O's are surrounded, captured
```

#### TypeScript Solution
```typescript
function solve(board: string[][]): void {
    if (!board || !board[0]) return;

    const rows = board.length;
    const cols = board[0].length;

    function dfs(r: number, c: number): void {
        if (
            r < 0 || r >= rows || c < 0 || c >= cols ||
            board[r][c] !== 'O'
        ) {
            return;
        }

        board[r][c] = 'T';

        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    }

    // Mark border-connected 'O's
    for (let r = 0; r < rows; r++) {
        if (board[r][0] === 'O') dfs(r, 0);
        if (board[r][cols - 1] === 'O') dfs(r, cols - 1);
    }
    for (let c = 0; c < cols; c++) {
        if (board[0][c] === 'O') dfs(0, c);
        if (board[rows - 1][c] === 'O') dfs(rows - 1, c);
    }

    // Process board
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 'O') {
                board[r][c] = 'X';
            } else if (board[r][c] === 'T') {
                board[r][c] = 'O';
            }
        }
    }
}
```

**Complexity Analysis**:
- Time: O(m × n) - visit each cell once
- Space: O(m × n) - recursion stack in worst case

---

### Problem 9: All Paths From Source to Target (Medium)
**LeetCode Link**: [797. All Paths From Source to Target](https://leetcode.com/problems/all-paths-from-source-to-target/)

**Description**: Given a directed acyclic graph (DAG) of `n` nodes labeled from 0 to n-1, find all possible paths from node 0 to node n-1 and return them in any order. The graph is given as `graph[i]` is a list of all nodes you can visit from node i.

#### Python Solution
```python
def allPathsSourceTarget(graph: list[list[int]]) -> list[list[int]]:
    # Step 1: Get target node (last node)
    target = len(graph) - 1

    # Step 2: Store all valid paths
    all_paths = []

    def dfs(node, path):
        # Step 3: Reached target, save path
        if node == target:
            all_paths.append(path[:])  # Add copy of path
            return

        # Step 4: Explore all neighbors
        for neighbor in graph[node]:
            # Step 5: Add neighbor to current path
            path.append(neighbor)

            # Step 6: Continue DFS
            dfs(neighbor, path)

            # Step 7: Backtrack - remove neighbor
            path.pop()

    # Step 8: Start DFS from node 0
    dfs(0, [0])

    return all_paths

# Example:
# graph = [[1,2],[3],[3],[]]
#
# Graph visualization:
# 0 → 1 → 3
# ↓       ↑
# 2 ------┘
#
# Paths from 0 to 3:
# [0, 1, 3]
# [0, 2, 3]
```

#### TypeScript Solution
```typescript
function allPathsSourceTarget(graph: number[][]): number[][] {
    const target = graph.length - 1;
    const allPaths: number[][] = [];

    function dfs(node: number, path: number[]): void {
        // Step 3: Reached target
        if (node === target) {
            allPaths.push([...path]);
            return;
        }

        // Step 4: Explore neighbors
        for (const neighbor of graph[node]) {
            path.push(neighbor);
            dfs(neighbor, path);
            path.pop(); // Backtrack
        }
    }

    dfs(0, [0]);
    return allPaths;
}
```

**Complexity Analysis**:
- Time: O(2^n × n) - exponential paths in worst case, n to copy each
- Space: O(n) - recursion depth and path storage

---

### Problem 10: Longest Increasing Path in a Matrix (Hard)
**LeetCode Link**: [329. Longest Increasing Path in a Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/)

**Description**: Given an `m x n` integers matrix, return the length of the longest increasing path. From each cell, you can move in four directions (up, down, left, right). You cannot move diagonally or outside the boundary.

#### Python Solution
```python
def longestIncreasingPath(matrix: list[list[int]]) -> int:
    # Step 1: Handle empty matrix
    if not matrix or not matrix[0]:
        return 0

    # Step 2: Get dimensions
    rows, cols = len(matrix), len(matrix[0])

    # Step 3: Memoization cache for DFS results
    cache = {}

    def dfs(r, c):
        # Step 4: Return cached result if exists
        if (r, c) in cache:
            return cache[(r, c)]

        # Step 5: Initialize max path length from this cell
        max_length = 1

        # Step 6: Try all 4 directions
        directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 7: Check if neighbor is valid and increasing
            if (0 <= nr < rows and 0 <= nc < cols and
                matrix[nr][nc] > matrix[r][c]):
                # Step 8: DFS from neighbor and update max
                length = 1 + dfs(nr, nc)
                max_length = max(max_length, length)

        # Step 9: Cache result
        cache[(r, c)] = max_length
        return max_length

    # Step 10: Try starting from each cell
    result = 0
    for r in range(rows):
        for c in range(cols):
            result = max(result, dfs(r, c))

    return result

# Example:
# Matrix:
# 9 9 4
# 6 6 8
# 2 1 1
#
# Longest path: 1→2→6→9, length = 4
# (starting from bottom-right area)
```

#### TypeScript Solution
```typescript
function longestIncreasingPath(matrix: number[][]): number {
    if (!matrix || !matrix[0]) return 0;

    const rows = matrix.length;
    const cols = matrix[0].length;
    const cache = new Map<string, number>();

    function dfs(r: number, c: number): number {
        const key = `${r},${c}`;
        if (cache.has(key)) {
            return cache.get(key)!;
        }

        let maxLength = 1;
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (
                nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                matrix[nr][nc] > matrix[r][c]
            ) {
                const length = 1 + dfs(nr, nc);
                maxLength = Math.max(maxLength, length);
            }
        }

        cache.set(key, maxLength);
        return maxLength;
    }

    let result = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            result = Math.max(result, dfs(r, c));
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(m × n) - visit each cell once with memoization
- Space: O(m × n) - cache and recursion stack

---

### Problem 11: Binary Tree Paths (Easy)
**LeetCode Link**: [257. Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/)

**Description**: Given the root of a binary tree, return all root-to-leaf paths in any order. A leaf is a node with no children.

#### Python Solution
```python
def binaryTreePaths(root: TreeNode) -> list[str]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Store all paths
    paths = []

    def dfs(node, path):
        # Step 3: Add current node to path
        if path:
            path += f"->{node.val}"
        else:
            path = str(node.val)

        # Step 4: Leaf node - save complete path
        if not node.left and not node.right:
            paths.append(path)
            return

        # Step 5: Recursively explore children
        if node.left:
            dfs(node.left, path)
        if node.right:
            dfs(node.right, path)

    # Step 6: Start DFS
    dfs(root, "")

    return paths

# Example:
#     1
#    / \
#   2   3
#    \
#     5
#
# Paths: ["1->2->5", "1->3"]
```

#### TypeScript Solution
```typescript
function binaryTreePaths(root: TreeNode | null): string[] {
    if (!root) return [];

    const paths: string[] = [];

    function dfs(node: TreeNode, path: string): void {
        // Add current node
        const currentPath = path ? `${path}->${node.val}` : `${node.val}`;

        // Leaf node
        if (!node.left && !node.right) {
            paths.push(currentPath);
            return;
        }

        // Explore children
        if (node.left) dfs(node.left, currentPath);
        if (node.right) dfs(node.right, currentPath);
    }

    dfs(root, "");
    return paths;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack height

---

### Problem 12: Sum of Left Leaves (Easy)
**LeetCode Link**: [404. Sum of Left Leaves](https://leetcode.com/problems/sum-of-left-leaves/)

**Description**: Given the root of a binary tree, return the sum of all left leaves. A left leaf is a leaf that is the left child of another node.

#### Python Solution
```python
def sumOfLeftLeaves(root: TreeNode) -> int:
    # Step 1: Handle empty tree
    if not root:
        return 0

    # Step 2: Track sum
    total = [0]

    def dfs(node, is_left):
        # Step 3: Base case
        if not node:
            return

        # Step 4: Check if current is a left leaf
        if is_left and not node.left and not node.right:
            total[0] += node.val

        # Step 5: Recursively check children
        # Mark left child as left, right child as not left
        dfs(node.left, True)
        dfs(node.right, False)

    # Step 6: Start DFS (root is not a left child)
    dfs(root, False)

    return total[0]

# Example:
#       3
#      / \
#     9  20
#       /  \
#      15   7
#
# Left leaves: 9 (left child of 3) and 15 (left child of 20)
# Sum = 9 + 15 = 24
```

#### TypeScript Solution
```typescript
function sumOfLeftLeaves(root: TreeNode | null): number {
    if (!root) return 0;

    let total = 0;

    function dfs(node: TreeNode | null, isLeft: boolean): void {
        if (!node) return;

        // Check if left leaf
        if (isLeft && !node.left && !node.right) {
            total += node.val;
        }

        dfs(node.left, true);
        dfs(node.right, false);
    }

    dfs(root, false);
    return total;
}
```

**Complexity Analysis**:
- Time: O(n) - visit all nodes
- Space: O(h) - recursion stack

---

### Problem 13: Reconstruct Itinerary (Hard)
**LeetCode Link**: [332. Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/)

**Description**: Given a list of airline tickets `[from, to]`, reconstruct the itinerary in order and return it. All tickets form one itinerary starting from "JFK". If there are multiple valid itineraries, return the one with the smallest lexical order.

#### Python Solution
```python
from collections import defaultdict

def findItinerary(tickets: list[list[str]]) -> list[str]:
    # Step 1: Build graph with sorted destinations
    graph = defaultdict(list)
    for src, dst in sorted(tickets, reverse=True):
        graph[src].append(dst)

    # Step 2: Result itinerary
    itinerary = []

    def dfs(airport):
        # Step 3: Visit all destinations from current airport
        while graph[airport]:
            # Step 4: Pop destination (reverse sorted, so smallest first)
            next_airport = graph[airport].pop()
            dfs(next_airport)

        # Step 5: Add airport to itinerary (postorder)
        itinerary.append(airport)

    # Step 6: Start from JFK
    dfs("JFK")

    # Step 7: Reverse to get correct order
    return itinerary[::-1]

# Example:
# tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]
#
# Graph:
# JFK → MUC
# MUC → LHR
# LHR → SFO
# SFO → SJC
#
# Itinerary: JFK → MUC → LHR → SFO → SJC
```

#### TypeScript Solution
```typescript
function findItinerary(tickets: string[][]): string[] {
    // Step 1: Build graph
    const graph = new Map<string, string[]>();

    tickets.sort((a, b) => b[1].localeCompare(a[1]));

    for (const [src, dst] of tickets) {
        if (!graph.has(src)) {
            graph.set(src, []);
        }
        graph.get(src)!.push(dst);
    }

    const itinerary: string[] = [];

    function dfs(airport: string): void {
        const destinations = graph.get(airport) || [];

        while (destinations.length > 0) {
            const next = destinations.pop()!;
            dfs(next);
        }

        itinerary.push(airport);
    }

    dfs("JFK");
    return itinerary.reverse();
}
```

**Complexity Analysis**:
- Time: O(E log E) - E edges, sorting tickets
- Space: O(E) - graph storage

---

### Problem 14: Validate Binary Search Tree (Medium)
**LeetCode Link**: [98. Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/)

**Description**: Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST is defined as follows:
- The left subtree of a node contains only nodes with keys less than the node's key.
- The right subtree contains only nodes with keys greater than the node's key.
- Both left and right subtrees must also be binary search trees.

#### Python Solution
```python
def isValidBST(root: TreeNode) -> bool:
    """
    DFS approach with range validation.
    Each node must be within a valid range (min, max).

    Visualization of valid vs invalid BST:

    VALID BST:              INVALID BST:
         5                       5
        / \                     / \
       3   7                   3   7
      / \   \                 / \   \
     2   4   8               2   6   8  ← 6 > 5 (violates BST property)

    For node 5: range (-inf, +inf)
    For node 3: range (-inf, 5)   ✓ 3 < 5
    For node 7: range (5, +inf)   ✓ 7 > 5
    For node 6: range (5, 7)      ✗ 6 < 7 but 6 > 5 (parent's parent)
    """

    def dfs(node, min_val, max_val):
        # Step 1: Empty tree is valid BST
        if not node:
            return True

        # Step 2: Check if current node violates BST property
        # Node must be strictly greater than min and less than max
        if node.val <= min_val or node.val >= max_val:
            return False

        # Step 3: Recursively validate left subtree
        # All nodes in left subtree must be < current node
        # So max_val becomes current node's value
        left_valid = dfs(node.left, min_val, node.val)

        # Step 4: Recursively validate right subtree
        # All nodes in right subtree must be > current node
        # So min_val becomes current node's value
        right_valid = dfs(node.right, node.val, max_val)

        # Step 5: Both subtrees must be valid
        return left_valid and right_valid

    # Step 6: Start DFS with infinite range
    return dfs(root, float('-inf'), float('inf'))

# Alternative: Inorder traversal approach
def isValidBST_inorder(root: TreeNode) -> bool:
    """
    Inorder traversal of BST produces sorted sequence.
    If sequence is not strictly increasing, not a valid BST.
    """
    # Step 1: Track previous value in inorder traversal
    prev = [float('-inf')]

    def inorder(node):
        if not node:
            return True

        # Step 2: Check left subtree
        if not inorder(node.left):
            return False

        # Step 3: Check current node
        if node.val <= prev[0]:
            return False
        prev[0] = node.val

        # Step 4: Check right subtree
        return inorder(node.right)

    return inorder(root)
```

#### TypeScript Solution
```typescript
function isValidBST(root: TreeNode | null): boolean {
    // DFS with range validation
    function dfs(node: TreeNode | null, minVal: number, maxVal: number): boolean {
        // Step 1: Base case
        if (!node) return true;

        // Step 2: Validate current node
        if (node.val <= minVal || node.val >= maxVal) {
            return false;
        }

        // Step 3: Validate subtrees with updated ranges
        return dfs(node.left, minVal, node.val) &&
               dfs(node.right, node.val, maxVal);
    }

    return dfs(root, -Infinity, Infinity);
}

// Alternative: Inorder traversal
function isValidBST_inorder(root: TreeNode | null): boolean {
    let prev = -Infinity;

    function inorder(node: TreeNode | null): boolean {
        if (!node) return true;

        if (!inorder(node.left)) return false;

        if (node.val <= prev) return false;
        prev = node.val;

        return inorder(node.right);
    }

    return inorder(root);
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack, h is height

---

### Problem 15: Symmetric Tree (Easy)
**LeetCode Link**: [101. Symmetric Tree](https://leetcode.com/problems/symmetric-tree/)

**Description**: Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).

#### Python Solution
```python
def isSymmetric(root: TreeNode) -> bool:
    """
    Use DFS to compare left and right subtrees.

    Visualization:

    SYMMETRIC:              NOT SYMMETRIC:
         1                       1
        / \                     / \
       2   2                   2   2
      / \ / \                   \   \
     3  4 4  3                   3   3

    Mirror check:
    Left subtree:  2 → 3, 4        Right subtree: 2 → 4, 3
                   ↓                              ↓
    Compare: 2=2 ✓, 3=3 ✓, 4=4 ✓   Compare outer-inner pairs
    """

    def is_mirror(left, right):
        # Step 1: Both null - symmetric
        if not left and not right:
            return True

        # Step 2: One null, one not - not symmetric
        if not left or not right:
            return False

        # Step 3: Values must match
        if left.val != right.val:
            return False

        # Step 4: Check mirror positions
        # Left's left mirrors right's right
        # Left's right mirrors right's left
        outer_match = is_mirror(left.left, right.right)
        inner_match = is_mirror(left.right, right.left)

        return outer_match and inner_match

    # Step 5: Tree is symmetric if left and right subtrees mirror each other
    if not root:
        return True

    return is_mirror(root.left, root.right)

# Example walkthrough:
#       1
#      / \
#     2   2
#    / \ / \
#   3  4 4  3
#
# Step 1: Compare left(2) and right(2): values match ✓
# Step 2: Compare left.left(3) and right.right(3): match ✓
# Step 3: Compare left.right(4) and right.left(4): match ✓
# Step 4: All comparisons pass → Symmetric!
```

#### TypeScript Solution
```typescript
function isSymmetric(root: TreeNode | null): boolean {
    function isMirror(left: TreeNode | null, right: TreeNode | null): boolean {
        // Both null
        if (!left && !right) return true;

        // One null
        if (!left || !right) return false;

        // Values must match and subtrees must mirror
        return left.val === right.val &&
               isMirror(left.left, right.right) &&
               isMirror(left.right, right.left);
    }

    if (!root) return true;
    return isMirror(root.left, root.right);
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack

---

### Problem 16: Path Sum II (Medium)
**LeetCode Link**: [113. Path Sum II](https://leetcode.com/problems/path-sum-ii/)

**Description**: Given the root of a binary tree and an integer `targetSum`, return all root-to-leaf paths where the sum of node values equals `targetSum`. Each path should be returned as a list of node values.

#### Python Solution
```python
def pathSum(root: TreeNode, targetSum: int) -> list[list[int]]:
    """
    DFS with backtracking to find all valid paths.

    Visualization:
    Tree:          5
                  / \
                 4   8
                /   / \
               11  13  4
              /  \      \
             7    2      1

    targetSum = 22

    DFS Path Exploration:
    Path 1: [5, 4, 11, 7]  → Sum = 27 ✗
    Path 2: [5, 4, 11, 2]  → Sum = 22 ✓ (Found!)
    Path 3: [5, 8, 13]     → Sum = 26 ✗
    Path 4: [5, 8, 4, 1]   → Sum = 18 ✗

    Result: [[5, 4, 11, 2]]
    """

    # Step 1: Store all valid paths
    result = []

    def dfs(node, current_path, remaining_sum):
        # Step 2: Base case - null node
        if not node:
            return

        # Step 3: Add current node to path
        current_path.append(node.val)

        # Step 4: Check if leaf node with target sum
        if not node.left and not node.right:
            if remaining_sum == node.val:
                # Found valid path - add copy to result
                result.append(current_path[:])
        else:
            # Step 5: Explore left and right subtrees
            new_remaining = remaining_sum - node.val
            dfs(node.left, current_path, new_remaining)
            dfs(node.right, current_path, new_remaining)

        # Step 6: Backtrack - remove current node from path
        current_path.pop()

    # Step 7: Start DFS from root
    dfs(root, [], targetSum)

    return result

# Detailed execution trace for example:
# Call stack and path building:
#
# dfs(5, [], 22)
#   path = [5]
#   dfs(4, [5], 17)
#     path = [5, 4]
#     dfs(11, [5, 4], 13)
#       path = [5, 4, 11]
#       dfs(7, [5, 4, 11], 2)
#         path = [5, 4, 11, 7], sum = 27 ✗
#         backtrack → path = [5, 4, 11]
#       dfs(2, [5, 4, 11], 2)
#         path = [5, 4, 11, 2], sum = 22 ✓
#         Add to result!
#         backtrack → path = [5, 4, 11]
#       backtrack → path = [5, 4]
#     backtrack → path = [5]
#   dfs(8, [5], 17)
#     ... continue exploration
```

#### TypeScript Solution
```typescript
function pathSum(root: TreeNode | null, targetSum: number): number[][] {
    const result: number[][] = [];

    function dfs(node: TreeNode | null, currentPath: number[], remainingSum: number): void {
        if (!node) return;

        // Add current node
        currentPath.push(node.val);

        // Check if leaf with target sum
        if (!node.left && !node.right && remainingSum === node.val) {
            result.push([...currentPath]);
        } else {
            // Explore children
            const newRemaining = remainingSum - node.val;
            dfs(node.left, currentPath, newRemaining);
            dfs(node.right, currentPath, newRemaining);
        }

        // Backtrack
        currentPath.pop();
    }

    dfs(root, [], targetSum);
    return result;
}
```

**Complexity Analysis**:
- Time: O(n²) - visit each node, copy paths (can be O(n) paths with O(n) length)
- Space: O(h) - recursion stack height

---

### Problem 17: Flood Fill (Easy)
**LeetCode Link**: [733. Flood Fill](https://leetcode.com/problems/flood-fill/)

**Description**: An image is represented by an `m x n` integer grid where `image[i][j]` represents the pixel value. You are given three integers `sr`, `sc`, and `color`. Perform a flood fill starting from pixel `[sr, sc]`, changing it and all connected pixels of the same color to the new color.

#### Python Solution
```python
def floodFill(image: list[list[int]], sr: int, sc: int, color: int) -> list[list[int]]:
    """
    DFS to flood fill connected pixels of same color.

    Visualization:
    Original image:        After flood fill at (1,1) with color 2:
    1 1 1                  2 2 2
    1 1 0      →           2 2 0
    1 0 1                  2 0 1

    DFS Exploration from (1,1):
    ┌─────────────────────────────────┐
    │ Start: (1,1) color=1            │
    │ ├─ Check (0,1): color=1 → Fill │
    │ │  ├─ Check (0,0): color=1 → Fill
    │ │  ├─ Check (0,2): color=1 → Fill
    │ ├─ Check (2,1): color=0 → Skip │
    │ ├─ Check (1,0): color=1 → Fill │
    │ ├─ Check (1,2): color=0 → Skip │
    └─────────────────────────────────┘
    """

    # Step 1: Get dimensions and starting color
    rows, cols = len(image), len(image[0])
    start_color = image[sr][sc]

    # Step 2: If new color same as start color, no work needed
    if start_color == color:
        return image

    def dfs(r, c):
        # Step 3: Boundary checks
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return

        # Step 4: Check if pixel is the original color
        if image[r][c] != start_color:
            return

        # Step 5: Fill current pixel with new color
        image[r][c] = color

        # Step 6: DFS to all 4 adjacent pixels
        dfs(r + 1, c)  # Down
        dfs(r - 1, c)  # Up
        dfs(r, c + 1)  # Right
        dfs(r, c - 1)  # Left

    # Step 7: Start flood fill from starting pixel
    dfs(sr, sc)

    return image

# Step-by-step execution visualization:
# Image: [[1,1,1],[1,1,0],[1,0,1]]
# Start: (1,1), color=2
#
# Call Stack:                      Image State:
# dfs(1,1) → fill                  [1,1,1]
#   dfs(2,1) → skip (color=0)      [1,2,0]  ← (1,1) filled
#   dfs(0,1) → fill                [1,0,1]
#     dfs(-1,1) → skip (boundary)
#     dfs(1,1) → skip (already 2)  [1,2,1]
#     dfs(0,0) → fill              [2,2,0]  ← (0,1) filled
#       ...continues               [1,0,1]
#     dfs(0,2) → fill
#   dfs(1,0) → fill                [2,2,2]
#   dfs(1,2) → skip (color=0)      [2,2,0]  ← Final
#                                  [2,0,1]
```

#### TypeScript Solution
```typescript
function floodFill(image: number[][], sr: number, sc: number, color: number): number[][] {
    const rows = image.length;
    const cols = image[0].length;
    const startColor = image[sr][sc];

    // If same color, no work needed
    if (startColor === color) return image;

    function dfs(r: number, c: number): void {
        // Boundary and color checks
        if (
            r < 0 || r >= rows || c < 0 || c >= cols ||
            image[r][c] !== startColor
        ) {
            return;
        }

        // Fill pixel
        image[r][c] = color;

        // DFS to neighbors
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    }

    dfs(sr, sc);
    return image;
}
```

**Complexity Analysis**:
- Time: O(m × n) - potentially visit all pixels
- Space: O(m × n) - recursion stack in worst case

---

### Problem 18: Keys and Rooms (Medium)
**LeetCode Link**: [841. Keys and Rooms](https://leetcode.com/problems/keys-and-rooms/)

**Description**: There are `n` rooms labeled from 0 to n-1. All rooms are locked except room 0. Your goal is to visit all rooms. When you visit a room, you may find a set of distinct keys in it. Each key has a number on it, allowing you to unlock and visit the corresponding room. Return true if you can visit all rooms.

#### Python Solution
```python
def canVisitAllRooms(rooms: list[list[int]]) -> bool:
    """
    DFS to explore all reachable rooms.

    Visualization:
    Rooms: [[1], [2], [3], []]
           Room 0 has key to room 1
           Room 1 has key to room 2
           Room 2 has key to room 3
           Room 3 is empty

    Graph representation:
    0 → 1 → 2 → 3

    DFS Exploration:
    ┌────────────────────────────┐
    │ Start: Room 0 (unlocked)   │
    │ ├─ Found key 1 → Visit room 1
    │ │  ├─ Found key 2 → Visit room 2
    │ │  │  ├─ Found key 3 → Visit room 3
    │ │  │  │  └─ No keys
    └────────────────────────────┘

    Visited: {0, 1, 2, 3} → Can visit all ✓

    Counter-example:
    Rooms: [[1,3], [3,0,1], [2], [0]]
                                    ↑
    Graph: 0 → 1 → 3            Room 2 not reachable!
           ↑___|

    Can't reach room 2 → Return False
    """

    # Step 1: Track visited rooms
    visited = set()

    def dfs(room):
        # Step 2: Mark room as visited
        visited.add(room)

        # Step 3: Explore all rooms we can access from here
        for key in rooms[room]:
            # Step 4: Only visit unvisited rooms
            if key not in visited:
                dfs(key)

    # Step 5: Start from room 0 (always unlocked)
    dfs(0)

    # Step 6: Check if we visited all rooms
    return len(visited) == len(rooms)

# Iterative DFS approach
def canVisitAllRooms_iterative(rooms: list[list[int]]) -> bool:
    # Step 1: Initialize stack and visited set
    stack = [0]
    visited = {0}

    # Step 2: DFS traversal
    while stack:
        room = stack.pop()

        # Step 3: Collect all keys in current room
        for key in rooms[room]:
            if key not in visited:
                visited.add(key)
                stack.append(key)

    # Step 4: Check if all rooms visited
    return len(visited) == len(rooms)

# Trace example:
# rooms = [[1,3], [2], [0], [1]]
#
# DFS trace:
# dfs(0): visited={0}, keys=[1,3]
#   dfs(1): visited={0,1}, keys=[2]
#     dfs(2): visited={0,1,2}, keys=[0]
#       dfs(0): already visited, skip
#   dfs(3): visited={0,1,2,3}, keys=[1]
#     dfs(1): already visited, skip
#
# Final: visited={0,1,2,3}, len=4, total rooms=4 → True
```

#### TypeScript Solution
```typescript
function canVisitAllRooms(rooms: number[][]): boolean {
    const visited = new Set<number>();

    function dfs(room: number): void {
        // Mark as visited
        visited.add(room);

        // Visit all accessible rooms
        for (const key of rooms[room]) {
            if (!visited.has(key)) {
                dfs(key);
            }
        }
    }

    // Start from room 0
    dfs(0);

    // Check if all rooms visited
    return visited.size === rooms.length;
}
```

**Complexity Analysis**:
- Time: O(n + k) - n rooms, k total keys
- Space: O(n) - visited set and recursion stack

---

### Problem 19: Find Eventual Safe States (Medium)
**LeetCode Link**: [802. Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/)

**Description**: There is a directed graph of `n` nodes numbered from 0 to n-1. A node is a terminal node if there are no outgoing edges. A node is a safe node if every possible path starting from that node leads to a terminal node. Return an array containing all the safe nodes in sorted order.

#### Python Solution
```python
def eventualSafeNodes(graph: list[list[int]]) -> list[int]:
    """
    DFS with cycle detection using three-color approach.

    Node states:
    - WHITE (0): Unvisited
    - GRAY (1): Visiting (in current DFS path)
    - BLACK (2): Visited (safe node)

    Visualization:
    Graph: [[1,2],[2,3],[5],[0],[5],[],[]]

         0 → 1
         ↓   ↓
         2 ← ┘
         ↓
         5 → (terminal)

         3 → 0 (creates cycle)

         4 → 5 (safe path)

         6 (terminal)

    Analysis:
    - Node 0: path 0→1→2→5 (terminal) OR 0→2→5 ✓ Safe
    - Node 1: path 1→2→5 ✓ Safe
    - Node 2: path 2→5 ✓ Safe
    - Node 3: path 3→0→1→2→5→... creates cycle ✗ Unsafe
    - Node 4: path 4→5 ✓ Safe
    - Node 5: terminal ✓ Safe
    - Node 6: terminal ✓ Safe

    Safe nodes: [0,1,2,4,5,6]
    """

    n = len(graph)

    # Step 1: Track node states
    # 0 = unvisited, 1 = visiting, 2 = safe
    state = [0] * n

    def dfs(node):
        # Step 2: If visiting (gray), found cycle
        if state[node] == 1:
            return False

        # Step 3: If already processed (black), return result
        if state[node] == 2:
            return True

        # Step 4: Mark as visiting (gray)
        state[node] = 1

        # Step 5: Check all neighbors
        for neighbor in graph[node]:
            if not dfs(neighbor):
                # Found cycle through neighbor
                return False

        # Step 6: All paths from this node are safe
        # Mark as safe (black)
        state[node] = 2
        return True

    # Step 7: Check each node
    safe_nodes = []
    for node in range(n):
        if dfs(node):
            safe_nodes.append(node)

    return safe_nodes

# Detailed trace for node 3:
# graph = [[1,2],[2,3],[5],[0],[5],[],[]]
#
# dfs(3):
#   state[3] = 1 (visiting)
#   Check neighbor 0:
#     dfs(0):
#       state[0] = 1 (visiting)
#       Check neighbor 1:
#         dfs(1):
#           state[1] = 1 (visiting)
#           Check neighbor 2:
#             dfs(2):
#               state[2] = 1 (visiting)
#               Check neighbor 5:
#                 dfs(5):
#                   state[5] = 1 (visiting)
#                   No neighbors
#                   state[5] = 2 (safe) ✓
#               state[2] = 2 (safe) ✓
#           Check neighbor 3:
#             dfs(3):
#               state[3] == 1 → CYCLE! ✗
#               return False
#     Cycle found → 3 is unsafe
```

#### TypeScript Solution
```typescript
function eventualSafeNodes(graph: number[][]): number[] {
    const n = graph.length;
    const state = new Array(n).fill(0); // 0=unvisited, 1=visiting, 2=safe

    function dfs(node: number): boolean {
        // Cycle detected
        if (state[node] === 1) return false;

        // Already processed
        if (state[node] === 2) return true;

        // Mark as visiting
        state[node] = 1;

        // Check all neighbors
        for (const neighbor of graph[node]) {
            if (!dfs(neighbor)) {
                return false;
            }
        }

        // Mark as safe
        state[node] = 2;
        return true;
    }

    const safeNodes: number[] = [];
    for (let i = 0; i < n; i++) {
        if (dfs(i)) {
            safeNodes.push(i);
        }
    }

    return safeNodes;
}
```

**Complexity Analysis**:
- Time: O(V + E) - visit each vertex and edge once
- Space: O(V) - state array and recursion stack

---

### Problem 20: Evaluate Division (Medium)
**LeetCode Link**: [399. Evaluate Division](https://leetcode.com/problems/evaluate-division/)

**Description**: Given equations in the format `A / B = k`, where `A` and `B` are variables and `k` is a real number, answer queries of the form `C / D`. Return an array of answers where `answers[i]` is the answer to the ith query, or -1 if the answer cannot be determined.

#### Python Solution
```python
from collections import defaultdict

def calcEquation(equations: list[list[str]], values: list[float],
                 queries: list[list[str]]) -> list[float]:
    """
    Build graph and use DFS to find paths and compute products.

    Visualization:
    equations = [["a","b"],["b","c"]]
    values = [2.0, 3.0]

    This means: a/b = 2.0, so a = 2b
                b/c = 3.0, so b = 3c

    Build bidirectional graph:
    a --(2.0)--> b --(3.0)--> c
    a <-(0.5)--- b <-(1/3)--- c

    Query: a/c = ?
    Path: a → b → c
    Product: 2.0 × 3.0 = 6.0

    Query: c/a = ?
    Path: c → b → a
    Product: (1/3) × 0.5 = 1/6 ≈ 0.167

    Query: a/e = ?
    No path exists → -1.0
    """

    # Step 1: Build adjacency list graph
    graph = defaultdict(dict)

    for (dividend, divisor), value in zip(equations, values):
        # a/b = value means a = value * b
        graph[dividend][divisor] = value
        # b/a = 1/value
        graph[divisor][dividend] = 1 / value

    def dfs(start, end, visited):
        # Step 2: Check if variables exist
        if start not in graph or end not in graph:
            return -1.0

        # Step 3: Found direct connection
        if end in graph[start]:
            return graph[start][end]

        # Step 4: Mark as visited
        visited.add(start)

        # Step 5: Try all neighbors
        for neighbor, value in graph[start].items():
            if neighbor not in visited:
                # Step 6: Recursively search from neighbor
                result = dfs(neighbor, end, visited)

                # Step 7: If path found, multiply values
                if result != -1.0:
                    return value * result

        # Step 8: No path found
        return -1.0

    # Step 9: Process each query
    results = []
    for dividend, divisor in queries:
        # Step 10: Same variable
        if dividend == divisor and dividend in graph:
            results.append(1.0)
        else:
            # DFS to find path
            results.append(dfs(dividend, divisor, set()))

    return results

# Example trace:
# equations = [["a","b"],["b","c"],["c","d"]]
# values = [2.0, 3.0, 4.0]
# query = ["a", "d"]
#
# Graph:
# a --(2.0)--> b --(3.0)--> c --(4.0)--> d
#
# DFS from a to d:
# dfs(a, d, {})
#   visited = {a}
#   neighbor b, value 2.0
#     dfs(b, d, {a})
#       visited = {a, b}
#       neighbor c, value 3.0
#         dfs(c, d, {a, b})
#           visited = {a, b, c}
#           neighbor d, value 4.0
#             d in graph[c] → return 4.0
#           return 3.0 × 4.0 = 12.0
#       return 2.0 × 12.0 = 24.0
#   return 24.0
#
# Result: a/d = 24.0
```

#### TypeScript Solution
```typescript
function calcEquation(equations: string[][], values: number[], queries: string[][]): number[] {
    // Build graph
    const graph = new Map<string, Map<string, number>>();

    for (let i = 0; i < equations.length; i++) {
        const [dividend, divisor] = equations[i];
        const value = values[i];

        if (!graph.has(dividend)) graph.set(dividend, new Map());
        if (!graph.has(divisor)) graph.set(divisor, new Map());

        graph.get(dividend)!.set(divisor, value);
        graph.get(divisor)!.set(dividend, 1 / value);
    }

    function dfs(start: string, end: string, visited: Set<string>): number {
        // Variables don't exist
        if (!graph.has(start) || !graph.has(end)) {
            return -1.0;
        }

        // Direct connection
        if (graph.get(start)!.has(end)) {
            return graph.get(start)!.get(end)!;
        }

        visited.add(start);

        // Try all neighbors
        for (const [neighbor, value] of graph.get(start)!) {
            if (!visited.has(neighbor)) {
                const result = dfs(neighbor, end, visited);
                if (result !== -1.0) {
                    return value * result;
                }
            }
        }

        return -1.0;
    }

    // Process queries
    const results: number[] = [];
    for (const [dividend, divisor] of queries) {
        if (dividend === divisor && graph.has(dividend)) {
            results.push(1.0);
        } else {
            results.push(dfs(dividend, divisor, new Set()));
        }
    }

    return results;
}
```

**Complexity Analysis**:
- Time: O(E + Q × (V + E)) - E equations, Q queries, V variables
- Space: O(V + E) - graph storage

---

### Problem 21: Minimum Height Trees (Medium)
**LeetCode Link**: [310. Minimum Height Trees](https://leetcode.com/problems/minimum-height-trees/)

**Description**: A tree is an undirected graph where any two vertices are connected by exactly one path. Given such a tree of `n` nodes labeled from 0 to n-1, find all root labels that give minimum height trees.

#### Python Solution
```python
from collections import deque, defaultdict

def findMinHeightTrees(n: int, edges: list[list[int]]) -> list[int]:
    """
    Use topological sort approach (peel leaves layer by layer).
    The last remaining nodes are the centroids - roots of MHTs.

    Visualization:
    Tree:       0
               / \
              1   2
             /     \
            3       4

    If root = 0: height = 2 (0→2→4)
    If root = 1: height = 2 (1→3 or 1→0→2→4)
    If root = 2: height = 2 (2→0→1→3)
    If root = 3: height = 3 (3→1→0→2→4) ✗
    If root = 4: height = 3 (4→2→0→1→3) ✗

    MHT roots: [0, 1, 2] all give height 2

    Peeling approach (like BFS from outside):
    Round 1: Remove leaves 3, 4
             Remaining: 0, 1, 2
    Round 2: Remove leaf 1
             Remaining: 0, 2
    Round 3: Can't remove more (would disconnect)
             Result: [0, 2] are centroids

    Actually correct approach - keep peeling until 1 or 2 nodes remain:
    """

    # Step 1: Handle edge cases
    if n <= 2:
        return list(range(n))

    # Step 2: Build adjacency list
    graph = defaultdict(set)
    for u, v in edges:
        graph[u].add(v)
        graph[v].add(u)

    # Step 3: Find initial leaves (degree = 1)
    leaves = deque()
    for node in range(n):
        if len(graph[node]) == 1:
            leaves.append(node)

    # Step 4: Peel leaves layer by layer
    remaining_nodes = n

    while remaining_nodes > 2:
        # Step 5: Remove current layer of leaves
        leaves_count = len(leaves)
        remaining_nodes -= leaves_count

        # Step 6: Process each leaf
        for _ in range(leaves_count):
            leaf = leaves.popleft()

            # Step 7: Remove leaf from neighbor's adjacency
            neighbor = graph[leaf].pop()  # Leaf has only 1 neighbor
            graph[neighbor].remove(leaf)

            # Step 8: If neighbor becomes new leaf, add to queue
            if len(graph[neighbor]) == 1:
                leaves.append(neighbor)

    # Step 9: Remaining nodes are MHT roots
    return list(leaves)

# DFS approach to calculate height (less efficient, for understanding):
def findMinHeightTrees_dfs(n: int, edges: list[list[int]]) -> list[int]:
    """Alternative: Calculate height for each possible root."""

    if n <= 2:
        return list(range(n))

    # Build graph
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)

    def get_height(root):
        """DFS to find height of tree with given root."""
        def dfs(node, parent):
            if not graph[node]:
                return 0

            max_height = 0
            for neighbor in graph[node]:
                if neighbor != parent:
                    height = 1 + dfs(neighbor, node)
                    max_height = max(max_height, height)

            return max_height

        return dfs(root, -1)

    # Find minimum height
    heights = [get_height(i) for i in range(n)]
    min_height = min(heights)

    # Return all roots with minimum height
    return [i for i, h in enumerate(heights) if h == min_height]
```

#### TypeScript Solution
```typescript
function findMinHeightTrees(n: number, edges: number[][]): number[] {
    // Edge cases
    if (n <= 2) return Array.from({length: n}, (_, i) => i);

    // Build graph
    const graph = new Map<number, Set<number>>();
    for (let i = 0; i < n; i++) {
        graph.set(i, new Set());
    }

    for (const [u, v] of edges) {
        graph.get(u)!.add(v);
        graph.get(v)!.add(u);
    }

    // Find initial leaves
    let leaves: number[] = [];
    for (let i = 0; i < n; i++) {
        if (graph.get(i)!.size === 1) {
            leaves.push(i);
        }
    }

    // Peel leaves
    let remainingNodes = n;

    while (remainingNodes > 2) {
        const leavesCount = leaves.length;
        remainingNodes -= leavesCount;

        const newLeaves: number[] = [];

        for (const leaf of leaves) {
            const neighbors = graph.get(leaf)!;
            const neighbor = neighbors.values().next().value;

            graph.get(neighbor)!.delete(leaf);

            if (graph.get(neighbor)!.size === 1) {
                newLeaves.push(neighbor);
            }
        }

        leaves = newLeaves;
    }

    return leaves;
}
```

**Complexity Analysis**:
- Time: O(n) - process each node once in topological sort
- Space: O(n) - graph storage

---

### Problem 22: Critical Connections in a Network (Hard)
**LeetCode Link**: [1192. Critical Connections in a Network](https://leetcode.com/problems/critical-connections-in-a-network/)

**Description**: There are `n` servers numbered from 0 to n-1 connected by undirected connections. A connection is critical if removing it will make some servers unable to reach others. Find all critical connections.

#### Python Solution
```python
def criticalConnections(n: int, connections: list[list[int]]) -> list[list[int]]:
    """
    Use Tarjan's algorithm with DFS to find bridges (critical edges).

    Visualization:
    Network:  0 --- 1 --- 2
              |     |
              +-----+
                    |
                    3

    Analysis:
    - Edge 0-1: Part of cycle, not critical
    - Edge 1-2: Bridge! Removing disconnects 2 from rest
    - Edge 1-3: Bridge! Removing disconnects 3 from rest
    - Edge 0-1 (lower): Part of cycle, not critical

    Critical connections: [[1,2], [1,3]]

    Algorithm:
    For each node, track:
    - discovery_time: When node was first visited
    - low_link: Lowest discovery time reachable from node

    Edge (u,v) is bridge if: low_link[v] > discovery_time[u]
    (meaning v can't reach any node discovered before u without using u-v edge)
    """

    # Step 1: Build adjacency list
    graph = [[] for _ in range(n)]
    for u, v in connections:
        graph[u].append(v)
        graph[v].append(u)

    # Step 2: Initialize tracking arrays
    discovery_time = [-1] * n  # When node was discovered
    low_link = [-1] * n         # Lowest discovery time reachable
    time = [0]                  # Current time counter
    result = []

    def dfs(node, parent):
        # Step 3: Mark discovery time and low link
        discovery_time[node] = low_link[node] = time[0]
        time[0] += 1

        # Step 4: Explore all neighbors
        for neighbor in graph[node]:
            # Step 5: Skip parent edge (undirected graph)
            if neighbor == parent:
                continue

            # Step 6: If neighbor unvisited, DFS
            if discovery_time[neighbor] == -1:
                dfs(neighbor, node)

                # Step 7: Update low link after returning
                low_link[node] = min(low_link[node], low_link[neighbor])

                # Step 8: Check if edge is a bridge
                # neighbor can't reach anything discovered before node
                if low_link[neighbor] > discovery_time[node]:
                    result.append([node, neighbor])
            else:
                # Step 9: Back edge, update low link
                low_link[node] = min(low_link[node], discovery_time[neighbor])

    # Step 10: Start DFS from node 0
    dfs(0, -1)

    return result

# Detailed trace example:
# n=4, connections=[[0,1],[1,2],[2,0],[1,3]]
#
# Graph:  0 --- 1 --- 3
#         |     |
#         +-----2
#
# DFS trace:
# dfs(0, -1):
#   discovery[0] = low[0] = 0, time = 1
#   neighbor 1:
#     dfs(1, 0):
#       discovery[1] = low[1] = 1, time = 2
#       neighbor 2:
#         dfs(2, 1):
#           discovery[2] = low[2] = 2, time = 3
#           neighbor 0: already visited
#             low[2] = min(2, discovery[0]) = min(2, 0) = 0
#           neighbor 1: parent, skip
#         low[1] = min(1, low[2]) = min(1, 0) = 0
#         low[2]=0 not > discovery[1]=1 → NOT bridge
#       neighbor 3:
#         dfs(3, 1):
#           discovery[3] = low[3] = 3, time = 4
#           neighbor 1: parent, skip
#         low[1] = min(0, low[3]) = min(0, 3) = 0
#         low[3]=3 > discovery[1]=1 → BRIDGE! [1,3]
#   low[0] = min(0, low[1]) = min(0, 0) = 0
#
# Result: [[1, 3]]
```

#### TypeScript Solution
```typescript
function criticalConnections(n: number, connections: number[][]): number[][] {
    // Build graph
    const graph: number[][] = Array.from({length: n}, () => []);
    for (const [u, v] of connections) {
        graph[u].push(v);
        graph[v].push(u);
    }

    const discoveryTime = new Array(n).fill(-1);
    const lowLink = new Array(n).fill(-1);
    let time = 0;
    const result: number[][] = [];

    function dfs(node: number, parent: number): void {
        discoveryTime[node] = lowLink[node] = time++;

        for (const neighbor of graph[node]) {
            if (neighbor === parent) continue;

            if (discoveryTime[neighbor] === -1) {
                dfs(neighbor, node);
                lowLink[node] = Math.min(lowLink[node], lowLink[neighbor]);

                // Check if bridge
                if (lowLink[neighbor] > discoveryTime[node]) {
                    result.push([node, neighbor]);
                }
            } else {
                lowLink[node] = Math.min(lowLink[node], discoveryTime[neighbor]);
            }
        }
    }

    dfs(0, -1);
    return result;
}
```

**Complexity Analysis**:
- Time: O(V + E) - visit each vertex and edge once
- Space: O(V + E) - graph storage and recursion stack

---

### Problem 23: Word Search II (Hard)
**LeetCode Link**: [212. Word Search II](https://leetcode.com/problems/word-search-ii/)

**Description**: Given an `m x n` board of characters and a list of strings `words`, return all words on the board. Each word must be constructed from letters of adjacent cells (horizontally or vertically), and each cell may not be used more than once in a word.

#### Python Solution
```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.word = None  # Store complete word at end node

def findWords(board: list[list[str]], words: list[str]) -> list[str]:
    """
    Combine Trie + DFS for efficient word search.

    Visualization:
    Board:      words = ["oath", "pea", "eat", "rain"]
    o a a n
    e t a e     Trie structure:
    i h k r              root
    i f l v            /  |  \
                      o   p   e   r
    Step 1: Build Trie  /   |   |   |
           o          a    e   a   a
          /          /     |   |   |
         a          t      a   t   i
        /          /             |   |
       t          h             *   n
      /          *              (eat)  *
     h                                (rain)
    *
    (oath)

    Step 2: DFS from each cell
    Starting at (0,0) 'o':
      DFS path: o → a → t → h ✓ Found "oath"!

    Starting at (1,1) 't':
      DFS won't find 'oath' (no 'o' neighbor)
      But can continue exploring other paths

    Optimization: Remove found words from Trie to avoid duplicates
    """

    # Step 1: Build Trie from words
    root = TrieNode()

    for word in words:
        node = root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.word = word  # Mark end of word

    # Step 2: Prepare for DFS
    rows, cols = len(board), len(board[0])
    result = []

    def dfs(r, c, parent_node):
        # Step 3: Get current character
        char = board[r][c]

        # Step 4: Check if char exists in Trie
        if char not in parent_node.children:
            return

        current_node = parent_node.children[char]

        # Step 5: Found a complete word
        if current_node.word:
            result.append(current_node.word)
            # Remove word to avoid duplicates
            current_node.word = None

        # Step 6: Mark cell as visited
        board[r][c] = '#'

        # Step 7: Explore all 4 directions
        for dr, dc in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            nr, nc = r + dr, c + dc

            # Step 8: Check bounds and not visited
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':
                dfs(nr, nc, current_node)

        # Step 9: Backtrack - restore cell
        board[r][c] = char

        # Step 10: Optimization - prune empty branches
        if not current_node.children:
            del parent_node.children[char]

    # Step 11: Start DFS from each cell
    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)

    return result

# Detailed trace for finding "oath":
# Board: [['o','a','a','n'],
#         ['e','t','a','e'],
#         ['i','h','k','r'],
#         ['i','f','l','v']]
#
# DFS from (0,0) 'o':
#   board[0][0] = '#'  (mark visited)
#   Check Trie: 'o' exists in root.children ✓
#   Explore neighbors:
#     Try (0,1) 'a':
#       board[0][1] = '#'
#       Check Trie: 'a' exists in node_o.children ✓
#       Explore neighbors:
#         Try (1,1) 't':
#           board[1][1] = '#'
#           Check Trie: 't' exists in node_a.children ✓
#           Explore neighbors:
#             Try (2,1) 'h':
#               board[2][1] = '#'
#               Check Trie: 'h' exists in node_t.children ✓
#               current_node.word = "oath" → Add to result!
#               board[2][1] = 'h'  (backtrack)
#           board[1][1] = 't'  (backtrack)
#       board[0][1] = 'a'  (backtrack)
#   board[0][0] = 'o'  (backtrack)
#
# Result: ["oath"] (continues for other words)
```

#### TypeScript Solution
```typescript
class TrieNode {
    children: Map<string, TrieNode>;
    word: string | null;

    constructor() {
        this.children = new Map();
        this.word = null;
    }
}

function findWords(board: string[][], words: string[]): string[] {
    // Build Trie
    const root = new TrieNode();

    for (const word of words) {
        let node = root;
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
        }
        node.word = word;
    }

    const rows = board.length;
    const cols = board[0].length;
    const result: string[] = [];

    function dfs(r: number, c: number, parentNode: TrieNode): void {
        const char = board[r][c];

        if (!parentNode.children.has(char)) return;

        const currentNode = parentNode.children.get(char)!;

        // Found word
        if (currentNode.word) {
            result.push(currentNode.word);
            currentNode.word = null;
        }

        // Mark visited
        board[r][c] = '#';

        // Explore 4 directions
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== '#') {
                dfs(nr, nc, currentNode);
            }
        }

        // Backtrack
        board[r][c] = char;

        // Prune
        if (currentNode.children.size === 0) {
            parentNode.children.delete(char);
        }
    }

    // Start DFS from each cell
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            dfs(r, c, root);
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(m × n × 4^L) - m×n cells, explore 4 directions, L is max word length
- Space: O(W × L) - Trie storage, W is total number of words, L is average word length

---

## Summary

Depth-First Search is a fundamental graph/tree traversal technique. Key takeaways:

1. **Two Implementations**:
   - **Recursive**: Clean, intuitive, uses call stack
   - **Iterative**: Explicit stack, more control

2. **Common Applications**:
   - Path finding and counting
   - Connected components
   - Cycle detection
   - Topological sorting
   - Backtracking problems

3. **Key Techniques**:
   - **Visited tracking**: Prevent infinite loops in graphs
   - **State tracking**: For cycle detection (visiting vs visited)
   - **Backtracking**: Build/unbuild paths
   - **Memoization**: Cache results for optimization

4. **Graph vs Tree DFS**:
   - **Trees**: No visited set needed (no cycles)
   - **Graphs**: Must track visited nodes

5. **Time/Space Tradeoffs**:
   - Recursive: Cleaner code, stack overflow risk
   - Iterative: More code, explicit control
   - Memoization: Trade space for time

**Practice Strategy**:
- Master basic tree DFS (all traversals)
- Practice grid-based DFS (islands, regions)
- Solve graph problems (cycles, paths)
- Combine with backtracking for path problems
- Use memoization for optimization

Remember: DFS explores depth-first, making it perfect for finding paths, detecting cycles, and exploring all possibilities!
