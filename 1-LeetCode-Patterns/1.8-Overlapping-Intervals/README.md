# Overlapping Intervals Pattern

## Pattern Overview

### What is this pattern?
The Overlapping Intervals pattern deals with problems involving intervals (ranges) that may overlap, merge, or need to be processed in a specific order. The key technique is usually sorting intervals by start time, then processing them sequentially.

### When to use it?
- Merging overlapping intervals
- Finding conflicts in schedules/meetings
- Inserting intervals into sorted list
- Finding minimum rooms/resources needed
- Checking if intervals overlap
- Problems involving ranges, schedules, or time periods

### Time/Space Complexity Benefits
- **Time Complexity**: O(n log n) - dominated by sorting
- **Space Complexity**: O(n) - for storing results or auxiliary data structures

### Visual Diagram

```
Example: Merge Overlapping Intervals

Input: [[1,3], [2,6], [8,10], [15,18]]

Step 1: Sort by start time (already sorted)
[1,3], [2,6], [8,10], [15,18]

Step 2: Process intervals
[1,3]
  └─ [2,6] overlaps! Merge to [1,6]
       └─ [8,10] doesn't overlap, add [1,6] to result
            └─ [15,18] doesn't overlap, add [8,10] to result
                  └─ End: add [15,18] to result

Result: [[1,6], [8,10], [15,18]]

Overlap Check:
Intervals [a,b] and [c,d] overlap if: a <= d AND c <= b

     [a----b]
  [c----d]       Overlaps!

     [a----b]
                [c----d]   No overlap
```

## Recognition Guidelines

### How to identify this pattern in interview questions?
Look for these indicators:
- Problem mentions "intervals", "ranges", or "time periods"
- Need to merge overlapping intervals
- Schedule/calendar problems (meetings, rooms)
- Finding conflicts or free time
- Insert interval into sorted list
- Count minimum resources needed
- Any problem with start and end times

### Key Phrases/Indicators
- "Merge intervals"
- "Overlapping intervals"
- "Meeting rooms"
- "Insert interval"
- "Non-overlapping intervals"
- "Minimum number of arrows/platforms"
- "Employee free time"
- "Schedule"
- "Book appointments"

## Template/Pseudocode

### Merge Intervals Template
```python
def merge_intervals(intervals):
    # Step 1: Sort intervals by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Initialize result with first interval
    merged = [intervals[0]]

    # Step 3: Process each interval
    for current in intervals[1:]:
        last_merged = merged[-1]

        # Check if current overlaps with last merged interval
        if current[0] <= last_merged[1]:
            # Merge: extend the end time
            last_merged[1] = max(last_merged[1], current[1])
        else:
            # No overlap: add current interval
            merged.append(current)

    return merged
```

### Insert Interval Template
```python
def insert_interval(intervals, new_interval):
    result = []
    i = 0
    n = len(intervals)

    # Add all intervals before new_interval
    while i < n and intervals[i][1] < new_interval[0]:
        result.append(intervals[i])
        i += 1

    # Merge overlapping intervals
    while i < n and intervals[i][0] <= new_interval[1]:
        new_interval[0] = min(new_interval[0], intervals[i][0])
        new_interval[1] = max(new_interval[1], intervals[i][1])
        i += 1
    result.append(new_interval)

    # Add remaining intervals
    while i < n:
        result.append(intervals[i])
        i += 1

    return result
```

## Problems

### Problem 1: Merge Intervals (Medium)
**LeetCode Link**: [56. Merge Intervals](https://leetcode.com/problems/merge-intervals/)

**Problem Description**:
Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.

**Example**:
```
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: [1,3] and [2,6] overlap, merge to [1,6]
```

**Python Solution**:
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    # Step 1: Sort intervals by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Initialize result with first interval
    merged = [intervals[0]]

    # Step 3: Process each interval starting from second
    for current in intervals[1:]:
        # Get the last merged interval
        last_merged = merged[-1]

        # Step 4: Check if current interval overlaps with last merged
        if current[0] <= last_merged[1]:
            # Overlaps: merge by extending end time to max of both
            last_merged[1] = max(last_merged[1], current[1])
        else:
            # No overlap: add current interval to result
            merged.append(current)

    return merged
```

**TypeScript Solution**:
```typescript
function merge(intervals: number[][]): number[][] {
    // Step 1: Sort intervals by start time
    intervals.sort((a, b) => a[0] - b[0]);

    // Step 2: Initialize result with first interval
    const merged: number[][] = [intervals[0]];

    // Step 3: Process each interval starting from second
    for (let i = 1; i < intervals.length; i++) {
        const current = intervals[i];
        const lastMerged = merged[merged.length - 1];

        // Step 4: Check if current interval overlaps with last merged
        if (current[0] <= lastMerged[1]) {
            // Overlaps: merge by extending end time to max of both
            lastMerged[1] = Math.max(lastMerged[1], current[1]);
        } else {
            // No overlap: add current interval to result
            merged.push(current);
        }
    }

    return merged;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - sorting dominates
- Space Complexity: O(n) - for the result array

---

### Problem 2: Insert Interval (Medium)
**LeetCode Link**: [57. Insert Interval](https://leetcode.com/problems/insert-interval/)

**Problem Description**:
You are given an array of non-overlapping intervals where intervals[i] = [starti, endi] represent the start and end of the ith interval and intervals is sorted in ascending order by starti. Insert newInterval and merge if necessary.

**Example**:
```
Input: intervals = [[1,3],[6,9]], newInterval = [2,5]
Output: [[1,5],[6,9]]
```

**Python Solution**:
```python
def insert(intervals: list[list[int]], newInterval: list[int]) -> list[list[int]]:
    result = []
    i = 0
    n = len(intervals)

    # Step 1: Add all intervals that come before newInterval (no overlap)
    while i < n and intervals[i][1] < newInterval[0]:
        result.append(intervals[i])
        i += 1

    # Step 2: Merge all overlapping intervals with newInterval
    while i < n and intervals[i][0] <= newInterval[1]:
        # Expand newInterval to include current interval
        newInterval[0] = min(newInterval[0], intervals[i][0])
        newInterval[1] = max(newInterval[1], intervals[i][1])
        i += 1

    # Add the merged interval
    result.append(newInterval)

    # Step 3: Add all remaining intervals
    while i < n:
        result.append(intervals[i])
        i += 1

    return result
```

**TypeScript Solution**:
```typescript
function insert(intervals: number[][], newInterval: number[]): number[][] {
    const result: number[][] = [];
    let i = 0;
    const n = intervals.length;

    // Step 1: Add all intervals that come before newInterval (no overlap)
    while (i < n && intervals[i][1] < newInterval[0]) {
        result.push(intervals[i]);
        i++;
    }

    // Step 2: Merge all overlapping intervals with newInterval
    while (i < n && intervals[i][0] <= newInterval[1]) {
        // Expand newInterval to include current interval
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }

    // Add the merged interval
    result.push(newInterval);

    // Step 3: Add all remaining intervals
    while (i < n) {
        result.push(intervals[i]);
        i++;
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through intervals
- Space Complexity: O(n) - for result array

---

### Problem 3: Non-overlapping Intervals (Medium)
**LeetCode Link**: [435. Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/)

**Problem Description**:
Given an array of intervals, find the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.

**Example**:
```
Input: intervals = [[1,2],[2,3],[3,4],[1,3]]
Output: 1
Explanation: Remove [1,3] to make rest non-overlapping
```

**Python Solution**:
```python
def eraseOverlapIntervals(intervals: list[list[int]]) -> int:
    # Step 1: Sort intervals by end time
    # Greedy approach: keep interval that ends earliest
    intervals.sort(key=lambda x: x[1])

    # Step 2: Track the end of last kept interval
    prev_end = intervals[0][1]
    removed = 0

    # Step 3: Process each interval starting from second
    for i in range(1, len(intervals)):
        # Step 4: Check if current interval overlaps with last kept interval
        if intervals[i][0] < prev_end:
            # Overlaps: remove this interval (increment counter)
            removed += 1
        else:
            # No overlap: keep this interval, update prev_end
            prev_end = intervals[i][1]

    return removed
```

**TypeScript Solution**:
```typescript
function eraseOverlapIntervals(intervals: number[][]): number {
    // Step 1: Sort intervals by end time
    intervals.sort((a, b) => a[1] - b[1]);

    // Step 2: Track the end of last kept interval
    let prevEnd = intervals[0][1];
    let removed = 0;

    // Step 3: Process each interval starting from second
    for (let i = 1; i < intervals.length; i++) {
        // Step 4: Check if current interval overlaps with last kept interval
        if (intervals[i][0] < prevEnd) {
            // Overlaps: remove this interval (increment counter)
            removed++;
        } else {
            // No overlap: keep this interval, update prevEnd
            prevEnd = intervals[i][1];
        }
    }

    return removed;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(1) - only using variables

---

### Problem 4: Meeting Rooms (Easy)
**LeetCode Link**: [252. Meeting Rooms](https://leetcode.com/problems/meeting-rooms/) (Premium)

**Problem Description**:
Given an array of meeting time intervals where intervals[i] = [starti, endi], determine if a person could attend all meetings.

**Example**:
```
Input: intervals = [[0,30],[5,10],[15,20]]
Output: false
Explanation: [0,30] overlaps with [5,10] and [15,20]
```

**Python Solution**:
```python
def canAttendMeetings(intervals: list[list[int]]) -> bool:
    # Step 1: Sort meetings by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Check each consecutive pair for overlap
    for i in range(len(intervals) - 1):
        # Step 3: If current meeting ends after next meeting starts, overlap!
        if intervals[i][1] > intervals[i + 1][0]:
            return False

    # Step 4: No overlaps found
    return True
```

**TypeScript Solution**:
```typescript
function canAttendMeetings(intervals: number[][]): boolean {
    // Step 1: Sort meetings by start time
    intervals.sort((a, b) => a[0] - b[0]);

    // Step 2: Check each consecutive pair for overlap
    for (let i = 0; i < intervals.length - 1; i++) {
        // Step 3: If current meeting ends after next meeting starts, overlap!
        if (intervals[i][1] > intervals[i + 1][0]) {
            return false;
        }
    }

    // Step 4: No overlaps found
    return true;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(1) - only using variables

---

### Problem 5: Meeting Rooms II (Medium)
**LeetCode Link**: [253. Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) (Premium)

**Problem Description**:
Given an array of meeting time intervals, return the minimum number of conference rooms required.

**Example**:
```
Input: intervals = [[0,30],[5,10],[15,20]]
Output: 2
Explanation: Need 2 rooms at time 5-10 and 15-20 (both overlap with [0,30])
```

**Python Solution**:
```python
import heapq

def minMeetingRooms(intervals: list[list[int]]) -> int:
    # Step 1: Sort meetings by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Min heap to track end times of ongoing meetings
    # Heap stores end times of meetings currently using rooms
    heap = []

    # Step 3: Process each meeting
    for start, end in intervals:
        # Step 4: If earliest ending meeting has finished, free up that room
        if heap and heap[0] <= start:
            heapq.heappop(heap)

        # Step 5: Allocate room for current meeting
        heapq.heappush(heap, end)

    # Step 6: Number of rooms needed = size of heap
    # (number of ongoing meetings at peak time)
    return len(heap)
```

**TypeScript Solution**:
```typescript
function minMeetingRooms(intervals: number[][]): number {
    // Step 1: Create separate arrays for start and end times
    const starts: number[] = intervals.map(i => i[0]).sort((a, b) => a - b);
    const ends: number[] = intervals.map(i => i[1]).sort((a, b) => a - b);

    // Step 2: Two pointers to track starts and ends
    let rooms = 0;
    let maxRooms = 0;
    let startPtr = 0;
    let endPtr = 0;

    // Step 3: Process all events
    while (startPtr < starts.length) {
        // Step 4: If a meeting starts before earliest ongoing meeting ends
        if (starts[startPtr] < ends[endPtr]) {
            // Need a new room
            rooms++;
            startPtr++;
        } else {
            // A meeting ended, room freed up
            rooms--;
            endPtr++;
        }

        // Track maximum rooms needed
        maxRooms = Math.max(maxRooms, rooms);
    }

    return maxRooms;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(n) - for heap or arrays

---

### Problem 6: Interval List Intersections (Medium)
**LeetCode Link**: [986. Interval List Intersections](https://leetcode.com/problems/interval-list-intersections/)

**Problem Description**:
You are given two lists of closed intervals, firstList and secondList. Return the intersection of these two interval lists.

**Example**:
```
Input: firstList = [[0,2],[5,10],[13,23],[24,25]],
       secondList = [[1,5],[8,12],[15,24],[25,26]]
Output: [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]
```

**Python Solution**:
```python
def intervalIntersection(firstList: list[list[int]], secondList: list[list[int]]) -> list[list[int]]:
    result = []
    i, j = 0, 0

    # Step 1: Use two pointers to traverse both lists
    while i < len(firstList) and j < len(secondList):
        # Step 2: Get current intervals
        start1, end1 = firstList[i]
        start2, end2 = secondList[j]

        # Step 3: Find intersection
        # Intersection start is max of both starts
        # Intersection end is min of both ends
        inter_start = max(start1, start2)
        inter_end = min(end1, end2)

        # Step 4: If intersection is valid, add to result
        if inter_start <= inter_end:
            result.append([inter_start, inter_end])

        # Step 5: Move pointer of interval that ends first
        if end1 < end2:
            i += 1
        else:
            j += 1

    return result
```

**TypeScript Solution**:
```typescript
function intervalIntersection(firstList: number[][], secondList: number[][]): number[][] {
    const result: number[][] = [];
    let i = 0, j = 0;

    // Step 1: Use two pointers to traverse both lists
    while (i < firstList.length && j < secondList.length) {
        // Step 2: Get current intervals
        const [start1, end1] = firstList[i];
        const [start2, end2] = secondList[j];

        // Step 3: Find intersection
        const interStart = Math.max(start1, start2);
        const interEnd = Math.min(end1, end2);

        // Step 4: If intersection is valid, add to result
        if (interStart <= interEnd) {
            result.push([interStart, interEnd]);
        }

        // Step 5: Move pointer of interval that ends first
        if (end1 < end2) {
            i++;
        } else {
            j++;
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(m + n) - where m and n are lengths of the two lists
- Space Complexity: O(1) - excluding output array

---

### Problem 7: Minimum Number of Arrows to Burst Balloons (Medium)
**LeetCode Link**: [452. Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/)

**Problem Description**:
Given an array of balloons where points[i] = [xstart, xend], find the minimum number of arrows that must be shot to burst all balloons.

**Example**:
```
Input: points = [[10,16],[2,8],[1,6],[7,12]]
Output: 2
Explanation: Shoot arrows at x=6 and x=11
```

**Python Solution**:
```python
def findMinArrowShots(points: list[list[int]]) -> int:
    # Step 1: Sort balloons by end position
    points.sort(key=lambda x: x[1])

    # Step 2: Initialize arrows count and position of first arrow
    arrows = 1
    arrow_pos = points[0][1]

    # Step 3: Process each balloon
    for start, end in points[1:]:
        # Step 4: If current balloon starts after arrow position
        # need a new arrow
        if start > arrow_pos:
            arrows += 1
            arrow_pos = end  # Shoot arrow at end of current balloon

    return arrows
```

**TypeScript Solution**:
```typescript
function findMinArrowShots(points: number[][]): number {
    // Step 1: Sort balloons by end position
    points.sort((a, b) => a[1] - b[1]);

    // Step 2: Initialize arrows count and position of first arrow
    let arrows = 1;
    let arrowPos = points[0][1];

    // Step 3: Process each balloon
    for (let i = 1; i < points.length; i++) {
        const [start, end] = points[i];

        // Step 4: If current balloon starts after arrow position
        // need a new arrow
        if (start > arrowPos) {
            arrows++;
            arrowPos = end;  // Shoot arrow at end of current balloon
        }
    }

    return arrows;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(1) - only using variables

---

### Problem 8: Employee Free Time (Hard)
**LeetCode Link**: [759. Employee Free Time](https://leetcode.com/problems/employee-free-time/) (Premium)

**Problem Description**:
Given a list of employees' schedules (list of intervals), return the list of finite intervals representing common free time for all employees.

**Example**:
```
Input: schedule = [[[1,2],[5,6]],[[1,3]],[[4,10]]]
Output: [[3,4]]
Explanation: All employees are free between 3 and 4
```

**Python Solution**:
```python
def employeeFreeTime(schedule: list[list[list[int]]]) -> list[list[int]]:
    # Step 1: Flatten all intervals into a single list
    all_intervals = []
    for employee in schedule:
        for interval in employee:
            all_intervals.append(interval)

    # Step 2: Sort all intervals by start time
    all_intervals.sort(key=lambda x: x[0])

    # Step 3: Merge overlapping intervals to find busy times
    merged = [all_intervals[0]]
    for current in all_intervals[1:]:
        last = merged[-1]
        if current[0] <= last[1]:
            last[1] = max(last[1], current[1])
        else:
            merged.append(current)

    # Step 4: Find gaps between merged intervals (free times)
    free_time = []
    for i in range(len(merged) - 1):
        # Gap between end of current and start of next
        free_time.append([merged[i][1], merged[i + 1][0]])

    return free_time
```

**TypeScript Solution**:
```typescript
function employeeFreeTime(schedule: number[][][]): number[][] {
    // Step 1: Flatten all intervals into a single list
    const allIntervals: number[][] = [];
    for (const employee of schedule) {
        for (const interval of employee) {
            allIntervals.push(interval);
        }
    }

    // Step 2: Sort all intervals by start time
    allIntervals.sort((a, b) => a[0] - b[0]);

    // Step 3: Merge overlapping intervals to find busy times
    const merged: number[][] = [allIntervals[0]];
    for (let i = 1; i < allIntervals.length; i++) {
        const current = allIntervals[i];
        const last = merged[merged.length - 1];
        if (current[0] <= last[1]) {
            last[1] = Math.max(last[1], current[1]);
        } else {
            merged.push(current);
        }
    }

    // Step 4: Find gaps between merged intervals (free times)
    const freeTime: number[][] = [];
    for (let i = 0; i < merged.length - 1; i++) {
        freeTime.push([merged[i][1], merged[i + 1][0]]);
    }

    return freeTime;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - where n is total number of intervals
- Space Complexity: O(n) - for storing flattened intervals

---

### Problem 9: My Calendar I (Medium)
**LeetCode Link**: [729. My Calendar I](https://leetcode.com/problems/my-calendar-i/)

**Problem Description**:
Implement a MyCalendar class to store your events. A new event can be added if it doesn't cause a double booking.

**Example**:
```
Input: ["MyCalendar", "book", "book", "book"]
       [[], [10, 20], [15, 25], [20, 30]]
Output: [null, true, false, true]
```

**Python Solution**:
```python
class MyCalendar:
    def __init__(self):
        # Step 1: Initialize list to store booked intervals
        self.bookings = []

    def book(self, start: int, end: int) -> bool:
        # Step 2: Check if new event overlaps with any existing booking
        for s, e in self.bookings:
            # Two intervals [start, end) and [s, e) overlap if:
            # start < e AND s < end
            if start < e and s < end:
                return False

        # Step 3: No overlap found, add the booking
        self.bookings.append((start, end))
        return True
```

**TypeScript Solution**:
```typescript
class MyCalendar {
    private bookings: [number, number][];

    constructor() {
        // Step 1: Initialize array to store booked intervals
        this.bookings = [];
    }

    book(start: number, end: number): boolean {
        // Step 2: Check if new event overlaps with any existing booking
        for (const [s, e] of this.bookings) {
            // Two intervals [start, end) and [s, e) overlap if:
            // start < e AND s < end
            if (start < e && s < end) {
                return false;
            }
        }

        // Step 3: No overlap found, add the booking
        this.bookings.push([start, end]);
        return true;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) per book operation - checking all existing bookings
- Space Complexity: O(n) - storing n bookings

---

### Problem 10: My Calendar II (Medium)
**LeetCode Link**: [731. My Calendar II](https://leetcode.com/problems/my-calendar-ii/)

**Problem Description**:
Implement a MyCalendarTwo class to store events. A new event can be added if it doesn't cause a triple booking.

**Example**:
```
Input: ["MyCalendarTwo", "book", "book", "book", "book", "book", "book"]
       [[], [10,20], [50,60], [10,40], [5,15], [5,10], [25,55]]
Output: [null, true, true, true, false, true, true]
```

**Python Solution**:
```python
class MyCalendarTwo:
    def __init__(self):
        # Step 1: Track single bookings and double bookings
        self.bookings = []
        self.overlaps = []  # Double booked intervals

    def book(self, start: int, end: int) -> bool:
        # Step 2: Check if new event would create triple booking
        # (overlaps with any double booking)
        for s, e in self.overlaps:
            if start < e and s < end:
                return False  # Would create triple booking

        # Step 3: Add overlaps with existing bookings to overlaps list
        for s, e in self.bookings:
            if start < e and s < end:
                # Calculate overlap and add to double bookings
                overlap_start = max(start, s)
                overlap_end = min(end, e)
                self.overlaps.append((overlap_start, overlap_end))

        # Step 4: Add to bookings
        self.bookings.append((start, end))
        return True
```

**TypeScript Solution**:
```typescript
class MyCalendarTwo {
    private bookings: [number, number][];
    private overlaps: [number, number][];

    constructor() {
        // Step 1: Track single bookings and double bookings
        this.bookings = [];
        this.overlaps = [];
    }

    book(start: number, end: number): boolean {
        // Step 2: Check if new event would create triple booking
        for (const [s, e] of this.overlaps) {
            if (start < e && s < end) {
                return false;  // Would create triple booking
            }
        }

        // Step 3: Add overlaps with existing bookings to overlaps list
        for (const [s, e] of this.bookings) {
            if (start < e && s < end) {
                const overlapStart = Math.max(start, s);
                const overlapEnd = Math.min(end, e);
                this.overlaps.push([overlapStart, overlapEnd]);
            }
        }

        // Step 4: Add to bookings
        this.bookings.push([start, end]);
        return true;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) per book operation
- Space Complexity: O(n) - for bookings and overlaps

---

### Problem 11: Data Stream as Disjoint Intervals (Hard)
**LeetCode Link**: [352. Data Stream as Disjoint Intervals](https://leetcode.com/problems/data-stream-as-disjoint-intervals/)

**Problem Description**:
Given a data stream of integers, implement a class that maintains intervals of consecutive integers.

**Example**:
```
Input: ["SummaryRanges", "addNum", "getIntervals", "addNum", "getIntervals", "addNum"]
       [[], [1], [], [3], [], [7]]
Output: [null, null, [[1,1]], null, [[1,1],[3,3]], null]
```

**Python Solution**:
```python
class SummaryRanges:
    def __init__(self):
        # Step 1: Use list to store disjoint intervals
        self.intervals = []

    def addNum(self, value: int) -> None:
        # Step 2: Find position to insert/merge
        new_interval = [value, value]
        merged = []
        i = 0

        # Add all intervals before new value
        while i < len(self.intervals) and self.intervals[i][1] < value - 1:
            merged.append(self.intervals[i])
            i += 1

        # Merge overlapping or adjacent intervals
        while i < len(self.intervals) and self.intervals[i][0] <= value + 1:
            new_interval[0] = min(new_interval[0], self.intervals[i][0])
            new_interval[1] = max(new_interval[1], self.intervals[i][1])
            i += 1

        merged.append(new_interval)

        # Add remaining intervals
        while i < len(self.intervals):
            merged.append(self.intervals[i])
            i += 1

        self.intervals = merged

    def getIntervals(self) -> list[list[int]]:
        # Step 3: Return current intervals
        return self.intervals
```

**TypeScript Solution**:
```typescript
class SummaryRanges {
    private intervals: number[][];

    constructor() {
        this.intervals = [];
    }

    addNum(value: number): void {
        const newInterval = [value, value];
        const merged: number[][] = [];
        let i = 0;

        // Add all intervals before new value
        while (i < this.intervals.length && this.intervals[i][1] < value - 1) {
            merged.push(this.intervals[i]);
            i++;
        }

        // Merge overlapping or adjacent intervals
        while (i < this.intervals.length && this.intervals[i][0] <= value + 1) {
            newInterval[0] = Math.min(newInterval[0], this.intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], this.intervals[i][1]);
            i++;
        }

        merged.push(newInterval);

        // Add remaining intervals
        while (i < this.intervals.length) {
            merged.push(this.intervals[i]);
            i++;
        }

        this.intervals = merged;
    }

    getIntervals(): number[][] {
        return this.intervals;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) per addNum operation
- Space Complexity: O(n) - storing intervals

---

### Problem 12: Range Module (Hard)
**LeetCode Link**: [715. Range Module](https://leetcode.com/problems/range-module/)

**Problem Description**:
Design a data structure to track ranges of numbers. Implement addRange, queryRange, and removeRange.

**Example**:
```
Input: ["RangeModule", "addRange", "removeRange", "queryRange", "queryRange"]
       [[], [10, 20], [14, 16], [10, 14], [13, 15]]
Output: [null, null, null, true, false]
```

**Python Solution**:
```python
class RangeModule:
    def __init__(self):
        # Step 1: Store intervals as list of [start, end]
        self.intervals = []

    def addRange(self, left: int, right: int) -> None:
        # Step 2: Merge new range with existing ranges
        result = []
        i = 0

        # Add intervals before new range
        while i < len(self.intervals) and self.intervals[i][1] < left:
            result.append(self.intervals[i])
            i += 1

        # Merge overlapping intervals
        while i < len(self.intervals) and self.intervals[i][0] <= right:
            left = min(left, self.intervals[i][0])
            right = max(right, self.intervals[i][1])
            i += 1

        result.append([left, right])

        # Add remaining intervals
        while i < len(self.intervals):
            result.append(self.intervals[i])
            i += 1

        self.intervals = result

    def queryRange(self, left: int, right: int) -> bool:
        # Step 3: Check if [left, right) is completely covered
        for start, end in self.intervals:
            if start <= left and right <= end:
                return True
        return False

    def removeRange(self, left: int, right: int) -> None:
        # Step 4: Remove [left, right) from existing ranges
        result = []

        for start, end in self.intervals:
            # If no overlap, keep interval
            if end <= left or start >= right:
                result.append([start, end])
            else:
                # Partial overlap - keep non-overlapping parts
                if start < left:
                    result.append([start, left])
                if right < end:
                    result.append([right, end])

        self.intervals = result
```

**TypeScript Solution**:
```typescript
class RangeModule {
    private intervals: number[][];

    constructor() {
        this.intervals = [];
    }

    addRange(left: number, right: number): void {
        const result: number[][] = [];
        let i = 0;

        // Add intervals before new range
        while (i < this.intervals.length && this.intervals[i][1] < left) {
            result.push(this.intervals[i]);
            i++;
        }

        // Merge overlapping intervals
        while (i < this.intervals.length && this.intervals[i][0] <= right) {
            left = Math.min(left, this.intervals[i][0]);
            right = Math.max(right, this.intervals[i][1]);
            i++;
        }

        result.push([left, right]);

        // Add remaining intervals
        while (i < this.intervals.length) {
            result.push(this.intervals[i]);
            i++;
        }

        this.intervals = result;
    }

    queryRange(left: number, right: number): boolean {
        for (const [start, end] of this.intervals) {
            if (start <= left && right <= end) {
                return true;
            }
        }
        return false;
    }

    removeRange(left: number, right: number): void {
        const result: number[][] = [];

        for (const [start, end] of this.intervals) {
            if (end <= left || start >= right) {
                result.push([start, end]);
            } else {
                if (start < left) {
                    result.push([start, left]);
                }
                if (right < end) {
                    result.push([right, end]);
                }
            }
        }

        this.intervals = result;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) for each operation
- Space Complexity: O(n) - for storing intervals

---

### Problem 13: Maximum Profit in Job Scheduling (Hard)
**LeetCode Link**: [1235. Maximum Profit in Job Scheduling](https://leetcode.com/problems/maximum-profit-in-job-scheduling/)

**Problem Description**:
Given startTime, endTime, and profit arrays for jobs, find the maximum profit such that chosen jobs don't overlap.

**Example**:
```
Input: startTime = [1,2,3,3], endTime = [3,4,5,6], profit = [50,10,40,70]
Output: 120
Explanation: Choose job 1 (profit 50) and job 4 (profit 70)
```

**Python Solution**:
```python
import bisect

def jobScheduling(startTime: list[int], endTime: list[int], profit: list[int]) -> int:
    # Step 1: Combine and sort jobs by end time
    jobs = sorted(zip(endTime, startTime, profit))

    # Step 2: DP array where dp[i] = (end_time, max_profit)
    dp = [[0, 0]]  # Base case: no jobs

    # Step 3: Process each job
    for end, start, p in jobs:
        # Step 4: Binary search for latest job that doesn't overlap
        # Find job with end_time <= current start_time
        i = bisect.bisect_right(dp, [start, float('inf')]) - 1

        # Step 5: Calculate profit if we take current job
        # max_profit_before + current_profit
        profit_with_current = dp[i][1] + p

        # Step 6: Compare with not taking current job
        if profit_with_current > dp[-1][1]:
            dp.append([end, profit_with_current])

    # Step 7: Return maximum profit
    return dp[-1][1]
```

**TypeScript Solution**:
```typescript
function jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
    // Step 1: Combine and sort jobs by end time
    const jobs: [number, number, number][] = [];
    for (let i = 0; i < startTime.length; i++) {
        jobs.push([endTime[i], startTime[i], profit[i]]);
    }
    jobs.sort((a, b) => a[0] - b[0]);

    // Step 2: DP array where dp[i] = [end_time, max_profit]
    const dp: [number, number][] = [[0, 0]];

    // Step 3: Process each job
    for (const [end, start, p] of jobs) {
        // Step 4: Binary search for latest non-overlapping job
        let left = 0, right = dp.length - 1;
        while (left < right) {
            const mid = Math.ceil((left + right) / 2);
            if (dp[mid][0] <= start) {
                left = mid;
            } else {
                right = mid - 1;
            }
        }

        // Step 5: Calculate profit with current job
        const profitWithCurrent = dp[left][1] + p;

        // Step 6: Update if better
        if (profitWithCurrent > dp[dp.length - 1][1]) {
            dp.push([end, profitWithCurrent]);
        }
    }

    // Step 7: Return maximum profit
    return dp[dp.length - 1][1];
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - sorting and binary searches
- Space Complexity: O(n) - for DP array

---

## Practice Tips

1. **Always sort first**: Most interval problems require sorting by start time (or sometimes end time)

2. **Overlap condition**: Two intervals [a,b] and [c,d] overlap if: `a < d AND c < b`
   - Or equivalently: `max(a,c) < min(b,d)`

3. **Merge intervals pattern**:
   - Sort by start time
   - Compare current interval with last merged interval
   - If overlap: extend end time
   - If no overlap: add new interval

4. **Common sorting strategies**:
   - By start time: for merging, inserting
   - By end time: for greedy problems (min arrows, max activities)
   - Both: create separate arrays for sweep line algorithm

5. **Edge cases to test**:
   - Empty input
   - Single interval
   - All overlapping intervals
   - No overlapping intervals
   - Intervals that touch but don't overlap ([1,2], [2,3])

6. **Pattern variations**:
   - Merge intervals: sort + scan
   - Find conflicts: sort + check consecutive pairs
   - Min resources: sort + heap or sweep line
   - Insert interval: three-phase scan (before, merge, after)
   - Intersection: two pointers

7. **Greedy vs DP**:
   - Greedy: when choosing earliest/latest ending works (min arrows, max activities)
   - DP: when you need to maximize profit or consider subset selection

8. **Data structures**:
   - List/Array: most common, for sorted intervals
   - Heap: for meeting rooms (tracking end times)
   - TreeMap/Balanced BST: for range queries and updates
   - Sweep line: for complex overlapping scenarios
