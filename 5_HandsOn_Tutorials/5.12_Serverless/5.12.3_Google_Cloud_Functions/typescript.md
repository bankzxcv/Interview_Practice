# Google Cloud Functions with TypeScript

Build serverless functions on Google Cloud using TypeScript.

## Prerequisites

```bash
# Install Node.js 18+
node --version

# Install Google Cloud SDK
gcloud --version

# Install Functions Framework
npm install -g @google-cloud/functions-framework

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Project Setup

```bash
mkdir gcf-typescript
cd gcf-typescript
npm init -y

# Install dependencies
npm install @google-cloud/functions-framework
npm install --save-dev typescript @types/node

# Install Google Cloud libraries
npm install @google-cloud/storage @google-cloud/firestore @google-cloud/pubsub

# Initialize TypeScript
npx tsc --init
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## HTTP Function (2nd Gen)

```typescript
// src/http-function.ts
import { HttpFunction } from '@google-cloud/functions-framework';

export const helloHttp: HttpFunction = (req, res) => {
  const name = req.query.name || req.body.name || 'World';

  res.status(200).json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
};
```

## REST API with CRUD

```typescript
// src/users-api.ts
import { HttpFunction } from '@google-cloud/functions-framework';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const users = new Map<string, User>([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() }]
]);

export const usersApi: HttpFunction = (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const path = req.path;
  const method = req.method;

  try {
    if (method === 'GET' && path === '/users') {
      return listUsers(res);
    } else if (method === 'GET' && path.startsWith('/users/')) {
      const id = path.split('/')[2];
      return getUser(id, res);
    } else if (method === 'POST' && path === '/users') {
      return createUser(req, res);
    } else if (method === 'PUT' && path.startsWith('/users/')) {
      const id = path.split('/')[2];
      return updateUser(id, req, res);
    } else if (method === 'DELETE' && path.startsWith('/users/')) {
      const id = path.split('/')[2];
      return deleteUser(id, res);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

function listUsers(res: any) {
  res.status(200).json({ users: Array.from(users.values()) });
}

function getUser(id: string, res: any) {
  const user = users.get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(200).json(user);
}

function createUser(req: any, res: any) {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const id = (users.size + 1).toString();
  const user: User = {
    id,
    name,
    email,
    createdAt: new Date().toISOString()
  };

  users.set(id, user);
  res.status(201).json(user);
}

function updateUser(id: string, req: any, res: any) {
  const user = users.get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;

  users.set(id, user);
  res.status(200).json(user);
}

function deleteUser(id: string, res: any) {
  if (!users.has(id)) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.delete(id);
  res.status(204).send('');
}
```

## Firestore Integration

```typescript
// src/firestore-function.ts
import { HttpFunction } from '@google-cloud/functions-framework';
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();
const collection = firestore.collection('users');

export const createUserFirestore: HttpFunction = async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    const userDoc = {
      userId,
      name,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await collection.doc(userId).set(userDoc);

    res.status(201).json({ id: userId, ...userDoc });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserFirestore: HttpFunction = async (req, res) => {
  try {
    const userId = req.query.userId as string;

    const doc = await collection.doc(userId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: error.message });
  }
};
```

## Cloud Storage Trigger

```typescript
// src/storage-trigger.ts
import { CloudEvent } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

interface StorageObjectData {
  bucket: string;
  name: string;
  size: string;
  contentType: string;
}

export const processFile = async (cloudEvent: CloudEvent<StorageObjectData>) => {
  console.log(`Processing file: ${cloudEvent.data.name}`);
  console.log(`Bucket: ${cloudEvent.data.bucket}`);
  console.log(`Size: ${cloudEvent.data.size} bytes`);

  const bucket = storage.bucket(cloudEvent.data.bucket);
  const file = bucket.file(cloudEvent.data.name);

  try {
    // Download file content
    const [content] = await file.download();

    // Process based on file type
    if (cloudEvent.data.name.endsWith('.json')) {
      const data = JSON.parse(content.toString());
      console.log('JSON data:', data);
      await processJsonData(data);
    } else if (cloudEvent.data.name.endsWith('.csv')) {
      const text = content.toString();
      console.log(`CSV has ${text.split('\n').length} lines`);
      await processCsvData(text);
    }

    console.log(`File ${cloudEvent.data.name} processed successfully`);
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
};

async function processJsonData(data: any) {
  console.log('Processing JSON data...');
  // Your business logic
}

async function processCsvData(content: string) {
  console.log('Processing CSV data...');
  // Your business logic
}
```

## Pub/Sub Trigger

```typescript
// src/pubsub-trigger.ts
import { CloudEvent } from '@google-cloud/functions-framework';

interface MessagePublishedData {
  message: {
    data: string;
    attributes: Record<string, string>;
    messageId: string;
    publishTime: string;
  };
}

interface OrderMessage {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  totalAmount: number;
}

export const processOrder = async (cloudEvent: CloudEvent<MessagePublishedData>) => {
  const pubsubMessage = cloudEvent.data.message;
  const dataString = Buffer.from(pubsubMessage.data, 'base64').toString();

  console.log(`Message ID: ${pubsubMessage.messageId}`);
  console.log(`Published at: ${pubsubMessage.publishTime}`);

  try {
    const order: OrderMessage = JSON.parse(dataString);

    console.log(`Processing order: ${order.orderId}`);
    console.log(`Customer: ${order.customerId}`);
    console.log(`Total: $${order.totalAmount}`);

    // Process the order
    await handleOrder(order);

    console.log(`Order ${order.orderId} processed successfully`);
  } catch (error) {
    console.error('Error processing message:', error);
    throw error; // Will trigger retry
  }
};

async function handleOrder(order: OrderMessage) {
  // Business logic
  console.log(`Processing ${order.items.length} items`);

  // Update inventory
  // Send confirmation
  // etc.
}
```

## Scheduled Function

```typescript
// src/scheduled-function.ts
import { CloudEvent } from '@google-cloud/functions-framework';

interface SchedulerData {
  custom_data?: string;
}

interface DailyReport {
  date: string;
  metrics: {
    totalOrders: number;
    revenue: number;
    newCustomers: number;
  };
}

export const dailyReport = async (cloudEvent: CloudEvent<SchedulerData>) => {
  console.log(`Running daily report at: ${new Date().toISOString()}`);

  try {
    const report = await generateReport();

    console.log('Report generated:', report);

    // Send report (email, storage, etc.)
    await sendReport(report);

    console.log('Report sent successfully');
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

async function generateReport(): Promise<DailyReport> {
  // Fetch data from database/services
  return {
    date: new Date().toISOString().split('T')[0],
    metrics: {
      totalOrders: 150,
      revenue: 15000,
      newCustomers: 25
    }
  };
}

async function sendReport(report: DailyReport) {
  console.log('Sending report...');
  // Implementation
}
```

## package.json

```json
{
  "name": "gcf-typescript",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "start": "npm run build && functions-framework --target=helloHttp --source=dist",
    "deploy": "npm run build && gcloud functions deploy"
  },
  "dependencies": {
    "@google-cloud/functions-framework": "^3.3.0",
    "@google-cloud/storage": "^7.7.0",
    "@google-cloud/firestore": "^7.1.0",
    "@google-cloud/pubsub": "^4.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

## Local Development

```bash
# Build
npm run build

# Test HTTP function locally
npx functions-framework --target=helloHttp --source=dist --signature-type=http

# Test in browser
curl http://localhost:8080?name=Google
```

## Deployment

```bash
# Deploy HTTP function (2nd gen)
gcloud functions deploy hello-http \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=helloHttp \
  --trigger-http \
  --allow-unauthenticated

# Deploy Storage trigger
gcloud functions deploy process-file \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=processFile \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=my-bucket"

# Deploy Pub/Sub trigger
gcloud functions deploy process-order \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=processOrder \
  --trigger-topic=orders

# Deploy scheduled function
gcloud functions deploy daily-report \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=dailyReport \
  --trigger-topic=daily-report-topic

# Create Cloud Scheduler job
gcloud scheduler jobs create pubsub daily-report-job \
  --location=us-central1 \
  --schedule="0 9 * * *" \
  --topic=daily-report-topic \
  --message-body="{}"
```

## Best Practices

1. Use 2nd generation for new projects
2. Set min instances for production workloads
3. Use Secret Manager for sensitive data
4. Implement proper error handling
5. Monitor with Cloud Logging and Monitoring
6. Use TypeScript strict mode
7. Keep functions focused and small
8. Use environment variables for config
9. Enable concurrency in 2nd gen
10. Test locally with Functions Framework
