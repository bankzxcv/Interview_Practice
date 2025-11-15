# Pattern 1.10: Binary Tree Traversal

## Pattern Overview

### What is Binary Tree Traversal?
Binary Tree Traversal is the process of visiting all nodes in a binary tree in a specific order. The three main traversal methods (Inorder, Preorder, Postorder) each serve different purposes and produce different node orderings.

### When to Use It?
- Printing/processing all nodes in a tree
- Serializing/deserializing trees
- Expression tree evaluation
- Finding paths in trees
- Validating binary search trees
- Building trees from traversal sequences
- Computing tree properties (height, diameter, etc.)

### Time/Space Complexity Benefits
- **Time Complexity**: O(n) - visit each node exactly once
- **Space Complexity**:
  - Recursive: O(h) where h is tree height (call stack)
  - Iterative: O(h) for stack-based approaches
  - Morris Traversal: O(1) space (threaded tree technique)

### Visual Diagram

```
Binary Tree Example:
        1
       / \
      2   3
     / \
    4   5

Traversal Orders:
┌─────────────────────────────────────────────────┐
│ Preorder  (Root→Left→Right): 1, 2, 4, 5, 3    │
│ Inorder   (Left→Root→Right): 4, 2, 5, 1, 3    │
│ Postorder (Left→Right→Root): 4, 5, 2, 3, 1    │
│ Level-order (BFS):           1, 2, 3, 4, 5     │
└─────────────────────────────────────────────────┘

Memory Aid:
PRE-order:  Process ROOT first (before children)
IN-order:   Process root IN the middle
POST-order: Process root AFTER children (POSTpone root)
```

### Detailed Visualizations

#### 1. PREORDER Traversal (Root → Left → Right)

```
Step-by-Step Execution:
        [1]  ← START: Process root first
       /   \
      2     3
     / \
    4   5

Order of Processing:
  Step 1: Visit 1 (root)         → Output: [1]
          Go left ↓

        1
       /↓\
     [2]  3    Step 2: Visit 2   → Output: [1, 2]
     / \       Go left ↓
    4   5

        1
       / \
      2   3
     /↓\       Step 3: Visit 4   → Output: [1, 2, 4]
   [4]  5      No children, backtrack ↑

        1
       / \
      2   3    Step 4: Visit 5   → Output: [1, 2, 4, 5]
     / \↓      No children, backtrack ↑↑
    4  [5]

        1
       / \↓    Step 5: Visit 3   → Output: [1, 2, 4, 5, 3]
      2  [3]   No children, DONE!
     / \
    4   5

Visual Path (arrows show visiting order):
        1①
       ↙ ↘
      2②  3⑤
     ↙ ↘
    4③  5④

Final Output: [1, 2, 4, 5, 3]
```

#### 2. INORDER Traversal (Left → Root → Right)

```
Step-by-Step Execution:
        1
       / \
      2   3     Key: Go LEFT as far as possible first!
     / \
    4   5

Order of Processing:
  Step 1: Start at 1, go left to 2, go left to 4

        1
       / \
      2   3
     /↓\       Leftmost node = 4
   [4]  5      Visit 4 FIRST!  → Output: [4]

        1
       / \
     [2]  3    Step 2: Backtrack to 2, visit it
     /↑\       (left subtree done) → Output: [4, 2]
    4   5      Now go right ↓

        1
       / \
      2   3    Step 3: Visit 5   → Output: [4, 2, 5]
     / \↓      No children, backtrack ↑↑
    4  [5]

       [1]     Step 4: Visit 1   → Output: [4, 2, 5, 1]
       /↑\     (left subtree done)
      2   3    Now go right ↓
     / \
    4   5

        1
       / \↓    Step 5: Visit 3   → Output: [4, 2, 5, 1, 3]
      2  [3]   DONE!
     / \
    4   5

Visual Path (numbers show visiting order):
        1④
       / \
      2②  3⑤
     / \
    4①  5③

For BST, this gives SORTED ORDER!
Example BST:      Inorder Result:
      4           [1, 2, 3, 4, 5, 6, 7]
     / \          ← Sorted ascending!
    2   6
   / \ / \
  1  3 5  7

Final Output: [4, 2, 5, 1, 3]
```

#### 3. POSTORDER Traversal (Left → Right → Root)

```
Step-by-Step Execution:
        1
       / \
      2   3     Key: Process ROOT LAST (children first)
     / \
    4   5

Order of Processing:
  Step 1: Go left to 2, then left to 4

        1
       / \
      2   3
     /↓\       Step 2: Visit 4   → Output: [4]
   [4]  5      (no children, so visit immediately)

        1
       / \
      2   3    Step 3: Visit 5   → Output: [4, 5]
     / \↓      (no children)
    4  [5]

        1      Step 4: NOW visit 2 → Output: [4, 5, 2]
       / \     (both children processed)
     [2]  3
     /↑\↑
    4   5

        1
       / \↓    Step 5: Visit 3   → Output: [4, 5, 2, 3]
      2  [3]
     / \
    4   5

       [1]     Step 6: Finally visit 1 → Output: [4, 5, 2, 3, 1]
       /↑\↑    (all children done, visit root LAST)
      2   3
     / \
    4   5

Visual Path (numbers show visiting order):
        1⑤
       / \
      2④  3④
     / \
    4①  5②

Use Case: Deleting tree (delete children before parent)
         Calculating directory sizes (sum children first)

Final Output: [4, 5, 2, 3, 1]
```

#### 4. LEVEL-ORDER Traversal (BFS - Breadth-First)

```
Step-by-Step Execution with Queue:

        1          Level 0
       / \
      2   3        Level 1
     / \
    4   5          Level 2

Queue Operations:
┌─────────────────────────────────────────────────────┐
│ Initial: queue = [1]                                │
├─────────────────────────────────────────────────────┤
│ Step 1: Dequeue 1, process it    → Output: [1]     │
│         Enqueue children: [2, 3]                    │
│         Queue: [2, 3]                               │
├─────────────────────────────────────────────────────┤
│ Step 2: Dequeue 2, process it    → Output: [1, 2]  │
│         Enqueue children: [4, 5]                    │
│         Queue: [3, 4, 5]                            │
├─────────────────────────────────────────────────────┤
│ Step 3: Dequeue 3, process it    → Output: [1,2,3] │
│         No children                                 │
│         Queue: [4, 5]                               │
├─────────────────────────────────────────────────────┤
│ Step 4: Dequeue 4, process it  → Output: [1,2,3,4] │
│         No children                                 │
│         Queue: [5]                                  │
├─────────────────────────────────────────────────────┤
│ Step 5: Dequeue 5, process it  → Output: [1,2,3,4,5]
│         No children                                 │
│         Queue: []  ← Empty, DONE!                   │
└─────────────────────────────────────────────────────┘

Level-by-Level Visualization:
════════════════════════════════════════════════
Level 0:  [1]          ← Root level
          ╱ ╲
Level 1: [2] [3]       ← Process left to right
         ╱ ╲
Level 2:[4] [5]        ← Process left to right
════════════════════════════════════════════════

More Complex Example:
              8                    Level 0: [8]
           ╱     ╲
          3       10               Level 1: [3, 10]
        ╱  ╲       ╲
       1    6       14             Level 2: [1, 6, 14]
           ╱ ╲     ╱
          4   7   13               Level 3: [4, 7, 13]

Result: [[8], [3, 10], [1, 6, 14], [4, 7, 13]]

Final Output: [1, 2, 3, 4, 5]
```

#### 5. Recursive Call Stack Visualization

```
PREORDER Call Stack Example:
        1
       / \
      2   3
     /
    4

Call Stack Evolution (→ indicates active call):

┌────────────────────────────────────────────────┐
│ [START] preorder(1)                            │
│   ├─ Process 1          Output: [1]            │
│   ├─→ Call preorder(2)                         │
│      ├─ Process 2       Output: [1, 2]         │
│      ├─→ Call preorder(4)                      │
│      │   ├─ Process 4   Output: [1, 2, 4]      │
│      │   ├─ Call preorder(null) → return       │
│      │   └─ Call preorder(null) → return       │
│      ├─← Return from preorder(4)               │
│      └─ Call preorder(null) → return           │
│   ├─← Return from preorder(2)                  │
│   └─→ Call preorder(3)                         │
│      ├─ Process 3       Output: [1, 2, 4, 3]   │
│      ├─ Call preorder(null) → return           │
│      └─ Call preorder(null) → return           │
│   └─← Return from preorder(3)                  │
└─ [END] All calls complete                      │
└────────────────────────────────────────────────┘

Stack Depth Visualization:
Depth  Call Stack              Output
  0    preorder(1)             [1]
  1    └─ preorder(2)          [1, 2]
  2       └─ preorder(4)       [1, 2, 4]
  3          └─ preorder(null) [1, 2, 4]  ← Max depth!
  2       └─ preorder(null)    [1, 2, 4]
  1    └─ preorder(3)          [1, 2, 4, 3]
  2       └─ preorder(null)    [1, 2, 4, 3]
  2       └─ preorder(null)    [1, 2, 4, 3]
  0    (complete)              [1, 2, 4, 3]

Space Complexity = O(h) where h = height
```

#### 6. Traversal Comparison on Same Tree

```
Sample Tree:
              A
           ╱     ╲
          B       C
        ╱  ╲       ╲
       D    E       F
           ╱
          G

┌──────────────────────────────────────────────────────┐
│                 TRAVERSAL SUMMARY                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ PREORDER (Root-Left-Right):                         │
│ Visit path: A → B → D → E → G → C → F              │
│ Result: [A, B, D, E, G, C, F]                       │
│                                                      │
│   Use: Copying tree, creating prefix notation       │
│   Think: "Process current, then dive into children" │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ INORDER (Left-Root-Right):                          │
│ Visit path: D → B → G → E → A → C → F              │
│ Result: [D, B, G, E, A, C, F]                       │
│                                                      │
│   Use: BST sorted order, expression evaluation      │
│   Think: "Go deep left, process, then go right"     │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ POSTORDER (Left-Right-Root):                        │
│ Visit path: D → G → E → B → F → C → A              │
│ Result: [D, G, E, B, F, C, A]                       │
│                                                      │
│   Use: Deleting tree, computing sizes               │
│   Think: "Process children completely before root"  │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ LEVEL-ORDER (BFS):                                  │
│ Level 0: A                                          │
│ Level 1: B, C                                       │
│ Level 2: D, E, F                                    │
│ Level 3: G                                          │
│ Result: [A, B, C, D, E, F, G]                       │
│                                                      │
│   Use: Shortest path, level-wise operations         │
│   Think: "Process all nodes at same depth first"    │
│                                                      │
└──────────────────────────────────────────────────────┘

Visual Animation of All Traversals:
      A          Preorder:  ① A (visit immediately)
     ╱ ╲         Inorder:   ④ A (visit after left subtree)
    B   C        Postorder: ⑦ A (visit last)
   ╱╲   ╲        Level:     ① A (level 0)
  D  E   F
    ╱
   G

Complete visiting order visualization:
      A①④⑦
     ╱   ╲
   B②③⑥   C⑥⑥⑥
  ╱ ╲     ╲
 D③①④ E④②⑤ F⑦⑤⑤
     ╱
    G⑤①①

Numbers indicate visit order for:
First digit: Preorder
Second digit: Inorder
Third digit: Postorder
```

## Recognition Guidelines

### How to Identify This Pattern

Look for these **key indicators**:
1. Problem involves **binary trees**
2. Need to **visit all nodes** or specific nodes
3. Order of visiting matters
4. Need to:
   - Collect values in specific order
   - Validate tree properties
   - Build/serialize trees
   - Find paths or ancestors

### Key Phrases/Indicators
- "traverse the tree"
- "visit all nodes"
- "in preorder/inorder/postorder"
- "serialize/deserialize"
- "print tree values"
- "process nodes in order"
- "left-to-right" or "right-to-left"

## Template/Pseudocode

### Recursive Traversal Templates

```python
# Preorder: Root → Left → Right
def preorder(root):
    if not root:
        return
    process(root)         # Process root first
    preorder(root.left)   # Then left subtree
    preorder(root.right)  # Then right subtree

# Inorder: Left → Root → Right
def inorder(root):
    if not root:
        return
    inorder(root.left)    # Left subtree first
    process(root)         # Then process root
    inorder(root.right)   # Then right subtree

# Postorder: Left → Right → Root
def postorder(root):
    if not root:
        return
    postorder(root.left)   # Left subtree first
    postorder(root.right)  # Then right subtree
    process(root)          # Process root last
```

### Iterative Traversal Template

```python
# Iterative Inorder (using stack)
def inorder_iterative(root):
    stack = []
    current = root
    result = []

    while current or stack:
        # Go to leftmost node
        while current:
            stack.append(current)
            current = current.left

        # Process node
        current = stack.pop()
        result.append(current.val)

        # Move to right subtree
        current = current.right

    return result
```

---

## Problems

### Problem 1: Binary Tree Inorder Traversal (Easy)
**LeetCode Link**: [94. Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/)

**Description**: Given the root of a binary tree, return the inorder traversal of its nodes' values.

#### Python Solution
```python
# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorderTraversal(root: TreeNode) -> list[int]:
    # Step 1: Initialize result list
    result = []

    # Step 2: Define recursive helper function
    def inorder(node):
        # Step 3: Base case - empty node
        if not node:
            return

        # Step 4: Traverse left subtree
        inorder(node.left)

        # Step 5: Process current node (add to result)
        result.append(node.val)

        # Step 6: Traverse right subtree
        inorder(node.right)

    # Step 7: Start traversal from root
    inorder(root)

    # Step 8: Return collected values
    return result

# Iterative approach (alternative)
def inorderTraversal_iterative(root: TreeNode) -> list[int]:
    # Step 1: Initialize stack and result
    stack = []
    result = []
    current = root

    # Step 2: Traverse until all nodes processed
    while current or stack:
        # Step 3: Go to leftmost node
        while current:
            stack.append(current)
            current = current.left

        # Step 4: Process node from stack
        current = stack.pop()
        result.append(current.val)

        # Step 5: Move to right subtree
        current = current.right

    return result
```

#### TypeScript Solution
```typescript
// Definition for a binary tree node.
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

function inorderTraversal(root: TreeNode | null): number[] {
    // Step 1: Initialize result array
    const result: number[] = [];

    // Step 2: Define recursive helper function
    function inorder(node: TreeNode | null): void {
        // Step 3: Base case - empty node
        if (!node) return;

        // Step 4: Traverse left subtree
        inorder(node.left);

        // Step 5: Process current node
        result.push(node.val);

        // Step 6: Traverse right subtree
        inorder(node.right);
    }

    // Step 7: Start traversal from root
    inorder(root);

    // Step 8: Return collected values
    return result;
}

// Iterative approach
function inorderTraversal_iterative(root: TreeNode | null): number[] {
    const stack: TreeNode[] = [];
    const result: number[] = [];
    let current = root;

    while (current || stack.length > 0) {
        while (current) {
            stack.push(current);
            current = current.left;
        }

        current = stack.pop()!;
        result.push(current.val);
        current = current.right;
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack or explicit stack, h is tree height

---

### Problem 2: Binary Tree Preorder Traversal (Easy)
**LeetCode Link**: [144. Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/)

**Description**: Given the root of a binary tree, return the preorder traversal of its nodes' values.

#### Python Solution
```python
def preorderTraversal(root: TreeNode) -> list[int]:
    # Step 1: Initialize result list
    result = []

    # Step 2: Define recursive helper function
    def preorder(node):
        # Step 3: Base case - empty node
        if not node:
            return

        # Step 4: Process current node FIRST (preorder)
        result.append(node.val)

        # Step 5: Traverse left subtree
        preorder(node.left)

        # Step 6: Traverse right subtree
        preorder(node.right)

    # Step 7: Start traversal from root
    preorder(root)

    return result

# Iterative approach
def preorderTraversal_iterative(root: TreeNode) -> list[int]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize stack with root and result
    stack = [root]
    result = []

    # Step 3: Process nodes from stack
    while stack:
        # Step 4: Pop and process current node
        node = stack.pop()
        result.append(node.val)

        # Step 5: Push right child first (so left is processed first)
        if node.right:
            stack.append(node.right)

        # Step 6: Push left child
        if node.left:
            stack.append(node.left)

    return result
```

#### TypeScript Solution
```typescript
function preorderTraversal(root: TreeNode | null): number[] {
    // Step 1: Initialize result array
    const result: number[] = [];

    // Step 2: Define recursive helper function
    function preorder(node: TreeNode | null): void {
        // Step 3: Base case - empty node
        if (!node) return;

        // Step 4: Process current node FIRST
        result.push(node.val);

        // Step 5: Traverse left subtree
        preorder(node.left);

        // Step 6: Traverse right subtree
        preorder(node.right);
    }

    // Step 7: Start traversal from root
    preorder(root);

    return result;
}

// Iterative approach
function preorderTraversal_iterative(root: TreeNode | null): number[] {
    if (!root) return [];

    const stack: TreeNode[] = [root];
    const result: number[] = [];

    while (stack.length > 0) {
        const node = stack.pop()!;
        result.push(node.val);

        // Push right first, then left (LIFO stack)
        if (node.right) stack.push(node.right);
        if (node.left) stack.push(node.left);
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion/stack space

---

### Problem 3: Binary Tree Postorder Traversal (Easy)
**LeetCode Link**: [145. Binary Tree Postorder Traversal](https://leetcode.com/problems/binary-tree-postorder-traversal/)

**Description**: Given the root of a binary tree, return the postorder traversal of its nodes' values.

#### Python Solution
```python
def postorderTraversal(root: TreeNode) -> list[int]:
    # Step 1: Initialize result list
    result = []

    # Step 2: Define recursive helper function
    def postorder(node):
        # Step 3: Base case - empty node
        if not node:
            return

        # Step 4: Traverse left subtree first
        postorder(node.left)

        # Step 5: Traverse right subtree
        postorder(node.right)

        # Step 6: Process current node LAST (postorder)
        result.append(node.val)

    # Step 7: Start traversal from root
    postorder(root)

    return result

# Iterative approach using two stacks
def postorderTraversal_iterative(root: TreeNode) -> list[int]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize two stacks
    stack1 = [root]
    stack2 = []

    # Step 3: Fill stack2 with reverse postorder
    while stack1:
        node = stack1.pop()
        stack2.append(node)

        # Push left then right (reverse of preorder)
        if node.left:
            stack1.append(node.left)
        if node.right:
            stack1.append(node.right)

    # Step 4: Pop from stack2 to get postorder
    result = []
    while stack2:
        result.append(stack2.pop().val)

    return result
```

#### TypeScript Solution
```typescript
function postorderTraversal(root: TreeNode | null): number[] {
    // Step 1: Initialize result array
    const result: number[] = [];

    // Step 2: Define recursive helper function
    function postorder(node: TreeNode | null): void {
        // Step 3: Base case - empty node
        if (!node) return;

        // Step 4: Traverse left subtree first
        postorder(node.left);

        // Step 5: Traverse right subtree
        postorder(node.right);

        // Step 6: Process current node LAST
        result.push(node.val);
    }

    // Step 7: Start traversal from root
    postorder(root);

    return result;
}

// Iterative approach
function postorderTraversal_iterative(root: TreeNode | null): number[] {
    if (!root) return [];

    const stack1: TreeNode[] = [root];
    const stack2: TreeNode[] = [];

    while (stack1.length > 0) {
        const node = stack1.pop()!;
        stack2.push(node);

        if (node.left) stack1.push(node.left);
        if (node.right) stack1.push(node.right);
    }

    const result: number[] = [];
    while (stack2.length > 0) {
        result.push(stack2.pop()!.val);
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion/stack space

---

### Problem 4: Binary Tree Level Order Traversal (Medium)
**LeetCode Link**: [102. Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)

**Description**: Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).

#### Python Solution
```python
from collections import deque

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
            # Step 6: Dequeue node and add to current level
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

# Visualization:
#       3
#      / \
#     9  20
#       /  \
#      15   7
#
# Level 0: [3]
# Level 1: [9, 20]
# Level 2: [15, 7]
# Result: [[3], [9, 20], [15, 7]]
```

#### TypeScript Solution
```typescript
function levelOrder(root: TreeNode | null): number[][] {
    // Step 1: Handle empty tree
    if (!root) return [];

    // Step 2: Initialize result and queue
    const result: number[][] = [];
    const queue: TreeNode[] = [root];

    // Step 3: Process level by level
    while (queue.length > 0) {
        // Step 4: Get current level size
        const levelSize = queue.length;
        const currentLevel: number[] = [];

        // Step 5: Process all nodes in current level
        for (let i = 0; i < levelSize; i++) {
            // Step 6: Dequeue node and add to current level
            const node = queue.shift()!;
            currentLevel.push(node.val);

            // Step 7: Enqueue children for next level
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        // Step 8: Add current level to result
        result.push(currentLevel);
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(w) - w is maximum width of tree (queue size)

---

### Problem 5: Binary Tree Zigzag Level Order Traversal (Medium)
**LeetCode Link**: [103. Binary Tree Zigzag Level Order Traversal](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/)

**Description**: Given the root of a binary tree, return the zigzag level order traversal (i.e., left to right, then right to left for the next level and alternate between).

#### Python Solution
```python
from collections import deque

def zigzagLevelOrder(root: TreeNode) -> list[list[int]]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize result, queue, and direction flag
    result = []
    queue = deque([root])
    left_to_right = True

    # Step 3: Process level by level
    while queue:
        # Step 4: Get current level size
        level_size = len(queue)
        current_level = []

        # Step 5: Process all nodes in current level
        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)

            # Step 6: Enqueue children
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        # Step 7: Reverse if moving right to left
        if not left_to_right:
            current_level.reverse()

        # Step 8: Add level to result and toggle direction
        result.append(current_level)
        left_to_right = not left_to_right

    return result

# Visualization:
#       3
#      / \
#     9  20
#       /  \
#      15   7
#
# Level 0 (L→R): [3]
# Level 1 (R→L): [20, 9]
# Level 2 (L→R): [15, 7]
# Result: [[3], [20, 9], [15, 7]]
```

#### TypeScript Solution
```typescript
function zigzagLevelOrder(root: TreeNode | null): number[][] {
    // Step 1: Handle empty tree
    if (!root) return [];

    // Step 2: Initialize result, queue, and direction
    const result: number[][] = [];
    const queue: TreeNode[] = [root];
    let leftToRight = true;

    // Step 3: Process level by level
    while (queue.length > 0) {
        // Step 4: Get current level size
        const levelSize = queue.length;
        const currentLevel: number[] = [];

        // Step 5: Process all nodes in current level
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;
            currentLevel.push(node.val);

            // Step 6: Enqueue children
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        // Step 7: Reverse if moving right to left
        if (!leftToRight) {
            currentLevel.reverse();
        }

        // Step 8: Add level and toggle direction
        result.push(currentLevel);
        leftToRight = !leftToRight;
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(w) - maximum width of tree

---

### Problem 6: Validate Binary Search Tree (Medium)
**LeetCode Link**: [98. Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/)

**Description**: Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST is defined as follows:
- The left subtree contains only nodes with keys less than the node's key
- The right subtree contains only nodes with keys greater than the node's key
- Both left and right subtrees must also be BSTs

#### Python Solution
```python
def isValidBST(root: TreeNode) -> bool:
    # Step 1: Use inorder traversal property of BST
    # Inorder traversal of BST gives sorted sequence

    def validate(node, min_val, max_val):
        # Step 2: Base case - empty node is valid
        if not node:
            return True

        # Step 3: Check if current value violates BST property
        if node.val <= min_val or node.val >= max_val:
            return False

        # Step 4: Validate left subtree (values must be < node.val)
        # and right subtree (values must be > node.val)
        return (validate(node.left, min_val, node.val) and
                validate(node.right, node.val, max_val))

    # Step 5: Start validation with infinite bounds
    return validate(root, float('-inf'), float('inf'))

# Alternative: Inorder traversal approach
def isValidBST_inorder(root: TreeNode) -> bool:
    # Step 1: Track previous value in inorder traversal
    prev = [float('-inf')]

    def inorder(node):
        if not node:
            return True

        # Step 2: Check left subtree
        if not inorder(node.left):
            return False

        # Step 3: Check current node (must be > previous)
        if node.val <= prev[0]:
            return False
        prev[0] = node.val

        # Step 4: Check right subtree
        return inorder(node.right)

    return inorder(root)

# Example:
#     5
#    / \
#   1   6
#      / \
#     4   7
# Node 4 < 5, violates BST (should be > 5)
```

#### TypeScript Solution
```typescript
function isValidBST(root: TreeNode | null): boolean {
    function validate(
        node: TreeNode | null,
        minVal: number,
        maxVal: number
    ): boolean {
        // Step 2: Base case - empty node is valid
        if (!node) return true;

        // Step 3: Check if current value violates BST property
        if (node.val <= minVal || node.val >= maxVal) {
            return false;
        }

        // Step 4: Validate both subtrees with updated bounds
        return (
            validate(node.left, minVal, node.val) &&
            validate(node.right, node.val, maxVal)
        );
    }

    // Step 5: Start with infinite bounds
    return validate(root, -Infinity, Infinity);
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack depth

---

### Problem 7: Kth Smallest Element in a BST (Medium)
**LeetCode Link**: [230. Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)

**Description**: Given the root of a binary search tree and an integer `k`, return the kth smallest value (1-indexed) of all values in the tree.

#### Python Solution
```python
def kthSmallest(root: TreeNode, k: int) -> int:
    # Step 1: Use inorder traversal (gives sorted order for BST)
    # Track count and result
    count = [0]
    result = [None]

    def inorder(node):
        # Step 2: Base case
        if not node or result[0] is not None:
            return

        # Step 3: Traverse left subtree
        inorder(node.left)

        # Step 4: Process current node
        count[0] += 1
        if count[0] == k:
            result[0] = node.val
            return

        # Step 5: Traverse right subtree
        inorder(node.right)

    # Step 6: Start traversal
    inorder(root)
    return result[0]

# Iterative approach
def kthSmallest_iterative(root: TreeNode, k: int) -> int:
    # Step 1: Initialize stack for inorder traversal
    stack = []
    current = root
    count = 0

    # Step 2: Inorder traversal
    while current or stack:
        # Step 3: Go to leftmost node
        while current:
            stack.append(current)
            current = current.left

        # Step 4: Process node
        current = stack.pop()
        count += 1

        # Step 5: Found kth smallest
        if count == k:
            return current.val

        # Step 6: Move to right subtree
        current = current.right

    return -1  # Should never reach here

# Example:
#     3
#    / \
#   1   4
#    \
#     2
# Inorder: [1, 2, 3, 4]
# k=1 → 1, k=2 → 2, k=3 → 3
```

#### TypeScript Solution
```typescript
function kthSmallest(root: TreeNode | null, k: number): number {
    // Step 1: Initialize stack for inorder traversal
    const stack: TreeNode[] = [];
    let current = root;
    let count = 0;

    // Step 2: Inorder traversal
    while (current || stack.length > 0) {
        // Step 3: Go to leftmost node
        while (current) {
            stack.push(current);
            current = current.left;
        }

        // Step 4: Process node
        current = stack.pop()!;
        count++;

        // Step 5: Found kth smallest
        if (count === k) {
            return current.val;
        }

        // Step 6: Move to right subtree
        current = current.right;
    }

    return -1;
}
```

**Complexity Analysis**:
- Time: O(h + k) - h to reach leftmost, k nodes to process
- Space: O(h) - stack space

---

### Problem 8: Binary Tree Right Side View (Medium)
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

    # Step 3: Level order traversal
    while queue:
        # Step 4: Get level size
        level_size = len(queue)

        # Step 5: Process all nodes in level
        for i in range(level_size):
            node = queue.popleft()

            # Step 6: Last node in level is visible from right
            if i == level_size - 1:
                result.append(node.val)

            # Step 7: Enqueue children
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

    return result

# DFS approach (recursive)
def rightSideView_dfs(root: TreeNode) -> list[int]:
    result = []

    def dfs(node, level):
        if not node:
            return

        # Step 1: First node we see at this level (going right first)
        if level == len(result):
            result.append(node.val)

        # Step 2: Visit right first, then left
        dfs(node.right, level + 1)
        dfs(node.left, level + 1)

    dfs(root, 0)
    return result

# Visualization:
#      1         ← visible
#    /   \
#   2     3      ← 3 visible
#    \     \
#     5     4    ← 4 visible
# Right view: [1, 3, 4]
```

#### TypeScript Solution
```typescript
function rightSideView(root: TreeNode | null): number[] {
    // Step 1: Handle empty tree
    if (!root) return [];

    // Step 2: Initialize result and queue
    const result: number[] = [];
    const queue: TreeNode[] = [root];

    // Step 3: Level order traversal
    while (queue.length > 0) {
        // Step 4: Get level size
        const levelSize = queue.length;

        // Step 5: Process all nodes in level
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;

            // Step 6: Last node in level is visible
            if (i === levelSize - 1) {
                result.push(node.val);
            }

            // Step 7: Enqueue children
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit all nodes
- Space: O(w) - width of tree for queue

---

### Problem 9: Construct Binary Tree from Preorder and Inorder Traversal (Medium)
**LeetCode Link**: [105. Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)

**Description**: Given two integer arrays `preorder` and `inorder` where `preorder` is the preorder traversal and `inorder` is the inorder traversal of a binary tree, construct and return the binary tree.

#### Python Solution
```python
def buildTree(preorder: list[int], inorder: list[int]) -> TreeNode:
    # Step 1: Create hashmap for quick inorder index lookup
    inorder_map = {val: idx for idx, val in enumerate(inorder)}

    # Step 2: Track current preorder index
    preorder_idx = [0]

    def build(left, right):
        # Step 3: Base case - no elements to construct tree
        if left > right:
            return None

        # Step 4: First element in preorder is root
        root_val = preorder[preorder_idx[0]]
        root = TreeNode(root_val)
        preorder_idx[0] += 1

        # Step 5: Find root position in inorder
        # Elements left of root → left subtree
        # Elements right of root → right subtree
        root_idx = inorder_map[root_val]

        # Step 6: Recursively build left and right subtrees
        # Build left first (preorder: root→left→right)
        root.left = build(left, root_idx - 1)
        root.right = build(root_idx + 1, right)

        return root

    # Step 7: Build tree
    return build(0, len(inorder) - 1)

# Example:
# preorder = [3,9,20,15,7]
# inorder  = [9,3,15,20,7]
#
# Step 1: 3 is root
# inorder: [9] | 3 | [15,20,7]
#          left   root  right
#
# Step 2: Build left subtree with preorder=[9], inorder=[9]
# Step 3: Build right subtree with preorder=[20,15,7], inorder=[15,20,7]
#
# Result:
#     3
#    / \
#   9  20
#      / \
#     15  7
```

#### TypeScript Solution
```typescript
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
    // Step 1: Create hashmap for inorder indices
    const inorderMap = new Map<number, number>();
    inorder.forEach((val, idx) => inorderMap.set(val, idx));

    // Step 2: Track preorder index
    let preorderIdx = 0;

    function build(left: number, right: number): TreeNode | null {
        // Step 3: Base case
        if (left > right) return null;

        // Step 4: Get root from preorder
        const rootVal = preorder[preorderIdx++];
        const root = new TreeNode(rootVal);

        // Step 5: Find root in inorder
        const rootIdx = inorderMap.get(rootVal)!;

        // Step 6: Build subtrees
        root.left = build(left, rootIdx - 1);
        root.right = build(rootIdx + 1, right);

        return root;
    }

    return build(0, inorder.length - 1);
}
```

**Complexity Analysis**:
- Time: O(n) - build each node once
- Space: O(n) - hashmap and recursion stack

---

### Problem 10: Flatten Binary Tree to Linked List (Medium)
**LeetCode Link**: [114. Flatten Binary Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/)

**Description**: Given the root of a binary tree, flatten the tree into a "linked list" in-place using the right pointer. The "linked list" should be in the same order as a preorder traversal of the binary tree.

#### Python Solution
```python
def flatten(root: TreeNode) -> None:
    # Step 1: Use modified preorder traversal
    # Track previous node to link nodes
    prev = [None]

    def preorder(node):
        # Step 2: Base case
        if not node:
            return

        # Step 3: Save children (will be modified)
        left = node.left
        right = node.right

        # Step 4: Link previous node to current
        if prev[0]:
            prev[0].right = node
            prev[0].left = None

        # Step 5: Update previous node
        prev[0] = node

        # Step 6: Traverse left then right (preorder)
        preorder(left)
        preorder(right)

    # Step 7: Start traversal
    preorder(root)

# Alternative: Iterative approach
def flatten_iterative(root: TreeNode) -> None:
    # Step 1: Traverse and flatten
    current = root

    while current:
        # Step 2: If left child exists
        if current.left:
            # Step 3: Find rightmost node in left subtree
            rightmost = current.left
            while rightmost.right:
                rightmost = rightmost.right

            # Step 4: Connect rightmost to current's right
            rightmost.right = current.right

            # Step 5: Move left subtree to right
            current.right = current.left
            current.left = None

        # Step 6: Move to next node
        current = current.right

# Visualization:
#     1              1
#    / \              \
#   2   5      →       2
#  / \   \              \
# 3   4   6              3
#                         \
#                          4
#                           \
#                            5
#                             \
#                              6
# Preorder: 1→2→3→4→5→6
```

#### TypeScript Solution
```typescript
function flatten(root: TreeNode | null): void {
    // Step 1: Traverse and flatten
    let current = root;

    while (current) {
        // Step 2: If left child exists
        if (current.left) {
            // Step 3: Find rightmost in left subtree
            let rightmost = current.left;
            while (rightmost.right) {
                rightmost = rightmost.right;
            }

            // Step 4: Connect rightmost to current's right
            rightmost.right = current.right;

            // Step 5: Move left to right
            current.right = current.left;
            current.left = null;
        }

        // Step 6: Move to next node
        current = current.right;
    }
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(1) - constant extra space (excluding recursion in first approach)

---

### Problem 11: Binary Tree Maximum Path Sum (Hard)
**LeetCode Link**: [124. Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)

**Description**: A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge. A path does not need to pass through the root. The path sum is the sum of node values in the path. Find the maximum path sum.

#### Python Solution
```python
def maxPathSum(root: TreeNode) -> int:
    # Step 1: Track global maximum
    max_sum = [float('-inf')]

    def max_gain(node):
        # Step 2: Base case - null node contributes 0
        if not node:
            return 0

        # Step 3: Get max gain from left and right subtrees
        # Take max with 0 (ignore negative paths)
        left_gain = max(max_gain(node.left), 0)
        right_gain = max(max_gain(node.right), 0)

        # Step 4: Calculate path sum through current node
        # Path: left → node → right
        current_path_sum = node.val + left_gain + right_gain

        # Step 5: Update global maximum
        max_sum[0] = max(max_sum[0], current_path_sum)

        # Step 6: Return max gain for parent
        # Can only use one side (left or right) + current node
        return node.val + max(left_gain, right_gain)

    # Step 7: Start DFS
    max_gain(root)

    return max_sum[0]

# Example:
#      -10
#      / \
#     9  20
#       /  \
#      15   7
#
# Max path: 15 → 20 → 7 = 42
#
# At node 20:
# - left_gain = 15
# - right_gain = 7
# - current_path = 20 + 15 + 7 = 42
# - return to parent: 20 + max(15, 7) = 35
```

#### TypeScript Solution
```typescript
function maxPathSum(root: TreeNode | null): number {
    // Step 1: Track global maximum
    let maxSum = -Infinity;

    function maxGain(node: TreeNode | null): number {
        // Step 2: Base case
        if (!node) return 0;

        // Step 3: Get max gain from subtrees (ignore negative)
        const leftGain = Math.max(maxGain(node.left), 0);
        const rightGain = Math.max(maxGain(node.right), 0);

        // Step 4: Calculate path sum through current node
        const currentPathSum = node.val + leftGain + rightGain;

        // Step 5: Update global maximum
        maxSum = Math.max(maxSum, currentPathSum);

        // Step 6: Return max gain for parent
        return node.val + Math.max(leftGain, rightGain);
    }

    maxGain(root);
    return maxSum;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack height

---

### Problem 12: Serialize and Deserialize Binary Tree (Hard)
**LeetCode Link**: [297. Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/)

**Description**: Design an algorithm to serialize and deserialize a binary tree. Serialization is converting a tree to a string. Deserialization is converting the string back to the original tree structure.

#### Python Solution
```python
class Codec:
    def serialize(self, root: TreeNode) -> str:
        """Encodes a tree to a single string using preorder traversal."""
        # Step 1: Initialize result list
        result = []

        def preorder(node):
            # Step 2: Use 'null' marker for None nodes
            if not node:
                result.append('null')
                return

            # Step 3: Add current value
            result.append(str(node.val))

            # Step 4: Traverse left and right
            preorder(node.left)
            preorder(node.right)

        # Step 5: Build serialized string
        preorder(root)
        return ','.join(result)

    def deserialize(self, data: str) -> TreeNode:
        """Decodes your encoded data to tree."""
        # Step 1: Split string into values
        values = data.split(',')

        # Step 2: Track current index
        self.idx = 0

        def build():
            # Step 3: Handle null marker
            if values[self.idx] == 'null':
                self.idx += 1
                return None

            # Step 4: Create node with current value
            node = TreeNode(int(values[self.idx]))
            self.idx += 1

            # Step 5: Recursively build left and right
            node.left = build()
            node.right = build()

            return node

        return build()

# Example:
#     1
#    / \
#   2   3
#      / \
#     4   5
#
# Serialized: "1,2,null,null,3,4,null,null,5,null,null"
# Preorder with null markers
```

#### TypeScript Solution
```typescript
class Codec {
    // Serialize tree to string
    serialize(root: TreeNode | null): string {
        // Step 1: Initialize result array
        const result: string[] = [];

        function preorder(node: TreeNode | null): void {
            // Step 2: Handle null nodes
            if (!node) {
                result.push('null');
                return;
            }

            // Step 3: Add current value
            result.push(node.val.toString());

            // Step 4: Traverse children
            preorder(node.left);
            preorder(node.right);
        }

        preorder(root);
        return result.join(',');
    }

    // Deserialize string to tree
    deserialize(data: string): TreeNode | null {
        // Step 1: Split string
        const values = data.split(',');
        let idx = 0;

        function build(): TreeNode | null {
            // Step 2: Handle null marker
            if (values[idx] === 'null') {
                idx++;
                return null;
            }

            // Step 3: Create node
            const node = new TreeNode(parseInt(values[idx]));
            idx++;

            // Step 4: Build children
            node.left = build();
            node.right = build();

            return node;
        }

        return build();
    }
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once for both operations
- Space: O(n) - store all node values

---

### Problem 13: Vertical Order Traversal of a Binary Tree (Hard)
**LeetCode Link**: [987. Vertical Order Traversal of a Binary Tree](https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/)

**Description**: Given the root of a binary tree, calculate the vertical order traversal. For each node at position (row, col):
- Left child is at (row+1, col-1)
- Right child is at (row+1, col+1)
Return values of nodes in vertical order from left to right. If two nodes are in the same position, order by value.

#### Python Solution
```python
from collections import defaultdict, deque

def verticalTraversal(root: TreeNode) -> list[list[int]]:
    # Step 1: Track nodes by column and row
    # col → [(row, val), ...]
    column_table = defaultdict(list)

    # Step 2: BFS with (node, row, col) tracking
    queue = deque([(root, 0, 0)])

    while queue:
        node, row, col = queue.popleft()

        # Step 3: Record node position and value
        column_table[col].append((row, node.val))

        # Step 4: Add children with updated positions
        if node.left:
            queue.append((node.left, row + 1, col - 1))
        if node.right:
            queue.append((node.right, row + 1, col + 1))

    # Step 5: Sort columns left to right
    result = []
    for col in sorted(column_table.keys()):
        # Step 6: Sort by row, then by value
        column_nodes = column_table[col]
        column_nodes.sort(key=lambda x: (x[0], x[1]))

        # Step 7: Extract values
        result.append([val for row, val in column_nodes])

    return result

# Visualization:
#       3
#      / \
#     9  20
#       /  \
#      15   7
#
# Positions:
# col -1: [(1,9)]           → [9]
# col  0: [(0,3)]           → [3]
# col  1: [(1,20), (2,15)]  → [15, 20]
# col  2: [(2,7)]           → [7]
#
# Result: [[9], [3], [15, 20], [7]]
```

#### TypeScript Solution
```typescript
function verticalTraversal(root: TreeNode | null): number[][] {
    if (!root) return [];

    // Step 1: Map to track columns
    const columnTable = new Map<number, Array<[number, number]>>();

    // Step 2: BFS with position tracking
    const queue: Array<[TreeNode, number, number]> = [[root, 0, 0]];

    while (queue.length > 0) {
        const [node, row, col] = queue.shift()!;

        // Step 3: Record position and value
        if (!columnTable.has(col)) {
            columnTable.set(col, []);
        }
        columnTable.get(col)!.push([row, node.val]);

        // Step 4: Add children
        if (node.left) {
            queue.push([node.left, row + 1, col - 1]);
        }
        if (node.right) {
            queue.push([node.right, row + 1, col + 1]);
        }
    }

    // Step 5: Sort columns and extract values
    const result: number[][] = [];
    const sortedCols = Array.from(columnTable.keys()).sort((a, b) => a - b);

    for (const col of sortedCols) {
        const nodes = columnTable.get(col)!;
        // Step 6: Sort by row, then value
        nodes.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
        result.push(nodes.map(([_, val]) => val));
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n log n) - n nodes, sorting by position
- Space: O(n) - store all nodes

---

### Problem 14: Binary Tree Level Order Traversal II (Medium)
**LeetCode Link**: [107. Binary Tree Level Order Traversal II](https://leetcode.com/problems/binary-tree-level-order-traversal-ii/)

**Description**: Given the root of a binary tree, return the bottom-up level order traversal of its nodes' values (i.e., from left to right, level by level from leaf to root).

#### Python Solution
```python
from collections import deque

def levelOrderBottom(root: TreeNode) -> list[list[int]]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize result and queue for BFS
    result = []
    queue = deque([root])

    # Step 3: Standard level-order traversal
    while queue:
        # Step 4: Get current level size
        level_size = len(queue)
        current_level = []

        # Step 5: Process all nodes at current level
        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)

            # Step 6: Enqueue children for next level
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        # Step 7: Add level to result
        result.append(current_level)

    # Step 8: Reverse to get bottom-up order
    return result[::-1]

# Visualization:
#       3
#      / \
#     9  20
#       /  \
#      15   7
#
# Normal Level Order:     Bottom-Up Level Order:
# Level 0: [3]            Level 2: [15, 7]
# Level 1: [9, 20]        Level 1: [9, 20]
# Level 2: [15, 7]        Level 0: [3]
#
# Result: [[15, 7], [9, 20], [3]]
```

#### TypeScript Solution
```typescript
function levelOrderBottom(root: TreeNode | null): number[][] {
    // Step 1: Handle empty tree
    if (!root) return [];

    // Step 2: Initialize result and queue
    const result: number[][] = [];
    const queue: TreeNode[] = [root];

    // Step 3: Standard BFS
    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentLevel: number[] = [];

        // Step 4: Process current level
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;
            currentLevel.push(node.val);

            // Step 5: Enqueue children
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        result.push(currentLevel);
    }

    // Step 6: Reverse for bottom-up order
    return result.reverse();
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(w) - maximum width of tree for queue

---

### Problem 15: Average of Levels in Binary Tree (Easy)
**LeetCode Link**: [637. Average of Levels in Binary Tree](https://leetcode.com/problems/average-of-levels-in-binary-tree/)

**Description**: Given the root of a binary tree, return the average value of the nodes on each level in the form of an array.

#### Python Solution
```python
from collections import deque

def averageOfLevels(root: TreeNode) -> list[float]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize result and queue
    result = []
    queue = deque([root])

    # Step 3: Level-order traversal
    while queue:
        # Step 4: Get current level size and sum
        level_size = len(queue)
        level_sum = 0

        # Step 5: Process all nodes at current level
        for _ in range(level_size):
            node = queue.popleft()
            level_sum += node.val

            # Step 6: Enqueue children
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        # Step 7: Calculate and store average for this level
        average = level_sum / level_size
        result.append(average)

    return result

# Visualization:
#       3
#      / \
#     9  20
#       /  \
#      15   7
#
# Level 0: [3]       → avg = 3/1 = 3.0
# Level 1: [9, 20]   → avg = 29/2 = 14.5
# Level 2: [15, 7]   → avg = 22/2 = 11.0
#
# Result: [3.0, 14.5, 11.0]
```

#### TypeScript Solution
```typescript
function averageOfLevels(root: TreeNode | null): number[] {
    // Step 1: Handle empty tree
    if (!root) return [];

    // Step 2: Initialize result and queue
    const result: number[] = [];
    const queue: TreeNode[] = [root];

    // Step 3: BFS traversal
    while (queue.length > 0) {
        const levelSize = queue.length;
        let levelSum = 0;

        // Step 4: Process current level
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;
            levelSum += node.val;

            // Step 5: Enqueue children
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        // Step 6: Calculate average
        result.push(levelSum / levelSize);
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(w) - maximum width for queue

---

### Problem 16: N-ary Tree Level Order Traversal (Medium)
**LeetCode Link**: [429. N-ary Tree Level Order Traversal](https://leetcode.com/problems/n-ary-tree-level-order-traversal/)

**Description**: Given an n-ary tree (each node can have multiple children), return the level order traversal of its nodes' values.

#### Python Solution
```python
from collections import deque

# Definition for a Node.
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children if children is not None else []

def levelOrder(root: Node) -> list[list[int]]:
    # Step 1: Handle empty tree
    if not root:
        return []

    # Step 2: Initialize result and queue
    result = []
    queue = deque([root])

    # Step 3: BFS traversal
    while queue:
        # Step 4: Get current level size
        level_size = len(queue)
        current_level = []

        # Step 5: Process all nodes at current level
        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)

            # Step 6: Enqueue ALL children (not just left/right)
            for child in node.children:
                queue.append(child)

        # Step 7: Add level to result
        result.append(current_level)

    return result

# Visualization:
#         1
#      /  |  \
#     3   2   4
#    / \
#   5   6
#
# Level 0: [1]
# Level 1: [3, 2, 4]       ← Three children of root
# Level 2: [5, 6]          ← Two children of node 3
#
# Result: [[1], [3, 2, 4], [5, 6]]
```

#### TypeScript Solution
```typescript
// Definition for a Node.
class Node {
    val: number;
    children: Node[];
    constructor(val?: number, children?: Node[]) {
        this.val = val === undefined ? 0 : val;
        this.children = children === undefined ? [] : children;
    }
}

function levelOrder(root: Node | null): number[][] {
    // Step 1: Handle empty tree
    if (!root) return [];

    // Step 2: Initialize result and queue
    const result: number[][] = [];
    const queue: Node[] = [root];

    // Step 3: BFS traversal
    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentLevel: number[] = [];

        // Step 4: Process current level
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift()!;
            currentLevel.push(node.val);

            // Step 5: Enqueue all children
            queue.push(...node.children);
        }

        result.push(currentLevel);
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(w) - maximum width of tree

---

### Problem 17: All Nodes Distance K in Binary Tree (Medium)
**LeetCode Link**: [863. All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/)

**Description**: Given the root of a binary tree, a target node, and an integer k, return an array of the values of all nodes that have a distance k from the target node.

#### Python Solution
```python
from collections import deque, defaultdict

def distanceK(root: TreeNode, target: TreeNode, k: int) -> list[int]:
    # Step 1: Build parent pointers using traversal
    # Map: node → parent
    parent_map = {}

    def build_parent_map(node, parent=None):
        if not node:
            return
        parent_map[node] = parent
        build_parent_map(node.left, node)
        build_parent_map(node.right, node)

    # Step 2: Build the parent map
    build_parent_map(root)

    # Step 3: BFS from target node
    # Treat tree as undirected graph
    queue = deque([(target, 0)])  # (node, distance)
    visited = {target}
    result = []

    # Step 4: BFS to find nodes at distance k
    while queue:
        node, distance = queue.popleft()

        # Step 5: Found node at distance k
        if distance == k:
            result.append(node.val)
            continue  # Don't go further

        # Step 6: Explore neighbors (left, right, parent)
        neighbors = [node.left, node.right, parent_map.get(node)]

        for neighbor in neighbors:
            if neighbor and neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, distance + 1))

    return result

# Visualization:
#       3
#      / \
#     5   1
#    / \  / \
#   6  2 0  8
#     / \
#    7   4
#
# target = 5, k = 2
#
# From node 5:
# Distance 0: [5]
# Distance 1: [6, 2, 3]       ← left, right, parent
# Distance 2: [7, 4, 1]       ← children of 2, right child of 3
#
# Result: [7, 4, 1]
#
# BFS exploration (treating as graph):
#     5 (target)
#    /|\
#   6 2 3  (distance 1)
#    /|  \
#   7 4   1  (distance 2) ← Answer!
```

#### TypeScript Solution
```typescript
function distanceK(
    root: TreeNode | null,
    target: TreeNode | null,
    k: number
): number[] {
    // Step 1: Build parent map
    const parentMap = new Map<TreeNode, TreeNode | null>();

    function buildParentMap(node: TreeNode | null, parent: TreeNode | null = null): void {
        if (!node) return;
        parentMap.set(node, parent);
        buildParentMap(node.left, node);
        buildParentMap(node.right, node);
    }

    buildParentMap(root);

    // Step 2: BFS from target
    const queue: Array<[TreeNode, number]> = [[target!, 0]];
    const visited = new Set<TreeNode>([target!]);
    const result: number[] = [];

    while (queue.length > 0) {
        const [node, distance] = queue.shift()!;

        // Step 3: Found nodes at distance k
        if (distance === k) {
            result.push(node.val);
            continue;
        }

        // Step 4: Explore neighbors
        const neighbors = [
            node.left,
            node.right,
            parentMap.get(node) || null
        ];

        for (const neighbor of neighbors) {
            if (neighbor && !visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([neighbor, distance + 1]);
            }
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once in parent map building and BFS
- Space: O(n) - parent map and visited set

---

### Problem 18: Find Duplicate Subtrees (Medium)
**LeetCode Link**: [652. Find Duplicate Subtrees](https://leetcode.com/problems/find-duplicate-subtrees/)

**Description**: Given the root of a binary tree, return all duplicate subtrees. For each kind of duplicate subtrees, you only need to return the root node of any one of them.

#### Python Solution
```python
from collections import defaultdict

def findDuplicateSubtrees(root: TreeNode) -> list[TreeNode]:
    # Step 1: Track subtree serializations and their frequencies
    subtree_map = defaultdict(int)
    result = []

    def serialize(node):
        # Step 2: Serialize subtree using postorder traversal
        if not node:
            return "#"  # Null marker

        # Step 3: Build serialization string
        # Format: "left,right,value"
        left_serial = serialize(node.left)
        right_serial = serialize(node.right)

        # Step 4: Create unique serialization for this subtree
        serial = f"{left_serial},{right_serial},{node.val}"

        # Step 5: Track this serialization
        subtree_map[serial] += 1

        # Step 6: If seen exactly twice, add to result
        # (only add once even if appears multiple times)
        if subtree_map[serial] == 2:
            result.append(node)

        return serial

    # Step 7: Start serialization from root
    serialize(root)

    return result

# Visualization:
#       1
#      / \
#     2   3
#    /   / \
#   4   2   4
#      /
#     4
#
# Serializations (postorder):
# Node 4 (leftmost):  "#,#,4"
# Node 2 (left):      "#,#,4,#,2"
# Node 4 (right leaf):"#,#,4"        ← Duplicate!
# Node 4 (under 2):   "#,#,4"        ← Duplicate!
# Node 2 (right):     "#,#,4,#,2"    ← Duplicate!
#
# Duplicate subtrees:
#   2        and      4
#  /
# 4
#
# Result: [node_2, node_4]
```

#### TypeScript Solution
```typescript
function findDuplicateSubtrees(root: TreeNode | null): Array<TreeNode | null> {
    // Step 1: Track subtree serializations
    const subtreeMap = new Map<string, number>();
    const result: Array<TreeNode | null> = [];

    function serialize(node: TreeNode | null): string {
        // Step 2: Base case
        if (!node) return "#";

        // Step 3: Serialize subtrees (postorder)
        const leftSerial = serialize(node.left);
        const rightSerial = serialize(node.right);

        // Step 4: Create serialization
        const serial = `${leftSerial},${rightSerial},${node.val}`;

        // Step 5: Track frequency
        const count = subtreeMap.get(serial) || 0;
        subtreeMap.set(serial, count + 1);

        // Step 6: Add to result if seen exactly twice
        if (count === 1) {
            result.push(node);
        }

        return serial;
    }

    serialize(root);
    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once, string operations are O(1) amortized
- Space: O(n) - store serializations for all subtrees

---

### Problem 19: Populating Next Right Pointers in Each Node (Medium)
**LeetCode Link**: [116. Populating Next Right Pointers in Each Node](https://leetcode.com/problems/populating-next-right-pointers-in-each-node/)

**Description**: Populate each next pointer to point to its next right node. If there is no next right node, the next pointer should be set to NULL. Initially, all next pointers are set to NULL.

#### Python Solution
```python
# Definition for a Node.
class Node:
    def __init__(self, val: int = 0, left: 'Node' = None,
                 right: 'Node' = None, next: 'Node' = None):
        self.val = val
        self.left = left
        self.right = right
        self.next = next

def connect(root: Node) -> Node:
    # Step 1: Handle empty tree
    if not root:
        return None

    # Step 2: Use level-order traversal
    # Start with root level
    leftmost = root

    # Step 3: Process each level
    while leftmost.left:  # While not at leaf level
        # Step 4: Traverse current level using 'next' pointers
        current = leftmost

        while current:
            # Step 5: Connect left child to right child
            current.left.next = current.right

            # Step 6: Connect right child to next node's left child
            if current.next:
                current.right.next = current.next.left

            # Step 7: Move to next node in current level
            current = current.next

        # Step 8: Move to next level
        leftmost = leftmost.left

    return root

# Visualization:
# Before:                After:
#       1                  1 → NULL
#      / \                / \
#     2   3              2 → 3 → NULL
#    / \ / \            / \ / \
#   4  5 6  7          4→5→6→7→ NULL
#
# Process:
# Level 0: 1 → NULL
# Level 1: 2 → 3 → NULL  (1.left.next = 1.right)
# Level 2: 4→5→6→7→NULL
#   - 2.left.next = 2.right (4→5)
#   - 2.right.next = 2.next.left (5→6)
#   - 3.left.next = 3.right (6→7)

# Alternative: BFS approach
from collections import deque

def connect_bfs(root: Node) -> Node:
    if not root:
        return None

    queue = deque([root])

    while queue:
        level_size = len(queue)

        for i in range(level_size):
            node = queue.popleft()

            # Connect to next node in level
            if i < level_size - 1:
                node.next = queue[0]

            # Add children to queue
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

    return root
```

#### TypeScript Solution
```typescript
class Node {
    val: number;
    left: Node | null;
    right: Node | null;
    next: Node | null;

    constructor(val?: number, left?: Node, right?: Node, next?: Node) {
        this.val = val === undefined ? 0 : val;
        this.left = left === undefined ? null : left;
        this.right = right === undefined ? null : right;
        this.next = next === undefined ? null : next;
    }
}

function connect(root: Node | null): Node | null {
    // Step 1: Handle empty tree
    if (!root) return null;

    // Step 2: Start with leftmost node of each level
    let leftmost = root;

    // Step 3: Process each level
    while (leftmost.left) {
        // Step 4: Traverse current level
        let current = leftmost;

        while (current) {
            // Step 5: Connect children
            current.left!.next = current.right;

            // Step 6: Connect to next subtree
            if (current.next) {
                current.right!.next = current.next.left;
            }

            current = current.next;
        }

        // Step 7: Move to next level
        leftmost = leftmost.left;
    }

    return root;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(1) - constant extra space (not counting recursion)

---

### Problem 20: Recover Binary Search Tree (Medium)
**LeetCode Link**: [99. Recover Binary Search Tree](https://leetcode.com/problems/recover-binary-search-tree/)

**Description**: Two nodes of a BST are swapped by mistake. Recover the tree without changing its structure. Use O(1) space if possible.

#### Python Solution
```python
def recoverTree(root: TreeNode) -> None:
    # Step 1: Track first and second swapped nodes
    # In inorder traversal of BST, values should be sorted
    # If two nodes swapped, we'll find inversions
    first = None
    second = None
    prev = None

    def inorder(node):
        nonlocal first, second, prev

        # Step 2: Base case
        if not node:
            return

        # Step 3: Traverse left subtree
        inorder(node.left)

        # Step 4: Check if current node violates BST property
        # prev.val should be < node.val in valid BST
        if prev and prev.val > node.val:
            # Step 5: First inversion found
            if not first:
                first = prev  # The larger value in first inversion
                second = node # Might be the second swapped node
            else:
                # Step 6: Second inversion found
                second = node

        # Step 7: Update previous node
        prev = node

        # Step 8: Traverse right subtree
        inorder(node.right)

    # Step 9: Find the swapped nodes
    inorder(root)

    # Step 10: Swap their values back
    if first and second:
        first.val, second.val = second.val, first.val

# Visualization:
# Incorrect BST (3 and 5 swapped):
#       5
#      / \
#     3   2
#    / \
#   1   4
#
# Inorder: [1, 3, 5, 4, 2]
#                ↑  ↑  ↑
# Expected:     [1, 2, 3, 4, 5]
#
# Inversions found:
# - 3 > 5: NO (wait, 5 is root)
# - Actually: [1, 5, 4, 2, 3] is the inorder
#   Inversions: 5>4 (first=5, second=4)
#              4>2 (update second=2)...
#
# Let me recalculate:
# Tree:     5           Inorder visits: left(3) → 3 → right(3) → 5 → left(2) → 2
#          / \
#         3   2         Actual inorder: 1, 3, 4, 5, 2
#        / \                Inversions: 5 > 2
#       1   4                  first = 5, second = 2
#
# After swap: Tree becomes valid BST
#       3
#      / \
#     2   5
#    / \
#   1   4
```

#### TypeScript Solution
```typescript
function recoverTree(root: TreeNode | null): void {
    // Step 1: Track swapped nodes
    let first: TreeNode | null = null;
    let second: TreeNode | null = null;
    let prev: TreeNode | null = null;

    function inorder(node: TreeNode | null): void {
        // Step 2: Base case
        if (!node) return;

        // Step 3: Traverse left
        inorder(node.left);

        // Step 4: Check for inversion
        if (prev && prev.val > node.val) {
            if (!first) {
                first = prev;
                second = node;
            } else {
                second = node;
            }
        }

        prev = node;

        // Step 5: Traverse right
        inorder(node.right);
    }

    // Step 6: Find swapped nodes
    inorder(root);

    // Step 7: Swap values
    if (first && second) {
        [first.val, second.val] = [second.val, first.val];
    }
}
```

**Complexity Analysis**:
- Time: O(n) - single inorder traversal
- Space: O(h) - recursion stack, O(1) if using Morris traversal

---

### Problem 21: Binary Tree Cameras (Hard)
**LeetCode Link**: [968. Binary Tree Cameras](https://leetcode.com/problems/binary-tree-cameras/)

**Description**: Install cameras on nodes of a binary tree. Each camera can monitor its parent, itself, and its immediate children. Return the minimum number of cameras needed to monitor all nodes.

#### Python Solution
```python
def minCameraCover(root: TreeNode) -> int:
    # Step 1: Define states
    # 0 = Not covered, needs coverage
    # 1 = Has camera
    # 2 = Covered by camera (but no camera here)

    camera_count = [0]

    def dfs(node):
        # Step 2: Base case - null nodes are considered covered
        if not node:
            return 2  # Covered (leaf's children)

        # Step 3: Postorder traversal (process children first)
        left_state = dfs(node.left)
        right_state = dfs(node.right)

        # Step 4: If any child is not covered, place camera here
        if left_state == 0 or right_state == 0:
            camera_count[0] += 1
            return 1  # This node has camera

        # Step 5: If any child has camera, this node is covered
        if left_state == 1 or right_state == 1:
            return 2  # Covered by child

        # Step 6: Both children covered but no camera nearby
        # This node needs coverage from parent
        return 0  # Not covered yet

    # Step 7: Process tree
    root_state = dfs(root)

    # Step 8: If root not covered, add camera at root
    if root_state == 0:
        camera_count[0] += 1

    return camera_count[0]

# Visualization:
#       0              Cameras needed: 2
#      / \
#     0   C            C = camera
#    / \
#   C   0
#
# Bottom-up processing (postorder):
# 1. Leaves return 0 (not covered)
# 2. Parent of leaves places camera (returns 1)
# 3. Grandparent is covered by camera below (returns 2)
# 4. If parent of grandparent not covered, place camera
#
# Example:      0
#              / \
#             0   0     ← leaves (state 0)
#
# After DFS:    C       ← needs camera (children uncovered)
#              / \
#             0   0
#
# Better:       0
#              / \
#             C   C     ← cameras at children
#
# Actually optimal:
#               0
#              / \
#             C   0     ← One camera covers 3 nodes
#            / \           (itself, parent, sibling)
#           0   0
```

#### TypeScript Solution
```typescript
function minCameraCover(root: TreeNode | null): number {
    let cameraCount = 0;

    // States: 0 = not covered, 1 = has camera, 2 = covered
    function dfs(node: TreeNode | null): number {
        // Step 1: Null nodes are covered
        if (!node) return 2;

        // Step 2: Process children (postorder)
        const leftState = dfs(node.left);
        const rightState = dfs(node.right);

        // Step 3: Place camera if child not covered
        if (leftState === 0 || rightState === 0) {
            cameraCount++;
            return 1;
        }

        // Step 4: Covered by child's camera
        if (leftState === 1 || rightState === 1) {
            return 2;
        }

        // Step 5: Not covered
        return 0;
    }

    // Step 6: Check root state
    if (dfs(root) === 0) {
        cameraCount++;
    }

    return cameraCount;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack

---

### Problem 22: Sum Root to Leaf Numbers (Medium)
**LeetCode Link**: [129. Sum Root to Leaf Numbers](https://leetcode.com/problems/sum-root-to-leaf-numbers/)

**Description**: Given a binary tree containing digits 0-9 only, each root-to-leaf path represents a number. Return the total sum of all root-to-leaf numbers.

#### Python Solution
```python
def sumNumbers(root: TreeNode) -> int:
    # Step 1: Track total sum
    total_sum = [0]

    def dfs(node, current_number):
        # Step 2: Base case - empty node
        if not node:
            return

        # Step 3: Build current number (shift left and add digit)
        current_number = current_number * 10 + node.val

        # Step 4: Check if leaf node
        if not node.left and not node.right:
            # Step 5: Add path number to total
            total_sum[0] += current_number
            return

        # Step 6: Recurse on children with updated number
        dfs(node.left, current_number)
        dfs(node.right, current_number)

    # Step 7: Start DFS from root
    dfs(root, 0)

    return total_sum[0]

# Alternative: return value approach
def sumNumbers_v2(root: TreeNode) -> int:
    def dfs(node, current_number):
        if not node:
            return 0

        # Build number along path
        current_number = current_number * 10 + node.val

        # Leaf node - return the complete number
        if not node.left and not node.right:
            return current_number

        # Sum of all paths in left and right subtrees
        return dfs(node.left, current_number) + dfs(node.right, current_number)

    return dfs(root, 0)

# Visualization:
#       1
#      / \
#     2   3
#    / \
#   4   5
#
# Root-to-leaf paths:
# 1 → 2 → 4 = 124
# 1 → 2 → 5 = 125
# 1 → 3     = 13
#
# Sum = 124 + 125 + 13 = 262
#
# Building numbers:
# Path 1→2→4:
#   current = 0
#   → 0*10 + 1 = 1
#   → 1*10 + 2 = 12
#   → 12*10 + 4 = 124 ✓
```

#### TypeScript Solution
```typescript
function sumNumbers(root: TreeNode | null): number {
    function dfs(node: TreeNode | null, currentNumber: number): number {
        // Step 1: Base case
        if (!node) return 0;

        // Step 2: Build current number
        currentNumber = currentNumber * 10 + node.val;

        // Step 3: Leaf node
        if (!node.left && !node.right) {
            return currentNumber;
        }

        // Step 4: Sum paths from both subtrees
        return dfs(node.left, currentNumber) + dfs(node.right, currentNumber);
    }

    return dfs(root, 0);
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack depth

---

### Problem 23: Path Sum II (Medium)
**LeetCode Link**: [113. Path Sum II](https://leetcode.com/problems/path-sum-ii/)

**Description**: Given the root of a binary tree and an integer targetSum, return all root-to-leaf paths where the sum of node values equals targetSum.

#### Python Solution
```python
def pathSum(root: TreeNode, targetSum: int) -> list[list[int]]:
    # Step 1: Initialize result list
    result = []

    def dfs(node, current_path, current_sum):
        # Step 2: Base case - empty node
        if not node:
            return

        # Step 3: Add current node to path
        current_path.append(node.val)
        current_sum += node.val

        # Step 4: Check if leaf node with target sum
        if not node.left and not node.right:
            if current_sum == targetSum:
                # Step 5: Found valid path - save copy
                result.append(current_path[:])
        else:
            # Step 6: Explore children
            dfs(node.left, current_path, current_sum)
            dfs(node.right, current_path, current_sum)

        # Step 7: Backtrack - remove current node
        current_path.pop()

    # Step 8: Start DFS
    dfs(root, [], 0)

    return result

# Visualization:
#       5
#      / \
#     4   8
#    /   / \
#   11  13  4
#  /  \    / \
# 7    2  5   1
#
# targetSum = 22
#
# Path exploration (DFS):
# [5] → [5,4] → [5,4,11] → [5,4,11,7]
#   sum = 27 ✗
# Backtrack → [5,4,11] → [5,4,11,2]
#   sum = 22 ✓ (found!)
# Backtrack → [5,4] → [5]
# [5] → [5,8] → [5,8,13]
#   sum = 26 ✗
# Backtrack → [5,8] → [5,8,4] → [5,8,4,5]
#   sum = 22 ✓ (found!)
# [5,8,4] → [5,8,4,1]
#   sum = 18 ✗
#
# Result: [[5,4,11,2], [5,8,4,5]]
```

#### TypeScript Solution
```typescript
function pathSum(root: TreeNode | null, targetSum: number): number[][] {
    // Step 1: Initialize result
    const result: number[][] = [];

    function dfs(
        node: TreeNode | null,
        currentPath: number[],
        currentSum: number
    ): void {
        // Step 2: Base case
        if (!node) return;

        // Step 3: Add current node
        currentPath.push(node.val);
        currentSum += node.val;

        // Step 4: Check if valid path at leaf
        if (!node.left && !node.right && currentSum === targetSum) {
            result.push([...currentPath]); // Save copy
        }

        // Step 5: Explore children
        dfs(node.left, currentPath, currentSum);
        dfs(node.right, currentPath, currentSum);

        // Step 6: Backtrack
        currentPath.pop();
    }

    dfs(root, [], 0);
    return result;
}
```

**Complexity Analysis**:
- Time: O(n) - visit each node once, O(n^2) worst case for copying paths
- Space: O(h) - recursion stack and path storage

---

## Summary

Binary Tree Traversal is fundamental to solving tree problems. Key takeaways:

1. **Know your traversals**:
   - **Preorder** (Root→Left→Right): Copy tree, prefix expressions
   - **Inorder** (Left→Root→Right): BST sorted order, binary expression evaluation
   - **Postorder** (Left→Right→Root): Delete tree, postfix expressions
   - **Level-order**: Shortest path, level-by-level processing

2. **Recursive vs Iterative**:
   - Recursive: Simpler, cleaner code
   - Iterative: Explicit stack control, avoid stack overflow

3. **Common Patterns**:
   - Track previous node for comparisons
   - Use level-order for level-based problems
   - Inorder for BST problems
   - Return values up the recursion tree

4. **Space Optimization**:
   - Morris Traversal for O(1) space (threaded trees)
   - Iterative for explicit control

**Practice Strategy**:
- Master basic traversals (recursive and iterative)
- Solve problems requiring each traversal type
- Practice tree construction/serialization
- Combine traversals with other techniques (DFS/BFS)

Remember: Most tree problems are just clever applications of these basic traversals!
