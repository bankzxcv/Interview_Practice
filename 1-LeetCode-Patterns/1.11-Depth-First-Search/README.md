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

```
DFS Traversal Example:

Tree:           1
               / \
              2   3
             / \   \
            4   5   6

DFS Order (Preorder): 1 → 2 → 4 → 5 → 3 → 6

Stack States:
Step 1: [1]           Visit 1
Step 2: [2, 3]        Push children (right first for left-first traversal)
Step 3: [4, 5, 3]     Visit 2, push children
Step 4: [5, 3]        Visit 4 (leaf)
Step 5: [3]           Visit 5 (leaf)
Step 6: [6]           Visit 3, push children
Step 7: []            Visit 6 (leaf)

Graph DFS:
    A --- B
    |     |
    C --- D

DFS from A: A → B → D → C (or A → C → D → B)
Explores one path completely before backtracking
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
