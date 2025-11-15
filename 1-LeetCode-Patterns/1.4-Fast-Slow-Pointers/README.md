# 1.4 Fast & Slow Pointers Pattern

## Pattern Overview

### What is Fast & Slow Pointers?
Fast & Slow Pointers (also called the "Tortoise and Hare" algorithm) uses two pointers that move through a data structure at different speeds. The slow pointer moves one step at a time, while the fast pointer moves two (or more) steps. This pattern is particularly effective for detecting cycles and finding middle elements in linked lists.

### When to Use It?
- Detecting cycles in linked lists
- Finding the middle of a linked list
- Detecting the start of a cycle
- Finding if a linked list is a palindrome
- Happy number problems
- Finding the nth node from the end

### Time/Space Complexity Benefits
- **Time**: O(n) - typically single pass through data structure
- **Space**: O(1) - only using two pointers (no extra data structures)
- Elegant alternative to using hashsets for cycle detection

### Visual Diagram

```
Cycle Detection:
1 -> 2 -> 3 -> 4 -> 5
          ↑         ↓
          8 <- 7 <- 6

Step 1:  slow=1, fast=2
Step 2:  slow=2, fast=4
Step 3:  slow=3, fast=6
Step 4:  slow=4, fast=8
Step 5:  slow=5, fast=4
Step 6:  slow=6, fast=6  <- They meet! Cycle detected

Finding Middle:
1 -> 2 -> 3 -> 4 -> 5 -> null
↑    ↑
slow fast

Step 1:  slow=1, fast=2
Step 2:  slow=2, fast=4
Step 3:  slow=3, fast=null  <- fast reached end, slow at middle
```

## Recognition Guidelines

### How to Identify This Pattern
Look for these keywords and scenarios:
- "Linked list cycle"
- "Find middle of linked list"
- "Detect cycle"
- "Happy number"
- "Circular array"
- "Find duplicate number"
- Problems involving linked lists or arrays with cycles

### Key Indicators
1. Problem involves linked list or sequence
2. Need to detect cycles or loops
3. Need to find middle element without knowing length
4. Space complexity should be O(1)
5. Keywords: "cycle", "middle", "duplicate", "loop"

## Template/Pseudocode

### Cycle Detection
```
function hasCycle(head):
    slow = head
    fast = head

    while fast != null and fast.next != null:
        slow = slow.next          // Move 1 step
        fast = fast.next.next     // Move 2 steps

        if slow == fast:
            return true           // Cycle detected

    return false                  // No cycle
```

### Finding Middle
```
function findMiddle(head):
    slow = head
    fast = head

    while fast != null and fast.next != null:
        slow = slow.next          // Move 1 step
        fast = fast.next.next     // Move 2 steps

    return slow                   // Slow is at middle
```

### Finding Cycle Start
```
function detectCycleStart(head):
    // Phase 1: Detect if cycle exists
    slow = head
    fast = head

    while fast != null and fast.next != null:
        slow = slow.next
        fast = fast.next.next

        if slow == fast:
            break                 // Cycle found

    if fast == null or fast.next == null:
        return null              // No cycle

    // Phase 2: Find cycle start
    slow = head
    while slow != fast:
        slow = slow.next
        fast = fast.next

    return slow                  // Start of cycle
```

---

## Problems

### Problem 1: Linked List Cycle
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/linked-list-cycle/](https://leetcode.com/problems/linked-list-cycle/)

**Description**: Determine if a linked list has a cycle.

#### Python Solution
```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def hasCycle(head: ListNode) -> bool:
    # Step 1: Handle edge case
    if not head or not head.next:
        return False

    # Step 2: Initialize two pointers
    slow = head
    fast = head

    # Step 3: Move pointers at different speeds
    while fast and fast.next:
        # Step 4: Move slow pointer 1 step
        slow = slow.next

        # Step 5: Move fast pointer 2 steps
        fast = fast.next.next

        # Step 6: Check if pointers meet
        # If they meet, there's a cycle
        if slow == fast:
            return True

    # Step 7: Fast pointer reached end, no cycle
    return False

# Why this works:
# - If no cycle: fast reaches end (null)
# - If cycle: fast will eventually catch up to slow
# - Distance between them decreases by 1 each iteration
```

#### TypeScript Solution
```typescript
class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }
}

function hasCycle(head: ListNode | null): boolean {
    // Step 1: Handle edge case
    if (!head || !head.next) return false;

    // Step 2: Initialize pointers
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;

    // Step 3: Move at different speeds
    while (fast && fast.next) {
        // Step 4-5: Move pointers
        slow = slow!.next;
        fast = fast.next.next;

        // Step 6: Check if meet
        if (slow === fast) {
            return true;
        }
    }

    return false;
}
```

**Time Complexity**: O(n) - in worst case, visit all nodes
**Space Complexity**: O(1) - only using two pointers

---

### Problem 2: Middle of the Linked List
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/middle-of-the-linked-list/](https://leetcode.com/problems/middle-of-the-linked-list/)

**Description**: Find the middle node of a linked list. If two middle nodes, return the second one.

#### Python Solution
```python
def middleNode(head: ListNode) -> ListNode:
    # Step 1: Initialize two pointers at head
    slow = head
    fast = head

    # Step 2: Move pointers at different speeds
    # When fast reaches end, slow will be at middle
    while fast and fast.next:
        # Step 3: Move slow 1 step
        slow = slow.next

        # Step 4: Move fast 2 steps
        fast = fast.next.next

    # Step 5: Return middle node
    return slow

# Visualization for [1,2,3,4,5]:
# Initial:     slow=1, fast=1
# After step 1: slow=2, fast=3
# After step 2: slow=3, fast=5
# After step 3: slow=3, fast=null (stopped)
# Return: 3 (middle node)
#
# For [1,2,3,4,5,6]:
# slow will be at 4 (second middle)
```

#### TypeScript Solution
```typescript
function middleNode(head: ListNode | null): ListNode | null {
    // Step 1: Initialize pointers
    let slow = head;
    let fast = head;

    // Step 2: Move until fast reaches end
    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;
    }

    // Step 3: Return middle
    return slow;
}
```

**Time Complexity**: O(n) - traverse list once
**Space Complexity**: O(1) - only two pointers

---

### Problem 3: Linked List Cycle II
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/linked-list-cycle-ii/](https://leetcode.com/problems/linked-list-cycle-ii/)

**Description**: Return the node where the cycle begins. Return null if no cycle.

#### Python Solution
```python
def detectCycle(head: ListNode) -> ListNode:
    # Step 1: Handle edge case
    if not head or not head.next:
        return None

    # Step 2: Phase 1 - Detect if cycle exists
    slow = head
    fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

        # Step 3: Cycle detected
        if slow == fast:
            break

    # Step 4: No cycle found
    if not fast or not fast.next:
        return None

    # Step 5: Phase 2 - Find cycle start
    # Key insight: Distance from head to cycle start ==
    # Distance from meeting point to cycle start
    slow = head

    while slow != fast:
        slow = slow.next
        fast = fast.next

    # Step 6: Return cycle start
    return slow

# Why this works (Mathematical proof):
# Let:
#   L = distance from head to cycle start
#   C = cycle length
#   k = distance from cycle start to meeting point
#
# When they meet:
#   slow traveled: L + k
#   fast traveled: L + k + nC (n full cycles)
#
# Since fast is 2x speed:
#   2(L + k) = L + k + nC
#   2L + 2k = L + k + nC
#   L + k = nC
#   L = nC - k
#
# This means: distance from head to start = distance from meeting point to start
```

#### TypeScript Solution
```typescript
function detectCycle(head: ListNode | null): ListNode | null {
    // Step 1: Edge case
    if (!head || !head.next) return null;

    // Step 2: Detect cycle
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;

    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;

        if (slow === fast) {
            break;
        }
    }

    // Step 3: No cycle
    if (!fast || !fast.next) return null;

    // Step 4: Find cycle start
    slow = head;
    while (slow !== fast) {
        slow = slow!.next;
        fast = fast!.next;
    }

    return slow;
}
```

**Time Complexity**: O(n) - traverse list at most twice
**Space Complexity**: O(1) - only two pointers

---

### Problem 4: Happy Number
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/happy-number/](https://leetcode.com/problems/happy-number/)

**Description**: Determine if a number is happy. A happy number eventually reaches 1 when replaced by sum of squares of its digits repeatedly.

#### Python Solution
```python
def isHappy(n: int) -> bool:
    # Helper function to calculate sum of squares of digits
    def get_next(num: int) -> int:
        total_sum = 0
        while num > 0:
            # Step 1: Extract last digit
            digit = num % 10
            # Step 2: Add square to sum
            total_sum += digit * digit
            # Step 3: Remove last digit
            num //= 10
        return total_sum

    # Step 4: Initialize two pointers
    # Use fast & slow to detect cycle
    slow = n
    fast = get_next(n)

    # Step 5: Move pointers at different speeds
    while fast != 1 and slow != fast:
        # Step 6: Move slow 1 step
        slow = get_next(slow)

        # Step 7: Move fast 2 steps
        fast = get_next(get_next(fast))

    # Step 8: If fast reached 1, it's happy
    # If slow == fast (and != 1), there's a cycle
    return fast == 1

# Example: n = 19
# 19 -> 1² + 9² = 82
# 82 -> 8² + 2² = 68
# 68 -> 6² + 8² = 100
# 100 -> 1² + 0² + 0² = 1 (happy!)
#
# Example: n = 2
# 2 -> 4 -> 16 -> 37 -> 58 -> 89 -> 145 -> 42 -> 20 -> 4 (cycle!)
```

#### TypeScript Solution
```typescript
function isHappy(n: number): boolean {
    // Helper to get next number
    const getNext = (num: number): number => {
        let totalSum = 0;
        while (num > 0) {
            const digit = num % 10;
            totalSum += digit * digit;
            num = Math.floor(num / 10);
        }
        return totalSum;
    };

    // Use fast & slow pointers
    let slow = n;
    let fast = getNext(n);

    while (fast !== 1 && slow !== fast) {
        slow = getNext(slow);
        fast = getNext(getNext(fast));
    }

    return fast === 1;
}
```

**Time Complexity**: O(log n) - number of digits is log n
**Space Complexity**: O(1) - only using pointers

---

### Problem 5: Remove Nth Node From End of List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/remove-nth-node-from-end-of-list/](https://leetcode.com/problems/remove-nth-node-from-end-of-list/)

**Description**: Remove the nth node from the end of a linked list.

#### Python Solution
```python
def removeNthFromEnd(head: ListNode, n: int) -> ListNode:
    # Step 1: Create dummy node to handle edge cases
    # (e.g., removing first node)
    dummy = ListNode(0)
    dummy.next = head

    # Step 2: Initialize two pointers
    slow = dummy
    fast = dummy

    # Step 3: Move fast pointer n+1 steps ahead
    # This creates gap of n nodes between slow and fast
    for i in range(n + 1):
        fast = fast.next

    # Step 4: Move both pointers until fast reaches end
    # Now slow will be at node before the one to remove
    while fast:
        slow = slow.next
        fast = fast.next

    # Step 5: Remove nth node from end
    slow.next = slow.next.next

    # Step 6: Return new head
    return dummy.next

# Visualization for [1,2,3,4,5], n=2:
# Need to remove 4 (2nd from end)
#
# Initial (after moving fast 3 steps):
# dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
# ↑                  ↑
# slow              fast
#
# After moving both to end:
# dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
#                ↑              ↑
#              slow           fast
#
# Remove: slow.next = slow.next.next
# Result: 1 -> 2 -> 3 -> 5
```

#### TypeScript Solution
```typescript
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
    // Step 1: Create dummy node
    const dummy = new ListNode(0);
    dummy.next = head;

    // Step 2: Initialize pointers
    let slow: ListNode | null = dummy;
    let fast: ListNode | null = dummy;

    // Step 3: Move fast n+1 steps
    for (let i = 0; i <= n; i++) {
        fast = fast!.next;
    }

    // Step 4: Move both until fast at end
    while (fast) {
        slow = slow!.next;
        fast = fast.next;
    }

    // Step 5: Remove node
    slow!.next = slow!.next!.next;

    return dummy.next;
}
```

**Time Complexity**: O(n) - single pass through list
**Space Complexity**: O(1) - only using pointers

---

### Problem 6: Palindrome Linked List
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/palindrome-linked-list/](https://leetcode.com/problems/palindrome-linked-list/)

**Description**: Check if a linked list is a palindrome.

#### Python Solution
```python
def isPalindrome(head: ListNode) -> bool:
    # Step 1: Find middle of list using fast & slow
    slow = head
    fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # Step 2: Reverse second half of list
    # slow is now at middle
    prev = None
    while slow:
        next_node = slow.next
        slow.next = prev
        prev = slow
        slow = next_node

    # Step 3: Compare first half with reversed second half
    # prev now points to head of reversed second half
    left = head
    right = prev

    while right:  # Only need to check second half
        # Step 4: If values don't match, not palindrome
        if left.val != right.val:
            return False

        # Step 5: Move both pointers
        left = left.next
        right = right.next

    # Step 6: All values matched
    return True

# Visualization for [1,2,2,1]:
# Step 1: Find middle
#   1 -> 2 -> 2 -> 1 -> null
#             ↑
#           slow
#
# Step 2: Reverse second half
#   First half: 1 -> 2
#   Second half (reversed): 1 -> 2
#
# Step 3: Compare
#   1 == 1 ✓
#   2 == 2 ✓
#   Result: true
```

#### TypeScript Solution
```typescript
function isPalindrome(head: ListNode | null): boolean {
    // Step 1: Find middle
    let slow = head;
    let fast = head;

    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;
    }

    // Step 2: Reverse second half
    let prev: ListNode | null = null;
    while (slow) {
        const nextNode = slow.next;
        slow.next = prev;
        prev = slow;
        slow = nextNode;
    }

    // Step 3: Compare halves
    let left = head;
    let right = prev;

    while (right) {
        if (left!.val !== right.val) {
            return false;
        }
        left = left!.next;
        right = right.next;
    }

    return true;
}
```

**Time Complexity**: O(n) - traverse list twice
**Space Complexity**: O(1) - only using pointers

---

### Problem 7: Reorder List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/reorder-list/](https://leetcode.com/problems/reorder-list/)

**Description**: Reorder list from L₀→L₁→...→Lₙ₋₁→Lₙ to L₀→Lₙ→L₁→Lₙ₋₁→L₂→Lₙ₋₂→...

#### Python Solution
```python
def reorderList(head: ListNode) -> None:
    # Step 1: Find middle using fast & slow pointers
    slow = head
    fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # Step 2: Reverse second half
    # slow is at middle, reverse from slow onwards
    prev = None
    curr = slow

    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node

    # Step 3: Merge two halves alternately
    # first points to first half, second points to reversed second half
    first = head
    second = prev

    while second.next:  # second half might be longer by 1
        # Step 4: Save next pointers
        first_next = first.next
        second_next = second.next

        # Step 5: Reorder: first -> second -> first.next -> ...
        first.next = second
        second.next = first_next

        # Step 6: Move to next pair
        first = first_next
        second = second_next

# Visualization for [1,2,3,4,5]:
# Step 1: Find middle
#   1 -> 2 -> 3 -> 4 -> 5
#             ↑
#           slow
#
# Step 2: Reverse second half
#   First: 1 -> 2 -> 3
#   Second (reversed): 5 -> 4 -> 3
#
# Step 3: Merge alternately
#   1 -> 5 -> 2 -> 4 -> 3
```

#### TypeScript Solution
```typescript
function reorderList(head: ListNode | null): void {
    if (!head || !head.next) return;

    // Step 1: Find middle
    let slow = head;
    let fast = head;

    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;
    }

    // Step 2: Reverse second half
    let prev: ListNode | null = null;
    let curr: ListNode | null = slow;

    while (curr) {
        const nextNode = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextNode;
    }

    // Step 3: Merge alternately
    let first: ListNode | null = head;
    let second: ListNode | null = prev;

    while (second!.next) {
        const firstNext = first!.next;
        const secondNext = second!.next;

        first!.next = second;
        second!.next = firstNext;

        first = firstNext;
        second = secondNext;
    }
}
```

**Time Complexity**: O(n) - three passes through list
**Space Complexity**: O(1) - only using pointers

---

### Problem 8: Circular Array Loop
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/circular-array-loop/](https://leetcode.com/problems/circular-array-loop/)

**Description**: Determine if there is a loop in a circular array with all forward or all backward moves.

#### Python Solution
```python
def circularArrayLoop(nums: List[int]) -> bool:
    n = len(nums)

    # Helper to get next index
    def get_next(index: int) -> int:
        return (index + nums[index]) % n

    # Step 1: Try starting from each index
    for i in range(n):
        # Step 2: Check if current element already marked (visited)
        if nums[i] == 0:
            continue

        # Step 3: Initialize slow and fast pointers
        slow = i
        fast = i

        # Step 4: Check direction (all moves must be same direction)
        is_forward = nums[i] > 0

        # Step 5: Move pointers with cycle detection
        while True:
            # Step 6: Move slow pointer
            slow = get_next(slow)

            # Step 7: Check if direction changed or single element loop
            if nums[slow] * nums[i] < 0 or abs(nums[slow] % n) == 0:
                break

            # Step 8: Move fast pointer twice
            fast = get_next(fast)
            if nums[fast] * nums[i] < 0 or abs(nums[fast] % n) == 0:
                break

            fast = get_next(fast)
            if nums[fast] * nums[i] < 0 or abs(nums[fast] % n) == 0:
                break

            # Step 9: Check if cycle detected
            if slow == fast:
                return True

        # Step 10: Mark all elements in this path as visited
        slow = i
        val = nums[i]
        while nums[slow] * val > 0:
            next_slow = get_next(slow)
            nums[slow] = 0
            slow = next_slow

    return False

# Example: [2,-1,1,2,2]
# From index 0: 0 -> 2 -> 3 -> 0 (cycle!)
# All moves forward (positive), valid cycle
```

#### TypeScript Solution
```typescript
function circularArrayLoop(nums: number[]): boolean {
    const n = nums.length;

    const getNext = (index: number): number => {
        return (index + nums[index] + n * 1000) % n;  // Handle negatives
    };

    for (let i = 0; i < n; i++) {
        if (nums[i] === 0) continue;

        let slow = i;
        let fast = i;
        const isForward = nums[i] > 0;

        while (true) {
            slow = getNext(slow);

            if (nums[slow] * nums[i] < 0 || Math.abs(nums[slow] % n) === 0) {
                break;
            }

            fast = getNext(fast);
            if (nums[fast] * nums[i] < 0 || Math.abs(nums[fast] % n) === 0) {
                break;
            }

            fast = getNext(fast);
            if (nums[fast] * nums[i] < 0 || Math.abs(nums[fast] % n) === 0) {
                break;
            }

            if (slow === fast) {
                return true;
            }
        }

        // Mark visited
        slow = i;
        const val = nums[i];
        while (nums[slow] * val > 0) {
            const nextSlow = getNext(slow);
            nums[slow] = 0;
            slow = nextSlow;
        }
    }

    return false;
}
```

**Time Complexity**: O(n²) - each element visited at most n times
**Space Complexity**: O(1) - only using pointers

---

### Problem 9: Find the Duplicate Number
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/find-the-duplicate-number/](https://leetcode.com/problems/find-the-duplicate-number/)

**Description**: Find the duplicate number in array of n+1 integers where each integer is in range [1, n].

#### Python Solution
```python
def findDuplicate(nums: List[int]) -> int:
    # Step 1: Treat array as linked list
    # nums[i] points to nums[nums[i]]
    # Key insight: Duplicate creates a cycle

    # Step 2: Phase 1 - Detect cycle (like Linked List Cycle II)
    slow = nums[0]
    fast = nums[0]

    # Step 3: Find meeting point
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]

        if slow == fast:
            break

    # Step 4: Phase 2 - Find cycle entrance (duplicate number)
    slow = nums[0]

    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]

    # Step 5: Return duplicate
    return slow

# Example: [1,3,4,2,2]
# Index:   [0,1,2,3,4]
# Think of as: 0->1->3->2->4->2 (cycle at 2)
#
# Visualization:
#   1 -> 3 -> 2 -> 4
#             ↑    ↓
#             ← ← ←
#
# Following pointers:
# slow: 0 -> 1 -> 3 -> 2 -> 4 -> 2
# fast: 0 -> 1 -> 3 -> 2 -> 4 -> 2 -> 4
# They meet at some point in cycle, then find entrance (2)
```

#### TypeScript Solution
```typescript
function findDuplicate(nums: number[]): number {
    // Phase 1: Find meeting point
    let slow = nums[0];
    let fast = nums[0];

    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow !== fast);

    // Phase 2: Find cycle entrance
    slow = nums[0];

    while (slow !== fast) {
        slow = nums[slow];
        fast = nums[fast];
    }

    return slow;
}
```

**Time Complexity**: O(n) - linear traversal
**Space Complexity**: O(1) - only pointers (no modification allowed)

---

### Problem 10: Intersection of Two Linked Lists
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/intersection-of-two-linked-lists/](https://leetcode.com/problems/intersection-of-two-linked-lists/)

**Description**: Find the node where two linked lists intersect.

#### Python Solution
```python
def getIntersectionNode(headA: ListNode, headB: ListNode) -> ListNode:
    # Step 1: Handle edge cases
    if not headA or not headB:
        return None

    # Step 2: Initialize two pointers
    ptrA = headA
    ptrB = headB

    # Step 3: Traverse both lists
    # Key insight: When a pointer reaches end, redirect to other list's head
    # This equalizes the path lengths
    while ptrA != ptrB:
        # Step 4: Move ptrA (switch to B if at end)
        ptrA = ptrA.next if ptrA else headB

        # Step 5: Move ptrB (switch to A if at end)
        ptrB = ptrB.next if ptrB else headA

    # Step 6: Return intersection (or None if no intersection)
    return ptrA

# Why this works:
# List A: a1 -> a2 -> c1 -> c2 -> c3
# List B: b1 -> b2 -> b3 -> c1 -> c2 -> c3
#
# Path of ptrA: a1 -> a2 -> c1 -> c2 -> c3 -> b1 -> b2 -> b3 -> c1 (meet here)
# Path of ptrB: b1 -> b2 -> b3 -> c1 -> c2 -> c3 -> a1 -> a2 -> c1 (meet here)
#
# Both travel: len(A) + len(B) - len(common)
# They meet at intersection point!
```

#### TypeScript Solution
```typescript
function getIntersectionNode(headA: ListNode | null, headB: ListNode | null): ListNode | null {
    // Handle edge cases
    if (!headA || !headB) return null;

    // Initialize pointers
    let ptrA: ListNode | null = headA;
    let ptrB: ListNode | null = headB;

    // Traverse until they meet
    while (ptrA !== ptrB) {
        ptrA = ptrA ? ptrA.next : headB;
        ptrB = ptrB ? ptrB.next : headA;
    }

    return ptrA;
}
```

**Time Complexity**: O(m + n) - traverse both lists
**Space Complexity**: O(1) - only two pointers

---

### Problem 11: Rotate List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/rotate-list/](https://leetcode.com/problems/rotate-list/)

**Description**: Rotate linked list to the right by k places.

#### Python Solution
```python
def rotateRight(head: ListNode, k: int) -> ListNode:
    # Step 1: Handle edge cases
    if not head or not head.next or k == 0:
        return head

    # Step 2: Find length and make circular
    length = 1
    tail = head

    while tail.next:
        tail = tail.next
        length += 1

    # Step 3: Connect tail to head (make circular)
    tail.next = head

    # Step 4: Calculate actual rotations needed
    # k might be larger than length
    k = k % length

    # Step 5: Find new tail (length - k - 1 steps from head)
    steps = length - k - 1
    new_tail = head

    for _ in range(steps):
        new_tail = new_tail.next

    # Step 6: Set new head and break circle
    new_head = new_tail.next
    new_tail.next = None

    return new_head

# Example: [1,2,3,4,5], k=2
# Original: 1 -> 2 -> 3 -> 4 -> 5
# After rotation by 2: 4 -> 5 -> 1 -> 2 -> 3
#
# Steps:
# 1. length = 5
# 2. Make circular: 1->2->3->4->5->1
# 3. k = 2 % 5 = 2
# 4. Find new tail at position 5-2-1=2: node 3
# 5. New head = node 4
# 6. Break: 4 -> 5 -> 1 -> 2 -> 3 -> null
```

#### TypeScript Solution
```typescript
function rotateRight(head: ListNode | null, k: number): ListNode | null {
    // Step 1: Edge cases
    if (!head || !head.next || k === 0) return head;

    // Step 2: Find length and tail
    let length = 1;
    let tail = head;

    while (tail.next) {
        tail = tail.next;
        length++;
    }

    // Step 3: Make circular
    tail.next = head;

    // Step 4: Calculate actual rotations
    k = k % length;

    // Step 5: Find new tail
    const steps = length - k - 1;
    let newTail = head;

    for (let i = 0; i < steps; i++) {
        newTail = newTail!.next!;
    }

    // Step 6: Set new head and break circle
    const newHead = newTail.next;
    newTail.next = null;

    return newHead;
}
```

**Time Complexity**: O(n) - traverse list twice
**Space Complexity**: O(1) - only using pointers

---

### Problem 12: Swap Nodes in Pairs
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/swap-nodes-in-pairs/](https://leetcode.com/problems/swap-nodes-in-pairs/)

**Description**: Swap every two adjacent nodes in linked list.

#### Python Solution
```python
def swapPairs(head: ListNode) -> ListNode:
    # Step 1: Create dummy node for easier handling
    dummy = ListNode(0)
    dummy.next = head
    prev = dummy

    # Step 2: Iterate through pairs
    while head and head.next:
        # Step 3: Identify nodes to swap
        first = head
        second = head.next

        # Step 4: Perform swap
        # prev -> first -> second -> rest
        # becomes
        # prev -> second -> first -> rest
        prev.next = second
        first.next = second.next
        second.next = first

        # Step 5: Move pointers for next iteration
        prev = first
        head = first.next

    # Step 6: Return new head
    return dummy.next

# Visualization for [1,2,3,4]:
# Initial: dummy -> 1 -> 2 -> 3 -> 4
#
# First swap (1 and 2):
#   dummy -> 2 -> 1 -> 3 -> 4
#            ↑    ↑
#          second first
#
# Move prev to first (now at 1), head to 3
#   dummy -> 2 -> 1 -> 3 -> 4
#                 ↑    ↑
#                prev head
#
# Second swap (3 and 4):
#   dummy -> 2 -> 1 -> 4 -> 3
#
# Result: [2,1,4,3]
```

#### TypeScript Solution
```typescript
function swapPairs(head: ListNode | null): ListNode | null {
    // Step 1: Create dummy
    const dummy = new ListNode(0);
    dummy.next = head;
    let prev: ListNode = dummy;

    // Step 2: Iterate through pairs
    while (head && head.next) {
        // Step 3: Identify nodes
        const first = head;
        const second = head.next;

        // Step 4: Swap
        prev.next = second;
        first.next = second.next;
        second.next = first;

        // Step 5: Move pointers
        prev = first;
        head = first.next;
    }

    return dummy.next;
}
```

**Time Complexity**: O(n) - single pass through list
**Space Complexity**: O(1) - only using pointers

---

### Problem 13: Sort List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/sort-list/](https://leetcode.com/problems/sort-list/)

**Description**: Sort a linked list in O(n log n) time and O(1) space.

#### Python Solution
```python
def sortList(head: ListNode) -> ListNode:
    # Step 1: Base case
    if not head or not head.next:
        return head

    # Step 2: Find middle using fast & slow pointers
    slow = head
    fast = head
    prev = None

    while fast and fast.next:
        prev = slow
        slow = slow.next
        fast = fast.next.next

    # Step 3: Split list into two halves
    prev.next = None

    # Step 4: Recursively sort both halves
    left = sortList(head)
    right = sortList(slow)

    # Step 5: Merge sorted halves
    return merge(left, right)

def merge(l1: ListNode, l2: ListNode) -> ListNode:
    # Step 6: Merge two sorted lists
    dummy = ListNode(0)
    curr = dummy

    while l1 and l2:
        if l1.val < l2.val:
            curr.next = l1
            l1 = l1.next
        else:
            curr.next = l2
            l2 = l2.next
        curr = curr.next

    # Step 7: Attach remaining nodes
    curr.next = l1 if l1 else l2

    return dummy.next

# Example: [4,2,1,3]
# Split: [4,2] and [1,3]
# Split again: [4], [2] and [1], [3]
# Merge: [2,4] and [1,3]
# Final merge: [1,2,3,4]
```

#### TypeScript Solution
```typescript
function sortList(head: ListNode | null): ListNode | null {
    // Base case
    if (!head || !head.next) return head;

    // Find middle
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;
    let prev: ListNode | null = null;

    while (fast && fast.next) {
        prev = slow;
        slow = slow!.next;
        fast = fast.next.next;
    }

    // Split
    prev!.next = null;

    // Sort recursively
    const left = sortList(head);
    const right = sortList(slow);

    // Merge
    return merge(left, right);
}

function merge(l1: ListNode | null, l2: ListNode | null): ListNode | null {
    const dummy = new ListNode(0);
    let curr = dummy;

    while (l1 && l2) {
        if (l1.val < l2.val) {
            curr.next = l1;
            l1 = l1.next;
        } else {
            curr.next = l2;
            l2 = l2.next;
        }
        curr = curr.next;
    }

    curr.next = l1 || l2;

    return dummy.next;
}
```

**Time Complexity**: O(n log n) - merge sort
**Space Complexity**: O(log n) - recursion stack

---

### Problem 14: Odd Even Linked List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/odd-even-linked-list/](https://leetcode.com/problems/odd-even-linked-list/)

**Description**: Group odd nodes together followed by even nodes (by position, not value).

#### Python Solution
```python
def oddEvenList(head: ListNode) -> ListNode:
    # Step 1: Handle edge cases
    if not head or not head.next:
        return head

    # Step 2: Initialize pointers
    # odd points to current odd position node
    # even points to current even position node
    odd = head
    even = head.next
    even_head = even  # Save head of even list

    # Step 3: Rearrange nodes
    while even and even.next:
        # Step 4: Connect odd nodes
        odd.next = even.next
        odd = odd.next

        # Step 5: Connect even nodes
        even.next = odd.next
        even = even.next

    # Step 6: Connect odd list to even list
    odd.next = even_head

    return head

# Visualization for [1,2,3,4,5]:
# Initial:
#   1 -> 2 -> 3 -> 4 -> 5
#   ↑    ↑
#  odd  even
#
# After first iteration:
#   1 -> 3 -> 2 -> 4 -> 5
#        ↑         ↑
#       odd       even
#
# After second iteration:
#   1 -> 3 -> 5    2 -> 4
#             ↑         ↑
#            odd       even
#
# Connect odd to even_head:
#   1 -> 3 -> 5 -> 2 -> 4
```

#### TypeScript Solution
```typescript
function oddEvenList(head: ListNode | null): ListNode | null {
    // Step 1: Edge cases
    if (!head || !head.next) return head;

    // Step 2: Initialize
    let odd = head;
    let even = head.next;
    const evenHead = even;

    // Step 3: Rearrange
    while (even && even.next) {
        // Connect odd nodes
        odd.next = even.next;
        odd = odd.next;

        // Connect even nodes
        even.next = odd.next;
        even = even.next;
    }

    // Step 4: Connect lists
    odd.next = evenHead;

    return head;
}
```

**Time Complexity**: O(n) - single pass
**Space Complexity**: O(1) - only pointers

---

### Problem 15: Split Linked List in Parts
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/split-linked-list-in-parts/](https://leetcode.com/problems/split-linked-list-in-parts/)

**Description**: Split linked list into k consecutive parts with lengths differing by at most 1.

#### Python Solution
```python
def splitListToParts(head: ListNode, k: int) -> List[ListNode]:
    # Step 1: Calculate length of list
    length = 0
    curr = head

    while curr:
        length += 1
        curr = curr.next

    # Step 2: Calculate size of each part
    part_size = length // k  # Minimum size of each part
    extra = length % k       # Number of parts that get 1 extra node

    # Step 3: Initialize result array
    result = []
    curr = head

    # Step 4: Create k parts
    for i in range(k):
        # Step 5: Save head of current part
        part_head = curr

        # Step 6: Calculate size of this part
        # First 'extra' parts get part_size + 1 nodes
        current_part_size = part_size + (1 if i < extra else 0)

        # Step 7: Move to end of current part
        for j in range(current_part_size - 1):
            if curr:
                curr = curr.next

        # Step 8: Split the list
        if curr:
            next_part = curr.next
            curr.next = None
            curr = next_part

        # Step 9: Add part to result
        result.append(part_head)

    return result

# Example: [1,2,3,4,5,6,7,8,9,10], k=3
# length = 10, part_size = 3, extra = 1
# Part 1: size = 4 (3+1) -> [1,2,3,4]
# Part 2: size = 3 -> [5,6,7]
# Part 3: size = 3 -> [8,9,10]
```

#### TypeScript Solution
```typescript
function splitListToParts(head: ListNode | null, k: number): Array<ListNode | null> {
    // Step 1: Calculate length
    let length = 0;
    let curr = head;

    while (curr) {
        length++;
        curr = curr.next;
    }

    // Step 2: Calculate sizes
    const partSize = Math.floor(length / k);
    const extra = length % k;

    // Step 3: Create parts
    const result: Array<ListNode | null> = [];
    curr = head;

    for (let i = 0; i < k; i++) {
        const partHead = curr;
        const currentPartSize = partSize + (i < extra ? 1 : 0);

        // Move to end of part
        for (let j = 0; j < currentPartSize - 1; j++) {
            if (curr) {
                curr = curr.next;
            }
        }

        // Split
        if (curr) {
            const nextPart = curr.next;
            curr.next = null;
            curr = nextPart;
        }

        result.push(partHead);
    }

    return result;
}
```

**Time Complexity**: O(n + k) - traverse list once + create k parts
**Space Complexity**: O(k) - output array of k parts

---

## Summary

The **Fast & Slow Pointers** pattern is elegant and powerful for linked list problems. Key takeaways:

1. **Cycle Detection**: Fast eventually catches slow if cycle exists
2. **Finding Middle**: When fast reaches end, slow is at middle
3. **Cycle Start**: Mathematical relationship between meeting point and cycle start
4. **Space Efficiency**: O(1) space alternative to using hashsets
5. **Speed Ratio**: Usually fast moves 2x speed of slow, but can be adjusted

This pattern demonstrates the beauty of algorithmic thinking - solving complex problems with simple pointer manipulation!
