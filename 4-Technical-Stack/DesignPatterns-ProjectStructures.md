# Real-World Project Structures with Design Patterns

> Complete folder structures and architecture examples showing when and how to apply design patterns

This guide demonstrates real-world project organization and shows which patterns to use where.

---

## Table of Contents

1. [E-commerce Platform](#e-commerce-platform)
2. [Social Media Application](#social-media-application)
3. [API Gateway Service](#api-gateway-service)
4. [Content Management System](#content-management-system)
5. [Microservices Architecture](#microservices-architecture)
6. [Game Engine](#game-engine)

---

## E-commerce Platform

### Complete Folder Structure

```
ecommerce-platform/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── Product.ts
│   │   │   │   ├── User.ts
│   │   │   │   ├── Order.ts
│   │   │   │   └── Cart.ts
│   │   │   └── interfaces/
│   │   │       ├── IRepository.ts
│   │   │       └── IPaymentGateway.ts
│   │   ├── patterns/
│   │   │   ├── singleton/
│   │   │   │   ├── ConfigManager.ts          # Singleton: App config
│   │   │   │   └── Logger.ts                 # Singleton: Logging
│   │   │   ├── factory/
│   │   │   │   ├── ProductFactory.ts         # Factory: Create products
│   │   │   │   └── OrderFactory.ts
│   │   │   ├── strategy/
│   │   │   │   ├── IPaymentStrategy.ts
│   │   │   │   ├── CreditCardPayment.ts      # Strategy: Payment methods
│   │   │   │   ├── PayPalPayment.ts
│   │   │   │   └── CryptoPayment.ts
│   │   │   ├── observer/
│   │   │   │   ├── IObserver.ts
│   │   │   │   ├── OrderSubject.ts           # Observer: Order events
│   │   │   │   ├── EmailNotifier.ts
│   │   │   │   ├── SMSNotifier.ts
│   │   │   │   └── InventoryUpdater.ts
│   │   │   ├── decorator/
│   │   │   │   ├── ProductDecorator.ts       # Decorator: Product features
│   │   │   │   ├── GiftWrapDecorator.ts
│   │   │   │   └── DiscountDecorator.ts
│   │   │   └── command/
│   │   │       ├── ICommand.ts
│   │   │       ├── CreateOrderCommand.ts     # Command: Order operations
│   │   │       └── CancelOrderCommand.ts
│   │   └── utils/
│   │       ├── validation/
│   │       └── helpers/
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── repositories/
│   │   │   │   ├── UserRepository.ts         # Repository pattern
│   │   │   │   ├── ProductRepository.ts
│   │   │   │   └── OrderRepository.ts
│   │   │   ├── factories/
│   │   │   │   └── DatabaseFactory.ts        # Factory: DB connections
│   │   │   └── migrations/
│   │   ├── cache/
│   │   │   ├── CacheManager.ts               # Singleton + Proxy
│   │   │   └── RedisCache.ts
│   │   ├── messaging/
│   │   │   ├── MessageQueue.ts               # Observer: Event bus
│   │   │   └── EventPublisher.ts
│   │   └── external/
│   │       ├── payment/
│   │       │   └── PaymentGatewayAdapter.ts  # Adapter: 3rd party APIs
│   │       └── shipping/
│   │           └── ShippingServiceAdapter.ts
│   ├── application/
│   │   ├── services/
│   │   │   ├── OrderService.ts               # Facade: Business logic
│   │   │   ├── PaymentService.ts
│   │   │   ├── ProductService.ts
│   │   │   └── UserService.ts
│   │   ├── usecases/
│   │   │   ├── checkout/
│   │   │   │   ├── CheckoutUseCase.ts
│   │   │   │   └── ValidateCart.ts
│   │   │   └── orders/
│   │   │       ├── CreateOrder.ts
│   │   │       └── TrackOrder.ts
│   │   └── dto/
│   │       ├── OrderDTO.ts
│   │       └── ProductDTO.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── ProductController.ts
│   │   │   ├── OrderController.ts
│   │   │   └── UserController.ts
│   │   ├── middleware/
│   │   │   ├── AuthMiddleware.ts             # Chain of Responsibility
│   │   │   ├── LoggingMiddleware.ts
│   │   │   └── RateLimitMiddleware.ts
│   │   ├── routes/
│   │   └── validators/
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── config/
│   ├── database.config.ts
│   ├── payment.config.ts
│   └── app.config.ts
└── package.json
```

### Pattern Usage Examples

#### 1. Checkout Flow (Multiple Patterns)

```typescript
// Order Service - Facade Pattern
class OrderService {
    constructor(
        private paymentFactory: PaymentFactory,      // Factory
        private orderRepository: OrderRepository,    // Repository
        private eventPublisher: EventPublisher,      // Observer
        private logger: Logger                       // Singleton
    ) {}

    async checkout(cart: Cart, paymentMethod: string): Promise<Order> {
        this.logger.log('Starting checkout process');

        // Factory: Create payment processor
        const paymentProcessor = this.paymentFactory.create(paymentMethod);

        // Strategy: Process payment
        const paymentResult = await paymentProcessor.process(cart.total);

        if (!paymentResult.success) {
            throw new Error('Payment failed');
        }

        // Create order
        const order = new Order(cart, paymentResult);
        await this.orderRepository.save(order);

        // Observer: Notify observers
        this.eventPublisher.publish('order.created', order);

        return order;
    }
}

// Observer: Email notification on order creation
class EmailNotifier implements IObserver {
    update(event: string, order: Order): void {
        if (event === 'order.created') {
            this.sendEmail(order.user.email, `Order ${order.id} confirmed`);
        }
    }

    private sendEmail(to: string, message: string): void {
        console.log(`Sending email to ${to}: ${message}`);
    }
}
```

---

## Social Media Application

### Complete Folder Structure

```
social-media-app/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── User.ts
│   │   │   │   ├── Post.ts
│   │   │   │   ├── Comment.ts
│   │   │   │   └── Message.ts
│   │   │   └── value-objects/
│   │   │       ├── UserId.ts
│   │   │       └── PostId.ts
│   │   ├── patterns/
│   │   │   ├── builder/
│   │   │   │   └── PostBuilder.ts            # Builder: Complex posts
│   │   │   ├── composite/
│   │   │   │   ├── IComponent.ts
│   │   │   │   ├── Feed.ts                   # Composite: Nested feeds
│   │   │   │   └── FeedItem.ts
│   │   │   ├── strategy/
│   │   │   │   ├── IRecommendationStrategy.ts
│   │   │   │   ├── TrendingStrategy.ts       # Strategy: Feed algorithms
│   │   │   │   ├── PersonalizedStrategy.ts
│   │   │   │   └── ChronologicalStrategy.ts
│   │   │   ├── observer/
│   │   │   │   ├── NotificationManager.ts    # Observer: Real-time updates
│   │   │   │   ├── PushNotification.ts
│   │   │   │   └── InAppNotification.ts
│   │   │   ├── proxy/
│   │   │   │   └── MediaProxy.ts             # Proxy: Lazy image loading
│   │   │   ├── decorator/
│   │   │   │   ├── ContentFilter.ts          # Decorator: Content moderation
│   │   │   │   ├── SpamFilter.ts
│   │   │   │   └── ProfanityFilter.ts
│   │   │   └── memento/
│   │   │       ├── PostMemento.ts            # Memento: Draft saving
│   │   │       └── DraftManager.ts
│   │   └── services/
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── repositories/
│   │   │   │   ├── UserRepository.ts
│   │   │   │   ├── PostRepository.ts
│   │   │   │   └── MessageRepository.ts
│   │   │   └── cache/
│   │   │       └── RedisCache.ts             # Proxy: Caching layer
│   │   ├── storage/
│   │   │   ├── S3StorageAdapter.ts           # Adapter: Cloud storage
│   │   │   └── LocalStorageAdapter.ts
│   │   ├── realtime/
│   │   │   ├── WebSocketManager.ts           # Singleton
│   │   │   └── EventStream.ts
│   │   └── search/
│   │       ├── ElasticsearchAdapter.ts       # Adapter: Search engine
│   │       └── SearchQueryBuilder.ts         # Builder: Complex queries
│   ├── application/
│   │   ├── services/
│   │   │   ├── PostService.ts                # Facade
│   │   │   ├── UserService.ts
│   │   │   ├── FeedService.ts
│   │   │   └── MessagingService.ts
│   │   ├── usecases/
│   │   │   ├── posts/
│   │   │   │   ├── CreatePost.ts
│   │   │   │   ├── LikePost.ts
│   │   │   │   └── SharePost.ts
│   │   │   ├── feed/
│   │   │   │   └── GenerateFeed.ts           # Strategy: Feed generation
│   │   │   └── messaging/
│   │   │       ├── SendMessage.ts
│   │   │       └── CreateThread.ts
│   │   └── dtos/
│   ├── presentation/
│   │   ├── api/
│   │   │   ├── controllers/
│   │   │   ├── graphql/
│   │   │   │   ├── resolvers/
│   │   │   │   └── schemas/
│   │   │   └── rest/
│   │   ├── websocket/
│   │   │   └── handlers/
│   │   └── middleware/
│   │       ├── AuthenticationMiddleware.ts   # Chain of Responsibility
│   │       └── RateLimitMiddleware.ts
│   └── index.ts
└── tests/
```

### Pattern Usage Examples

#### Feed Generation with Strategy Pattern

```typescript
interface IRecommendationStrategy {
    generateFeed(userId: string): Promise<Post[]>;
}

class TrendingStrategy implements IRecommendationStrategy {
    async generateFeed(userId: string): Promise<Post[]> {
        // Fetch trending posts
        return await this.postRepository.findTrending();
    }
}

class PersonalizedStrategy implements IRecommendationStrategy {
    constructor(
        private mlModel: MachineLearningModel,
        private userPreferences: UserPreferencesService
    ) {}

    async generateFeed(userId: string): Promise<Post[]> {
        const preferences = await this.userPreferences.get(userId);
        return await this.mlModel.predict(userId, preferences);
    }
}

class FeedService {
    private strategy: IRecommendationStrategy;

    setStrategy(strategy: IRecommendationStrategy): void {
        this.strategy = strategy;
    }

    async getFeed(userId: string): Promise<Post[]> {
        return await this.strategy.generateFeed(userId);
    }
}
```

---

## API Gateway Service

### Complete Folder Structure

```
api-gateway/
├── src/
│   ├── core/
│   │   ├── patterns/
│   │   │   ├── proxy/
│   │   │   │   ├── ServiceProxy.ts           # Proxy: Service routing
│   │   │   │   ├── CachingProxy.ts
│   │   │   │   └── RateLimitProxy.ts
│   │   │   ├── chain-of-responsibility/
│   │   │   │   ├── IMiddleware.ts
│   │   │   │   ├── AuthMiddleware.ts         # Chain: Request pipeline
│   │   │   │   ├── LoggingMiddleware.ts
│   │   │   │   ├── ValidationMiddleware.ts
│   │   │   │   ├── RateLimitMiddleware.ts
│   │   │   │   └── CircuitBreakerMiddleware.ts
│   │   │   ├── adapter/
│   │   │   │   ├── IServiceAdapter.ts
│   │   │   │   ├── RestAdapter.ts            # Adapter: Different protocols
│   │   │   │   ├── GraphQLAdapter.ts
│   │   │   │   ├── GrpcAdapter.ts
│   │   │   │   └── SoapAdapter.ts
│   │   │   ├── strategy/
│   │   │   │   ├── ILoadBalancerStrategy.ts
│   │   │   │   ├── RoundRobinStrategy.ts     # Strategy: Load balancing
│   │   │   │   ├── LeastConnectionsStrategy.ts
│   │   │   │   └── WeightedStrategy.ts
│   │   │   ├── decorator/
│   │   │   │   ├── RequestDecorator.ts       # Decorator: Request enrichment
│   │   │   │   ├── CompressionDecorator.ts
│   │   │   │   └── EncryptionDecorator.ts
│   │   │   └── facade/
│   │   │       └── GatewayFacade.ts          # Facade: Unified API
│   │   ├── routing/
│   │   │   ├── Router.ts
│   │   │   ├── RouteConfig.ts
│   │   │   └── ServiceRegistry.ts            # Singleton
│   │   ├── resilience/
│   │   │   ├── CircuitBreaker.ts
│   │   │   ├── RetryPolicy.ts
│   │   │   └── Timeout.ts
│   │   └── security/
│   │       ├── AuthenticationManager.ts
│   │       ├── JwtValidator.ts
│   │       └── ApiKeyValidator.ts
│   ├── infrastructure/
│   │   ├── http/
│   │   │   ├── HttpClient.ts                 # Builder pattern
│   │   │   └── HttpClientBuilder.ts
│   │   ├── cache/
│   │   │   ├── CacheManager.ts               # Singleton
│   │   │   └── RedisClient.ts
│   │   └── monitoring/
│   │       ├── MetricsCollector.ts           # Observer
│   │       └── HealthChecker.ts
│   ├── services/
│   │   ├── GatewayService.ts                 # Main service
│   │   ├── RoutingService.ts
│   │   └── AggregationService.ts
│   └── index.ts
└── config/
    ├── routes.config.ts
    ├── services.config.ts
    └── middleware.config.ts
```

### Pattern Usage: Request Pipeline

```typescript
// Chain of Responsibility: Middleware pipeline
abstract class Middleware {
    protected next: Middleware | null = null;

    setNext(middleware: Middleware): Middleware {
        this.next = middleware;
        return middleware;
    }

    async handle(request: Request): Promise<Response> {
        if (this.next) {
            return this.next.handle(request);
        }
        return this.process(request);
    }

    protected abstract process(request: Request): Promise<Response>;
}

class AuthMiddleware extends Middleware {
    protected async process(request: Request): Promise<Response> {
        const token = request.headers['authorization'];
        if (!this.validateToken(token)) {
            throw new UnauthorizedError();
        }
        return super.handle(request);
    }

    private validateToken(token: string): boolean {
        // JWT validation logic
        return true;
    }
}

class RateLimitMiddleware extends Middleware {
    protected async process(request: Request): Promise<Response> {
        const clientId = request.ip;
        if (this.isRateLimited(clientId)) {
            throw new RateLimitError();
        }
        return super.handle(request);
    }

    private isRateLimited(clientId: string): boolean {
        // Rate limit logic
        return false;
    }
}

class LoggingMiddleware extends Middleware {
    protected async process(request: Request): Promise<Response> {
        console.log(`Request: ${request.method} ${request.url}`);
        const startTime = Date.now();

        const response = await super.handle(request);

        const duration = Date.now() - startTime;
        console.log(`Response: ${response.status} (${duration}ms)`);

        return response;
    }
}

// Setup pipeline
const auth = new AuthMiddleware();
const rateLimit = new RateLimitMiddleware();
const logging = new LoggingMiddleware();

auth.setNext(rateLimit).setNext(logging);

// Process request through pipeline
await auth.handle(request);
```

---

## Microservices Architecture

### Service Structure

```
microservices/
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── patterns/
│   │   │   │   ├── repository/              # Repository pattern
│   │   │   │   │   └── UserRepository.ts
│   │   │   │   ├── factory/
│   │   │   │   │   └── UserFactory.ts
│   │   │   │   └── singleton/
│   │   │   │       └── DatabaseConnection.ts
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   └── infrastructure/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── order-service/
│   │   ├── src/
│   │   │   ├── patterns/
│   │   │   │   ├── saga/                    # Saga pattern
│   │   │   │   │   └── OrderSaga.ts
│   │   │   │   ├── event-sourcing/
│   │   │   │   │   └── OrderEventStore.ts
│   │   │   │   └── cqrs/                    # CQRS pattern
│   │   │   │       ├── commands/
│   │   │   │       └── queries/
│   │   │   └── ...
│   │   └── Dockerfile
│   ├── payment-service/
│   │   ├── src/
│   │   │   ├── patterns/
│   │   │   │   ├── strategy/                # Payment strategies
│   │   │   │   ├── adapter/                 # Payment gateway adapters
│   │   │   │   └── circuit-breaker/
│   │   │   └── ...
│   │   └── Dockerfile
│   └── notification-service/
│       ├── src/
│       │   ├── patterns/
│       │   │   ├── observer/                # Event subscribers
│       │   │   ├── factory/                 # Notification factory
│       │   │   └── template-method/         # Template for notifications
│       │   └── ...
│       └── Dockerfile
├── shared/
│   ├── patterns/
│   │   ├── message-bus/                     # Observer pattern
│   │   ├── service-discovery/               # Registry pattern
│   │   └── api-gateway/                     # Gateway pattern
│   └── utils/
├── infrastructure/
│   ├── docker-compose.yml
│   └── kubernetes/
│       ├── deployments/
│       └── services/
└── docs/
```

---

## Summary: When to Use Each Pattern

### By Use Case

| Use Case | Recommended Patterns |
|----------|---------------------|
| **Payment Processing** | Strategy, Factory, Adapter |
| **User Authentication** | Chain of Responsibility, Singleton |
| **Notifications** | Observer, Factory, Template Method |
| **API Gateway** | Facade, Proxy, Chain of Responsibility |
| **File Upload** | Builder, Proxy, Strategy |
| **Caching** | Proxy, Singleton, Decorator |
| **Logging** | Singleton, Observer, Decorator |
| **Database Access** | Repository, Factory, Singleton |
| **UI Components** | Composite, Decorator, Builder |
| **Undo/Redo** | Command, Memento |

### Architecture Layers

```
┌─────────────────────────────────────┐
│ Presentation Layer                  │
│ - Controllers (Facade)              │
│ - Middleware (Chain of Resp.)       │
│ - Validators (Strategy)             │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Application Layer                   │
│ - Services (Facade)                 │
│ - Use Cases (Command)               │
│ - DTOs (Builder)                    │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Domain Layer                        │
│ - Entities                          │
│ - Value Objects                     │
│ - Domain Services                   │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Infrastructure Layer                │
│ - Repositories (Repository)         │
│ - External Services (Adapter)       │
│ - Database (Singleton, Factory)     │
│ - Cache (Proxy)                     │
└─────────────────────────────────────┘
```

---

## Key Takeaways

1. **Don't overuse patterns** - Start simple, refactor to patterns when needed
2. **Combine patterns** - Real applications use multiple patterns together
3. **Layer appropriately** - Different patterns fit different architectural layers
4. **Test thoroughly** - Patterns should improve, not complicate testing
5. **Document decisions** - Explain why patterns were chosen

---

*Back to: [Design Patterns Index](DesignPatterns.md)*
