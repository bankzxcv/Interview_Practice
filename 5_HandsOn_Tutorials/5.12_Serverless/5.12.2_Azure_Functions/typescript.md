# Azure Functions with TypeScript

Complete guide to building serverless functions with Azure Functions using TypeScript.

## Prerequisites

```bash
# Install Node.js 18 LTS or higher
node --version

# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Install Azure CLI
az --version

# Login to Azure
az login
```

## Project Setup

```bash
# Create a new Azure Functions project
mkdir azure-functions-typescript
cd azure-functions-typescript

# Initialize Functions project with TypeScript
func init --typescript

# Install dependencies
npm install

# Install additional packages
npm install @azure/storage-blob @azure/cosmos @azure/identity
```

## Project Structure

```
azure-functions-typescript/
├── src/
│   └── functions/
│       ├── httpTrigger.ts
│       ├── timerTrigger.ts
│       ├── blobTrigger.ts
│       └── queueTrigger.ts
├── host.json
├── local.settings.json
├── package.json
└── tsconfig.json
```

## Basic HTTP Trigger

```typescript
// src/functions/httpTrigger.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

interface User {
    id: string;
    name: string;
    email: string;
}

export async function httpTrigger(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'World';

    return {
        status: 200,
        jsonBody: {
            message: `Hello, ${name}!`,
            timestamp: new Date().toISOString(),
            invocationId: context.invocationId
        }
    };
}

app.http('httpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger
});
```

## REST API with CRUD Operations

```typescript
// src/functions/usersApi.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

// In-memory storage (use Cosmos DB or Table Storage in production)
const users: Map<string, User> = new Map([
    ['1', { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() }],
    ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() }]
]);

// GET /api/users
export async function getUsers(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log('Getting all users');

    return {
        status: 200,
        jsonBody: {
            users: Array.from(users.values())
        }
    };
}

// GET /api/users/{id}
export async function getUser(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    const userId = request.params.id;
    context.log(`Getting user: ${userId}`);

    const user = users.get(userId);

    if (!user) {
        return {
            status: 404,
            jsonBody: { error: 'User not found' }
        };
    }

    return {
        status: 200,
        jsonBody: user
    };
}

// POST /api/users
export async function createUser(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as Partial<User>;

        if (!body.name || !body.email) {
            return {
                status: 400,
                jsonBody: { error: 'Name and email are required' }
            };
        }

        const newUser: User = {
            id: (users.size + 1).toString(),
            name: body.name,
            email: body.email,
            createdAt: new Date().toISOString()
        };

        users.set(newUser.id, newUser);

        context.log(`Created user: ${newUser.id}`);

        return {
            status: 201,
            jsonBody: newUser
        };
    } catch (error) {
        context.error('Error creating user:', error);
        return {
            status: 400,
            jsonBody: { error: 'Invalid request body' }
        };
    }
}

// PUT /api/users/{id}
export async function updateUser(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    const userId = request.params.id;

    const user = users.get(userId);
    if (!user) {
        return {
            status: 404,
            jsonBody: { error: 'User not found' }
        };
    }

    try {
        const updates = await request.json() as Partial<User>;

        const updatedUser: User = {
            ...user,
            name: updates.name || user.name,
            email: updates.email || user.email
        };

        users.set(userId, updatedUser);

        context.log(`Updated user: ${userId}`);

        return {
            status: 200,
            jsonBody: updatedUser
        };
    } catch (error) {
        return {
            status: 400,
            jsonBody: { error: 'Invalid request body' }
        };
    }
}

// DELETE /api/users/{id}
export async function deleteUser(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    const userId = request.params.id;

    if (!users.has(userId)) {
        return {
            status: 404,
            jsonBody: { error: 'User not found' }
        };
    }

    users.delete(userId);
    context.log(`Deleted user: ${userId}`);

    return {
        status: 204
    };
}

// Register HTTP routes
app.http('getUsers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users',
    handler: getUsers
});

app.http('getUser', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users/{id}',
    handler: getUser
});

app.http('createUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'users',
    handler: createUser
});

app.http('updateUser', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'users/{id}',
    handler: updateUser
});

app.http('deleteUser', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'users/{id}',
    handler: deleteUser
});
```

## Cosmos DB Integration

```typescript
// src/functions/cosmosDbHandler.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const client = new CosmosClient({ endpoint, key });

const database = client.database('SampleDB');
const container = database.container('Users');

interface UserDocument {
    id: string;
    userId: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

export async function createUserInCosmos(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as Partial<UserDocument>;

        const userDoc: UserDocument = {
            id: body.userId || Date.now().toString(),
            userId: body.userId || Date.now().toString(),
            name: body.name || '',
            email: body.email || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const { resource } = await container.items.create(userDoc);

        context.log(`Created user in Cosmos DB: ${resource?.id}`);

        return {
            status: 201,
            jsonBody: resource
        };
    } catch (error: any) {
        context.error('Error creating user in Cosmos DB:', error);
        return {
            status: 500,
            jsonBody: { error: error.message }
        };
    }
}

export async function getUserFromCosmos(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;

        const { resource } = await container.item(userId, userId).read<UserDocument>();

        if (!resource) {
            return {
                status: 404,
                jsonBody: { error: 'User not found' }
            };
        }

        return {
            status: 200,
            jsonBody: resource
        };
    } catch (error: any) {
        if (error.code === 404) {
            return {
                status: 404,
                jsonBody: { error: 'User not found' }
            };
        }

        context.error('Error getting user from Cosmos DB:', error);
        return {
            status: 500,
            jsonBody: { error: error.message }
        };
    }
}

app.http('createUserInCosmos', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'cosmos/users',
    handler: createUserInCosmos
});

app.http('getUserFromCosmos', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'cosmos/users/{userId}',
    handler: getUserFromCosmos
});
```

## Blob Storage Trigger

```typescript
// src/functions/blobTrigger.ts
import { app, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';

export async function blobTrigger(
    blob: Buffer,
    context: InvocationContext
): Promise<void> {
    context.log(`Blob trigger function processed blob`);
    context.log(`Name: ${context.triggerMetadata?.name}`);
    context.log(`Blob Size: ${blob.length} bytes`);

    const blobName = context.triggerMetadata?.name as string;

    // Process based on file type
    if (blobName.endsWith('.json')) {
        const content = blob.toString('utf-8');
        const data = JSON.parse(content);
        context.log('JSON data:', data);

        // Process JSON data
        await processJsonData(data, context);
    } else if (blobName.endsWith('.csv')) {
        const content = blob.toString('utf-8');
        context.log('CSV content:', content.substring(0, 100));

        // Process CSV data
        await processCsvData(content, context);
    } else if (blobName.endsWith('.txt')) {
        const content = blob.toString('utf-8');
        const lines = content.split('\n').length;
        context.log(`Text file has ${lines} lines`);
    }

    context.log('Blob processing completed');
}

async function processJsonData(data: any, context: InvocationContext): Promise<void> {
    context.log('Processing JSON data...');
    // Your business logic here
}

async function processCsvData(content: string, context: InvocationContext): Promise<void> {
    context.log('Processing CSV data...');
    const lines = content.split('\n');
    context.log(`CSV has ${lines.length} rows`);
    // Your business logic here
}

app.storageBlob('blobTrigger', {
    path: 'uploads/{name}',
    connection: 'AzureWebJobsStorage',
    handler: blobTrigger
});
```

## Queue Trigger

```typescript
// src/functions/queueTrigger.ts
import { app, InvocationContext } from '@azure/functions';

interface OrderMessage {
    orderId: string;
    customerId: string;
    items: Array<{
        productId: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
}

export async function queueTrigger(
    queueItem: unknown,
    context: InvocationContext
): Promise<void> {
    context.log('Queue trigger function processed work item', queueItem);

    try {
        const message = queueItem as OrderMessage;

        context.log(`Processing order: ${message.orderId}`);
        context.log(`Customer: ${message.customerId}`);
        context.log(`Total: $${message.totalAmount}`);

        // Process the order
        await processOrder(message, context);

        context.log(`Order ${message.orderId} processed successfully`);
    } catch (error: any) {
        context.error('Error processing queue message:', error);
        throw error; // Will retry or move to poison queue
    }
}

async function processOrder(order: OrderMessage, context: InvocationContext): Promise<void> {
    // Validate order
    if (!order.orderId || !order.customerId) {
        throw new Error('Invalid order data');
    }

    // Business logic
    context.log(`Processing ${order.items.length} items`);

    // Update inventory
    // Send confirmation email
    // Update database
    // etc.

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
}

app.storageQueue('queueTrigger', {
    queueName: 'orders',
    connection: 'AzureWebJobsStorage',
    handler: queueTrigger
});
```

## Timer Trigger (Scheduled Jobs)

```typescript
// src/functions/timerTrigger.ts
import { app, InvocationContext, Timer } from '@azure/functions';

interface DailyReport {
    date: string;
    metrics: {
        totalOrders: number;
        revenue: number;
        newCustomers: number;
    };
}

export async function timerTrigger(
    myTimer: Timer,
    context: InvocationContext
): Promise<void> {
    context.log('Timer trigger function ran!', new Date().toISOString());

    if (myTimer.isPastDue) {
        context.log('Timer is running late!');
    }

    try {
        // Generate daily report
        const report = await generateDailyReport(context);

        context.log('Daily report generated:', report);

        // Send report (email, storage, etc.)
        await sendReport(report, context);

        context.log('Report sent successfully');
    } catch (error: any) {
        context.error('Error in timer function:', error);
        throw error;
    }
}

async function generateDailyReport(context: InvocationContext): Promise<DailyReport> {
    // Fetch data from database
    // Calculate metrics

    const report: DailyReport = {
        date: new Date().toISOString().split('T')[0],
        metrics: {
            totalOrders: 150,
            revenue: 15000,
            newCustomers: 25
        }
    };

    return report;
}

async function sendReport(report: DailyReport, context: InvocationContext): Promise<void> {
    // Send via email or save to storage
    context.log('Sending report...');
    // Implementation here
}

app.timer('timerTrigger', {
    schedule: '0 0 9 * * *', // 9 AM every day
    handler: timerTrigger
});
```

## Event Hub Trigger

```typescript
// src/functions/eventHubTrigger.ts
import { app, InvocationContext } from '@azure/functions';

interface TelemetryEvent {
    deviceId: string;
    timestamp: string;
    temperature: number;
    humidity: number;
}

export async function eventHubTrigger(
    events: unknown[],
    context: InvocationContext
): Promise<void> {
    context.log(`Event Hub trigger function processed ${events.length} events`);

    for (const event of events) {
        const telemetry = event as TelemetryEvent;

        context.log('Processing telemetry:', telemetry);

        // Process telemetry data
        await processTelemetry(telemetry, context);
    }
}

async function processTelemetry(
    telemetry: TelemetryEvent,
    context: InvocationContext
): Promise<void> {
    // Validate data
    if (telemetry.temperature > 100) {
        context.warn(`High temperature alert: ${telemetry.temperature}°C`);
        // Send alert
    }

    // Store in database
    // Update dashboard
    // etc.
}

app.eventHub('eventHubTrigger', {
    connection: 'EventHubConnection',
    eventHubName: 'telemetry',
    cardinality: 'many',
    handler: eventHubTrigger
});
```

## Configuration Files

### host.json

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

### local.settings.json

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://your-cosmos-account.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-key",
    "EventHubConnection": "your-event-hub-connection-string"
  }
}
```

### package.json

```json
{
  "name": "azure-functions-typescript",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "prestart": "npm run build",
    "start": "func start",
    "test": "jest"
  },
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@azure/cosmos": "^4.0.0",
    "@azure/storage-blob": "^12.17.0",
    "@azure/identity": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "typescript": "^5.0.0",
    "@azure/functions-core-tools": "^4.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

## Local Development

```bash
# Start Azure Storage Emulator (Azurite)
npm install -g azurite
azurite --silent --location azurite --debug azurite/debug.log

# Start Functions locally
npm start

# Test HTTP endpoint
curl http://localhost:7071/api/httpTrigger?name=Azure
```

## Deployment

### Deploy with Azure Functions Core Tools

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-functions --location eastus

# Create storage account
az storage account create \
  --name stfunctionsapp \
  --resource-group rg-functions \
  --location eastus \
  --sku Standard_LRS

# Create function app
az functionapp create \
  --name my-typescript-functions \
  --resource-group rg-functions \
  --storage-account stfunctionsapp \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4

# Deploy
npm run build
func azure functionapp publish my-typescript-functions
```

### Deploy with Azure CLI and ZIP

```bash
# Build project
npm run build

# Create deployment package
zip -r deploy.zip . -x "*.git*" "node_modules/*" "local.settings.json"

# Deploy
az functionapp deployment source config-zip \
  --resource-group rg-functions \
  --name my-typescript-functions \
  --src deploy.zip
```

## Testing

```typescript
// tests/httpTrigger.test.ts
import { HttpRequest, InvocationContext } from '@azure/functions';
import { httpTrigger } from '../src/functions/httpTrigger';

describe('HTTP Trigger Tests', () => {
    it('should return hello message', async () => {
        const request = new HttpRequest({
            method: 'GET',
            url: 'http://localhost:7071/api/httpTrigger',
            query: { name: 'Test' }
        });

        const context = new InvocationContext();

        const response = await httpTrigger(request, context);

        expect(response.status).toBe(200);
        expect(response.jsonBody).toHaveProperty('message');
    });
});
```

## Best Practices

1. **Use TypeScript strict mode** for type safety
2. **Initialize clients outside handlers** for connection reuse
3. **Use Application Insights** for monitoring and logging
4. **Implement retry policies** for transient failures
5. **Use managed identities** instead of connection strings
6. **Set appropriate timeout values** based on workload
7. **Use durable functions** for complex workflows
8. **Enable CORS** for browser-based clients
9. **Use slots** for blue-green deployments
10. **Monitor cold start times** and optimize if needed
