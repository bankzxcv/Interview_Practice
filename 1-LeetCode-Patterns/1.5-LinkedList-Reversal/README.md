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

```
Original List:
1 -> 2 -> 3 -> 4 -> 5 -> None

Step-by-step reversal:
prev = None, curr = 1
None <- 1    2 -> 3 -> 4 -> 5 -> None

prev = 1, curr = 2
None <- 1 <- 2    3 -> 4 -> 5 -> None

prev = 2, curr = 3
None <- 1 <- 2 <- 3    4 -> 5 -> None

prev = 3, curr = 4
None <- 1 <- 2 <- 3 <- 4    5 -> None

prev = 4, curr = 5
None <- 1 <- 2 <- 3 <- 4 <- 5

Final Reversed List:
5 -> 4 -> 3 -> 2 -> 1 -> None
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
