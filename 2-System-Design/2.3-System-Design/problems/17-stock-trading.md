# Design Stock Trading Platform

## Problem Statement

Design a low-latency stock trading platform that matches buy/sell orders, ensures ACID transactions, handles high throughput during market hours, and provides real-time market data.

## Requirements

- Place market/limit orders
- Order matching engine
- Real-time quotes and order book
- Portfolio management
- Trade history
- Low latency (< 10ms matching)
- High throughput (100K orders/sec)
- ACID guarantees (no double-spend)

## Architecture

```
Client → API Gateway → Order Service → Matching Engine → Settlement → Database
                           ↓
                    Message Queue (Kafka)
                           ↓
            [Market Data Service, Notification Service]
```

## Order Matching Engine

```python
from sortedcontainers import SortedList

class OrderBook:
    def __init__(self, symbol):
        self.symbol = symbol
        # Buy orders sorted by price DESC (highest price first)
        self.buy_orders = SortedList(key=lambda o: -o.price)
        # Sell orders sorted by price ASC (lowest price first)
        self.sell_orders = SortedList(key=lambda o: o.price)

    def add_order(self, order):
        if order.side == 'BUY':
            # Try to match with sell orders
            while order.quantity > 0 and self.sell_orders:
                best_sell = self.sell_orders[0]

                # Check if prices match (buy >= sell)
                if order.price >= best_sell.price:
                    # Match!
                    trade_quantity = min(order.quantity, best_sell.quantity)
                    trade_price = best_sell.price  # Take maker's price

                    self.execute_trade(order, best_sell, trade_quantity, trade_price)

                    order.quantity -= trade_quantity
                    best_sell.quantity -= trade_quantity

                    if best_sell.quantity == 0:
                        self.sell_orders.pop(0)
                else:
                    break  # No match possible

            # Add remaining quantity to order book
            if order.quantity > 0:
                self.buy_orders.add(order)

        else:  # SELL
            # Try to match with buy orders
            while order.quantity > 0 and self.buy_orders:
                best_buy = self.buy_orders[0]

                if best_buy.price >= order.price:
                    trade_quantity = min(order.quantity, best_buy.quantity)
                    trade_price = best_buy.price

                    self.execute_trade(best_buy, order, trade_quantity, trade_price)

                    order.quantity -= trade_quantity
                    best_buy.quantity -= trade_quantity

                    if best_buy.quantity == 0:
                        self.buy_orders.pop(0)
                else:
                    break

            if order.quantity > 0:
                self.sell_orders.add(order)

    def execute_trade(self, buy_order, sell_order, quantity, price):
        # Create trade record
        trade = {
            'symbol': self.symbol,
            'buy_order_id': buy_order.id,
            'sell_order_id': sell_order.id,
            'quantity': quantity,
            'price': price,
            'timestamp': now()
        }

        # Persist trade (ACID transaction)
        db.begin_transaction()
        try:
            db.insert_trade(trade)

            # Update buyer's portfolio
            db.execute("""
                UPDATE portfolios
                SET cash = cash - ?,
                    shares = shares + ?
                WHERE user_id = ?
            """, quantity * price, quantity, buy_order.user_id)

            # Update seller's portfolio
            db.execute("""
                UPDATE portfolios
                SET cash = cash + ?,
                    shares = shares - ?
                WHERE user_id = ?
            """, quantity * price, quantity, sell_order.user_id)

            db.commit()

            # Notify users
            kafka.publish('trade_executed', trade)

        except Exception as e:
            db.rollback()
            raise
```

## Database Design

```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY,
  user_id UUID,
  symbol VARCHAR(10),
  side VARCHAR(4),  -- BUY, SELL
  type VARCHAR(10),  -- MARKET, LIMIT
  quantity INT,
  price DECIMAL(10,2),  -- NULL for market orders
  filled_quantity INT DEFAULT 0,
  status VARCHAR(20),  -- PENDING, PARTIAL, FILLED, CANCELLED
  created_at TIMESTAMP,

  INDEX idx_user (user_id, created_at DESC),
  INDEX idx_symbol_status (symbol, status)
);

CREATE TABLE trades (
  trade_id UUID PRIMARY KEY,
  symbol VARCHAR(10),
  buy_order_id UUID,
  sell_order_id UUID,
  quantity INT,
  price DECIMAL(10,2),
  executed_at TIMESTAMP,

  INDEX idx_symbol_time (symbol, executed_at DESC)
);

CREATE TABLE portfolios (
  user_id UUID PRIMARY KEY,
  cash DECIMAL(15,2),
  CONSTRAINT positive_cash CHECK (cash >= 0)
);

CREATE TABLE holdings (
  user_id UUID,
  symbol VARCHAR(10),
  quantity INT,
  average_cost DECIMAL(10,2),

  PRIMARY KEY (user_id, symbol),
  CONSTRAINT positive_quantity CHECK (quantity >= 0)
);
```

## Order Validation

```python
def place_order(user_id, symbol, side, quantity, price=None):
    # 1. Validate sufficient balance
    if side == 'BUY':
        required_cash = quantity * (price or get_market_price(symbol))
        portfolio = db.get_portfolio(user_id)

        if portfolio.cash < required_cash:
            raise InsufficientFundsError()

        # Lock cash (pessimistic)
        db.execute("""
            UPDATE portfolios
            SET cash = cash - ?
            WHERE user_id = ? AND cash >= ?
        """, required_cash, user_id, required_cash)

    elif side == 'SELL':
        holding = db.get_holding(user_id, symbol)

        if holding.quantity < quantity:
            raise InsufficientSharesError()

        # Lock shares
        db.execute("""
            UPDATE holdings
            SET quantity = quantity - ?
            WHERE user_id = ? AND symbol = ? AND quantity >= ?
        """, quantity, user_id, symbol, quantity)

    # 2. Create order
    order_id = db.insert_order(user_id, symbol, side, quantity, price)

    # 3. Send to matching engine
    kafka.publish('orders', {
        'order_id': order_id,
        'user_id': user_id,
        'symbol': symbol,
        'side': side,
        'quantity': quantity,
        'price': price
    })

    return order_id
```

## Real-Time Market Data

```python
# WebSocket for live quotes
class MarketDataService:
    def on_trade(self, trade):
        # Update last price
        redis.set(f"last_price:{trade.symbol}", trade.price)

        # Update OHLCV (1-minute candle)
        minute = int(trade.timestamp / 60) * 60
        redis.zadd(f"trades:{trade.symbol}:{minute}",
                   {json.dumps(trade): trade.timestamp})

        # Publish to subscribers
        websocket.broadcast(f"ticker:{trade.symbol}", {
            "symbol": trade.symbol,
            "price": trade.price,
            "quantity": trade.quantity,
            "timestamp": trade.timestamp
        })

# Client subscribes
ws.send({
    "action": "subscribe",
    "channels": ["ticker:AAPL", "ticker:GOOGL"]
})
```

## Low-Latency Optimizations

1. **In-Memory Order Book**: Keep hot symbols in RAM
2. **Lock-Free Data Structures**: Concurrent queues
3. **Single-Threaded Matching**: One symbol = one thread (no locks)
4. **Pre-Allocated Memory**: Avoid GC pauses
5. **Co-location**: API servers near exchange

## Risk Management

```python
def check_circuit_breaker(symbol, price):
    """Halt trading if price moves >10% in 5 minutes"""
    prev_price = redis.get(f"price_5min_ago:{symbol}")

    if prev_price:
        change_pct = abs(price - prev_price) / prev_price

        if change_pct > 0.10:
            # Halt trading
            redis.set(f"trading_halted:{symbol}", 1, ex=300)  # 5 min
            return False

    return True

def check_position_limit(user_id, symbol, quantity):
    """Prevent one user from owning >5% of symbol"""
    total_supply = get_total_shares(symbol)
    current_holding = db.get_holding(user_id, symbol).quantity

    if (current_holding + quantity) / total_supply > 0.05:
        raise PositionLimitError()
```

## Scaling

1. **Shard by Symbol**: Each symbol on dedicated matching engine
2. **Read Replicas**: Portfolio queries on slaves
3. **Event Sourcing**: Replay order log for recovery
4. **CQRS**: Separate write (orders) and read (portfolio) models

## Monitoring

```
Performance:
- Order latency: p50 < 1ms, p99 < 10ms
- Trade execution rate: 100K trades/sec
- WebSocket message latency: < 50ms

Business:
- Orders per day: 50M
- Trades per day: 20M
- Average trade value: $10,000
- Daily volume: $200B
```

## Interview Talking Points

"Stock trading needs low latency (<10ms) and ACID guarantees. I'd use in-memory order book with price-time priority matching, pessimistic locking to prevent double-spend, and Kafka for async settlement. Shard by symbol (one matching engine per stock). Use WebSocket for real-time quotes. For scale, event sourcing for replay and CQRS for read/write separation. Monitor for circuit breakers (>10% move = halt)."
