# Strategy Pattern

> Define a family of algorithms, encapsulate each one, and make them interchangeable

## Overview

The Strategy pattern lets you define a family of algorithms, put each of them into a separate class, and make their objects interchangeable. It enables selecting an algorithm at runtime without changing the code that uses it.

**Category**: Behavioral Pattern

---

## When to Use

✅ **Use Strategy when:**
- You have multiple algorithms for a specific task
- You want to switch algorithms at runtime
- You need to isolate algorithm implementation details
- You have many conditional statements selecting different behaviors
- Different variants of an algorithm are needed

❌ **Avoid Strategy when:**
- You have only one or two algorithms
- Algorithms rarely change
- Simple conditional logic is sufficient
- Overhead of extra classes isn't justified

---

## Real-World Use Cases

1. **Payment Processing**
   - Credit card, PayPal, Crypto
   - Different payment gateways
   - Regional payment methods

2. **Sorting Algorithms**
   - Quick sort, merge sort, bubble sort
   - Choose based on data size
   - Performance optimization

3. **Compression Algorithms**
   - ZIP, RAR, 7z, GZIP
   - Different compression levels
   - Format selection

4. **Routing Algorithms**
   - Shortest path, fastest route
   - Avoid tolls, scenic route
   - Traffic-aware routing

5. **Validation Strategies**
   - Email, phone, password
   - Different rule sets
   - Custom validators

---

## Project Folder Structure

### Example 1: Payment System
```
project/
├── src/
│   ├── payment/
│   │   ├── strategies/
│   │   │   ├── IPaymentStrategy.ts      # Interface
│   │   │   ├── CreditCardStrategy.ts
│   │   │   ├── PayPalStrategy.ts
│   │   │   ├── CryptoStrategy.ts
│   │   │   └── BankTransferStrategy.ts
│   │   ├── context/
│   │   │   └── PaymentProcessor.ts      # Context
│   │   ├── models/
│   │   │   ├── Payment.ts
│   │   │   └── PaymentResult.ts
│   │   └── validators/
│   │       └── PaymentValidator.ts
│   ├── services/
│   │   └── CheckoutService.ts           # Uses strategies
│   └── controllers/
│       └── PaymentController.ts
├── tests/
│   └── strategies/
└── config/
    └── payment.config.ts
```

### Example 2: Data Export System
```
project/
├── src/
│   ├── export/
│   │   ├── strategies/
│   │   │   ├── IExportStrategy.ts
│   │   │   ├── CsvExportStrategy.ts
│   │   │   ├── JsonExportStrategy.ts
│   │   │   ├── XmlExportStrategy.ts
│   │   │   └── PdfExportStrategy.ts
│   │   ├── context/
│   │   │   └── DataExporter.ts
│   │   └── formatters/
│   │       └── DataFormatter.ts
│   ├── services/
│   │   └── ReportService.ts
│   └── models/
│       └── Report.ts
└── tests/
```

### Example 3: Authentication System
```
project/
├── src/
│   ├── auth/
│   │   ├── strategies/
│   │   │   ├── IAuthStrategy.ts
│   │   │   ├── LocalStrategy.ts         # Username/password
│   │   │   ├── JwtStrategy.ts           # JWT tokens
│   │   │   ├── OAuth2Strategy.ts        # OAuth
│   │   │   └── ApiKeyStrategy.ts        # API keys
│   │   ├── context/
│   │   │   └── AuthService.ts
│   │   ├── middleware/
│   │   │   └── AuthMiddleware.ts
│   │   └── models/
│   │       ├── User.ts
│   │       └── Credentials.ts
│   └── controllers/
│       └── AuthController.ts
└── config/
    └── auth.config.ts
```

---

## TypeScript Implementation

### Basic Strategy Pattern

```typescript
// Strategy Interface
interface PaymentStrategy {
    pay(amount: number): Promise<PaymentResult>;
    validate(): boolean;
    getProcessingFee(amount: number): number;
}

interface PaymentResult {
    success: boolean;
    transactionId: string;
    message: string;
}

// Concrete Strategies
class CreditCardStrategy implements PaymentStrategy {
    constructor(
        private cardNumber: string,
        private cvv: string,
        private expiryDate: string
    ) {}

    validate(): boolean {
        // Validate card details
        return this.cardNumber.length === 16 && this.cvv.length === 3;
    }

    getProcessingFee(amount: number): number {
        return amount * 0.029 + 0.30; // 2.9% + $0.30
    }

    async pay(amount: number): Promise<PaymentResult> {
        if (!this.validate()) {
            throw new Error('Invalid card details');
        }

        console.log(`Processing $${amount} via Credit Card`);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            transactionId: `cc_${Date.now()}`,
            message: 'Payment processed successfully'
        };
    }
}

class PayPalStrategy implements PaymentStrategy {
    constructor(
        private email: string,
        private password: string
    ) {}

    validate(): boolean {
        return this.email.includes('@') && this.password.length >= 8;
    }

    getProcessingFee(amount: number): number {
        return amount * 0.034 + 0.30; // 3.4% + $0.30
    }

    async pay(amount: number): Promise<PaymentResult> {
        if (!this.validate()) {
            throw new Error('Invalid PayPal credentials');
        }

        console.log(`Processing $${amount} via PayPal`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            transactionId: `pp_${Date.now()}`,
            message: 'PayPal payment successful'
        };
    }
}

class CryptoStrategy implements PaymentStrategy {
    constructor(
        private walletAddress: string,
        private cryptocurrency: string
    ) {}

    validate(): boolean {
        return this.walletAddress.length > 20;
    }

    getProcessingFee(amount: number): number {
        return 0.01; // Flat fee
    }

    async pay(amount: number): Promise<PaymentResult> {
        if (!this.validate()) {
            throw new Error('Invalid wallet address');
        }

        console.log(`Processing $${amount} via ${this.cryptocurrency}`);
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            success: true,
            transactionId: `crypto_${Date.now()}`,
            message: `${this.cryptocurrency} payment successful`
        };
    }
}

// Context
class PaymentProcessor {
    private strategy: PaymentStrategy;

    constructor(strategy: PaymentStrategy) {
        this.strategy = strategy;
    }

    // Allow changing strategy at runtime
    public setStrategy(strategy: PaymentStrategy): void {
        this.strategy = strategy;
    }

    public async processPayment(amount: number): Promise<PaymentResult> {
        const fee = this.strategy.getProcessingFee(amount);
        const total = amount + fee;

        console.log(`Total amount (including fee): $${total.toFixed(2)}`);

        return await this.strategy.pay(total);
    }
}

// Usage
async function main() {
    // Credit card payment
    const creditCard = new CreditCardStrategy(
        '4111111111111111',
        '123',
        '12/25'
    );
    const processor = new PaymentProcessor(creditCard);
    await processor.processPayment(100);

    // Switch to PayPal
    const paypal = new PayPalStrategy('user@example.com', 'password123');
    processor.setStrategy(paypal);
    await processor.processPayment(50);

    // Switch to Crypto
    const crypto = new CryptoStrategy(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'Bitcoin'
    );
    processor.setStrategy(crypto);
    await processor.processPayment(200);
}
```

### Advanced: Compression Strategy

```typescript
interface CompressionStrategy {
    compress(data: string): Buffer;
    decompress(data: Buffer): string;
    getCompressionRatio(original: string, compressed: Buffer): number;
    getName(): string;
}

class ZipCompression implements CompressionStrategy {
    private level: number;

    constructor(level: number = 6) {
        this.level = level; // 1-9
    }

    getName(): string {
        return `ZIP (Level ${this.level})`;
    }

    compress(data: string): Buffer {
        console.log(`Compressing with ${this.getName()}`);
        // Simulate compression
        const compressed = Buffer.from(data).toString('base64');
        return Buffer.from(compressed);
    }

    decompress(data: Buffer): string {
        console.log(`Decompressing with ${this.getName()}`);
        return Buffer.from(data.toString(), 'base64').toString();
    }

    getCompressionRatio(original: string, compressed: Buffer): number {
        return (compressed.length / original.length) * 100;
    }
}

class GzipCompression implements CompressionStrategy {
    getName(): string {
        return 'GZIP';
    }

    compress(data: string): Buffer {
        console.log(`Compressing with ${this.getName()}`);
        const zlib = require('zlib');
        return zlib.gzipSync(data);
    }

    decompress(data: Buffer): string {
        console.log(`Decompressing with ${this.getName()}`);
        const zlib = require('zlib');
        return zlib.gunzipSync(data).toString();
    }

    getCompressionRatio(original: string, compressed: Buffer): number {
        return (compressed.length / original.length) * 100;
    }
}

class NoCompression implements CompressionStrategy {
    getName(): string {
        return 'No Compression';
    }

    compress(data: string): Buffer {
        return Buffer.from(data);
    }

    decompress(data: Buffer): string {
        return data.toString();
    }

    getCompressionRatio(original: string, compressed: Buffer): number {
        return 100;
    }
}

// Context with automatic strategy selection
class FileCompressor {
    private strategy: CompressionStrategy;

    constructor(strategy: CompressionStrategy) {
        this.strategy = strategy;
    }

    public setStrategy(strategy: CompressionStrategy): void {
        this.strategy = strategy;
    }

    // Auto-select strategy based on data size
    public autoSelectStrategy(dataSize: number): void {
        if (dataSize < 1024) {
            // Small files: no compression
            this.strategy = new NoCompression();
        } else if (dataSize < 1024 * 100) {
            // Medium files: ZIP
            this.strategy = new ZipCompression(6);
        } else {
            // Large files: GZIP
            this.strategy = new GzipCompression();
        }
        console.log(`Auto-selected: ${this.strategy.getName()}`);
    }

    public compressFile(data: string): { compressed: Buffer; ratio: number } {
        const compressed = this.strategy.compress(data);
        const ratio = this.strategy.getCompressionRatio(data, compressed);

        console.log(`Compression ratio: ${ratio.toFixed(2)}%`);
        return { compressed, ratio };
    }

    public decompressFile(data: Buffer): string {
        return this.strategy.decompress(data);
    }
}

// Usage
const largeData = 'x'.repeat(200 * 1024); // 200KB
const compressor = new FileCompressor(new NoCompression());

compressor.autoSelectStrategy(largeData.length);
const { compressed, ratio } = compressor.compressFile(largeData);
const decompressed = compressor.decompressFile(compressed);

console.log(`Original: ${largeData.length} bytes`);
console.log(`Compressed: ${compressed.length} bytes`);
```

---

## Python Implementation

### Basic Strategy Pattern

```python
from abc import ABC, abstractmethod
from typing import Protocol
from dataclasses import dataclass
import asyncio


@dataclass
class PaymentResult:
    success: bool
    transaction_id: str
    message: str


class PaymentStrategy(Protocol):
    """Strategy interface using Protocol (structural subtyping)"""

    def validate(self) -> bool:
        ...

    def get_processing_fee(self, amount: float) -> float:
        ...

    async def pay(self, amount: float) -> PaymentResult:
        ...


class CreditCardStrategy:
    def __init__(self, card_number: str, cvv: str, expiry_date: str):
        self.card_number = card_number
        self.cvv = cvv
        self.expiry_date = expiry_date

    def validate(self) -> bool:
        return len(self.card_number) == 16 and len(self.cvv) == 3

    def get_processing_fee(self, amount: float) -> float:
        return amount * 0.029 + 0.30  # 2.9% + $0.30

    async def pay(self, amount: float) -> PaymentResult:
        if not self.validate():
            raise ValueError("Invalid card details")

        print(f"Processing ${amount} via Credit Card")
        await asyncio.sleep(1)  # Simulate API call

        return PaymentResult(
            success=True,
            transaction_id=f"cc_{int(asyncio.get_event_loop().time())}",
            message="Payment processed successfully"
        )


class PayPalStrategy:
    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password

    def validate(self) -> bool:
        return '@' in self.email and len(self.password) >= 8

    def get_processing_fee(self, amount: float) -> float:
        return amount * 0.034 + 0.30  # 3.4% + $0.30

    async def pay(self, amount: float) -> PaymentResult:
        if not self.validate():
            raise ValueError("Invalid PayPal credentials")

        print(f"Processing ${amount} via PayPal")
        await asyncio.sleep(1)

        return PaymentResult(
            success=True,
            transaction_id=f"pp_{int(asyncio.get_event_loop().time())}",
            message="PayPal payment successful"
        )


class CryptoStrategy:
    def __init__(self, wallet_address: str, cryptocurrency: str):
        self.wallet_address = wallet_address
        self.cryptocurrency = cryptocurrency

    def validate(self) -> bool:
        return len(self.wallet_address) > 20

    def get_processing_fee(self, amount: float) -> float:
        return 0.01  # Flat fee

    async def pay(self, amount: float) -> PaymentResult:
        if not self.validate():
            raise ValueError("Invalid wallet address")

        print(f"Processing ${amount} via {self.cryptocurrency}")
        await asyncio.sleep(2)

        return PaymentResult(
            success=True,
            transaction_id=f"crypto_{int(asyncio.get_event_loop().time())}",
            message=f"{self.cryptocurrency} payment successful"
        )


class PaymentProcessor:
    """Context class"""

    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: PaymentStrategy) -> None:
        """Allow changing strategy at runtime"""
        self._strategy = strategy

    async def process_payment(self, amount: float) -> PaymentResult:
        fee = self._strategy.get_processing_fee(amount)
        total = amount + fee

        print(f"Total amount (including fee): ${total:.2f}")
        return await self._strategy.pay(total)


# Usage
async def main():
    # Credit card payment
    credit_card = CreditCardStrategy('4111111111111111', '123', '12/25')
    processor = PaymentProcessor(credit_card)
    await processor.process_payment(100)

    # Switch to PayPal
    paypal = PayPalStrategy('user@example.com', 'password123')
    processor.set_strategy(paypal)
    await processor.process_payment(50)

    # Switch to Crypto
    crypto = CryptoStrategy('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Bitcoin')
    processor.set_strategy(crypto)
    await processor.process_payment(200)


if __name__ == "__main__":
    asyncio.run(main())
```

### Functional Strategy Pattern (Python)

```python
from typing import Callable, Dict
from dataclasses import dataclass


@dataclass
class DiscountResult:
    original_price: float
    discount_amount: float
    final_price: float
    strategy_name: str


# Strategies as functions
def no_discount(price: float) -> float:
    """No discount applied"""
    return price


def percentage_discount(percentage: float) -> Callable[[float], float]:
    """Returns a function that applies percentage discount"""
    def apply(price: float) -> float:
        return price * (1 - percentage / 100)
    return apply


def fixed_amount_discount(amount: float) -> Callable[[float], float]:
    """Returns a function that applies fixed amount discount"""
    def apply(price: float) -> float:
        return max(0, price - amount)
    return apply


def bulk_discount(min_quantity: int, discount_percentage: float) -> Callable[[float, int], float]:
    """Returns a function that applies bulk discount"""
    def apply(price: float, quantity: int = 1) -> float:
        if quantity >= min_quantity:
            return price * (1 - discount_percentage / 100)
        return price
    return apply


# Context
class PricingCalculator:
    def __init__(self):
        self.strategies: Dict[str, Callable] = {
            'none': no_discount,
            'seasonal': percentage_discount(20),
            'loyalty': percentage_discount(15),
            'clearance': percentage_discount(50),
            'coupon': fixed_amount_discount(10),
            'bulk': bulk_discount(10, 25)
        }

    def calculate_price(
        self,
        original_price: float,
        strategy_name: str,
        quantity: int = 1
    ) -> DiscountResult:
        """Calculate price using specified strategy"""
        if strategy_name not in self.strategies:
            raise ValueError(f"Unknown strategy: {strategy_name}")

        strategy = self.strategies[strategy_name]

        # Handle strategies with different signatures
        try:
            final_price = strategy(original_price, quantity)
        except TypeError:
            final_price = strategy(original_price)

        discount_amount = original_price - final_price

        return DiscountResult(
            original_price=original_price,
            discount_amount=discount_amount,
            final_price=final_price,
            strategy_name=strategy_name
        )

    def add_strategy(self, name: str, strategy: Callable) -> None:
        """Add new pricing strategy"""
        self.strategies[name] = strategy


# Usage
if __name__ == "__main__":
    calculator = PricingCalculator()

    # Apply different strategies
    result1 = calculator.calculate_price(100, 'seasonal')
    print(f"Seasonal: ${result1.final_price} (saved ${result1.discount_amount})")

    result2 = calculator.calculate_price(100, 'coupon')
    print(f"Coupon: ${result2.final_price} (saved ${result2.discount_amount})")

    result3 = calculator.calculate_price(100, 'bulk', quantity=15)
    print(f"Bulk: ${result3.final_price} (saved ${result3.discount_amount})")

    # Add custom strategy
    calculator.add_strategy(
        'vip',
        percentage_discount(30)
    )
    result4 = calculator.calculate_price(100, 'vip')
    print(f"VIP: ${result4.final_price} (saved ${result4.discount_amount})")
```

---

## Advantages & Disadvantages

### Advantages ✅
- **Open/Closed Principle**: Add new strategies without changing context
- **Runtime flexibility**: Switch algorithms on the fly
- **Testability**: Easy to test each strategy independently
- **Code reuse**: Strategies can be reused across contexts
- **Separation of concerns**: Algorithm logic separated from business logic

### Disadvantages ❌
- **Increased complexity**: More classes/functions
- **Client awareness**: Client must know about different strategies
- **Communication overhead**: Context and strategy must share data
- **Can be overkill**: Simple if/else might be sufficient

---

## Common Pitfalls

### 1. Strategy Has Too Much Logic
```typescript
// ❌ BAD: Strategy doing too much
class BadStrategy implements PaymentStrategy {
    async pay(amount: number) {
        // Validation
        // Database access
        // Email sending
        // Logging
        // Business logic
    }
}

// ✅ GOOD: Single responsibility
class GoodStrategy implements PaymentStrategy {
    constructor(
        private validator: PaymentValidator,
        private logger: Logger
    ) {}

    async pay(amount: number) {
        this.validator.validate(amount);
        const result = await this.processPayment(amount);
        this.logger.log(result);
        return result;
    }
}
```

### 2. Not Using Interface
```python
# ❌ BAD: No common interface
class CreditCard:
    def process_credit_card(self, amount):
        pass

class PayPal:
    def send_paypal_payment(self, amount):  # Different method!
        pass

# ✅ GOOD: Common interface
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: float):
        pass
```

---

## Related Patterns

- **State**: Similar structure, but State changes behavior based on internal state
- **Command**: Encapsulates requests, Strategy encapsulates algorithms
- **Factory**: Often used together to create strategies
- **Template Method**: Alternative when algorithm structure is fixed

---

## Summary

**Key Takeaways:**
1. Strategy encapsulates algorithms in separate classes
2. Enables runtime algorithm selection
3. Follows Open/Closed Principle
4. Client selects strategy (vs State where object changes itself)
5. Can be implemented functionally in languages with first-class functions

**When to use**: Multiple algorithms, runtime selection, avoid conditionals
**When to avoid**: Simple cases, algorithms don't change, few variants

---

*Next: [Observer Pattern](DesignPatterns-Observer.md)*
