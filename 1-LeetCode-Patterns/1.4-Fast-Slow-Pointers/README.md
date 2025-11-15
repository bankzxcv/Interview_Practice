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

#### 1. The Race Track Analogy - Understanding Fast & Slow Pointers

Think of fast and slow pointers as two runners on a track:
```
🐢 = Slow Pointer (Tortoise) - moves 1 step at a time
🐰 = Fast Pointer (Hare) - moves 2 steps at a time

Starting Line:
    🐢🐰
    ↓
[Start] -> [1] -> [2] -> [3] -> [4] -> [5] -> [Finish]

After 1 Move:
    🐢      🐰
    ↓       ↓
[Start] -> [1] -> [2] -> [3] -> [4] -> [5] -> [Finish]

After 2 Moves:
            🐢              🐰
            ↓               ↓
[Start] -> [1] -> [2] -> [3] -> [4] -> [5] -> [Finish]

After 3 Moves:
                    🐢                      🐰
                    ↓                       ↓
[Start] -> [1] -> [2] -> [3] -> [4] -> [5] -> [Finish]

Result: When 🐰 reaches finish, 🐢 is at the middle!
```

#### 2. Cycle Detection - Complete Walkthrough

```
=== THE CIRCULAR TRACK ===

Imagine a circular race track where runners keep going in circles:

    [1] → [2] → [3]
     ↑           ↓
    [6] ← [5] ← [4]

This is a cycle! Let's watch our runners:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 0 (Initial Position):
    [1*] → [2] → [3]
     ↑           ↓
    [6] ← [5] ← [4]
    🐢🐰 both start at node 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1:
    [1] → [2*] → [3]
     ↑      🐢    ↓
    [6] ← [5] ← [4]
                  🐰
    🐢 moved 1 step → at node 2
    🐰 moved 2 steps → at node 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2:
    [1] → [2] → [3*]
     ↑           ↓
    [6] ← [5*] ← [4]
          🐰     🐢
    🐢 moved 1 step → at node 3
    🐰 moved 2 steps → at node 5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3:
    [1] → [2] → [3]
     ↑           ↓
    [6*] ← [5] ← [4*]
    🐰          🐢
    🐢 moved 1 step → at node 4
    🐰 moved 2 steps → at node 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 4:
    [1] → [2*] → [3]
     ↑     🐰    ↓
    [6] ← [5*] ← [4]
          🐢
    🐢 moved 1 step → at node 5
    🐰 moved 2 steps → at node 2 (wrapped around!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 5:
    [1] → [2] → [3]
     ↑           ↓
    [6*] ← [5] ← [4*]
    🐢🐰
    🐢 moved 1 step → at node 6
    🐰 moved 2 steps → at node 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 6:
    [1] → [2*] → [3]
     ↑    🐢🐰   ↓
    [6] ← [5] ← [4]

    🐢 moved 1 step → at node 2
    🐰 moved 2 steps → at node 2

    🎉 THEY MEET! CYCLE DETECTED! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY INSIGHT: In a cycle, fast pointer will ALWAYS catch slow pointer!
Like a faster runner lapping a slower one on a circular track.
```

#### 3. Finding Middle Element - Visual Journey

```
=== SCENARIO 1: ODD NUMBER OF NODES ===

List: [1] → [2] → [3] → [4] → [5] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Initial:
🐢🐰
 ↓
[1] → [2] → [3] → [4] → [5] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After Move 1:
      🐢      🐰
       ↓       ↓
[1] → [2] → [3] → [4] → [5] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After Move 2:
              🐢              🐰
               ↓               ↓
[1] → [2] → [3] → [4] → [5] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Final State:
              🐢                      🐰
               ↓                       ↓
[1] → [2] → [3] → [4] → [5] → NULL

🐰 reached end (NULL)
🐢 is at MIDDLE node (3)! ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== SCENARIO 2: EVEN NUMBER OF NODES ===

List: [1] → [2] → [3] → [4] → [5] → [6] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Initial:
🐢🐰
 ↓
[1] → [2] → [3] → [4] → [5] → [6] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After Move 1:
      🐢      🐰
       ↓       ↓
[1] → [2] → [3] → [4] → [5] → [6] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After Move 2:
              🐢              🐰
               ↓               ↓
[1] → [2] → [3] → [4] → [5] → [6] → NULL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After Move 3:
                      🐢                      🐰
                       ↓                       ↓
[1] → [2] → [3] → [4] → [5] → [6] → NULL

🐰 reached end (NULL)
🐢 is at SECOND MIDDLE node (4)! ✓
(For even length, we return the second of two middle nodes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 4. Finding Cycle Start - The Magic Formula

```
=== FINDING WHERE THE CYCLE BEGINS ===

Phase 1: Detect cycle and find meeting point

    [A] → [B] → [C] ← ─ ─ ─ ┐
                 ↓          │ (This is the CYCLE)
                [F] → [E] → [D]

    Distance from A to C = L (length before cycle)
    Cycle length = C

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Run fast & slow until they meet

    [A] → [B] → [C] ← ─ ─ ─ ┐
                 ↓          │
                [F] → [E*] → [D]
                      🐢🐰

    They meet at E! (meeting point)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 2: Find the cycle start (the magic part!)

Step 2: Reset slow to head, keep fast at meeting point
        Move BOTH at same speed (1 step each)

    🐢
    ↓
    [A] → [B] → [C] ← ─ ─ ─ ┐
                 ↓          │
                [F] → [E] → [D]
                      🐰

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After 1 move (both move 1 step):

          🐢
           ↓
    [A] → [B] → [C] ← ─ ─ ─ ┐
                 ↓          │
                [F*] → [E] → [D]
                🐰

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After 2 moves:

                  🐢🐰
                   ↓
    [A] → [B] → [C] ← ─ ─ ─ ┐
                 ↓          │
                [F] → [E] → [D]

    🎉 THEY MEET AT C - THE CYCLE START! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY THIS WORKS (The Mathematical Magic):

When they first meet in Phase 1:
  • slow traveled: L + k (L to enter cycle, k into cycle)
  • fast traveled: L + k + nC (same path + n full cycles)
  • fast is 2x speed: 2(L + k) = L + k + nC

Simplifying:
  2L + 2k = L + k + nC
  L + k = nC
  L = nC - k

This means:
  Distance from HEAD to CYCLE START (L)
  = Distance from MEETING POINT to CYCLE START (nC - k)

So moving both pointers at same speed from these positions,
they'll meet exactly at the cycle start!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 5. Why Fast & Slow Works - The Intuition

```
╔═══════════════════════════════════════════════════════════╗
║  KEY PRINCIPLE: Gap Reduction in Cycles                  ║
╚═══════════════════════════════════════════════════════════╝

In a cycle, if fast is behind slow:

Gap = 3 nodes
         ↓―――――↓
    [1] → [2] → [3] → [4] → [5]
     ↑                       ↓
     └───────[8] ← [7] ← [6]←┘
    🐢                   🐰

After 1 iteration:
  • slow moves 1 step forward
  • fast moves 2 steps forward
  • Gap REDUCES by 1

Gap = 2 nodes
         ↓―――↓
    [1] → [2] → [3] → [4] → [5]
     ↑                       ↓
     └───────[8] ← [7] ← [6]←┘
          🐢              🐰

After another iteration:
Gap = 1 node
         ↓―↓
    [1] → [2] → [3] → [4] → [5]
     ↑                       ↓
     └───────[8] ← [7] ← [6]←┘
               🐢          🐰

After another iteration:
Gap = 0 nodes (MEET!)
         🐢🐰
    [1] → [2] → [3] → [4] → [5]
     ↑                       ↓
     └───────[8] ← [7] ← [6]←┘

GUARANTEED to meet in cycle!
No cycle? Fast reaches NULL first!

╚═══════════════════════════════════════════════════════════╝
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

### Problem 16: Delete the Middle Node of a Linked List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/](https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/)

**Description**: Delete the middle node of a linked list and return the head. For a list of size n, middle node is the ⌊n/2⌋th node (0-indexed).

#### Python Solution
```python
def deleteMiddle(head: ListNode) -> ListNode:
    # Step 1: Handle edge case - single node
    if not head or not head.next:
        return None

    # Step 2: Create dummy node to handle edge cases
    dummy = ListNode(0)
    dummy.next = head

    # Step 3: Initialize fast and slow pointers
    # We need prev pointer to delete middle
    slow = dummy
    fast = head

    # Step 4: Move pointers - fast moves 2x speed
    # When fast reaches end, slow will be at node BEFORE middle
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # Step 5: Delete middle node
    # slow is at node before middle
    slow.next = slow.next.next

    # Step 6: Return new head
    return dummy.next

# Visualization for [1,2,3,4,5]:
#
# Initial state:
#   dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
#   slow=dummy, fast=1
#
# After iteration 1:
#   dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
#            ↑         ↑
#           slow      fast
#
# After iteration 2:
#   dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
#                 ↑              ↑
#                slow          fast
#
# Fast reached end, slow at node 2 (before middle 3)
# Delete: slow.next = slow.next.next
# Result: [1,2,4,5] (middle node 3 removed)
```

#### TypeScript Solution
```typescript
function deleteMiddle(head: ListNode | null): ListNode | null {
    // Step 1: Edge case
    if (!head || !head.next) return null;

    // Step 2: Create dummy
    const dummy = new ListNode(0);
    dummy.next = head;

    // Step 3: Initialize pointers
    let slow: ListNode = dummy;
    let fast: ListNode | null = head;

    // Step 4: Move pointers
    while (fast && fast.next) {
        slow = slow.next!;
        fast = fast.next.next;
    }

    // Step 5: Delete middle
    slow.next = slow.next!.next;

    return dummy.next;
}
```

**Time Complexity**: O(n) - single pass through list
**Space Complexity**: O(1) - only using pointers

---

### Problem 17: Maximum Twin Sum of a Linked List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/maximum-twin-sum-of-a-linked-list/](https://leetcode.com/problems/maximum-twin-sum-of-a-linked-list/)

**Description**: In a linked list of even length n, the ith node's twin is the (n-1-i)th node. Return maximum twin sum.

#### Python Solution
```python
def pairSum(head: ListNode) -> int:
    # Step 1: Find middle using fast & slow pointers
    slow = head
    fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # Step 2: Reverse second half of list
    # slow is now at middle
    prev = None
    curr = slow

    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node

    # Step 3: Calculate twin sums
    # First half: head -> ... -> middle
    # Second half (reversed): prev -> ... -> middle
    max_sum = 0
    first = head
    second = prev  # Head of reversed second half

    while second:
        # Step 4: Calculate current twin sum
        twin_sum = first.val + second.val
        # Step 5: Update maximum
        max_sum = max(max_sum, twin_sum)

        # Step 6: Move to next pair
        first = first.next
        second = second.next

    return max_sum

# Visualization for [5,4,2,1]:
#
# Original: 5 -> 4 -> 2 -> 1
#           0    1    2    3  (indices)
#
# Twin pairs:
#   (0,3): 5 + 1 = 6
#   (1,2): 4 + 2 = 6
#
# Step 1: Find middle
#   5 -> 4 -> 2 -> 1
#             ↑
#           slow (middle)
#
# Step 2: Reverse second half
#   First half: 5 -> 4
#   Second half (reversed): 1 -> 2
#
# Step 3: Calculate sums
#   5 + 1 = 6 ✓
#   4 + 2 = 6 ✓
#   max = 6
```

#### TypeScript Solution
```typescript
function pairSum(head: ListNode | null): number {
    // Step 1: Find middle
    let slow = head;
    let fast = head;

    while (fast && fast.next) {
        slow = slow!.next;
        fast = fast.next.next;
    }

    // Step 2: Reverse second half
    let prev: ListNode | null = null;
    let curr = slow;

    while (curr) {
        const nextNode = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextNode;
    }

    // Step 3: Calculate max sum
    let maxSum = 0;
    let first = head;
    let second = prev;

    while (second) {
        const twinSum = first!.val + second.val;
        maxSum = Math.max(maxSum, twinSum);

        first = first!.next;
        second = second.next;
    }

    return maxSum;
}
```

**Time Complexity**: O(n) - traverse list twice
**Space Complexity**: O(1) - only using pointers

---

### Problem 18: Reverse Nodes in k-Group
**Difficulty**: Hard
**LeetCode Link**: [https://leetcode.com/problems/reverse-nodes-in-k-group/](https://leetcode.com/problems/reverse-nodes-in-k-group/)

**Description**: Reverse nodes of linked list k at a time. If nodes remaining are less than k, leave them as is.

#### Python Solution
```python
def reverseKGroup(head: ListNode, k: int) -> ListNode:
    # Step 1: Check if we have k nodes to reverse
    def has_k_nodes(node: ListNode, k: int) -> bool:
        count = 0
        while node and count < k:
            count += 1
            node = node.next
        return count == k

    # Step 2: Reverse k nodes starting from head
    def reverse_k_nodes(head: ListNode, k: int):
        prev = None
        curr = head

        for _ in range(k):
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node

        return prev, curr  # New head, next segment start

    # Step 3: Main logic
    if not head or k == 1:
        return head

    # Step 4: Use dummy node
    dummy = ListNode(0)
    dummy.next = head
    prev_group = dummy

    while True:
        # Step 5: Check if we have k nodes
        if not has_k_nodes(prev_group.next, k):
            break

        # Step 6: Save positions
        group_start = prev_group.next
        next_group = group_start
        for _ in range(k):
            next_group = next_group.next

        # Step 7: Reverse k nodes
        new_group_head, _ = reverse_k_nodes(group_start, k)

        # Step 8: Connect reversed group
        prev_group.next = new_group_head
        group_start.next = next_group

        # Step 9: Move to next group
        prev_group = group_start

    return dummy.next

# Visualization for [1,2,3,4,5], k=2:
#
# Original: 1 -> 2 -> 3 -> 4 -> 5
#
# Group 1 (reverse 1,2):
#   2 -> 1 -> 3 -> 4 -> 5
#
# Group 2 (reverse 3,4):
#   2 -> 1 -> 4 -> 3 -> 5
#
# Group 3 (only 1 node left, don't reverse):
#   Final: 2 -> 1 -> 4 -> 3 -> 5
```

#### TypeScript Solution
```typescript
function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
    // Helper: Check if k nodes available
    const hasKNodes = (node: ListNode | null, k: number): boolean => {
        let count = 0;
        while (node && count < k) {
            count++;
            node = node.next;
        }
        return count === k;
    };

    // Helper: Reverse k nodes
    const reverseK = (head: ListNode, k: number): [ListNode, ListNode | null] => {
        let prev: ListNode | null = null;
        let curr: ListNode | null = head;

        for (let i = 0; i < k; i++) {
            const nextNode = curr!.next;
            curr!.next = prev;
            prev = curr;
            curr = nextNode;
        }

        return [prev!, curr];
    };

    if (!head || k === 1) return head;

    const dummy = new ListNode(0);
    dummy.next = head;
    let prevGroup: ListNode = dummy;

    while (true) {
        if (!hasKNodes(prevGroup.next, k)) break;

        const groupStart = prevGroup.next!;
        let nextGroup: ListNode | null = groupStart;

        for (let i = 0; i < k; i++) {
            nextGroup = nextGroup!.next;
        }

        const [newHead, _] = reverseK(groupStart, k);

        prevGroup.next = newHead;
        groupStart.next = nextGroup;
        prevGroup = groupStart;
    }

    return dummy.next;
}
```

**Time Complexity**: O(n) - traverse each node once
**Space Complexity**: O(1) - only using pointers

---

### Problem 19: Add Two Numbers II
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/add-two-numbers-ii/](https://leetcode.com/problems/add-two-numbers-ii/)

**Description**: Add two numbers represented by linked lists where most significant digit comes first. Return the sum as a linked list.

#### Python Solution
```python
def addTwoNumbers(l1: ListNode, l2: ListNode) -> ListNode:
    # Step 1: Reverse both lists
    def reverse_list(head: ListNode) -> ListNode:
        prev = None
        curr = head

        while curr:
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node

        return prev

    # Step 2: Reverse input lists
    r1 = reverse_list(l1)
    r2 = reverse_list(l2)

    # Step 3: Add numbers digit by digit
    dummy = ListNode(0)
    curr = dummy
    carry = 0

    while r1 or r2 or carry:
        # Step 4: Get current digits
        val1 = r1.val if r1 else 0
        val2 = r2.val if r2 else 0

        # Step 5: Calculate sum
        total = val1 + val2 + carry
        carry = total // 10
        digit = total % 10

        # Step 6: Create new node
        curr.next = ListNode(digit)
        curr = curr.next

        # Step 7: Move to next digits
        r1 = r1.next if r1 else None
        r2 = r2.next if r2 else None

    # Step 8: Reverse result to get correct order
    return reverse_list(dummy.next)

# Visualization for l1 = [7,2,4,3], l2 = [5,6,4]:
# (represents 7243 + 564 = 7807)
#
# Step 1: Reverse lists
#   r1: 3 -> 4 -> 2 -> 7
#   r2: 4 -> 6 -> 5
#
# Step 2: Add digit by digit (right to left)
#   3 + 4 = 7, carry = 0
#   4 + 6 = 10, carry = 1, digit = 0
#   2 + 5 + 1 = 8, carry = 0
#   7 + 0 = 7, carry = 0
#
#   Result (reversed): 7 -> 0 -> 8 -> 7
#
# Step 3: Reverse to get final answer
#   Final: 7 -> 8 -> 0 -> 7 (represents 7807)
```

#### TypeScript Solution
```typescript
function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
    // Helper: Reverse list
    const reverseList = (head: ListNode | null): ListNode | null => {
        let prev: ListNode | null = null;
        let curr = head;

        while (curr) {
            const nextNode = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextNode;
        }

        return prev;
    };

    // Reverse inputs
    let r1 = reverseList(l1);
    let r2 = reverseList(l2);

    // Add numbers
    const dummy = new ListNode(0);
    let curr = dummy;
    let carry = 0;

    while (r1 || r2 || carry) {
        const val1 = r1 ? r1.val : 0;
        const val2 = r2 ? r2.val : 0;

        const total = val1 + val2 + carry;
        carry = Math.floor(total / 10);
        const digit = total % 10;

        curr.next = new ListNode(digit);
        curr = curr.next;

        r1 = r1 ? r1.next : null;
        r2 = r2 ? r2.next : null;
    }

    // Reverse result
    return reverseList(dummy.next);
}
```

**Time Complexity**: O(max(m, n)) - where m, n are lengths of lists
**Space Complexity**: O(1) - excluding output list

---

### Problem 20: Copy List with Random Pointer
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/copy-list-with-random-pointer/](https://leetcode.com/problems/copy-list-with-random-pointer/)

**Description**: Deep copy a linked list where each node has a next and random pointer.

#### Python Solution
```python
class Node:
    def __init__(self, val=0, next=None, random=None):
        self.val = val
        self.next = next
        self.random = random

def copyRandomList(head: Node) -> Node:
    if not head:
        return None

    # Step 1: Create interleaved list (original -> copy -> original -> copy)
    # Original: A -> B -> C
    # After: A -> A' -> B -> B' -> C -> C'
    curr = head

    while curr:
        # Create copy and insert after original
        copy = Node(curr.val)
        copy.next = curr.next
        curr.next = copy
        curr = copy.next

    # Step 2: Set random pointers for copied nodes
    curr = head

    while curr:
        if curr.random:
            # Copy's random = original's random's next (which is the copy)
            curr.next.random = curr.random.next
        curr = curr.next.next

    # Step 3: Separate the two lists
    # Restore original and extract copy
    dummy = Node(0)
    copy_curr = dummy
    curr = head

    while curr:
        # Extract copy
        copy_node = curr.next
        copy_curr.next = copy_node
        copy_curr = copy_node

        # Restore original
        curr.next = copy_node.next
        curr = curr.next

    return dummy.next

# Visualization for [[7,null],[13,0],[11,4],[10,2],[1,0]]:
#
# Original list:
#   7 -> 13 -> 11 -> 10 -> 1
#   ↓     ↓     ↓     ↓    ↓
#  null   7     1     11   7
#
# Step 1: Create interleaved
#   7 -> 7' -> 13 -> 13' -> 11 -> 11' -> 10 -> 10' -> 1 -> 1'
#
# Step 2: Set random pointers
#   7'.random = 7.random.next = null.next = null
#   13'.random = 13.random.next = 7.next = 7'
#   (and so on...)
#
# Step 3: Separate lists
#   Copy: 7' -> 13' -> 11' -> 10' -> 1'
#   (with all random pointers correctly set)
```

#### TypeScript Solution
```typescript
class Node {
    val: number;
    next: Node | null;
    random: Node | null;

    constructor(val?: number, next?: Node, random?: Node) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
        this.random = (random === undefined ? null : random);
    }
}

function copyRandomList(head: Node | null): Node | null {
    if (!head) return null;

    // Step 1: Create interleaved list
    let curr: Node | null = head;

    while (curr) {
        const copy = new Node(curr.val);
        copy.next = curr.next;
        curr.next = copy;
        curr = copy.next;
    }

    // Step 2: Set random pointers
    curr = head;

    while (curr) {
        if (curr.random) {
            curr.next!.random = curr.random.next;
        }
        curr = curr.next!.next;
    }

    // Step 3: Separate lists
    const dummy = new Node(0);
    let copyCurr = dummy;
    curr = head;

    while (curr) {
        const copyNode = curr.next!;
        copyCurr.next = copyNode;
        copyCurr = copyNode;

        curr.next = copyNode.next;
        curr = curr.next;
    }

    return dummy.next;
}
```

**Time Complexity**: O(n) - three passes through list
**Space Complexity**: O(1) - excluding output (in-place interleaving)

---

### Problem 21: Flatten a Multilevel Doubly Linked List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/](https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/)

**Description**: Flatten a multilevel doubly linked list where nodes can have a child pointer to another list.

#### Python Solution
```python
class Node:
    def __init__(self, val=0, prev=None, next=None, child=None):
        self.val = val
        self.prev = prev
        self.next = next
        self.child = child

def flatten(head: Node) -> Node:
    if not head:
        return None

    # Step 1: Use pointer to traverse and flatten
    curr = head

    while curr:
        # Step 2: If no child, just move forward
        if not curr.child:
            curr = curr.next
            continue

        # Step 3: Has child - need to flatten
        # Save next node
        next_node = curr.next

        # Step 4: Find tail of child list
        child = curr.child
        tail = child

        while tail.next:
            tail = tail.next

        # Step 5: Connect current to child
        curr.next = child
        child.prev = curr
        curr.child = None

        # Step 6: Connect child's tail to saved next
        if next_node:
            tail.next = next_node
            next_node.prev = tail

        # Step 7: Continue from current position
        # (will now traverse through flattened child)
        curr = curr.next

    return head

# Visualization:
#
# Original multilevel list:
#   1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6
#              |
#              7 <-> 8 <-> 9 <-> 10
#                   |
#                   11 <-> 12
#
# Step-by-step flattening:
#
# At node 3 (has child 7):
#   1. Save next = 4
#   2. Find tail of child list (10)
#   3. Connect: 3 -> 7, 7 <- 3
#   4. Connect: 10 -> 4, 4 <- 10
#   5. Remove child pointer
#
#   1 <-> 2 <-> 3 <-> 7 <-> 8 <-> 9 <-> 10 <-> 4 <-> 5 <-> 6
#                            |
#                            11 <-> 12
#
# At node 8 (has child 11):
#   1. Save next = 9
#   2. Find tail of child list (12)
#   3. Connect: 8 -> 11, 11 <- 8
#   4. Connect: 12 -> 9, 9 <- 12
#
# Final flattened list:
#   1 <-> 2 <-> 3 <-> 7 <-> 8 <-> 11 <-> 12 <-> 9 <-> 10 <-> 4 <-> 5 <-> 6
```

#### TypeScript Solution
```typescript
class Node {
    val: number;
    prev: Node | null;
    next: Node | null;
    child: Node | null;

    constructor(val?: number, prev?: Node, next?: Node, child?: Node) {
        this.val = (val === undefined ? 0 : val);
        this.prev = (prev === undefined ? null : prev);
        this.next = (next === undefined ? null : next);
        this.child = (child === undefined ? null : child);
    }
}

function flatten(head: Node | null): Node | null {
    if (!head) return null;

    let curr: Node | null = head;

    while (curr) {
        if (!curr.child) {
            curr = curr.next;
            continue;
        }

        const nextNode = curr.next;
        const child = curr.child;

        // Find tail of child
        let tail = child;
        while (tail.next) {
            tail = tail.next;
        }

        // Connect current to child
        curr.next = child;
        child.prev = curr;
        curr.child = null;

        // Connect tail to next
        if (nextNode) {
            tail.next = nextNode;
            nextNode.prev = tail;
        }

        curr = curr.next;
    }

    return head;
}
```

**Time Complexity**: O(n) - visit each node once
**Space Complexity**: O(1) - only using pointers

---

### Problem 22: Linked List Components
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/linked-list-components/](https://leetcode.com/problems/linked-list-components/)

**Description**: Given a linked list and array of values, count number of connected components (consecutive nodes whose values are in the array).

#### Python Solution
```python
def numComponents(head: ListNode, nums: List[int]) -> int:
    # Step 1: Convert array to set for O(1) lookup
    num_set = set(nums)

    # Step 2: Traverse list and count components
    components = 0
    curr = head
    in_component = False

    while curr:
        # Step 3: Check if current value is in set
        if curr.val in num_set:
            # Step 4: If not already in component, start new one
            if not in_component:
                components += 1
                in_component = True
        else:
            # Step 5: End of component
            in_component = False

        # Step 6: Move to next node
        curr = curr.next

    return components

# Visualization for head = [0,1,2,3], nums = [0,1,3]:
#
# List: 0 -> 1 -> 2 -> 3
#       ✓    ✓    ✗    ✓
#
# Traversal:
#   Node 0: in nums ✓, start component 1, in_component = True
#   Node 1: in nums ✓, continue component 1
#   Node 2: NOT in nums ✗, end component, in_component = False
#   Node 3: in nums ✓, start component 2, in_component = True
#
# Components:
#   Component 1: [0, 1]
#   Component 2: [3]
#
# Total: 2 components
#
# Another example: head = [0,1,2,3,4], nums = [0,3,1,4]:
#
# List: 0 -> 1 -> 2 -> 3 -> 4
#       ✓    ✓    ✗    ✓    ✓
#
# Components:
#   Component 1: [0, 1]
#   Component 2: [3, 4]
#
# Total: 2 components
```

#### TypeScript Solution
```typescript
function numComponents(head: ListNode | null, nums: number[]): number {
    // Step 1: Create set
    const numSet = new Set(nums);

    // Step 2: Count components
    let components = 0;
    let curr = head;
    let inComponent = false;

    while (curr) {
        if (numSet.has(curr.val)) {
            if (!inComponent) {
                components++;
                inComponent = true;
            }
        } else {
            inComponent = false;
        }

        curr = curr.next;
    }

    return components;
}
```

**Time Complexity**: O(n + m) - n for list traversal, m for set creation
**Space Complexity**: O(m) - set storage for m numbers

---

### Problem 23: Next Greater Node In Linked List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/next-greater-node-in-linked-list/](https://leetcode.com/problems/next-greater-node-in-linked-list/)

**Description**: For each node, find the value of the next greater node (first node with greater value to the right). Return 0 if none exists.

#### Python Solution
```python
def nextLargerNodes(head: ListNode) -> List[int]:
    # Step 1: Convert linked list to array for easier processing
    values = []
    curr = head

    while curr:
        values.append(curr.val)
        curr = curr.next

    # Step 2: Initialize result array with zeros
    n = len(values)
    result = [0] * n

    # Step 3: Use stack to find next greater elements
    # Stack stores indices of elements waiting for next greater
    stack = []

    # Step 4: Traverse array
    for i in range(n):
        # Step 5: While current element is greater than stack top
        # We found next greater for stack top
        while stack and values[stack[-1]] < values[i]:
            idx = stack.pop()
            result[idx] = values[i]

        # Step 6: Push current index to stack
        stack.append(i)

    # Step 7: Remaining elements in stack have no next greater
    # (already initialized to 0)

    return result

# Visualization for [2,1,5]:
#
# List: 2 -> 1 -> 5
# Index: 0    1    2
#
# Step-by-step:
#
# i=0, val=2:
#   stack = []
#   No elements to pop
#   Push 0: stack = [0]
#   result = [0, 0, 0]
#
# i=1, val=1:
#   stack = [0]
#   values[0]=2 > values[1]=1, don't pop
#   Push 1: stack = [0, 1]
#   result = [0, 0, 0]
#
# i=2, val=5:
#   stack = [0, 1]
#   values[1]=1 < values[2]=5 ✓
#     Pop 1, result[1] = 5
#   values[0]=2 < values[2]=5 ✓
#     Pop 0, result[0] = 5
#   Push 2: stack = [2]
#   result = [5, 5, 0]
#
# Final: [5, 5, 0]
#
# Explanation:
#   Node 2: next greater is 5
#   Node 1: next greater is 5
#   Node 5: no next greater (returns 0)
```

#### TypeScript Solution
```typescript
function nextLargerNodes(head: ListNode | null): number[] {
    // Step 1: Convert to array
    const values: number[] = [];
    let curr = head;

    while (curr) {
        values.push(curr.val);
        curr = curr.next;
    }

    // Step 2: Initialize result
    const n = values.length;
    const result = new Array(n).fill(0);

    // Step 3: Use stack
    const stack: number[] = [];

    for (let i = 0; i < n; i++) {
        while (stack.length > 0 && values[stack[stack.length - 1]] < values[i]) {
            const idx = stack.pop()!;
            result[idx] = values[i];
        }

        stack.push(i);
    }

    return result;
}
```

**Time Complexity**: O(n) - each element pushed/popped once
**Space Complexity**: O(n) - array and stack storage

---

### Problem 24: Remove Zero Sum Consecutive Nodes from Linked List
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/remove-zero-sum-consecutive-nodes-from-linked-list/](https://leetcode.com/problems/remove-zero-sum-consecutive-nodes-from-linked-list/)

**Description**: Remove all consecutive sequences of nodes that sum to 0.

#### Python Solution
```python
def removeZeroSumSublists(head: ListNode) -> ListNode:
    # Step 1: Create dummy node
    dummy = ListNode(0)
    dummy.next = head

    # Step 2: Use prefix sum and hashmap
    # Key: prefix sum, Value: node at that prefix sum
    prefix_sum = 0
    prefix_map = {0: dummy}

    # Step 3: First pass - record all prefix sums
    curr = head

    while curr:
        prefix_sum += curr.val
        # If prefix sum seen before, it means nodes in between sum to 0
        # Update map to point to current node (will remove intermediate nodes)
        prefix_map[prefix_sum] = curr
        curr = curr.next

    # Step 4: Second pass - rebuild list skipping zero-sum sequences
    prefix_sum = 0
    curr = dummy

    while curr:
        prefix_sum += curr.val
        # Jump to the last node with this prefix sum
        # This skips all zero-sum sequences
        curr.next = prefix_map[prefix_sum].next
        curr = curr.next

    return dummy.next

# Visualization for [1,2,-3,3,1]:
#
# Original: 1 -> 2 -> -3 -> 3 -> 1
#
# First pass - calculate prefix sums:
#   dummy(0): sum = 0
#   1: sum = 1
#   2: sum = 3
#   -3: sum = 0 (same as dummy! nodes 1,2,-3 sum to 0)
#   3: sum = 3 (same as node 2! node -3 alone or with 3 sum to 0)
#   1: sum = 4
#
# prefix_map after first pass:
#   0 -> node(-3)  (updated from dummy)
#   1 -> node(1)
#   3 -> node(3)   (updated from node(2))
#   4 -> node(1)
#
# Second pass - rebuild:
#   At dummy (sum=0): jump to prefix_map[0].next = node(3)
#   At node 3 (sum=3): jump to prefix_map[3].next = node(1)
#   At node 1 (sum=4): jump to prefix_map[4].next = null
#
# Result: 3 -> 1
#
# Another example: [1,2,3,-3,-2]:
#   Original: 1 -> 2 -> 3 -> -3 -> -2
#
#   Prefix sums:
#   1: sum=1
#   2: sum=3
#   3: sum=6
#   -3: sum=3 (nodes 3,-3 sum to 0)
#   -2: sum=1 (nodes 2,3,-3,-2 sum to 0)
#
#   Result: 1
```

#### TypeScript Solution
```typescript
function removeZeroSumSublists(head: ListNode | null): ListNode | null {
    // Step 1: Create dummy
    const dummy = new ListNode(0);
    dummy.next = head;

    // Step 2: First pass - record prefix sums
    let prefixSum = 0;
    const prefixMap = new Map<number, ListNode>();
    prefixMap.set(0, dummy);

    let curr: ListNode | null = head;

    while (curr) {
        prefixSum += curr.val;
        prefixMap.set(prefixSum, curr);
        curr = curr.next;
    }

    // Step 3: Second pass - rebuild list
    prefixSum = 0;
    curr = dummy;

    while (curr) {
        prefixSum += curr.val;
        curr.next = prefixMap.get(prefixSum)!.next;
        curr = curr.next;
    }

    return dummy.next;
}
```

**Time Complexity**: O(n) - two passes through list
**Space Complexity**: O(n) - hashmap storage

---

### Problem 25: Convert Binary Number in a Linked List to Integer
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/convert-binary-number-in-a-linked-list-to-integer/](https://leetcode.com/problems/convert-binary-number-in-a-linked-list-to-integer/)

**Description**: Convert a binary number represented as a linked list (most significant bit first) to decimal integer.

#### Python Solution
```python
def getDecimalValue(head: ListNode) -> int:
    # Step 1: Initialize result
    result = 0
    curr = head

    # Step 2: Traverse list
    # For each bit, shift result left and add current bit
    while curr:
        # Step 3: Shift left (multiply by 2) and add current bit
        result = result * 2 + curr.val
        # Step 4: Move to next node
        curr = curr.next

    # Step 5: Return decimal value
    return result

# Visualization for [1,0,1]:
# Binary: 101 = 1*4 + 0*2 + 1*1 = 5
#
# Step-by-step calculation:
#
# Initial: result = 0
#
# Node 1 (val=1):
#   result = 0 * 2 + 1 = 1
#   Binary so far: 1
#
# Node 2 (val=0):
#   result = 1 * 2 + 0 = 2
#   Binary so far: 10
#
# Node 3 (val=1):
#   result = 2 * 2 + 1 = 5
#   Binary so far: 101
#
# Final: 5
#
# Alternative approach - Understanding the math:
# For binary number b₃b₂b₁:
#   Decimal = b₃ * 2² + b₂ * 2¹ + b₁ * 2⁰
#
# We can rewrite as:
#   Decimal = ((b₃ * 2 + b₂) * 2 + b₁)
#
# This is what we compute iteratively!
#
# Example with [1,0,0,1]:
# Binary: 1001 = 9
#
#   Start: 0
#   After 1: 0*2+1 = 1
#   After 0: 1*2+0 = 2
#   After 0: 2*2+0 = 4
#   After 1: 4*2+1 = 9 ✓
```

#### TypeScript Solution
```typescript
function getDecimalValue(head: ListNode | null): number {
    // Step 1: Initialize
    let result = 0;
    let curr = head;

    // Step 2: Traverse and calculate
    while (curr) {
        // Shift left and add current bit
        result = result * 2 + curr.val;
        curr = curr.next;
    }

    return result;
}

// Alternative solution using bit manipulation:
function getDecimalValueBitwise(head: ListNode | null): number {
    let result = 0;
    let curr = head;

    while (curr) {
        // Left shift by 1 (equivalent to * 2)
        // Then OR with current bit
        result = (result << 1) | curr.val;
        curr = curr.next;
    }

    return result;
}
```

**Time Complexity**: O(n) - single pass through list
**Space Complexity**: O(1) - only using result variable

---

## Summary

The **Fast & Slow Pointers** pattern is elegant and powerful for linked list problems. Key takeaways:

1. **Cycle Detection**: Fast eventually catches slow if cycle exists
2. **Finding Middle**: When fast reaches end, slow is at middle
3. **Cycle Start**: Mathematical relationship between meeting point and cycle start
4. **Space Efficiency**: O(1) space alternative to using hashsets
5. **Speed Ratio**: Usually fast moves 2x speed of slow, but can be adjusted

This pattern demonstrates the beauty of algorithmic thinking - solving complex problems with simple pointer manipulation!
