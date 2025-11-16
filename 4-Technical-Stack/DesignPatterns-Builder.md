# Builder Pattern

> Separate the construction of a complex object from its representation, allowing the same construction process to create different representations

## Overview

The Builder pattern constructs complex objects step by step. Unlike other creational patterns, Builder doesn't require products to have a common interface, which allows you to produce different types and representations using the same construction code.

**Category**: Creational Pattern

---

## When to Use

✅ **Use Builder when:**
- Object has many optional parameters (telescoping constructor problem)
- Object creation requires multiple steps
- You want to create different representations of the same object
- Construction algorithm should be independent of the parts
- You need immutable objects with many fields

❌ **Avoid Builder when:**
- Object is simple with few fields
- All parameters are required
- Object structure rarely changes
- Simple constructor or factory is sufficient

---

## Real-World Use Cases

1. **HTTP Request Builders**
   - Headers, query params, body
   - Method chaining
   - Fluent interface

2. **SQL Query Builders**
   - SELECT, WHERE, JOIN clauses
   - Dynamic query construction
   - Type-safe queries

3. **Document/Report Builders**
   - PDF, HTML, Markdown generation
   - Complex document structure
   - Different output formats

4. **Configuration Objects**
   - Application settings
   - Feature flags
   - Environment-specific configs

5. **UI Component Builders**
   - Form builders
   - Dialog/Modal builders
   - Complex widget construction

---

## Project Folder Structure

### Example 1: HTTP Client Builder
```
project/
├── src/
│   ├── http/
│   │   ├── HttpClient.ts
│   │   ├── HttpRequestBuilder.ts     # Builder
│   │   ├── HttpRequest.ts            # Product
│   │   ├── HttpResponse.ts
│   │   └── interfaces/
│   │       └── IRequestBuilder.ts
│   ├── middleware/
│   │   ├── AuthMiddleware.ts
│   │   └── LoggingMiddleware.ts
│   └── services/
│       └── ApiService.ts             # Uses builder
├── tests/
│   └── HttpRequestBuilder.test.ts
└── examples/
    └── usage.ts
```

### Example 2: Query Builder
```
project/
├── src/
│   ├── database/
│   │   ├── builders/
│   │   │   ├── QueryBuilder.ts       # Main builder
│   │   │   ├── SelectBuilder.ts
│   │   │   ├── InsertBuilder.ts
│   │   │   └── UpdateBuilder.ts
│   │   ├── query/
│   │   │   ├── Query.ts              # Product
│   │   │   └── Clause.ts
│   │   ├── connection/
│   │   │   └── Connection.ts
│   │   └── interfaces/
│   │       └── IQueryBuilder.ts
│   ├── models/
│   │   └── User.ts
│   └── repositories/
│       └── UserRepository.ts         # Uses builder
└── tests/
```

### Example 3: Form Builder
```
project/
├── src/
│   ├── forms/
│   │   ├── builders/
│   │   │   ├── FormBuilder.ts        # Main builder
│   │   │   ├── FieldBuilder.ts
│   │   │   └── ValidationBuilder.ts
│   │   ├── components/
│   │   │   ├── Form.ts               # Product
│   │   │   ├── Field.ts
│   │   │   └── Validator.ts
│   │   └── interfaces/
│   │       └── IFormBuilder.ts
│   ├── validators/
│   │   └── rules/
│   └── renderers/
│       ├── HTMLRenderer.ts
│       └── ReactRenderer.ts
└── examples/
```

---

## TypeScript Implementation

### Basic Builder Pattern

```typescript
// Product
class User {
    constructor(
        public readonly username: string,
        public readonly email: string,
        public readonly firstName?: string,
        public readonly lastName?: string,
        public readonly age?: number,
        public readonly phone?: string,
        public readonly address?: string,
        public readonly role?: string
    ) {}

    public getFullName(): string {
        return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
    }
}

// Builder
class UserBuilder {
    private username!: string;
    private email!: string;
    private firstName?: string;
    private lastName?: string;
    private age?: number;
    private phone?: string;
    private address?: string;
    private role?: string;

    public setUsername(username: string): this {
        this.username = username;
        return this;
    }

    public setEmail(email: string): this {
        this.email = email;
        return this;
    }

    public setFirstName(firstName: string): this {
        this.firstName = firstName;
        return this;
    }

    public setLastName(lastName: string): this {
        this.lastName = lastName;
        return this;
    }

    public setAge(age: number): this {
        this.age = age;
        return this;
    }

    public setPhone(phone: string): this {
        this.phone = phone;
        return this;
    }

    public setAddress(address: string): this {
        this.address = address;
        return this;
    }

    public setRole(role: string): this {
        this.role = role;
        return this;
    }

    public build(): User {
        // Validation
        if (!this.username || !this.email) {
            throw new Error('Username and email are required');
        }

        return new User(
            this.username,
            this.email,
            this.firstName,
            this.lastName,
            this.age,
            this.phone,
            this.address,
            this.role
        );
    }

    public reset(): this {
        this.username = '';
        this.email = '';
        this.firstName = undefined;
        this.lastName = undefined;
        this.age = undefined;
        this.phone = undefined;
        this.address = undefined;
        this.role = undefined;
        return this;
    }
}

// Usage
const user = new UserBuilder()
    .setUsername('johndoe')
    .setEmail('john@example.com')
    .setFirstName('John')
    .setLastName('Doe')
    .setAge(30)
    .setRole('admin')
    .build();

console.log(user.getFullName()); // "John Doe"
```

### HTTP Request Builder

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Headers {
    [key: string]: string;
}

interface QueryParams {
    [key: string]: string | number | boolean;
}

class HttpRequest {
    constructor(
        public readonly url: string,
        public readonly method: HttpMethod,
        public readonly headers: Headers,
        public readonly queryParams: QueryParams,
        public readonly body?: any,
        public readonly timeout?: number
    ) {}

    public getFullUrl(): string {
        const params = new URLSearchParams(
            Object.entries(this.queryParams).map(([k, v]) => [k, String(v)])
        );
        const queryString = params.toString();
        return queryString ? `${this.url}?${queryString}` : this.url;
    }
}

class HttpRequestBuilder {
    private url: string = '';
    private method: HttpMethod = 'GET';
    private headers: Headers = {};
    private queryParams: QueryParams = {};
    private body?: any;
    private timeout?: number;

    public setUrl(url: string): this {
        this.url = url;
        return this;
    }

    public setMethod(method: HttpMethod): this {
        this.method = method;
        return this;
    }

    public addHeader(key: string, value: string): this {
        this.headers[key] = value;
        return this;
    }

    public setHeaders(headers: Headers): this {
        this.headers = { ...headers };
        return this;
    }

    public addQueryParam(key: string, value: string | number | boolean): this {
        this.queryParams[key] = value;
        return this;
    }

    public setQueryParams(params: QueryParams): this {
        this.queryParams = { ...params };
        return this;
    }

    public setBody(body: any): this {
        this.body = body;
        return this;
    }

    public setJsonBody(data: object): this {
        this.body = data;
        this.addHeader('Content-Type', 'application/json');
        return this;
    }

    public setTimeout(timeout: number): this {
        this.timeout = timeout;
        return this;
    }

    // Convenience methods
    public get(url: string): this {
        return this.setUrl(url).setMethod('GET');
    }

    public post(url: string): this {
        return this.setUrl(url).setMethod('POST');
    }

    public put(url: string): this {
        return this.setUrl(url).setMethod('PUT');
    }

    public delete(url: string): this {
        return this.setUrl(url).setMethod('DELETE');
    }

    // Authentication helpers
    public withBearerToken(token: string): this {
        return this.addHeader('Authorization', `Bearer ${token}`);
    }

    public withBasicAuth(username: string, password: string): this {
        const encoded = btoa(`${username}:${password}`);
        return this.addHeader('Authorization', `Basic ${encoded}`);
    }

    public build(): HttpRequest {
        if (!this.url) {
            throw new Error('URL is required');
        }

        return new HttpRequest(
            this.url,
            this.method,
            this.headers,
            this.queryParams,
            this.body,
            this.timeout
        );
    }
}

// Usage
const request = new HttpRequestBuilder()
    .post('https://api.example.com/users')
    .withBearerToken('eyJhbGciOiJIUzI1...')
    .setJsonBody({ name: 'John Doe', email: 'john@example.com' })
    .addQueryParam('sendEmail', true)
    .setTimeout(5000)
    .build();

console.log(request.getFullUrl());
console.log(request.headers);
console.log(request.body);
```

### SQL Query Builder

```typescript
type OrderDirection = 'ASC' | 'DESC';

class SqlQuery {
    constructor(
        public readonly sql: string,
        public readonly params: any[]
    ) {}

    public execute(connection: any): Promise<any> {
        // Execute query with connection
        return connection.query(this.sql, this.params);
    }
}

class QueryBuilder {
    private selectFields: string[] = ['*'];
    private tableName: string = '';
    private whereConditions: string[] = [];
    private joinClauses: string[] = [];
    private orderByFields: Array<{ field: string; direction: OrderDirection }> = [];
    private limitValue?: number;
    private offsetValue?: number;
    private params: any[] = [];

    public select(...fields: string[]): this {
        this.selectFields = fields.length > 0 ? fields : ['*'];
        return this;
    }

    public from(table: string): this {
        this.tableName = table;
        return this;
    }

    public where(condition: string, ...params: any[]): this {
        this.whereConditions.push(condition);
        this.params.push(...params);
        return this;
    }

    public andWhere(condition: string, ...params: any[]): this {
        return this.where(condition, ...params);
    }

    public orWhere(condition: string, ...params: any[]): this {
        if (this.whereConditions.length > 0) {
            const lastCondition = this.whereConditions.pop()!;
            this.whereConditions.push(`(${lastCondition}) OR (${condition})`);
        } else {
            this.whereConditions.push(condition);
        }
        this.params.push(...params);
        return this;
    }

    public join(table: string, condition: string): this {
        this.joinClauses.push(`INNER JOIN ${table} ON ${condition}`);
        return this;
    }

    public leftJoin(table: string, condition: string): this {
        this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
        return this;
    }

    public orderBy(field: string, direction: OrderDirection = 'ASC'): this {
        this.orderByFields.push({ field, direction });
        return this;
    }

    public limit(limit: number): this {
        this.limitValue = limit;
        return this;
    }

    public offset(offset: number): this {
        this.offsetValue = offset;
        return this;
    }

    public build(): SqlQuery {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.tableName}`;

        // Add JOINs
        if (this.joinClauses.length > 0) {
            sql += ' ' + this.joinClauses.join(' ');
        }

        // Add WHERE
        if (this.whereConditions.length > 0) {
            sql += ' WHERE ' + this.whereConditions.join(' AND ');
        }

        // Add ORDER BY
        if (this.orderByFields.length > 0) {
            const orderClauses = this.orderByFields.map(
                ({ field, direction }) => `${field} ${direction}`
            );
            sql += ' ORDER BY ' + orderClauses.join(', ');
        }

        // Add LIMIT
        if (this.limitValue !== undefined) {
            sql += ` LIMIT ${this.limitValue}`;
        }

        // Add OFFSET
        if (this.offsetValue !== undefined) {
            sql += ` OFFSET ${this.offsetValue}`;
        }

        return new SqlQuery(sql, this.params);
    }

    public toSql(): string {
        return this.build().sql;
    }
}

// Usage
const query = new QueryBuilder()
    .select('users.id', 'users.name', 'orders.total')
    .from('users')
    .leftJoin('orders', 'users.id = orders.user_id')
    .where('users.age > ?', 18)
    .andWhere('users.active = ?', true)
    .orderBy('users.name', 'ASC')
    .limit(10)
    .offset(20)
    .build();

console.log(query.sql);
console.log(query.params);
```

---

## Python Implementation

### Basic Builder Pattern

```python
from __future__ import annotations
from typing import Optional
from dataclasses import dataclass


@dataclass
class User:
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None

    def get_full_name(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username


class UserBuilder:
    def __init__(self):
        self._username: Optional[str] = None
        self._email: Optional[str] = None
        self._first_name: Optional[str] = None
        self._last_name: Optional[str] = None
        self._age: Optional[int] = None
        self._phone: Optional[str] = None
        self._address: Optional[str] = None
        self._role: Optional[str] = None

    def set_username(self, username: str) -> UserBuilder:
        self._username = username
        return self

    def set_email(self, email: str) -> UserBuilder:
        self._email = email
        return self

    def set_first_name(self, first_name: str) -> UserBuilder:
        self._first_name = first_name
        return self

    def set_last_name(self, last_name: str) -> UserBuilder:
        self._last_name = last_name
        return self

    def set_age(self, age: int) -> UserBuilder:
        self._age = age
        return self

    def set_phone(self, phone: str) -> UserBuilder:
        self._phone = phone
        return self

    def set_address(self, address: str) -> UserBuilder:
        self._address = address
        return self

    def set_role(self, role: str) -> UserBuilder:
        self._role = role
        return self

    def build(self) -> User:
        """Build and return the User object"""
        if not self._username or not self._email:
            raise ValueError("Username and email are required")

        return User(
            username=self._username,
            email=self._email,
            first_name=self._first_name,
            last_name=self._last_name,
            age=self._age,
            phone=self._phone,
            address=self._address,
            role=self._role
        )

    def reset(self) -> UserBuilder:
        """Reset builder to initial state"""
        self.__init__()
        return self


# Usage
if __name__ == "__main__":
    user = (UserBuilder()
            .set_username('johndoe')
            .set_email('john@example.com')
            .set_first_name('John')
            .set_last_name('Doe')
            .set_age(30)
            .set_role('admin')
            .build())

    print(user.get_full_name())  # "John Doe"
    print(user)
```

### HTTP Request Builder

```python
from typing import Dict, Any, Optional, Union
from enum import Enum
from dataclasses import dataclass
import base64


class HttpMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


@dataclass
class HttpRequest:
    url: str
    method: HttpMethod
    headers: Dict[str, str]
    query_params: Dict[str, Union[str, int, bool]]
    body: Optional[Any] = None
    timeout: Optional[int] = None

    def get_full_url(self) -> str:
        """Build full URL with query parameters"""
        if not self.query_params:
            return self.url

        from urllib.parse import urlencode
        query_string = urlencode(self.query_params)
        return f"{self.url}?{query_string}"


class HttpRequestBuilder:
    def __init__(self):
        self._url: str = ''
        self._method: HttpMethod = HttpMethod.GET
        self._headers: Dict[str, str] = {}
        self._query_params: Dict[str, Union[str, int, bool]] = {}
        self._body: Optional[Any] = None
        self._timeout: Optional[int] = None

    def set_url(self, url: str) -> 'HttpRequestBuilder':
        self._url = url
        return self

    def set_method(self, method: HttpMethod) -> 'HttpRequestBuilder':
        self._method = method
        return self

    def add_header(self, key: str, value: str) -> 'HttpRequestBuilder':
        self._headers[key] = value
        return self

    def set_headers(self, headers: Dict[str, str]) -> 'HttpRequestBuilder':
        self._headers = headers.copy()
        return self

    def add_query_param(self, key: str, value: Union[str, int, bool]) -> 'HttpRequestBuilder':
        self._query_params[key] = value
        return self

    def set_query_params(self, params: Dict[str, Union[str, int, bool]]) -> 'HttpRequestBuilder':
        self._query_params = params.copy()
        return self

    def set_body(self, body: Any) -> 'HttpRequestBuilder':
        self._body = body
        return self

    def set_json_body(self, data: dict) -> 'HttpRequestBuilder':
        import json
        self._body = json.dumps(data)
        self.add_header('Content-Type', 'application/json')
        return self

    def set_timeout(self, timeout: int) -> 'HttpRequestBuilder':
        self._timeout = timeout
        return self

    # Convenience methods
    def get(self, url: str) -> 'HttpRequestBuilder':
        return self.set_url(url).set_method(HttpMethod.GET)

    def post(self, url: str) -> 'HttpRequestBuilder':
        return self.set_url(url).set_method(HttpMethod.POST)

    def put(self, url: str) -> 'HttpRequestBuilder':
        return self.set_url(url).set_method(HttpMethod.PUT)

    def delete(self, url: str) -> 'HttpRequestBuilder':
        return self.set_url(url).set_method(HttpMethod.DELETE)

    # Authentication helpers
    def with_bearer_token(self, token: str) -> 'HttpRequestBuilder':
        return self.add_header('Authorization', f'Bearer {token}')

    def with_basic_auth(self, username: str, password: str) -> 'HttpRequestBuilder':
        credentials = f"{username}:{password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return self.add_header('Authorization', f'Basic {encoded}')

    def build(self) -> HttpRequest:
        """Build and return HttpRequest object"""
        if not self._url:
            raise ValueError("URL is required")

        return HttpRequest(
            url=self._url,
            method=self._method,
            headers=self._headers,
            query_params=self._query_params,
            body=self._body,
            timeout=self._timeout
        )


# Usage
if __name__ == "__main__":
    request = (HttpRequestBuilder()
               .post('https://api.example.com/users')
               .with_bearer_token('eyJhbGciOiJIUzI1...')
               .set_json_body({'name': 'John Doe', 'email': 'john@example.com'})
               .add_query_param('sendEmail', True)
               .set_timeout(5000)
               .build())

    print(request.get_full_url())
    print(request.headers)
    print(request.body)
```

---

## Advantages & Disadvantages

### Advantages ✅
- **Fluent interface**: Method chaining improves readability
- **Immutability**: Builds immutable objects
- **Flexibility**: Different representations from same process
- **Named parameters**: Clear what each value represents
- **Validation**: Centralized validation before building
- **Optional parameters**: Handles many optional fields elegantly

### Disadvantages ❌
- **Verbosity**: More code than simple constructor
- **Duplication**: Builder mirrors product structure
- **Complexity**: Overkill for simple objects
- **Memory overhead**: Temporary builder objects

---

## Common Pitfalls

### 1. Not Validating in Build Method
```typescript
// ❌ BAD: No validation
class BadBuilder {
    build() {
        return new User(this.username, this.email); // Might be undefined!
    }
}

// ✅ GOOD: Validate before building
class GoodBuilder {
    build() {
        if (!this.username || !this.email) {
            throw new Error('Required fields missing');
        }
        return new User(this.username, this.email);
    }
}
```

### 2. Mutable Product
```python
# ❌ BAD: Mutable product
class MutableUser:
    def __init__(self, username):
        self.username = username

# ✅ GOOD: Immutable product with dataclass
from dataclasses import dataclass

@dataclass(frozen=True)
class ImmutableUser:
    username: str
    email: str
```

---

## Summary

**Key Takeaways:**
1. Builder separates construction from representation
2. Perfect for objects with many optional parameters
3. Enables fluent, readable API
4. Validates before creating object
5. Supports immutable objects

**When to use**: Complex objects, many parameters, step-by-step construction
**When to avoid**: Simple objects, all required parameters, rarely changes

---

*Next: [Strategy Pattern](DesignPatterns-Strategy.md)*
