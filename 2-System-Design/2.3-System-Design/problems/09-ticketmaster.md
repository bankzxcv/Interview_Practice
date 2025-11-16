# Design Ticketmaster

## Problem Statement

Design a ticket booking system like Ticketmaster for concerts, sports events, and shows that handles high concurrency, prevents double-booking, implements seat locking, and manages inventory under extreme load.

## Requirements Clarification

### Functional Requirements

- Browse events (concerts, sports, theater)
- View venue seating map with availability
- Select and reserve seats (hold for 10 minutes)
- Complete purchase (payment + confirmation)
- Transfer/resell tickets
- Mobile tickets (QR codes)

### Non-Functional Requirements

- **High availability**: 99.9% uptime
- **Consistency**: Strong (no double-booking)
- **Scale**: 100M users, 100K concurrent buyers during hot sales
- **Low latency**: Seat selection < 1 second
- **Fairness**: FIFO queue for popular events

### Out of Scope

- Dynamic pricing/surge pricing
- Auction-based pricing
- Ticket recommendations

## Capacity Estimation

### Events & Users

```
Events:
- 50,000 active events simultaneously
- Average venue: 20,000 seats
- Total seats available: 1B seats

Users:
- 100M total users
- 10M daily active users
- Peak: 100K concurrent users (major event goes on sale)

Transactions:
- 100K tickets sold per day (average)
- Peak: 20K tickets/minute (major concert like Taylor Swift)
- Per second: 20K ÷ 60 = ~333 tickets/sec
```

### Storage

```
Events:
- 50K events × 10 KB = 500 MB

Seats:
- 1B seats × 200 bytes (seat info, status) = 200 GB

Bookings:
- 100K/day × 365 × 5 years = 182.5M bookings
- Per booking: 1 KB (user, event, seats, payment)
- Total: 182.5 GB

Total: < 1 TB (very manageable)
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
│  (Web, iOS, Android)                                         │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                  Load Balancer + WAF                          │
│  (DDoS protection, rate limiting)                            │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                  Virtual Waiting Room                         │
│  (Queue Service - SQS / Redis Queue)                         │
│  - Manages 100K concurrent users                             │
│  - Fair FIFO ordering                                        │
└────────────────┬─────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────────────────────────────────┐
       │                                                │
┌──────▼──────────┐                          ┌─────────▼─────────┐
│  Event Service  │                          │  Booking Service  │
│  (Browse,       │                          │  (Reserve, Lock,  │
│   Search)       │                          │   Purchase)       │
└─────────────────┘                          └─────────┬─────────┘
                                                       │
                                             ┌─────────▼─────────┐
                                             │  Payment Service  │
                                             │  (Stripe, PayPal) │
                                             └───────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │  Redis       │  │  S3          │       │
│  │ (Events,     │  │ (Seat Locks, │  │ (Tickets,    │       │
│  │  Bookings)   │  │  Inventory)  │  │  QR Codes)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: Pessimistic Locking for Seat Reservation

**Problem:** Two users select same seat simultaneously → both think they got it → double booking!

**Approach 1: Optimistic Locking (Doesn't Work)**

```sql
-- User A and User B both read seat status
SELECT status FROM seats WHERE seat_id = 'A1' AND event_id = 'concert123';
-- Both see: status = 'available'

-- Both try to book
UPDATE seats SET status = 'reserved', reserved_by = 'userA'
WHERE seat_id = 'A1' AND status = 'available';
-- Both succeed! Double booking!
```

**Approach 2: Pessimistic Locking (Production)**

```python
def reserve_seat(user_id, event_id, seat_id):
    with transaction():
        # Lock row for update (other transactions wait)
        seat = db.execute("""
            SELECT * FROM seats
            WHERE event_id = ? AND seat_id = ?
            FOR UPDATE NOWAIT
        """, event_id, seat_id)

        if not seat:
            raise Exception("Seat not found")

        if seat['status'] != 'available':
            raise Exception("Seat already reserved")

        # Reserve seat (no one else can access until commit)
        db.execute("""
            UPDATE seats
            SET status = 'reserved',
                reserved_by = ?,
                reserved_at = NOW()
            WHERE event_id = ? AND seat_id = ?
        """, user_id, event_id, seat_id)

        # Set expiry (release after 10 minutes)
        redis.setex(f"lock:{event_id}:{seat_id}", 600, user_id)

    return {"status": "reserved", "expires_in": 600}
```

**Pros:**
- ✅ Guarantees no double-booking (exclusive lock)
- ✅ Simple to reason about
- ✅ ACID compliance

**Cons:**
- ❌ Lock contention (users wait for each other)
- ❌ Deadlock potential (if locking multiple seats)
- ❌ Lower throughput under high concurrency

**When to use:**
- Inventory management (limited quantity)
- Financial transactions
- Cannot tolerate conflicts

**Alternative: Redis-based Locking**

```python
def reserve_seat_redis(user_id, event_id, seat_id):
    # Try to acquire lock
    lock_key = f"seat_lock:{event_id}:{seat_id}"
    acquired = redis.set(lock_key, user_id, nx=True, ex=600)

    if not acquired:
        raise Exception("Seat already reserved")

    # Update database
    db.execute("""
        UPDATE seats SET status = 'reserved', reserved_by = ?
        WHERE event_id = ? AND seat_id = ?
    """, user_id, event_id, seat_id)

    return {"status": "reserved"}
```

**Pros:**
- ✅ Faster than database locks (in-memory)
- ✅ TTL support (auto-expiry)
- ✅ Less database contention

**Cons:**
- ❌ Redis failure = lost locks
- ❌ Eventual consistency between Redis and DB

### Decision 2: Virtual Waiting Room (Queue)

**Problem:** 1M users try to buy 20K tickets when sale opens → system overwhelmed

**Solution: FIFO Queue**

```python
# When sale opens at 10:00 AM
def join_waiting_room(user_id, event_id):
    # Add user to queue
    position = redis.rpush(f"queue:{event_id}", user_id)

    return {
        "queue_position": position,
        "estimated_wait_minutes": position // 100  # Admit 100 users/minute
    }

# Background worker admits users from queue
def admit_users_from_queue(event_id):
    while True:
        # Admit 100 users per minute
        for _ in range(100):
            user_id = redis.lpop(f"queue:{event_id}")

            if not user_id:
                break

            # Grant access token (valid for 30 minutes)
            token = generate_token(user_id, event_id)
            redis.setex(f"access:{user_id}:{event_id}", 1800, token)

            # Notify user (WebSocket / Push)
            notify_user(user_id, {
                "message": "Your turn to buy tickets!",
                "access_token": token
            })

        time.sleep(60)  # Wait 1 minute
```

**Pros:**
- ✅ Fair (FIFO)
- ✅ Prevents server overload
- ✅ Better UX (know your position)
- ✅ Reduce bot impact

**Cons:**
- ❌ Waiting frustration
- ❌ Complex to implement
- ❌ Queue jumping exploits

### Decision 3: Inventory Tracking (Available Seats Count)

**Problem:** Query "how many seats available?" for every request → expensive

**Solution: Cached Counter**

```python
# Initialize inventory in Redis
def init_inventory(event_id):
    total_seats = db.count("SELECT COUNT(*) FROM seats WHERE event_id = ?", event_id)
    redis.set(f"inventory:{event_id}", total_seats)

# Decrement on reservation
def reserve_seat(user_id, event_id, seat_id):
    # ... lock seat ...

    # Decrement inventory
    remaining = redis.decr(f"inventory:{event_id}")

    if remaining < 0:
        # Oversold! (shouldn't happen with locks)
        redis.incr(f"inventory:{event_id}")
        raise Exception("Event sold out")

    return remaining

# Increment if reservation expires
def release_expired_reservations():
    expired = db.execute("""
        SELECT event_id, seat_id FROM seats
        WHERE status = 'reserved'
        AND reserved_at < NOW() - INTERVAL '10 minutes'
    """)

    for seat in expired:
        # Release seat
        db.execute("""
            UPDATE seats SET status = 'available', reserved_by = NULL
            WHERE event_id = ? AND seat_id = ?
        """, seat['event_id'], seat['seat_id'])

        # Increment inventory
        redis.incr(f"inventory:{seat['event_id']}")
```

**Pros:**
- ✅ Fast reads (O(1) from Redis)
- ✅ Avoid expensive COUNT queries

**Cons:**
- ❌ Consistency challenges (Redis vs DB)
- ❌ Need reconciliation job

**Reconciliation:**

```python
# Run every hour
def reconcile_inventory(event_id):
    # Count available seats in DB
    db_count = db.count("""
        SELECT COUNT(*) FROM seats
        WHERE event_id = ? AND status = 'available'
    """, event_id)

    # Get Redis count
    redis_count = int(redis.get(f"inventory:{event_id}") or 0)

    # Fix discrepancy
    if db_count != redis_count:
        logger.warning(f"Inventory mismatch: DB={db_count}, Redis={redis_count}")
        redis.set(f"inventory:{event_id}", db_count)
```

## Database Design

```sql
CREATE TABLE events (
  event_id UUID PRIMARY KEY,
  name VARCHAR(200),
  venue_id UUID,
  event_date TIMESTAMP,
  total_seats INT,
  available_seats INT,  -- Denormalized for fast queries
  status VARCHAR(20),  -- upcoming, on_sale, sold_out, completed
  created_at TIMESTAMP
);

CREATE TABLE venues (
  venue_id UUID PRIMARY KEY,
  name VARCHAR(100),
  city VARCHAR(50),
  capacity INT,
  seating_chart_url TEXT  -- S3 URL to SVG/image
);

CREATE TABLE seats (
  seat_id VARCHAR(10),  -- e.g., "A1", "B12"
  event_id UUID REFERENCES events(event_id),
  section VARCHAR(50),  -- e.g., "Orchestra", "Balcony"
  row VARCHAR(10),
  seat_number INT,
  price DECIMAL(10,2),
  status VARCHAR(20),  -- available, reserved, sold
  reserved_by UUID,  -- User who reserved
  reserved_at TIMESTAMP,

  PRIMARY KEY (event_id, seat_id),
  INDEX idx_event_status (event_id, status)
);

CREATE TABLE bookings (
  booking_id UUID PRIMARY KEY,
  user_id UUID,
  event_id UUID,
  seats TEXT[],  -- Array of seat_ids
  total_price DECIMAL(10,2),
  payment_status VARCHAR(20),  -- pending, completed, refunded
  payment_id VARCHAR(100),  -- Stripe transaction ID
  created_at TIMESTAMP,

  INDEX idx_user (user_id),
  INDEX idx_event (event_id)
);

CREATE TABLE tickets (
  ticket_id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(booking_id),
  seat_id VARCHAR(10),
  qr_code TEXT,  -- Base64 or S3 URL
  status VARCHAR(20),  -- active, used, transferred, cancelled
  created_at TIMESTAMP
);
```

## Booking Flow

### Step 1: Select Seats

```
GET /api/v1/events/{event_id}/seats
Response:
{
  "sections": [
    {
      "name": "Orchestra",
      "rows": [
        {
          "row": "A",
          "seats": [
            {"seat_id": "A1", "status": "available", "price": 150},
            {"seat_id": "A2", "status": "reserved", "price": 150},
            {"seat_id": "A3", "status": "sold", "price": 150}
          ]
        }
      ]
    }
  ]
}
```

### Step 2: Reserve Seats (Hold)

```
POST /api/v1/bookings/reserve
Request:
{
  "event_id": "event123",
  "seat_ids": ["A1", "A2"]
}
Response:
{
  "reservation_id": "res-uuid",
  "expires_at": "2024-01-01T10:10:00Z",  // 10 minutes from now
  "total_price": 300
}
```

### Step 3: Complete Purchase

```
POST /api/v1/bookings/{reservation_id}/purchase
Request:
{
  "payment_method": "card",
  "payment_token": "tok_visa_123"  // Stripe token
}
Response:
{
  "booking_id": "booking-uuid",
  "tickets": [
    {"ticket_id": "ticket1", "seat_id": "A1", "qr_code": "..."},
    {"ticket_id": "ticket2", "seat_id": "A2", "qr_code": "..."}
  ]
}
```

### Step 4: Release Expired Reservations

```python
# Background job runs every minute
def release_expired():
    with transaction():
        # Find expired reservations
        expired = db.execute("""
            UPDATE seats
            SET status = 'available', reserved_by = NULL, reserved_at = NULL
            WHERE status = 'reserved'
            AND reserved_at < NOW() - INTERVAL '10 minutes'
            RETURNING event_id, seat_id
        """)

        # Update inventory counters
        for seat in expired:
            redis.incr(f"inventory:{seat['event_id']}")

        logger.info(f"Released {len(expired)} expired reservations")
```

## Handling Peak Load

### Problem: Taylor Swift Tickets

```
Event: Taylor Swift concert
Capacity: 50,000 seats
Demand: 2M users want tickets
Peak load: 500K users hit site at 10:00 AM sharp
```

### Solution 1: Rate Limiting

```python
# Per-user rate limit
@rate_limit(max_requests=10, window=60)  # 10 requests per minute
def get_seats(user_id, event_id):
    # ...
```

### Solution 2: Horizontal Scaling

```
Normal traffic: 10 API servers
Peak traffic: Auto-scale to 1,000 API servers
Database: Use read replicas (10 slaves) for seat availability queries
```

### Solution 3: Caching

```python
# Cache seat availability (30-second TTL)
def get_available_seats(event_id):
    cache_key = f"seats:{event_id}"
    cached = redis.get(cache_key)

    if cached:
        return json.loads(cached)

    seats = db.query("""
        SELECT seat_id, status, price FROM seats
        WHERE event_id = ?
    """, event_id)

    redis.setex(cache_key, 30, json.dumps(seats))
    return seats
```

### Solution 4: Virtual Waiting Room

```
Queue 500K users → Admit 100/minute → ~5000 minutes (~3.5 days) to process all

Reality: 50K seats sell out in 10 minutes → 490K users disappointed
```

## Monitoring

```
Performance:
- Seat query latency: p50 < 100ms, p99 < 500ms
- Reservation success rate: > 99%
- Payment success rate: > 98%

Business:
- Tickets sold per day: 100K
- Revenue per day: $5M
- Average ticket price: $50

Alerts:
- Database lock timeout rate > 1%
- Queue depth > 100K
- Payment failure rate > 2%
- Inventory mismatch detected
```

## Security

1. **Bot prevention:** CAPTCHA, rate limiting, device fingerprinting
2. **Scalping prevention:** Limit tickets per user, verify identity
3. **Payment security:** PCI compliance, tokenization
4. **QR code security:** Signed tickets, one-time use validation

## Interview Talking Points

"Ticketmaster's key challenge is concurrency control. I'd use pessimistic locking (FOR UPDATE) to prevent double-booking. For peak load (500K users), implement virtual waiting room with FIFO queue. Use Redis for fast inventory tracking with hourly reconciliation. For payments, use Stripe with idempotency to handle retries. Monitor lock contention and auto-scale during hot sales."
