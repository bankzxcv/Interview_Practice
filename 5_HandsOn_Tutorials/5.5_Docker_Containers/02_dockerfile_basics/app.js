const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Node.js in Docker!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    service: 'node-app'
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    app: 'Docker Node.js Demo',
    version: '1.0.0',
    framework: 'Express',
    nodeVersion: process.version,
    platform: process.platform,
    containerized: true
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
