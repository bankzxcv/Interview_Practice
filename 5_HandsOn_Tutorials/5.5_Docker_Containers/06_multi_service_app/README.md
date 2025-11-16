# Tutorial 06: Multi-Service Application

## Objectives
- Build a complete full-stack application with Docker Compose
- Integrate web application, database, and caching layer
- Implement service-to-service communication
- Handle data persistence across container restarts
- Use environment configuration and secrets

## Prerequisites
- Completed Tutorial 05 (Docker Compose Intro)
- Understanding of web applications and databases
- Basic knowledge of REST APIs

## Project Overview

We'll build a **Task Management API** with:
- **Frontend**: Static web UI (Nginx)
- **Backend**: Python Flask REST API
- **Database**: PostgreSQL for data storage
- **Cache**: Redis for session management and caching
- **Admin**: pgAdmin for database management

## Architecture

```
                    ┌──────────────┐
                    │   Nginx      │
                    │  (Frontend)  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Flask API  │
                    │  (Backend)   │
                    └──┬────────┬──┘
                       │        │
            ┌──────────▼──┐  ┌──▼──────────┐
            │  PostgreSQL │  │    Redis    │
            │ (Database)  │  │   (Cache)   │
            └─────────────┘  └─────────────┘
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  # Frontend - Nginx serving static files
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped

  # Backend - Flask API
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://taskuser:taskpass@db:5432/taskdb
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY:-dev-secret-key}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
      - db-network
    volumes:
      - ./backend/app:/app
    restart: unless-stopped

  # Database - PostgreSQL
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=taskdb
      - POSTGRES_USER=taskuser
      - POSTGRES_PASSWORD=taskpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - db-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskuser -d taskdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Cache - Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

  # Database Admin - pgAdmin
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@example.com
      - PGADMIN_DEFAULT_PASSWORD=admin
    ports:
      - "5050:80"
    depends_on:
      - db
    networks:
      - db-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
  db-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

## Backend API (Flask)

`backend/app.py`:

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database connection
def get_db():
    return psycopg2.connect(
        os.getenv('DATABASE_URL'),
        cursor_factory=RealDictCursor
    )

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

@app.route('/api/health')
def health():
    try:
        # Check database
        conn = get_db()
        conn.close()
        db_status = 'connected'
    except:
        db_status = 'disconnected'

    try:
        # Check Redis
        redis_client.ping()
        redis_status = 'connected'
    except:
        redis_status = 'disconnected'

    return jsonify({
        'status': 'healthy' if db_status == 'connected' else 'unhealthy',
        'database': db_status,
        'cache': redis_status,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    if request.method == 'GET':
        # Try cache first
        cached = redis_client.get('tasks:all')
        if cached:
            return jsonify(json.loads(cached))

        # Get from database
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT * FROM tasks ORDER BY created_at DESC')
        tasks = cur.fetchall()
        cur.close()
        conn.close()

        # Cache the results
        redis_client.setex('tasks:all', 60, json.dumps(tasks, default=str))

        return jsonify(tasks)

    elif request.method == 'POST':
        data = request.json
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO tasks (title, description, status) VALUES (%s, %s, %s) RETURNING *',
            (data['title'], data.get('description', ''), data.get('status', 'todo'))
        )
        task = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        # Invalidate cache
        redis_client.delete('tasks:all')

        return jsonify(task), 201

@app.route('/api/tasks/<int:task_id>', methods=['GET', 'PUT', 'DELETE'])
def task_detail(task_id):
    conn = get_db()
    cur = conn.cursor()

    if request.method == 'GET':
        cur.execute('SELECT * FROM tasks WHERE id = %s', (task_id,))
        task = cur.fetchone()
        cur.close()
        conn.close()

        if task:
            return jsonify(task)
        return jsonify({'error': 'Task not found'}), 404

    elif request.method == 'PUT':
        data = request.json
        cur.execute(
            'UPDATE tasks SET title = %s, description = %s, status = %s WHERE id = %s RETURNING *',
            (data['title'], data.get('description', ''), data['status'], task_id)
        )
        task = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        redis_client.delete('tasks:all')

        if task:
            return jsonify(task)
        return jsonify({'error': 'Task not found'}), 404

    elif request.method == 'DELETE':
        cur.execute('DELETE FROM tasks WHERE id = %s RETURNING id', (task_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        redis_client.delete('tasks:all')

        if deleted:
            return jsonify({'message': 'Task deleted'})
        return jsonify({'error': 'Task not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

`backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--reload", "app:app"]
```

`backend/requirements.txt`:

```text
Flask==3.0.0
Flask-CORS==4.0.0
psycopg2-binary==2.9.9
redis==5.0.1
gunicorn==21.2.0
```

## Frontend (Static HTML)

`frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 { color: #667eea; margin-bottom: 30px; }
        .task-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        input, textarea, button, select {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #5568d3; }
        .task {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
        .task.done { opacity: 0.6; text-decoration: line-through; }
        .task-actions {
            margin-top: 10px;
        }
        .task-actions button {
            width: auto;
            padding: 5px 15px;
            margin-right: 5px;
            font-size: 14px;
        }
        .delete-btn { background: #dc3545; }
        .done-btn { background: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Task Manager</h1>

        <div class="task-form">
            <h3>Add New Task</h3>
            <input type="text" id="taskTitle" placeholder="Task title" required>
            <textarea id="taskDescription" placeholder="Description" rows="3"></textarea>
            <select id="taskStatus">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
            </select>
            <button onclick="addTask()">Add Task</button>
        </div>

        <div id="taskList"></div>
    </div>

    <script>
        const API_URL = 'http://localhost:5000/api';

        async function loadTasks() {
            const response = await fetch(`${API_URL}/tasks`);
            const tasks = await response.json();

            const taskList = document.getElementById('taskList');
            taskList.innerHTML = tasks.map(task => `
                <div class="task ${task.status === 'done' ? 'done' : ''}">
                    <h3>${task.title}</h3>
                    <p>${task.description || 'No description'}</p>
                    <small>Status: ${task.status} | Created: ${new Date(task.created_at).toLocaleString()}</small>
                    <div class="task-actions">
                        <button class="done-btn" onclick="updateTask(${task.id}, 'done')">Mark Done</button>
                        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        async function addTask() {
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const status = document.getElementById('taskStatus').value;

            if (!title) {
                alert('Please enter a task title');
                return;
            }

            await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, status })
            });

            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            loadTasks();
        }

        async function updateTask(id, status) {
            await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            loadTasks();
        }

        async function deleteTask(id) {
            if (confirm('Delete this task?')) {
                await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
                loadTasks();
            }
        }

        // Load tasks on page load
        loadTasks();
    </script>
</body>
</html>
```

`frontend/Dockerfile`:

```dockerfile
FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

`frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Database Initialization

`init-db.sql`:

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_status ON tasks(status);

-- Insert sample data
INSERT INTO tasks (title, description, status) VALUES
    ('Learn Docker', 'Complete Docker tutorial series', 'in_progress'),
    ('Build API', 'Create RESTful API with Flask', 'done'),
    ('Deploy Application', 'Deploy to production environment', 'todo');
```

## Running the Application

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:5000/api/tasks
# pgAdmin: http://localhost:5050

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Verification

```bash
# Test backend health
curl http://localhost:5000/api/health

# Get all tasks
curl http://localhost:5000/api/tasks

# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","description":"Test task","status":"todo"}'

# Update a task
curl -X PUT http://localhost:5000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Task","status":"done"}'

# Delete a task
curl -X DELETE http://localhost:5000/api/tasks/1
```

## Key Concepts

1. **Service Orchestration**: Multiple services working together
2. **Network Isolation**: Frontend and database on separate networks
3. **Data Persistence**: Volumes for database and Redis
4. **Health Checks**: Ensure services are ready before starting dependents
5. **Environment Configuration**: Using environment variables
6. **Proxy Configuration**: Nginx proxying API requests

## Next Steps

- **Tutorial 07**: Volumes and data persistence
- **Tutorial 08**: Advanced networking
- **Tutorial 09**: Environment variables and secrets

## Key Takeaways

1. Docker Compose orchestrates multi-service applications
2. Services communicate via service names (DNS)
3. Networks provide isolation between services
4. Volumes ensure data persistence
5. depends_on controls startup order
6. Health checks ensure service readiness
7. Environment variables configure services
8. One docker-compose.yml defines entire stack
