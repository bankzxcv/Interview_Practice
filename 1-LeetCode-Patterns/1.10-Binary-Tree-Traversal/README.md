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
Binary Tree:
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
