# LinkedList In-place Reversal Pattern

## Pattern Overview

### What is this pattern?
The LinkedList In-place Reversal pattern involves reversing the links between nodes in a linked list without using extra space. Instead of creating a new list, we modify the `next` pointers of nodes to point in the opposite direction.

### When to use it?
- When you need to reverse a linked list (fully or partially)
- When you need to reverse nodes in k-group chunks
- When you need to swap pairs or reorder nodes
- When the problem involves reversing connections between nodes

### Time/Space Complexity Benefits
- **Time Complexity**: O(n) - we visit each node once
- **Space Complexity**: O(1) - we only use a few pointers, no recursion stack or extra data structures

### Visual Diagram

#### The Big Picture: Flipping Arrows
Imagine each arrow as a physical connection you need to flip around:

```
BEFORE REVERSAL:
┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
│ 1 │───>│ 2 │───>│ 3 │───>│ 4 │───>│ 5 │───> NULL
└───┘    └───┘    └───┘    └───┘    └───┘

AFTER REVERSAL:
         ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
NULL <───│ 1 │<───│ 2 │<───│ 3 │<───│ 4 │<───│ 5 │
         └───┘    └───┘    └───┘    └───┘    └───┘
```

#### Detailed Step-by-Step Pointer Movement

Think of three hands (pointers) walking through the list:
- **prev**: Points to the already-reversed portion
- **curr**: The node we're currently reversing
- **next**: Temporarily holds the rest of the list

```
INITIAL STATE:
prev = NULL, curr = 1, next = ?

NULL     ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
  ▲      │ 1 │───>│ 2 │───>│ 3 │───>│ 4 │───>│ 5 │───> NULL
  │      └───┘    └───┘    └───┘    └───┘    └───┘
 prev     curr

================================================================================

STEP 1: Processing node 1
┌─────────────────────────────────────────────────────────────┐
│ 1. Save next:     next = curr.next (save 2)                │
│ 2. Reverse link:  curr.next = prev (1 points to NULL)      │
│ 3. Move prev:     prev = curr (prev becomes 1)             │
│ 4. Move curr:     curr = next (curr becomes 2)             │
└─────────────────────────────────────────────────────────────┘

NULL <───┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
         │ 1 │    │ 2 │───>│ 3 │───>│ 4 │───>│ 5 │───> NULL
         └───┘    └───┘    └───┘    └───┘    └───┘
         prev     curr
      [REVERSED] [PROCESSING...]

================================================================================

STEP 2: Processing node 2
┌─────────────────────────────────────────────────────────────┐
│ 1. Save next:     next = curr.next (save 3)                │
│ 2. Reverse link:  curr.next = prev (2 points to 1)         │
│ 3. Move prev:     prev = curr (prev becomes 2)             │
│ 4. Move curr:     curr = next (curr becomes 3)             │
└─────────────────────────────────────────────────────────────┘

NULL <───┌───┐<───┌───┐    ┌───┐    ┌───┐    ┌───┐
         │ 1 │    │ 2 │    │ 3 │───>│ 4 │───>│ 5 │───> NULL
         └───┘    └───┘    └───┘    └───┘    └───┘
                  prev     curr
               [REVERSED] [PROCESSING...]

================================================================================

STEP 3: Processing node 3
┌─────────────────────────────────────────────────────────────┐
│ 1. Save next:     next = curr.next (save 4)                │
│ 2. Reverse link:  curr.next = prev (3 points to 2)         │
│ 3. Move prev:     prev = curr (prev becomes 3)             │
│ 4. Move curr:     curr = next (curr becomes 4)             │
└─────────────────────────────────────────────────────────────┘

NULL <───┌───┐<───┌───┐<───┌───┐    ┌───┐    ┌───┐
         │ 1 │    │ 2 │    │ 3 │    │ 4 │───>│ 5 │───> NULL
         └───┘    └───┘    └───┘    └───┘    └───┘
                           prev     curr
                        [REVERSED] [PROCESSING...]

================================================================================

STEP 4: Processing node 4
┌─────────────────────────────────────────────────────────────┐
│ 1. Save next:     next = curr.next (save 5)                │
│ 2. Reverse link:  curr.next = prev (4 points to 3)         │
│ 3. Move prev:     prev = curr (prev becomes 4)             │
│ 4. Move curr:     curr = next (curr becomes 5)             │
└─────────────────────────────────────────────────────────────┘

NULL <───┌───┐<───┌───┐<───┌───┐<───┌───┐    ┌───┐
         │ 1 │    │ 2 │    │ 3 │    │ 4 │    │ 5 │───> NULL
         └───┘    └───┘    └───┘    └───┘    └───┘
                                     prev     curr
                                  [REVERSED] [PROCESSING...]

================================================================================

STEP 5: Processing node 5 (Last node)
┌─────────────────────────────────────────────────────────────┐
│ 1. Save next:     next = curr.next (save NULL)             │
│ 2. Reverse link:  curr.next = prev (5 points to 4)         │
│ 3. Move prev:     prev = curr (prev becomes 5)             │
│ 4. Move curr:     curr = next (curr becomes NULL)          │
└─────────────────────────────────────────────────────────────┘

NULL <───┌───┐<───┌───┐<───┌───┐<───┌───┐<───┌───┐
         │ 1 │    │ 2 │    │ 3 │    │ 4 │    │ 5 │    NULL
         └───┘    └───┘    └───┘    └───┘    └───┘     ▲
                                              prev     curr
                                          [NEW HEAD]  [STOP!]

================================================================================

FINAL RESULT:
Return prev (which points to 5, the new head)

NEW LIST: 5 -> 4 -> 3 -> 2 -> 1 -> NULL
```

#### Memory View: What's Happening in Each Step

```
Step 0: INITIAL
┌──────┬──────┬──────┬──────┬──────┐
│  1   │  2   │  3   │  4   │  5   │
├──────┼──────┼──────┼──────┼──────┤
│ next─┼──>2  │ next─┼──>4  │ next─┼──>NULL
└──────┴──────┴──────┴──────┴──────┘
         │              │              │
         └──────────────┴──────────────┘  (Original forward links)

Step 1: After processing 1
┌──────┬──────┬──────┬──────┬──────┐
│  1   │  2   │  3   │  4   │  5   │
├──────┼──────┼──────┼──────┼──────┤
│ next─┼>NULL │ next─┼──>4  │ next─┼──>NULL
└──────┴──────┴──────┴──────┴──────┘
   ◄──────┘       │              │
  (flipped!)      └──────────────┘

Step 2: After processing 2
┌──────┬──────┬──────┬──────┬──────┐
│  1   │  2   │  3   │  4   │  5   │
├──────┼──────┼──────┼──────┼──────┤
│ next─┼>NULL │ next─┼──>2  │ next─┼──>NULL
└──────┴──────┴──────┴──────┴──────┘
   ◄──────────────┘       │              │
   (flipped!)             └──────────────┘

...and so on until all arrows are flipped!
```

#### Partial Reversal Visualization (Reverse positions 2 to 4)

```
ORIGINAL:
    1 ───> 2 ───> 3 ───> 4 ───> 5 ───> NULL

WANT TO REVERSE ONLY:  [2, 3, 4]

STEP-BY-STEP:

Step 1: Find position before reversal starts (node 1)
    ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
    │ 1 │───>│ 2 │───>│ 3 │───>│ 4 │───>│ 5 │───> NULL
    └───┘    └───┘    └───┘    └───┘    └───┘
    prev     start
             (will become tail of reversed section)

Step 2: Move node 3 to front of reversed section
    ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
    │ 1 │───>│ 3 │───>│ 2 │───>│ 4 │───>│ 5 │───> NULL
    └───┘    └───┘    └───┘    └───┘    └───┘
    prev              start

Step 3: Move node 4 to front of reversed section
    ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
    │ 1 │───>│ 4 │───>│ 3 │───>│ 2 │───>│ 5 │───> NULL
    └───┘    └───┘    └───┘    └───┘    └───┘
    prev                        start

FINAL RESULT: 1 -> 4 -> 3 -> 2 -> 5 -> NULL
```

#### The "Hand-Over-Hand" Mental Model

Think of it like flipping cards in a deck one at a time:

```
Start with deck facing right:
[1→] [2→] [3→] [4→] [5→]

Pick up card 1, flip it, put down facing left:
[←1]     [2→] [3→] [4→] [5→]

Pick up card 2, flip it, put on top of pile facing left:
[←2] [←1]     [3→] [4→] [5→]

Pick up card 3, flip it, put on pile:
[←3] [←2] [←1]     [4→] [5→]

Continue until done:
[←5] [←4] [←3] [←2] [←1]

Your "pile" (prev) is now the reversed list!
```

## Recognition Guidelines

### How to identify this pattern in interview questions?
Look for these indicators:
- Problem mentions "reverse" and "linked list"
- Need to reverse nodes in groups or pairs
- Need to reorder nodes (like odd-even positions)
- Problem asks to reverse a sublist
- Need to swap adjacent nodes

### Key Phrases/Indicators
- "Reverse a linked list"
- "Reverse nodes in k-group"
- "Swap every two adjacent nodes"
- "Reverse nodes from position m to n"
- "Reorder list"
- "Palindrome linked list" (often requires reversal)

## Template/Pseudocode

### Basic Reversal Template
```python
def reverse_list(head):
    prev = None
    current = head

    while current:
        # Step 1: Save next node before breaking the link
        next_node = current.next

        # Step 2: Reverse the pointer
        current.next = prev

        # Step 3: Move prev and current forward
        prev = current
        current = next_node

    # prev is now the new head
    return prev
```

### Partial Reversal Template (positions m to n)
```python
def reverse_between(head, m, n):
    if not head or m == n:
        return head

    # Step 1: Find the node before position m
    dummy = ListNode(0)
    dummy.next = head
    prev = dummy

    for _ in range(m - 1):
        prev = prev.next

    # Step 2: Reverse n - m + 1 nodes
    reverse_start = prev.next
    current = reverse_start.next

    for _ in range(n - m):
        reverse_start.next = current.next
        current.next = prev.next
        prev.next = current
        current = reverse_start.next

    return dummy.next
```

## Problems

### Problem 1: Reverse Linked List (Easy)
**LeetCode Link**: [206. Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/)

**Problem Description**:
Given the head of a singly linked list, reverse the list, and return the reversed list.

**Example**:
```
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
```

**Python Solution**:
```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head: ListNode) -> ListNode:
    # Step 1: Initialize prev as None (new tail will point to None)
    prev = None

    # Step 2: Start with current at head
    current = head

    # Step 3: Traverse through the list
    while current:
        # Step 3a: Save the next node before we break the link
        next_node = current.next

        # Step 3b: Reverse the link - make current point to prev
        current.next = prev

        # Step 3c: Move prev forward to current node
        prev = current

        # Step 3d: Move current forward to next node
        current = next_node

    # Step 4: prev is now the new head (last node processed)
    return prev
```

**TypeScript Solution**:
```typescript
class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }
}

function reverseList(head: ListNode | null): ListNode | null {
    // Step 1: Initialize prev as null (new tail will point to null)
    let prev: ListNode | null = null;

    // Step 2: Start with current at head
    let current: ListNode | null = head;

    // Step 3: Traverse through the list
    while (current !== null) {
        // Step 3a: Save the next node before we break the link
        const nextNode: ListNode | null = current.next;

        // Step 3b: Reverse the link - make current point to prev
        current.next = prev;

        // Step 3c: Move prev forward to current node
        prev = current;

        // Step 3d: Move current forward to next node
        current = nextNode;
    }

    // Step 4: prev is now the new head (last node processed)
    return prev;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we visit each node exactly once
- Space Complexity: O(1) - we only use three pointers

---

### Problem 2: Reverse Linked List II (Medium)
**LeetCode Link**: [92. Reverse Linked List II](https://leetcode.com/problems/reverse-linked-list-ii/)

**Problem Description**:
Given the head of a singly linked list and two integers left and right where left <= right, reverse the nodes of the list from position left to position right, and return the reversed list.

**Example**:
```
Input: head = [1,2,3,4,5], left = 2, right = 4
Output: [1,4,3,2,5]
```

**Python Solution**:
```python
def reverseBetween(head: ListNode, left: int, right: int) -> ListNode:
    # Step 1: Handle edge case
    if not head or left == right:
        return head

    # Step 2: Create dummy node to handle edge case where left = 1
    dummy = ListNode(0)
    dummy.next = head

    # Step 3: Find the node just before position 'left'
    prev = dummy
    for _ in range(left - 1):
        prev = prev.next

    # Step 4: Start reversing from position 'left'
    # 'reverse_start' will be the first node in the reversed section
    reverse_start = prev.next
    # 'current' is the node we're currently processing
    current = reverse_start.next

    # Step 5: Reverse nodes from left to right
    # We need to reverse (right - left) links
    for _ in range(right - left):
        # Save what reverse_start points to
        reverse_start.next = current.next
        # Move current to the front of reversed section
        current.next = prev.next
        # Update the connection from prev
        prev.next = current
        # Move to next node to reverse
        current = reverse_start.next

    # Step 6: Return the new head
    return dummy.next
```

**TypeScript Solution**:
```typescript
function reverseBetween(head: ListNode | null, left: number, right: number): ListNode | null {
    // Step 1: Handle edge case
    if (!head || left === right) {
        return head;
    }

    // Step 2: Create dummy node to handle edge case where left = 1
    const dummy = new ListNode(0);
    dummy.next = head;

    // Step 3: Find the node just before position 'left'
    let prev: ListNode = dummy;
    for (let i = 0; i < left - 1; i++) {
        prev = prev.next!;
    }

    // Step 4: Start reversing from position 'left'
    // 'reverseStart' will be the first node in the reversed section
    const reverseStart: ListNode = prev.next!;
    // 'current' is the node we're currently processing
    let current: ListNode | null = reverseStart.next;

    // Step 5: Reverse nodes from left to right
    // We need to reverse (right - left) links
    for (let i = 0; i < right - left; i++) {
        // Save what reverseStart points to
        reverseStart.next = current!.next;
        // Move current to the front of reversed section
        current!.next = prev.next;
        // Update the connection from prev
        prev.next = current;
        // Move to next node to reverse
        current = reverseStart.next;
    }

    // Step 6: Return the new head
    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we traverse to position left, then reverse (right - left) nodes
- Space Complexity: O(1) - only using pointers

---

### Problem 3: Reverse Nodes in k-Group (Hard)
**LeetCode Link**: [25. Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/)

**Problem Description**:
Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list. If the number of nodes is not a multiple of k, left-out nodes should remain as is.

**Example**:
```
Input: head = [1,2,3,4,5], k = 2
Output: [2,1,4,3,5]

Input: head = [1,2,3,4,5], k = 3
Output: [3,2,1,4,5]
```

**Python Solution**:
```python
def reverseKGroup(head: ListNode, k: int) -> ListNode:
    # Step 1: Check if we have at least k nodes remaining
    def has_k_nodes(node, k):
        count = 0
        while node and count < k:
            node = node.next
            count += 1
        return count == k

    # Step 2: Create dummy node for easier handling
    dummy = ListNode(0)
    dummy.next = head
    prev_group = dummy

    # Step 3: Process the list in groups of k
    while has_k_nodes(prev_group.next, k):
        # Step 3a: Save the first node of current group
        current = prev_group.next
        next_node = current.next

        # Step 3b: Reverse k nodes
        for _ in range(k - 1):
            # Save the next node
            current.next = next_node.next
            # Move next_node to the front of the group
            next_node.next = prev_group.next
            # Update the connection from previous group
            prev_group.next = next_node
            # Move to the next node to reverse
            next_node = current.next

        # Step 3c: Move prev_group to the end of reversed group
        # (current is now at the end of this group)
        prev_group = current

    # Step 4: Return the new head
    return dummy.next
```

**TypeScript Solution**:
```typescript
function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
    // Step 1: Check if we have at least k nodes remaining
    function hasKNodes(node: ListNode | null, k: number): boolean {
        let count = 0;
        while (node && count < k) {
            node = node.next;
            count++;
        }
        return count === k;
    }

    // Step 2: Create dummy node for easier handling
    const dummy = new ListNode(0);
    dummy.next = head;
    let prevGroup: ListNode = dummy;

    // Step 3: Process the list in groups of k
    while (hasKNodes(prevGroup.next, k)) {
        // Step 3a: Save the first node of current group
        let current: ListNode = prevGroup.next!;
        let nextNode: ListNode | null = current.next;

        // Step 3b: Reverse k nodes
        for (let i = 0; i < k - 1; i++) {
            // Save the next node
            current.next = nextNode!.next;
            // Move nextNode to the front of the group
            nextNode!.next = prevGroup.next;
            // Update the connection from previous group
            prevGroup.next = nextNode;
            // Move to the next node to reverse
            nextNode = current.next;
        }

        // Step 3c: Move prevGroup to the end of reversed group
        // (current is now at the end of this group)
        prevGroup = current;
    }

    // Step 4: Return the new head
    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we visit each node once
- Space Complexity: O(1) - only using pointers

---

### Problem 4: Swap Nodes in Pairs (Medium)
**LeetCode Link**: [24. Swap Nodes in Pairs](https://leetcode.com/problems/swap-nodes-in-pairs/)

**Problem Description**:
Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed).

**Example**:
```
Input: head = [1,2,3,4]
Output: [2,1,4,3]
```

**Python Solution**:
```python
def swapPairs(head: ListNode) -> ListNode:
    # Step 1: Create dummy node to simplify edge cases
    dummy = ListNode(0)
    dummy.next = head
    prev = dummy

    # Step 2: Process pairs while we have at least 2 nodes
    while prev.next and prev.next.next:
        # Step 2a: Identify the two nodes to swap
        first = prev.next
        second = prev.next.next

        # Step 2b: Perform the swap
        # Connect prev to second (which will be first after swap)
        prev.next = second
        # Connect first to what comes after second
        first.next = second.next
        # Connect second back to first
        second.next = first

        # Step 2c: Move prev to the node that's now second (was first)
        prev = first

    # Step 3: Return the new head
    return dummy.next
```

**TypeScript Solution**:
```typescript
function swapPairs(head: ListNode | null): ListNode | null {
    // Step 1: Create dummy node to simplify edge cases
    const dummy = new ListNode(0);
    dummy.next = head;
    let prev: ListNode = dummy;

    // Step 2: Process pairs while we have at least 2 nodes
    while (prev.next && prev.next.next) {
        // Step 2a: Identify the two nodes to swap
        const first: ListNode = prev.next;
        const second: ListNode = prev.next.next;

        // Step 2b: Perform the swap
        // Connect prev to second (which will be first after swap)
        prev.next = second;
        // Connect first to what comes after second
        first.next = second.next;
        // Connect second back to first
        second.next = first;

        // Step 2c: Move prev to the node that's now second (was first)
        prev = first;
    }

    // Step 3: Return the new head
    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we visit each node once
- Space Complexity: O(1) - only using pointers

---

### Problem 5: Palindrome Linked List (Easy)
**LeetCode Link**: [234. Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/)

**Problem Description**:
Given the head of a singly linked list, return true if it is a palindrome or false otherwise.

**Example**:
```
Input: head = [1,2,2,1]
Output: true

Input: head = [1,2]
Output: false
```

**Python Solution**:
```python
def isPalindrome(head: ListNode) -> bool:
    # Step 1: Find the middle of the linked list using slow/fast pointers
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # Step 2: Reverse the second half of the list
    # slow is now at the middle (or start of second half)
    prev = None
    while slow:
        next_node = slow.next
        slow.next = prev
        prev = slow
        slow = next_node

    # Step 3: Compare first half with reversed second half
    # prev now points to the head of reversed second half
    left = head
    right = prev

    while right:  # right half might be shorter
        # If values don't match, it's not a palindrome
        if left.val != right.val:
            return False
        left = left.next
        right = right.next

    # Step 4: All values matched, it's a palindrome
    return True
```

**TypeScript Solution**:
```typescript
function isPalindrome(head: ListNode | null): boolean {
    // Step 1: Find the middle of the linked list using slow/fast pointers
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;

    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;
    }

    // Step 2: Reverse the second half of the list
    // slow is now at the middle (or start of second half)
    let prev: ListNode | null = null;
    while (slow) {
        const nextNode: ListNode | null = slow.next;
        slow.next = prev;
        prev = slow;
        slow = nextNode;
    }

    // Step 3: Compare first half with reversed second half
    // prev now points to the head of reversed second half
    let left: ListNode | null = head;
    let right: ListNode | null = prev;

    while (right) {  // right half might be shorter
        // If values don't match, it's not a palindrome
        if (left!.val !== right.val) {
            return false;
        }
        left = left!.next;
        right = right.next;
    }

    // Step 4: All values matched, it's a palindrome
    return true;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - finding middle O(n/2) + reversing O(n/2) + comparing O(n/2) = O(n)
- Space Complexity: O(1) - only using pointers

---

### Problem 6: Reorder List (Medium)
**LeetCode Link**: [143. Reorder List](https://leetcode.com/problems/reorder-list/)

**Problem Description**:
You are given the head of a singly linked-list. Reorder the list to be: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → ...

**Example**:
```
Input: head = [1,2,3,4,5]
Output: [1,5,2,4,3]
```

**Python Solution**:
```python
def reorderList(head: ListNode) -> None:
    """
    Do not return anything, modify head in-place instead.
    """
    # Step 1: Find the middle of the list
    slow = fast = head
    while fast.next and fast.next.next:
        slow = slow.next
        fast = fast.next.next

    # Step 2: Reverse the second half
    # Split the list into two halves
    second = slow.next
    slow.next = None  # End first half

    # Reverse second half
    prev = None
    while second:
        next_node = second.next
        second.next = prev
        prev = second
        second = next_node

    # Step 3: Merge the two halves alternately
    # prev is the head of reversed second half
    first = head
    second = prev

    while second:
        # Save next pointers
        first_next = first.next
        second_next = second.next

        # Connect first to second
        first.next = second
        # Connect second to first's next
        second.next = first_next

        # Move pointers forward
        first = first_next
        second = second_next
```

**TypeScript Solution**:
```typescript
function reorderList(head: ListNode | null): void {
    // Step 1: Find the middle of the list
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;

    while (fast!.next && fast!.next.next) {
        slow = slow!.next;
        fast = fast!.next.next;
    }

    // Step 2: Reverse the second half
    // Split the list into two halves
    let second: ListNode | null = slow!.next;
    slow!.next = null;  // End first half

    // Reverse second half
    let prev: ListNode | null = null;
    while (second) {
        const nextNode: ListNode | null = second.next;
        second.next = prev;
        prev = second;
        second = nextNode;
    }

    // Step 3: Merge the two halves alternately
    // prev is the head of reversed second half
    let first: ListNode | null = head;
    second = prev;

    while (second) {
        // Save next pointers
        const firstNext: ListNode | null = first!.next;
        const secondNext: ListNode | null = second.next;

        // Connect first to second
        first!.next = second;
        // Connect second to first's next
        second.next = firstNext;

        // Move pointers forward
        first = firstNext;
        second = secondNext;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - find middle O(n/2) + reverse O(n/2) + merge O(n/2) = O(n)
- Space Complexity: O(1) - only using pointers

---

### Problem 7: Add Two Numbers II (Medium)
**LeetCode Link**: [445. Add Two Numbers II](https://leetcode.com/problems/add-two-numbers-ii/)

**Problem Description**:
You are given two non-empty linked lists representing two non-negative integers. The most significant digit comes first and each node contains a single digit. Add the two numbers and return the sum as a linked list.

**Example**:
```
Input: l1 = [7,2,4,3], l2 = [5,6,4]
Output: [7,8,0,7]
Explanation: 7243 + 564 = 7807
```

**Python Solution**:
```python
def addTwoNumbers(l1: ListNode, l2: ListNode) -> ListNode:
    # Step 1: Reverse both input lists to process from least significant digit
    def reverse_list(head):
        prev = None
        current = head
        while current:
            next_node = current.next
            current.next = prev
            prev = current
            current = next_node
        return prev

    l1 = reverse_list(l1)
    l2 = reverse_list(l2)

    # Step 2: Add the two reversed lists
    carry = 0
    dummy = ListNode(0)
    current = dummy

    while l1 or l2 or carry:
        # Get values from both lists (or 0 if list is exhausted)
        val1 = l1.val if l1 else 0
        val2 = l2.val if l2 else 0

        # Calculate sum and carry
        total = val1 + val2 + carry
        carry = total // 10
        digit = total % 10

        # Create new node with the digit
        current.next = ListNode(digit)
        current = current.next

        # Move to next nodes
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None

    # Step 3: Reverse the result to get most significant digit first
    return reverse_list(dummy.next)
```

**TypeScript Solution**:
```typescript
function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
    // Step 1: Reverse both input lists to process from least significant digit
    function reverseList(head: ListNode | null): ListNode | null {
        let prev: ListNode | null = null;
        let current: ListNode | null = head;
        while (current) {
            const nextNode: ListNode | null = current.next;
            current.next = prev;
            prev = current;
            current = nextNode;
        }
        return prev;
    }

    l1 = reverseList(l1);
    l2 = reverseList(l2);

    // Step 2: Add the two reversed lists
    let carry = 0;
    const dummy = new ListNode(0);
    let current: ListNode = dummy;

    while (l1 || l2 || carry) {
        // Get values from both lists (or 0 if list is exhausted)
        const val1 = l1 ? l1.val : 0;
        const val2 = l2 ? l2.val : 0;

        // Calculate sum and carry
        const total = val1 + val2 + carry;
        carry = Math.floor(total / 10);
        const digit = total % 10;

        // Create new node with the digit
        current.next = new ListNode(digit);
        current = current.next;

        // Move to next nodes
        l1 = l1 ? l1.next : null;
        l2 = l2 ? l2.next : null;
    }

    // Step 3: Reverse the result to get most significant digit first
    return reverseList(dummy.next);
}
```

**Complexity Analysis**:
- Time Complexity: O(max(m, n)) - where m and n are lengths of the two lists
- Space Complexity: O(1) - only using pointers (excluding output)

---

### Problem 8: Reverse Nodes in Even Length Groups (Medium)
**LeetCode Link**: [2074. Reverse Nodes in Even Length Groups](https://leetcode.com/problems/reverse-nodes-in-even-length-groups/)

**Problem Description**:
You are given the head of a linked list. The nodes in the linked list are sequentially assigned to non-empty groups whose lengths form the sequence of natural numbers (1, 2, 3, 4, ...). Reverse the nodes in each group with an even length.

**Example**:
```
Input: head = [5,2,6,3,9,1,7,3,8,4]
Output: [5,6,2,3,9,1,4,8,3,7]
Explanation: Groups: [5], [2,6], [3,9,1], [7,3,8,4]
Reverse even-length groups: [5], [6,2], [3,9,1], [4,8,3,7]
```

**Python Solution**:
```python
def reverseEvenLengthGroups(head: ListNode) -> ListNode:
    # Step 1: Helper function to get group length
    def get_group_length(node, expected_len):
        """Count actual nodes in group (might be less than expected)"""
        count = 0
        while node and count < expected_len:
            count += 1
            node = node.next
        return count

    # Step 2: Helper function to reverse a group
    def reverse_group(prev, count):
        """Reverse 'count' nodes after 'prev'"""
        if count <= 1:
            return

        current = prev.next
        next_node = current.next

        for _ in range(count - 1):
            current.next = next_node.next
            next_node.next = prev.next
            prev.next = next_node
            next_node = current.next

    # Step 3: Create dummy node for easier handling
    dummy = ListNode(0)
    dummy.next = head
    prev = dummy
    group_size = 1

    # Step 4: Process each group
    while prev.next:
        # Get actual length of current group
        actual_length = get_group_length(prev.next, group_size)

        # Reverse if group has even length
        if actual_length % 2 == 0:
            reverse_group(prev, actual_length)

        # Move prev to end of current group
        for _ in range(actual_length):
            prev = prev.next

        # Next group will be larger
        group_size += 1

    return dummy.next
```

**TypeScript Solution**:
```typescript
function reverseEvenLengthGroups(head: ListNode | null): ListNode | null {
    // Step 1: Helper function to get group length
    function getGroupLength(node: ListNode | null, expectedLen: number): number {
        let count = 0;
        while (node && count < expectedLen) {
            count++;
            node = node.next;
        }
        return count;
    }

    // Step 2: Helper function to reverse a group
    function reverseGroup(prev: ListNode, count: number): void {
        if (count <= 1) {
            return;
        }

        let current: ListNode = prev.next!;
        let nextNode: ListNode | null = current.next;

        for (let i = 0; i < count - 1; i++) {
            current.next = nextNode!.next;
            nextNode!.next = prev.next;
            prev.next = nextNode;
            nextNode = current.next;
        }
    }

    // Step 3: Create dummy node for easier handling
    const dummy = new ListNode(0);
    dummy.next = head;
    let prev: ListNode = dummy;
    let groupSize = 1;

    // Step 4: Process each group
    while (prev.next) {
        // Get actual length of current group
        const actualLength = getGroupLength(prev.next, groupSize);

        // Reverse if group has even length
        if (actualLength % 2 === 0) {
            reverseGroup(prev, actualLength);
        }

        // Move prev to end of current group
        for (let i = 0; i < actualLength; i++) {
            prev = prev.next!;
        }

        // Next group will be larger
        groupSize++;
    }

    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we visit each node a constant number of times
- Space Complexity: O(1) - only using pointers

---

### Problem 9: Rotate List (Medium)
**LeetCode Link**: [61. Rotate List](https://leetcode.com/problems/rotate-list/)

**Problem Description**:
Given the head of a linked list, rotate the list to the right by k places.

**Example**:
```
Input: head = [1,2,3,4,5], k = 2
Output: [4,5,1,2,3]
```

**Python Solution**:
```python
def rotateRight(head: ListNode, k: int) -> ListNode:
    # Step 1: Handle edge cases
    if not head or not head.next or k == 0:
        return head

    # Step 2: Find the length and make it circular
    length = 1
    tail = head
    while tail.next:
        tail = tail.next
        length += 1

    # Connect tail to head to make it circular
    tail.next = head

    # Step 3: Find the new tail and new head
    # k might be larger than length, so use modulo
    k = k % length
    # We need to move (length - k) steps to find new tail
    steps_to_new_tail = length - k

    new_tail = head
    for _ in range(steps_to_new_tail - 1):
        new_tail = new_tail.next

    # Step 4: Break the circle and return new head
    new_head = new_tail.next
    new_tail.next = None

    return new_head
```

**TypeScript Solution**:
```typescript
function rotateRight(head: ListNode | null, k: number): ListNode | null {
    // Step 1: Handle edge cases
    if (!head || !head.next || k === 0) {
        return head;
    }

    // Step 2: Find the length and make it circular
    let length = 1;
    let tail: ListNode = head;
    while (tail.next) {
        tail = tail.next;
        length++;
    }

    // Connect tail to head to make it circular
    tail.next = head;

    // Step 3: Find the new tail and new head
    // k might be larger than length, so use modulo
    k = k % length;
    // We need to move (length - k) steps to find new tail
    const stepsToNewTail = length - k;

    let newTail: ListNode = head;
    for (let i = 0; i < stepsToNewTail - 1; i++) {
        newTail = newTail.next!;
    }

    // Step 4: Break the circle and return new head
    const newHead: ListNode | null = newTail.next;
    newTail.next = null;

    return newHead;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we traverse the list twice at most
- Space Complexity: O(1) - only using pointers

---

### Problem 10: Swapping Nodes in a Linked List (Medium)
**LeetCode Link**: [1721. Swapping Nodes in a Linked List](https://leetcode.com/problems/swapping-nodes-in-a-linked-list/)

**Problem Description**:
You are given the head of a linked list, and an integer k. Return the head of the linked list after swapping the values of the kth node from the beginning and the kth node from the end.

**Example**:
```
Input: head = [1,2,3,4,5], k = 2
Output: [1,4,3,2,5]
```

**Python Solution**:
```python
def swapNodes(head: ListNode, k: int) -> ListNode:
    # Step 1: Find the kth node from the beginning
    first = head
    for _ in range(k - 1):
        first = first.next

    # Step 2: Find the kth node from the end
    # Use two pointers with k gap between them
    second = head
    current = first

    # Move current to the end, maintaining k gap with second
    while current.next:
        current = current.next
        second = second.next

    # Step 3: Swap the values (not the nodes themselves)
    first.val, second.val = second.val, first.val

    # Step 4: Return the head (unchanged)
    return head
```

**TypeScript Solution**:
```typescript
function swapNodes(head: ListNode | null, k: number): ListNode | null {
    // Step 1: Find the kth node from the beginning
    let first: ListNode = head!;
    for (let i = 0; i < k - 1; i++) {
        first = first.next!;
    }

    // Step 2: Find the kth node from the end
    // Use two pointers with k gap between them
    let second: ListNode = head!;
    let current: ListNode = first;

    // Move current to the end, maintaining k gap with second
    while (current.next) {
        current = current.next;
        second = second.next!;
    }

    // Step 3: Swap the values (not the nodes themselves)
    [first.val, second.val] = [second.val, first.val];

    // Step 4: Return the head (unchanged)
    return head;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the list
- Space Complexity: O(1) - only using pointers

---

### Problem 11: Odd Even Linked List (Medium)
**LeetCode Link**: [328. Odd Even Linked List](https://leetcode.com/problems/odd-even-linked-list/)

**Problem Description**:
Given the head of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return the reordered list.

**Example**:
```
Input: head = [1,2,3,4,5]
Output: [1,3,5,2,4]
```

**Python Solution**:
```python
def oddEvenList(head: ListNode) -> ListNode:
    # Step 1: Handle edge cases
    if not head or not head.next:
        return head

    # Step 2: Initialize pointers for odd and even lists
    odd = head  # First node (index 1) is odd
    even = head.next  # Second node (index 2) is even
    even_head = even  # Save head of even list to connect later

    # Step 3: Separate odd and even nodes
    while even and even.next:
        # Connect current odd to next odd (skip one node)
        odd.next = even.next
        odd = odd.next

        # Connect current even to next even (skip one node)
        even.next = odd.next
        even = even.next

    # Step 4: Connect end of odd list to head of even list
    odd.next = even_head

    return head
```

**TypeScript Solution**:
```typescript
function oddEvenList(head: ListNode | null): ListNode | null {
    // Step 1: Handle edge cases
    if (!head || !head.next) {
        return head;
    }

    // Step 2: Initialize pointers for odd and even lists
    let odd: ListNode = head;  // First node (index 1) is odd
    let even: ListNode = head.next;  // Second node (index 2) is even
    const evenHead: ListNode = even;  // Save head of even list to connect later

    // Step 3: Separate odd and even nodes
    while (even && even.next) {
        // Connect current odd to next odd (skip one node)
        odd.next = even.next;
        odd = odd.next;

        // Connect current even to next even (skip one node)
        even.next = odd.next;
        even = even.next!;
    }

    // Step 4: Connect end of odd list to head of even list
    odd.next = evenHead;

    return head;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the list
- Space Complexity: O(1) - only rearranging pointers

---

### Problem 12: Reverse Alternate K Nodes (Medium)
**LeetCode Link**: Not a standard LeetCode problem, but similar to [25. Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/)

**Problem Description**:
Given a linked list and a number k, reverse every alternate k nodes. If k is greater than the size of the linked list, reverse the entire linked list.

**Example**:
```
Input: 1->2->3->4->5->6->7->8->9, k = 3
Output: 3->2->1->4->5->6->9->8->7
(Reverse first 3, keep next 3, reverse next 3)
```

**Python Solution**:
```python
def reverseAlternateKNodes(head: ListNode, k: int) -> ListNode:
    # Step 1: Check if we have k nodes to reverse
    def has_k_nodes(node, k):
        count = 0
        while node and count < k:
            node = node.next
            count += 1
        return count == k

    # Step 2: Create dummy for easier handling
    dummy = ListNode(0)
    dummy.next = head
    prev_group = dummy
    should_reverse = True  # Track whether to reverse this group

    # Step 3: Process groups of k nodes
    while True:
        # Check if we have k nodes remaining
        if not has_k_nodes(prev_group.next, k):
            break

        if should_reverse:
            # Reverse this group
            current = prev_group.next
            next_node = current.next

            for _ in range(k - 1):
                current.next = next_node.next
                next_node.next = prev_group.next
                prev_group.next = next_node
                next_node = current.next

            prev_group = current
        else:
            # Skip this group (don't reverse)
            for _ in range(k):
                prev_group = prev_group.next

        # Toggle reversal for next group
        should_reverse = not should_reverse

    return dummy.next
```

**TypeScript Solution**:
```typescript
function reverseAlternateKNodes(head: ListNode | null, k: number): ListNode | null {
    // Step 1: Check if we have k nodes to reverse
    function hasKNodes(node: ListNode | null, k: number): boolean {
        let count = 0;
        while (node && count < k) {
            node = node.next;
            count++;
        }
        return count === k;
    }

    // Step 2: Create dummy for easier handling
    const dummy = new ListNode(0);
    dummy.next = head;
    let prevGroup: ListNode = dummy;
    let shouldReverse = true;  // Track whether to reverse this group

    // Step 3: Process groups of k nodes
    while (true) {
        // Check if we have k nodes remaining
        if (!hasKNodes(prevGroup.next, k)) {
            break;
        }

        if (shouldReverse) {
            // Reverse this group
            let current: ListNode = prevGroup.next!;
            let nextNode: ListNode | null = current.next;

            for (let i = 0; i < k - 1; i++) {
                current.next = nextNode!.next;
                nextNode!.next = prevGroup.next;
                prevGroup.next = nextNode;
                nextNode = current.next;
            }

            prevGroup = current;
        } else {
            // Skip this group (don't reverse)
            for (let i = 0; i < k; i++) {
                prevGroup = prevGroup.next!;
            }
        }

        // Toggle reversal for next group
        shouldReverse = !shouldReverse;
    }

    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we visit each node once
- Space Complexity: O(1) - only using pointers

---

### Problem 13: Reverse Linked List (Recursive Approach) (Easy)
**LeetCode Link**: [206. Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/)

**Problem Description**:
Reverse a singly linked list using recursion instead of iteration.

**Example**:
```
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
```

**Visualization**:
```
Recursion unwinding - think of it as going to the end, then reversing on the way back:

Call Stack (going down):
reverse(1→2→3→4→5)
  reverse(2→3→4→5)
    reverse(3→4→5)
      reverse(4→5)
        reverse(5)  ← Base case! Return 5

Unwinding (coming back up):
        5 (return this as new head)
      4→5: Flip to 5→4→null
    3→4→5: Flip to 5→4→3→null
  2→3→4→5: Flip to 5→4→3→2→null
1→2→3→4→5: Flip to 5→4→3→2→1→null

At each level, we:
1. Recursively reverse the rest
2. Make next.next point back to current
3. Set current.next to null (to avoid cycles)
```

**Python Solution**:
```python
def reverseList(head: ListNode) -> ListNode:
    """
    Recursive approach to reverse a linked list.

    Visualization of recursive calls for [1,2,3]:

    reverseList(1)
      ├─> reverseList(2)
      │     ├─> reverseList(3)
      │     │     └─> reverseList(None) = None (base case)
      │     │     3.next.next = 3  ← Can't do, None has no next
      │     │     Actually: 3 is last, return 3
      │     2.next.next = 2  → Makes 3 point back to 2
      │     2.next = None    → Break original link
      │     Return 3 (new head)
      1.next.next = 1  → Makes 2 point back to 1
      1.next = None    → Break original link
      Return 3 (new head)
    """
    # Step 1: Base case - empty list or single node
    if not head or not head.next:
        return head

    # Step 2: Recursively reverse the rest of the list
    # After this call, 'new_head' points to the new head (last node)
    # and the rest of the list is already reversed
    new_head = reverseList(head.next)

    # Step 3: Reverse the current connection
    # head.next currently points to the first node of reversed list
    # Make that node point back to head
    head.next.next = head

    # Step 4: Set current node's next to None (will be updated by caller
    # or will remain None if this is the new tail)
    head.next = None

    # Step 5: Return the new head (propagate up the recursion)
    return new_head

# Example walkthrough for [1,2,3]:
# reverseList(1): new_head = reverseList(2)
#                 2.next = 1, 1.next = None
#                 return 3
# reverseList(2): new_head = reverseList(3)
#                 3.next = 2, 2.next = None
#                 return 3
# reverseList(3): return 3 (base case)
```

**TypeScript Solution**:
```typescript
function reverseList(head: ListNode | null): ListNode | null {
    // Step 1: Base case - empty list or single node
    if (!head || !head.next) {
        return head;
    }

    // Step 2: Recursively reverse the rest of the list
    // After this call, 'newHead' points to the new head (last node)
    // and the rest of the list is already reversed
    const newHead: ListNode | null = reverseList(head.next);

    // Step 3: Reverse the current connection
    // head.next currently points to the first node of reversed list
    // Make that node point back to head
    head.next!.next = head;

    // Step 4: Set current node's next to null (will be updated by caller
    // or will remain null if this is the new tail)
    head.next = null;

    // Step 5: Return the new head (propagate up the recursion)
    return newHead;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we visit each node once through recursion
- Space Complexity: O(n) - recursion call stack requires O(n) space (this is worse than iterative O(1))

---

### Problem 14: Partition List (Medium)
**LeetCode Link**: [86. Partition List](https://leetcode.com/problems/partition-list/)

**Problem Description**:
Given the head of a linked list and a value x, partition it such that all nodes less than x come before nodes greater than or equal to x. Preserve the original relative order of nodes in each partition.

**Example**:
```
Input: head = [1,4,3,2,5,2], x = 3
Output: [1,2,2,4,3,5]
```

**Visualization**:
```
Original: 1 → 4 → 3 → 2 → 5 → 2 → NULL, x = 3

Split into two lists:
Less than 3:     1 → 2 → 2 → NULL
Greater/Equal 3: 4 → 3 → 5 → NULL

Combine them:    1 → 2 → 2 → 4 → 3 → 5 → NULL
                 └─────────┘ └─────────┘
                  (less <3)   (>= 3)
```

**Python Solution**:
```python
def partition(head: ListNode, x: int) -> ListNode:
    """
    Strategy: Create two separate lists, then connect them.

    Visualization for [1,4,3,2,5,2], x=3:

    Start:
    less_dummy → NULL    greater_dummy → NULL
    less ↑               greater ↑

    Process 1 (< 3):
    less_dummy → 1 → NULL    greater_dummy → NULL
                 less ↑                      greater ↑

    Process 4 (>= 3):
    less_dummy → 1 → NULL    greater_dummy → 4 → NULL
                 less ↑                           greater ↑

    Process 3 (>= 3):
    less_dummy → 1 → NULL    greater_dummy → 4 → 3 → NULL
                 less ↑                                greater ↑

    Process 2 (< 3):
    less_dummy → 1 → 2 → NULL    greater_dummy → 4 → 3 → NULL
                      less ↑                                greater ↑

    ... continue for all nodes, then connect less to greater
    """
    # Step 1: Create dummy nodes for two partitions
    less_dummy = ListNode(0)  # Dummy for nodes < x
    greater_dummy = ListNode(0)  # Dummy for nodes >= x

    # Step 2: Initialize pointers to build both lists
    less = less_dummy
    greater = greater_dummy

    # Step 3: Traverse original list and partition nodes
    current = head
    while current:
        if current.val < x:
            # Add to 'less' list
            less.next = current
            less = less.next
        else:
            # Add to 'greater' list
            greater.next = current
            greater = greater.next

        current = current.next

    # Step 4: Important - terminate the greater list
    # (prevents cycles if last node was moved to less list)
    greater.next = None

    # Step 5: Connect the two lists
    less.next = greater_dummy.next

    # Step 6: Return the head of combined list
    return less_dummy.next
```

**TypeScript Solution**:
```typescript
function partition(head: ListNode | null, x: number): ListNode | null {
    // Step 1: Create dummy nodes for two partitions
    const lessDummy = new ListNode(0);  // Dummy for nodes < x
    const greaterDummy = new ListNode(0);  // Dummy for nodes >= x

    // Step 2: Initialize pointers to build both lists
    let less: ListNode = lessDummy;
    let greater: ListNode = greaterDummy;

    // Step 3: Traverse original list and partition nodes
    let current: ListNode | null = head;
    while (current) {
        if (current.val < x) {
            // Add to 'less' list
            less.next = current;
            less = less.next;
        } else {
            // Add to 'greater' list
            greater.next = current;
            greater = greater.next;
        }

        current = current.next;
    }

    // Step 4: Important - terminate the greater list
    // (prevents cycles if last node was moved to less list)
    greater.next = null;

    // Step 5: Connect the two lists
    less.next = greaterDummy.next;

    // Step 6: Return the head of combined list
    return lessDummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the list
- Space Complexity: O(1) - only rearranging pointers, not creating new nodes

---

### Problem 15: Maximum Twin Sum of a Linked List (Medium)
**LeetCode Link**: [2130. Maximum Twin Sum of a Linked List](https://leetcode.com/problems/maximum-twin-sum-of-a-linked-list/)

**Problem Description**:
In a linked list of size n (even), the ith node (0-indexed) and the (n-1-i)th node are twins. Return the maximum twin sum.

**Example**:
```
Input: head = [5,4,2,1]
Output: 6
Explanation:
Twins: (0,3) sum = 5+1=6, (1,2) sum = 4+2=6
Maximum = 6
```

**Visualization**:
```
List: 5 → 4 → 2 → 1 → NULL
      ↑       ↑   ↑       ↑
      0       1   2       3
      └───────────┘       (twin sum = 5+1 = 6)
              └───────┘   (twin sum = 4+2 = 6)

Strategy:
1. Find middle: slow/fast pointers
2. Reverse second half
3. Compare first half with reversed second half

Step 1: Find middle
5 → 4 → 2 → 1 → NULL
    ↑
    middle

Step 2: Reverse second half
5 → 4    NULL ← 2 ← 1
first           second (reversed)

Step 3: Calculate twin sums
Compare pairs: (5,1), (4,2)
```

**Python Solution**:
```python
def pairSum(head: ListNode) -> int:
    """
    Use slow/fast pointers to find middle, reverse second half,
    then compare pairs from both halves.

    Example: [5,4,2,1]
    1. Find middle: slow at 2
    2. Reverse [2,1] to get [1,2]
    3. Compare: 5+1=6, 4+2=6, max=6
    """
    # Step 1: Find the middle of the list using slow/fast pointers
    slow = fast = head

    # After this loop, slow will be at the start of second half
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # Step 2: Reverse the second half of the list
    prev = None
    while slow:
        next_node = slow.next
        slow.next = prev
        prev = slow
        slow = next_node

    # Step 3: Calculate maximum twin sum
    # prev now points to the head of reversed second half
    # head points to the start of first half
    max_sum = 0
    first_half = head
    second_half = prev

    while second_half:  # Traverse both halves simultaneously
        # Calculate twin sum
        twin_sum = first_half.val + second_half.val
        max_sum = max(max_sum, twin_sum)

        # Move to next pair
        first_half = first_half.next
        second_half = second_half.next

    return max_sum
```

**TypeScript Solution**:
```typescript
function pairSum(head: ListNode | null): number {
    // Step 1: Find the middle of the list using slow/fast pointers
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;

    // After this loop, slow will be at the start of second half
    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;
    }

    // Step 2: Reverse the second half of the list
    let prev: ListNode | null = null;
    while (slow) {
        const nextNode: ListNode | null = slow.next;
        slow.next = prev;
        prev = slow;
        slow = nextNode;
    }

    // Step 3: Calculate maximum twin sum
    // prev now points to the head of reversed second half
    // head points to the start of first half
    let maxSum = 0;
    let firstHalf: ListNode | null = head;
    let secondHalf: ListNode | null = prev;

    while (secondHalf) {  // Traverse both halves simultaneously
        // Calculate twin sum
        const twinSum = firstHalf!.val + secondHalf.val;
        maxSum = Math.max(maxSum, twinSum);

        // Move to next pair
        firstHalf = firstHalf!.next;
        secondHalf = secondHalf.next;
    }

    return maxSum;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - find middle O(n/2), reverse O(n/2), compare O(n/2) = O(n)
- Space Complexity: O(1) - only using pointers

---

### Problem 16: Remove Nth Node From End of List (Medium)
**LeetCode Link**: [19. Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/)

**Problem Description**:
Given the head of a linked list, remove the nth node from the end of the list and return its head. Do it in one pass.

**Example**:
```
Input: head = [1,2,3,4,5], n = 2
Output: [1,2,3,5]
Explanation: Remove 4 (2nd from end)
```

**Visualization**:
```
Goal: Remove 2nd node from end (node 4)

Original: 1 → 2 → 3 → 4 → 5 → NULL
                      ↑
                  (2nd from end)

Two-pointer technique with gap of n:

Step 1: Move fast pointer n steps ahead
fast:               ↓
      1 → 2 → 3 → 4 → 5 → NULL
slow: ↓

Step 2: Move both until fast reaches end
                    fast:     ↓
      1 → 2 → 3 → 4 → 5 → NULL
            slow: ↓

Now slow is just before the node to remove!

Step 3: Skip the target node
      1 → 2 → 3 ──┐  5 → NULL
                  └──┘
               (bypass 4)
```

**Python Solution**:
```python
def removeNthFromEnd(head: ListNode, n: int) -> ListNode:
    """
    Use two pointers with a gap of n between them.
    When fast reaches end, slow is at node before target.

    Visualization for removing 2nd from end in [1,2,3,4,5]:

    Initial state with dummy:
    dummy → 1 → 2 → 3 → 4 → 5 → NULL
    slow,fast ↑

    After moving fast n steps (n=2):
    dummy → 1 → 2 → 3 → 4 → 5 → NULL
    slow ↑          fast ↑

    Move both until fast.next is NULL:
    dummy → 1 → 2 → 3 → 4 → 5 → NULL
                slow ↑          fast ↑

    Now slow.next (node 4) is the one to remove!
    """
    # Step 1: Create dummy node to handle edge case of removing head
    dummy = ListNode(0)
    dummy.next = head

    # Step 2: Initialize both pointers at dummy
    slow = fast = dummy

    # Step 3: Move fast pointer n steps ahead
    for _ in range(n):
        fast = fast.next

    # Step 4: Move both pointers until fast reaches the last node
    # This maintains a gap of n between them
    while fast.next:
        slow = slow.next
        fast = fast.next

    # Step 5: slow is now just before the node to remove
    # Skip the target node
    slow.next = slow.next.next

    # Step 6: Return the head (might have changed if we removed first node)
    return dummy.next
```

**TypeScript Solution**:
```typescript
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
    // Step 1: Create dummy node to handle edge case of removing head
    const dummy = new ListNode(0);
    dummy.next = head;

    // Step 2: Initialize both pointers at dummy
    let slow: ListNode = dummy;
    let fast: ListNode = dummy;

    // Step 3: Move fast pointer n steps ahead
    for (let i = 0; i < n; i++) {
        fast = fast.next!;
    }

    // Step 4: Move both pointers until fast reaches the last node
    // This maintains a gap of n between them
    while (fast.next) {
        slow = slow.next!;
        fast = fast.next;
    }

    // Step 5: slow is now just before the node to remove
    // Skip the target node
    slow.next = slow.next!.next;

    // Step 6: Return the head (might have changed if we removed first node)
    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the list
- Space Complexity: O(1) - only using two pointers

---

### Problem 17: Sort List (Medium)
**LeetCode Link**: [148. Sort List](https://leetcode.com/problems/sort-list/)

**Problem Description**:
Sort a linked list in O(n log n) time and O(1) space complexity using merge sort.

**Example**:
```
Input: head = [4,2,1,3]
Output: [1,2,3,4]
```

**Visualization**:
```
Merge Sort on Linked List:

Original: 4 → 2 → 1 → 3 → NULL

Step 1: Split into halves (recursively)
        4 → 2 → 1 → 3
           ↓
    4 → 2      1 → 3
      ↓          ↓
    4   2      1   3

Step 2: Merge sorted halves (bottom-up)
    4   2  →  2 → 4
    1   3  →  1 → 3
      ↓
    2→4  1→3
      ↓
    1 → 2 → 3 → 4

Key operations:
1. Find middle (slow/fast pointers)
2. Split list
3. Recursively sort both halves
4. Merge two sorted lists
```

**Python Solution**:
```python
def sortList(head: ListNode) -> ListNode:
    """
    Merge sort for linked list.

    Visualization for [4,2,1,3]:

    sortList([4,2,1,3])
      ├─ sortList([4,2])
      │    ├─ sortList([4]) → [4]
      │    ├─ sortList([2]) → [2]
      │    └─ merge([4],[2]) → [2,4]
      ├─ sortList([1,3])
      │    ├─ sortList([1]) → [1]
      │    ├─ sortList([3]) → [3]
      │    └─ merge([1],[3]) → [1,3]
      └─ merge([2,4],[1,3]) → [1,2,3,4]
    """
    # Step 1: Base case - empty list or single node
    if not head or not head.next:
        return head

    # Step 2: Find the middle of the list using slow/fast pointers
    slow, fast = head, head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # Step 3: Split the list into two halves
    mid = slow.next
    slow.next = None  # Break the link

    # Step 4: Recursively sort both halves
    left = sortList(head)
    right = sortList(mid)

    # Step 5: Merge the two sorted halves
    return merge(left, right)

def merge(l1: ListNode, l2: ListNode) -> ListNode:
    """
    Merge two sorted linked lists.

    Example: merge [2,4] and [1,3]

    dummy → NULL
    Start: Compare 2 vs 1, pick 1
    dummy → 1 → NULL

    Compare 2 vs 3, pick 2
    dummy → 1 → 2 → NULL

    Compare 4 vs 3, pick 3
    dummy → 1 → 2 → 3 → NULL

    Only [4] left, append it
    dummy → 1 → 2 → 3 → 4 → NULL
    """
    # Create dummy node for easier handling
    dummy = ListNode(0)
    current = dummy

    # Merge while both lists have nodes
    while l1 and l2:
        if l1.val < l2.val:
            current.next = l1
            l1 = l1.next
        else:
            current.next = l2
            l2 = l2.next
        current = current.next

    # Append remaining nodes (if any)
    current.next = l1 if l1 else l2

    return dummy.next
```

**TypeScript Solution**:
```typescript
function sortList(head: ListNode | null): ListNode | null {
    // Step 1: Base case - empty list or single node
    if (!head || !head.next) {
        return head;
    }

    // Step 2: Find the middle of the list using slow/fast pointers
    let slow: ListNode = head;
    let fast: ListNode | null = head.next;
    while (fast && fast.next) {
        slow = slow.next!;
        fast = fast.next.next;
    }

    // Step 3: Split the list into two halves
    const mid: ListNode | null = slow.next;
    slow.next = null;  // Break the link

    // Step 4: Recursively sort both halves
    const left = sortList(head);
    const right = sortList(mid);

    // Step 5: Merge the two sorted halves
    return merge(left, right);
}

function merge(l1: ListNode | null, l2: ListNode | null): ListNode | null {
    // Create dummy node for easier handling
    const dummy = new ListNode(0);
    let current: ListNode = dummy;

    // Merge while both lists have nodes
    while (l1 && l2) {
        if (l1.val < l2.val) {
            current.next = l1;
            l1 = l1.next;
        } else {
            current.next = l2;
            l2 = l2.next;
        }
        current = current.next;
    }

    // Append remaining nodes (if any)
    current.next = l1 ? l1 : l2;

    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - dividing takes log n levels, merging at each level takes O(n)
- Space Complexity: O(log n) - recursion stack depth (not O(1) but best for linked list)

---

### Problem 18: Reverse Nodes in Segments (Medium)
**LeetCode Link**: Similar to [2816. Double a Number Represented as a Linked List](https://leetcode.com/problems/double-a-number-represented-as-a-linked-list/)

**Problem Description**:
Given a linked list, reverse nodes in segments where each segment is defined by consecutive increasing or decreasing sequences.

**Example**:
```
Input: [1,2,3,2,1,4,5,3]
Output: [3,2,1,2,1,5,4,3]
Explanation:
Segments: [1,2,3], [2,1], [4,5], [3]
Reversed: [3,2,1], [2,1], [5,4], [3]
```

**Visualization**:
```
Original segments:
[1 → 2 → 3] (increasing)
[2 → 1] (decreasing)
[4 → 5] (increasing)
[3] (single)

After reversing each segment:
[3 → 2 → 1]
[2 → 1] (already decreasing, becomes increasing)
[5 → 4]
[3]

Final: 3 → 2 → 1 → 2 → 1 → 5 → 4 → 3
```

**Python Solution**:
```python
def reverseSegments(head: ListNode) -> ListNode:
    """
    Identify segments and reverse each one.

    Visualization for [1,2,3,2,1]:

    Segment 1: [1,2,3] - increasing
    Reverse to: [3,2,1]

    Segment 2: [2,1] - decreasing
    Reverse to: [1,2]

    Result: [3,2,1,1,2]
    """
    if not head or not head.next:
        return head

    # Helper function to reverse a segment
    def reverse_segment(start, end):
        """Reverse nodes from start to end (inclusive)"""
        prev = None
        current = start

        while current != end:
            next_node = current.next
            current.next = prev
            prev = current
            current = next_node

        # Reverse the last node (end)
        if current:
            next_node = current.next
            current.next = prev
            prev = current
            current = next_node

        return prev, start, current  # new_head, new_tail, next_segment

    # Step 1: Create dummy for easier handling
    dummy = ListNode(0)
    dummy.next = head
    prev_tail = dummy
    current = head

    # Step 2: Process segments
    while current:
        segment_start = current

        # Find end of current segment (while increasing or same)
        while current.next and current.val <= current.next.val:
            current = current.next

        segment_end = current
        next_segment = current.next

        # Step 3: Reverse this segment
        new_head, new_tail, _ = reverse_segment(segment_start, segment_end)

        # Step 4: Connect reversed segment to result
        prev_tail.next = new_head
        new_tail.next = next_segment

        # Step 5: Move to next segment
        prev_tail = new_tail
        current = next_segment

    return dummy.next
```

**TypeScript Solution**:
```typescript
function reverseSegments(head: ListNode | null): ListNode | null {
    if (!head || !head.next) {
        return head;
    }

    // Helper function to reverse a segment
    function reverseSegment(
        start: ListNode,
        end: ListNode
    ): [ListNode, ListNode, ListNode | null] {
        let prev: ListNode | null = null;
        let current: ListNode | null = start;

        while (current !== end) {
            const nextNode: ListNode | null = current!.next;
            current!.next = prev;
            prev = current;
            current = nextNode;
        }

        // Reverse the last node (end)
        if (current) {
            const nextNode: ListNode | null = current.next;
            current.next = prev;
            prev = current;
            current = nextNode;
        }

        return [prev!, start, current];  // new_head, new_tail, next_segment
    }

    // Step 1: Create dummy for easier handling
    const dummy = new ListNode(0);
    dummy.next = head;
    let prevTail: ListNode = dummy;
    let current: ListNode | null = head;

    // Step 2: Process segments
    while (current) {
        const segmentStart: ListNode = current;

        // Find end of current segment (while increasing or same)
        while (current.next && current.val <= current.next.val) {
            current = current.next;
        }

        const segmentEnd: ListNode = current;
        const nextSegment: ListNode | null = current.next;

        // Step 3: Reverse this segment
        const [newHead, newTail, _] = reverseSegment(segmentStart, segmentEnd);

        // Step 4: Connect reversed segment to result
        prevTail.next = newHead;
        newTail.next = nextSegment;

        // Step 5: Move to next segment
        prevTail = newTail;
        current = nextSegment;
    }

    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the list
- Space Complexity: O(1) - only using pointers

---

### Problem 19: Reverse Linked List in Binary (Medium)
**LeetCode Link**: Custom problem (combines [206. Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) concepts)

**Problem Description**:
Given a linked list where each node contains a binary digit (0 or 1), reverse the list and return the decimal value of the resulting binary number.

**Example**:
```
Input: head = [1,0,1,1]  (represents binary 1011 = 11 in decimal)
Output: head = [1,1,0,1], decimal = 13 (binary 1101)
```

**Visualization**:
```
Original: 1 → 0 → 1 → 1 → NULL
          ↓   ↓   ↓   ↓
Binary:   1   0   1   1  = 1011 (11 in decimal)

After reversal:
          1 → 1 → 0 → 1 → NULL
          ↓   ↓   ↓   ↓
Binary:   1   1   0   1  = 1101 (13 in decimal)

Converting to decimal:
1×2³ + 1×2² + 0×2¹ + 1×2⁰
= 8  + 4   + 0   + 1
= 13
```

**Python Solution**:
```python
def reverseBinaryList(head: ListNode) -> tuple[ListNode, int]:
    """
    Reverse the linked list and calculate decimal value.

    Visualization for [1,0,1,1]:

    Step 1: Reverse list
    1→0→1→1  becomes  1→1→0→1

    Step 2: Calculate decimal
    Start from head: 1→1→0→1
    result = 0
    result = 0×2 + 1 = 1
    result = 1×2 + 1 = 3
    result = 3×2 + 0 = 6
    result = 6×2 + 1 = 13
    """
    # Step 1: Reverse the linked list
    prev = None
    current = head

    while current:
        # Save next before breaking the link
        next_node = current.next

        # Reverse the pointer
        current.next = prev

        # Move pointers forward
        prev = current
        current = next_node

    # prev is now the new head
    reversed_head = prev

    # Step 2: Calculate decimal value from reversed list
    decimal_value = 0
    current = reversed_head

    # Traverse and build decimal number
    # Each step: multiply by 2 and add current digit
    while current:
        decimal_value = decimal_value * 2 + current.val
        current = current.next

    return reversed_head, decimal_value

# Alternative: Get decimal without creating reversed list
def getBinaryDecimal(head: ListNode) -> int:
    """
    Calculate decimal value without modifying list.

    Method: Count length first, then calculate value

    For [1,0,1,1]:
    Length = 4
    Position 0 (value 1): 1 × 2^(4-0-1) = 1 × 8 = 8
    Position 1 (value 0): 0 × 2^(4-1-1) = 0 × 4 = 0
    Position 2 (value 1): 1 × 2^(4-2-1) = 1 × 2 = 2
    Position 3 (value 1): 1 × 2^(4-3-1) = 1 × 1 = 1
    Total = 8 + 0 + 2 + 1 = 11
    """
    # Count length
    length = 0
    current = head
    while current:
        length += 1
        current = current.next

    # Calculate decimal
    decimal = 0
    current = head
    position = 0

    while current:
        # Add contribution of current digit
        power = length - position - 1
        decimal += current.val * (2 ** power)
        current = current.next
        position += 1

    return decimal
```

**TypeScript Solution**:
```typescript
function reverseBinaryList(head: ListNode | null): [ListNode | null, number] {
    // Step 1: Reverse the linked list
    let prev: ListNode | null = null;
    let current: ListNode | null = head;

    while (current) {
        // Save next before breaking the link
        const nextNode: ListNode | null = current.next;

        // Reverse the pointer
        current.next = prev;

        // Move pointers forward
        prev = current;
        current = nextNode;
    }

    // prev is now the new head
    const reversedHead: ListNode | null = prev;

    // Step 2: Calculate decimal value from reversed list
    let decimalValue = 0;
    current = reversedHead;

    // Traverse and build decimal number
    // Each step: multiply by 2 and add current digit
    while (current) {
        decimalValue = decimalValue * 2 + current.val;
        current = current.next;
    }

    return [reversedHead, decimalValue];
}

// Alternative: Get decimal without creating reversed list
function getBinaryDecimal(head: ListNode | null): number {
    // Count length
    let length = 0;
    let current: ListNode | null = head;
    while (current) {
        length++;
        current = current.next;
    }

    // Calculate decimal
    let decimal = 0;
    current = head;
    let position = 0;

    while (current) {
        // Add contribution of current digit
        const power = length - position - 1;
        decimal += current.val * Math.pow(2, power);
        current = current.next;
        position++;
    }

    return decimal;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - reverse in O(n), calculate decimal in O(n)
- Space Complexity: O(1) - only using pointers

---

### Problem 20: Split Linked List in Parts (Medium)
**LeetCode Link**: [725. Split Linked List in Parts](https://leetcode.com/problems/split-linked-list-in-parts/)

**Problem Description**:
Given the head of a singly linked list and an integer k, split the list into k consecutive linked list parts. The length of each part should be as equal as possible, with earlier parts being slightly larger if necessary.

**Example**:
```
Input: head = [1,2,3,4,5,6,7,8,9,10], k = 3
Output: [[1,2,3,4],[5,6,7],[8,9,10]]
```

**Visualization**:
```
Original: 1→2→3→4→5→6→7→8→9→10 (length = 10)
k = 3

Calculate sizes:
base_size = 10 // 3 = 3
extra = 10 % 3 = 1

Part sizes: [4, 3, 3]  (first part gets the extra)

Split:
Part 1: 1→2→3→4→NULL     (size 4)
Part 2: 5→6→7→NULL       (size 3)
Part 3: 8→9→10→NULL      (size 3)

Visual breakdown:
1→2→3→4 | 5→6→7 | 8→9→10
   ↑          ↑        ↑
  cut here  cut here  end
```

**Python Solution**:
```python
def splitListToParts(head: ListNode, k: int) -> list[ListNode]:
    """
    Split list into k parts as evenly as possible.

    Visualization for [1,2,3,4,5,6,7], k=3:
    Length = 7
    base_size = 7 // 3 = 2
    extra = 7 % 3 = 1

    Part sizes: [2+1, 2, 2] = [3, 2, 2]

    Result:
    Part 1: 1→2→3
    Part 2: 4→5
    Part 3: 6→7
    """
    # Step 1: Calculate the length of the list
    length = 0
    current = head
    while current:
        length += 1
        current = current.next

    # Step 2: Calculate size of each part
    base_size = length // k  # Minimum size for each part
    extra = length % k  # Number of parts that need one extra node

    # Step 3: Split the list
    result = []
    current = head

    for i in range(k):
        # Determine size of current part
        part_size = base_size + (1 if i < extra else 0)

        # Save head of current part
        part_head = current

        # Move to the end of current part
        for j in range(part_size - 1):
            if current:
                current = current.next

        # Break the link to create separate part
        if current:
            next_part = current.next
            current.next = None
            current = next_part

        # Add this part to result
        result.append(part_head)

    return result
```

**TypeScript Solution**:
```typescript
function splitListToParts(head: ListNode | null, k: number): Array<ListNode | null> {
    // Step 1: Calculate the length of the list
    let length = 0;
    let current: ListNode | null = head;
    while (current) {
        length++;
        current = current.next;
    }

    // Step 2: Calculate size of each part
    const baseSize = Math.floor(length / k);  // Minimum size for each part
    const extra = length % k;  // Number of parts that need one extra node

    // Step 3: Split the list
    const result: Array<ListNode | null> = [];
    current = head;

    for (let i = 0; i < k; i++) {
        // Determine size of current part
        const partSize = baseSize + (i < extra ? 1 : 0);

        // Save head of current part
        const partHead: ListNode | null = current;

        // Move to the end of current part
        for (let j = 0; j < partSize - 1; j++) {
            if (current) {
                current = current.next;
            }
        }

        // Break the link to create separate part
        if (current) {
            const nextPart: ListNode | null = current.next;
            current.next = null;
            current = nextPart;
        }

        // Add this part to result
        result.push(partHead);
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n + k) - O(n) to count length and split, O(k) to create k parts
- Space Complexity: O(k) - storing k part heads (not counting output array)

---

### Problem 21: Delete N Nodes After M Nodes (Medium)
**LeetCode Link**: [1474. Delete N Nodes After M Nodes](https://leetcode.com/problems/delete-n-nodes-after-m-nodes/)

**Problem Description**:
Given the head of a linked list and two integers m and n, traverse the list and remove some nodes in the following way: Start with the head, keep the first m nodes, delete the next n nodes, and repeat until end of list.

**Example**:
```
Input: head = [1,2,3,4,5,6,7,8,9,10,11,12,13], m = 2, n = 3
Output: [1,2,6,7,11,12]
Explanation: Keep 2, delete 3, keep 2, delete 3, keep 2, delete 3
```

**Visualization**:
```
Original: 1→2→3→4→5→6→7→8→9→10→11→12→13

m = 2 (keep), n = 3 (delete)

Cycle 1:
Keep:   [1,2]
Delete: [3,4,5]

Cycle 2:
Keep:   [6,7]
Delete: [8,9,10]

Cycle 3:
Keep:   [11,12]
Delete: [13]

Result: 1→2→6→7→11→12

Visual pattern:
K K D D D K K D D D K K D
1 2 3 4 5 6 7 8 9 0 1 2 3
└─┘ └───┘ └─┘ └───┘ └─┘ └┘
keep delete keep delete keep del
```

**Python Solution**:
```python
def deleteNodes(head: ListNode, m: int, n: int) -> ListNode:
    """
    Keep m nodes, delete n nodes, repeat.

    Visualization for [1,2,3,4,5,6,7,8], m=2, n=2:

    Start: 1→2→3→4→5→6→7→8

    Keep 2: 1→2 (current at 2)
    Delete 2: skip 3,4
    Result so far: 1→2→5→6→7→8

    Keep 2: 5→6 (current at 6)
    Delete 2: skip 7,8
    Result: 1→2→5→6
    """
    # Step 1: Handle edge case
    if not head or n == 0:
        return head

    current = head

    # Step 2: Repeat pattern until end of list
    while current:
        # Step 2a: Keep m nodes
        for i in range(m - 1):
            if not current:
                return head
            current = current.next

        if not current:
            return head

        # Step 2b: Delete n nodes
        # First, find the node after the n nodes to delete
        temp = current
        for i in range(n):
            if not temp:
                break
            temp = temp.next

        # Step 2c: Connect current to the node after deleted section
        current.next = temp

        # Step 2d: Move to next section
        current = temp

    return head
```

**TypeScript Solution**:
```typescript
function deleteNodes(head: ListNode | null, m: number, n: number): ListNode | null {
    // Step 1: Handle edge case
    if (!head || n === 0) {
        return head;
    }

    let current: ListNode | null = head;

    // Step 2: Repeat pattern until end of list
    while (current) {
        // Step 2a: Keep m nodes
        for (let i = 0; i < m - 1; i++) {
            if (!current) {
                return head;
            }
            current = current.next;
        }

        if (!current) {
            return head;
        }

        // Step 2b: Delete n nodes
        // First, find the node after the n nodes to delete
        let temp: ListNode | null = current;
        for (let i = 0; i < n; i++) {
            if (!temp) {
                break;
            }
            temp = temp.next;
        }

        // Step 2c: Connect current to the node after deleted section
        current.next = temp;

        // Step 2d: Move to next section
        current = temp;
    }

    return head;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the list
- Space Complexity: O(1) - only using pointers

---

### Problem 22: Reverse Every Other K Nodes (Hard)
**LeetCode Link**: Custom problem (combines concepts from [25. Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/))

**Problem Description**:
Given a linked list and integer k, reverse every other k-sized group. The first group should not be reversed, the second should be reversed, the third should not be reversed, and so on.

**Example**:
```
Input: head = [1,2,3,4,5,6,7,8,9], k = 3
Output: [1,2,3,6,5,4,7,8,9]
Explanation:
Group 1: [1,2,3] - not reversed
Group 2: [4,5,6] - reversed to [6,5,4]
Group 3: [7,8,9] - not reversed
```

**Visualization**:
```
Original: 1→2→3→4→5→6→7→8→9→10→11→12
k = 3

Identify groups:
Group 0: [1,2,3] - DON'T reverse (even index)
Group 1: [4,5,6] - REVERSE (odd index)
Group 2: [7,8,9] - DON'T reverse (even index)
Group 3: [10,11,12] - REVERSE (odd index)

Result:
[1,2,3] + [6,5,4] + [7,8,9] + [12,11,10]
= 1→2→3→6→5→4→7→8→9→12→11→10

Visual transformation:
Before: 1→2→3  4→5→6  7→8→9  10→11→12
        └───┘  └───┘  └───┘  └─────┘
        keep   flip   keep    flip

After:  1→2→3  6→5→4  7→8→9  12→11→10
```

**Python Solution**:
```python
def reverseAlternateKGroups(head: ListNode, k: int) -> ListNode:
    """
    Reverse every other k-sized group.

    Visualization for [1,2,3,4,5,6], k=2:

    Group 0: [1,2] - keep → 1→2
    Group 1: [3,4] - reverse → 4→3
    Group 2: [5,6] - keep → 5→6

    Result: 1→2→4→3→5→6
    """
    # Helper to check if k nodes exist
    def has_k_nodes(node, k):
        count = 0
        while node and count < k:
            node = node.next
            count += 1
        return count == k

    # Helper to reverse k nodes
    def reverse_k_nodes(prev_group, k):
        """Reverse k nodes after prev_group"""
        current = prev_group.next
        next_node = current.next

        for _ in range(k - 1):
            current.next = next_node.next
            next_node.next = prev_group.next
            prev_group.next = next_node
            next_node = current.next

        return current  # Returns new tail of reversed group

    # Step 1: Create dummy node
    dummy = ListNode(0)
    dummy.next = head
    prev_group = dummy
    group_index = 0

    # Step 2: Process groups
    while has_k_nodes(prev_group.next, k):
        if group_index % 2 == 1:
            # Odd group index - reverse this group
            new_tail = reverse_k_nodes(prev_group, k)
            prev_group = new_tail
        else:
            # Even group index - don't reverse, just skip
            for _ in range(k):
                prev_group = prev_group.next

        group_index += 1

    return dummy.next
```

**TypeScript Solution**:
```typescript
function reverseAlternateKGroups(head: ListNode | null, k: number): ListNode | null {
    // Helper to check if k nodes exist
    function hasKNodes(node: ListNode | null, k: number): boolean {
        let count = 0;
        while (node && count < k) {
            node = node.next;
            count++;
        }
        return count === k;
    }

    // Helper to reverse k nodes
    function reverseKNodes(prevGroup: ListNode, k: number): ListNode {
        let current: ListNode = prevGroup.next!;
        let nextNode: ListNode | null = current.next;

        for (let i = 0; i < k - 1; i++) {
            current.next = nextNode!.next;
            nextNode!.next = prevGroup.next;
            prevGroup.next = nextNode;
            nextNode = current.next;
        }

        return current;  // Returns new tail of reversed group
    }

    // Step 1: Create dummy node
    const dummy = new ListNode(0);
    dummy.next = head;
    let prevGroup: ListNode = dummy;
    let groupIndex = 0;

    // Step 2: Process groups
    while (hasKNodes(prevGroup.next, k)) {
        if (groupIndex % 2 === 1) {
            // Odd group index - reverse this group
            const newTail = reverseKNodes(prevGroup, k);
            prevGroup = newTail;
        } else {
            // Even group index - don't reverse, just skip
            for (let i = 0; i < k; i++) {
                prevGroup = prevGroup.next!;
            }
        }

        groupIndex++;
    }

    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the list, each node processed once
- Space Complexity: O(1) - only using pointers

---

## Practice Tips

1. **Master the basic reversal first**: Make sure you can reverse a linked list in your sleep before tackling more complex problems.

2. **Use dummy nodes**: They simplify edge cases where the head might change.

3. **Draw diagrams**: Visualize the pointer movements on paper. This pattern is all about pointer manipulation.

4. **Watch for edge cases**:
   - Empty list (head is None/null)
   - Single node
   - Two nodes
   - When k equals list length
   - When k is greater than list length

5. **Common mistakes to avoid**:
   - Forgetting to save the next node before changing pointers
   - Losing track of the original head
   - Not handling the case where k > list length
   - Creating infinite loops by not properly breaking links

6. **Pattern variations**:
   - Full reversal
   - Partial reversal (positions m to n)
   - Reversal in groups of k
   - Alternate group reversal
   - Pairwise swapping

7. **Testing strategy**:
   - Test with odd-length lists
   - Test with even-length lists
   - Test with k = 1 (no change)
   - Test with k = list length (full reversal)
