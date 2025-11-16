# Design Payment Processing System

## Problem Statement

Design a payment processing system like Stripe/PayPal that handles transactions, ensures ACID properties, prevents double-charging, handles failures gracefully with idempotency.

## Requirements

- Process payments (credit card, bank transfer, digital wallets)
- Idempotent operations (retry-safe)
- Strong consistency (no double-charge/double-credit)
- Handle failures (network, external API)
- Fraud detection
- Reconciliation with external systems
- PCI DSS compliance

## Architecture

```
Client → API Gateway → Payment Service → [Stripe API, Bank APIs]
                            ↓
                    Idempotency Store (Redis)
                            ↓
                    Database (PostgreSQL - ACID)
                            ↓
                    Ledger (Double-entry bookkeeping)
```

## Idempotency

```python
# Prevent double-charging on retry
@app.route('/api/payments', methods=['POST'])
def create_payment():
    idempotency_key = request.headers.get('Idempotency-Key')

    if not idempotency_key:
        return {"error": "Idempotency-Key required"}, 400

    # Check if request already processed
    cached = redis.get(f"idempotency:{idempotency_key}")

    if cached:
        # Return same response
        return json.loads(cached), 200

    # Process payment
    result = process_payment(request.json)

    # Cache response for 24 hours
    redis.setex(f"idempotency:{idempotency_key}", 86400, json.dumps(result))

    return result, 201

def process_payment(data):
    payment_id = uuid.uuid4()

    with db.transaction():
        # 1. Create payment record
        db.insert_payment({
            'payment_id': payment_id,
            'user_id': data['user_id'],
            'amount': data['amount'],
            'currency': data['currency'],
            'status': 'pending'
        })

        # 2. Charge external provider (Stripe)
        try:
            charge = stripe.Charge.create(
                amount=data['amount'] * 100,  # cents
                currency=data['currency'],
                source=data['card_token'],
                idempotency_key=str(payment_id)  # Stripe's idempotency
            )

            # 3. Update payment status
            db.execute("""
                UPDATE payments
                SET status = 'completed',
                    external_transaction_id = ?,
                    completed_at = NOW()
                WHERE payment_id = ?
            """, charge.id, payment_id)

            # 4. Update ledger (double-entry)
            create_ledger_entries(payment_id, data['user_id'], data['amount'])

            return {
                'payment_id': str(payment_id),
                'status': 'completed',
                'transaction_id': charge.id
            }

        except stripe.CardError as e:
            # Card declined
            db.execute("""
                UPDATE payments
                SET status = 'failed', error_message = ?
                WHERE payment_id = ?
            """, str(e), payment_id)

            raise
```

## Double-Entry Ledger

```python
def create_ledger_entries(payment_id, user_id, amount):
    """
    Double-entry bookkeeping ensures balanced books.
    Debit = Credit always.
    """

    # Debit user's account (money out)
    db.insert_ledger_entry({
        'entry_id': uuid.uuid4(),
        'payment_id': payment_id,
        'account': f'user:{user_id}',
        'type': 'debit',
        'amount': amount,
        'balance_after': get_balance(user_id) - amount
    })

    # Credit merchant's account (money in)
    db.insert_ledger_entry({
        'entry_id': uuid.uuid4(),
        'payment_id': payment_id,
        'account': 'merchant:revenue',
        'type': 'credit',
        'amount': amount,
        'balance_after': get_balance('merchant:revenue') + amount
    })

    # Verify balanced
    assert sum_debits(payment_id) == sum_credits(payment_id)
```

## Database Design

```sql
CREATE TABLE payments (
  payment_id UUID PRIMARY KEY,
  user_id UUID,
  amount DECIMAL(15,2),
  currency VARCHAR(3),
  status VARCHAR(20),  -- pending, completed, failed, refunded
  payment_method VARCHAR(50),
  external_transaction_id VARCHAR(100),
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,

  INDEX idx_user (user_id, created_at DESC),
  INDEX idx_status (status)
);

CREATE TABLE ledger_entries (
  entry_id UUID PRIMARY KEY,
  payment_id UUID,
  account VARCHAR(100),
  type VARCHAR(10),  -- debit, credit
  amount DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  created_at TIMESTAMP,

  INDEX idx_payment (payment_id),
  INDEX idx_account (account, created_at DESC)
);

CREATE TABLE refunds (
  refund_id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(payment_id),
  amount DECIMAL(15,2),
  reason TEXT,
  status VARCHAR(20),
  created_at TIMESTAMP
);
```

## Reconciliation

```python
def daily_reconciliation():
    """Match our records with Stripe's"""

    # Get yesterday's payments
    our_payments = db.query("""
        SELECT external_transaction_id, amount
        FROM payments
        WHERE DATE(completed_at) = CURRENT_DATE - 1
        AND status = 'completed'
    """)

    # Get Stripe's records
    stripe_charges = stripe.Charge.list(
        created={'gte': yesterday_start, 'lt': today_start}
    )

    our_total = sum(p.amount for p in our_payments)
    stripe_total = sum(c.amount for c in stripe_charges) / 100  # cents → dollars

    if abs(our_total - stripe_total) > 0.01:  # Allow 1 cent rounding
        alert_finance_team(f"Mismatch: Our=${our_total}, Stripe=${stripe_total}")

    # Find missing transactions
    our_ids = set(p.external_transaction_id for p in our_payments)
    stripe_ids = set(c.id for c in stripe_charges)

    missing = stripe_ids - our_ids
    if missing:
        alert_finance_team(f"Missing transactions: {missing}")
```

## Fraud Detection

```python
def check_fraud(payment):
    score = 0

    # 1. Velocity check (>5 payments in 1 hour)
    recent_count = redis.incr(f"payment_count:{payment.user_id}")
    if recent_count == 1:
        redis.expire(f"payment_count:{payment.user_id}", 3600)

    if recent_count > 5:
        score += 50

    # 2. Unusual amount (>10x average)
    avg_amount = get_user_avg_payment(payment.user_id)
    if payment.amount > avg_amount * 10:
        score += 30

    # 3. Geolocation mismatch
    user_country = get_user_country(payment.user_id)
    card_country = get_card_country(payment.card_token)

    if user_country != card_country:
        score += 20

    # 4. Blacklisted card/IP
    if is_blacklisted(payment.card_token) or is_blacklisted(payment.ip_address):
        score += 100

    # Decision
    if score >= 100:
        return "block"
    elif score >= 50:
        return "review"
    else:
        return "allow"
```

## Retry Logic with Exponential Backoff

```python
def charge_with_retry(payment_id, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = stripe.Charge.create(...)
            return result

        except stripe.RateLimitError:
            # Backoff: 1s, 2s, 4s
            time.sleep(2 ** attempt)
            continue

        except stripe.APIConnectionError:
            # Network error, retry
            time.sleep(2 ** attempt)
            continue

        except stripe.CardError:
            # Card declined, don't retry
            raise

    raise MaxRetriesExceeded()
```

## Distributed Transactions (2-Phase Commit)

```python
# When payment involves multiple services
def transfer_funds(sender_id, receiver_id, amount):
    # Phase 1: Prepare
    tx_id = uuid.uuid4()

    sender_ok = sender_service.prepare_debit(tx_id, sender_id, amount)
    receiver_ok = receiver_service.prepare_credit(tx_id, receiver_id, amount)

    if sender_ok and receiver_ok:
        # Phase 2: Commit
        sender_service.commit(tx_id)
        receiver_service.commit(tx_id)
        return "success"
    else:
        # Rollback
        sender_service.rollback(tx_id)
        receiver_service.rollback(tx_id)
        return "failed"
```

## Webhook Handling

```python
@app.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    # Verify signature
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return "Invalid payload", 400

    # Handle events
    if event.type == 'charge.succeeded':
        charge = event.data.object
        db.execute("""
            UPDATE payments
            SET status = 'completed'
            WHERE external_transaction_id = ?
        """, charge.id)

    elif event.type == 'charge.failed':
        charge = event.data.object
        db.execute("""
            UPDATE payments
            SET status = 'failed'
            WHERE external_transaction_id = ?
        """, charge.id)

    return "OK", 200
```

## Monitoring

```
Performance:
- Payment latency: p50 < 500ms, p99 < 2s
- Success rate: > 98%
- Idempotent cache hit rate: < 1%

Financial:
- Daily volume: $10M
- Transaction fee: 2.9% + $0.30
- Revenue: $290K + transaction fees

Alerts:
- Payment failure rate > 5%
- Reconciliation mismatch
- Fraud score spike
```

## Interview Talking Points

"Payment system needs ACID guarantees and idempotency. Use idempotency keys (24-hour cache) to prevent double-charging on retries. Implement double-entry ledger (debit = credit). For external API failures, retry with exponential backoff. Daily reconciliation with Stripe. Fraud detection: velocity checks, geolocation, blacklists. For distributed transactions, use 2-phase commit or saga pattern. Monitor success rate (>98%) and reconciliation mismatches."
