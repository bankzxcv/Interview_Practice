from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import os
import json
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection
def get_db():
    try:
        conn = psycopg2.connect(
            os.getenv('DATABASE_URL'),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

# Redis connection
try:
    redis_client = redis.from_url(
        os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Redis connected successfully")
except Exception as e:
    logger.error(f"Redis connection error: {e}")
    redis_client = None

@app.route('/api/health')
def health():
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }

    # Check database
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT 1')
        cur.close()
        conn.close()
        health_status['database'] = 'connected'
    except Exception as e:
        health_status['database'] = 'disconnected'
        health_status['database_error'] = str(e)
        health_status['status'] = 'unhealthy'

    # Check Redis
    try:
        if redis_client:
            redis_client.ping()
            health_status['cache'] = 'connected'
        else:
            health_status['cache'] = 'disconnected'
    except Exception as e:
        health_status['cache'] = 'disconnected'
        health_status['cache_error'] = str(e)

    status_code = 200 if health_status['status'] == 'healthy' else 503
    return jsonify(health_status), status_code

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    if request.method == 'GET':
        # Try cache first
        if redis_client:
            try:
                cached = redis_client.get('tasks:all')
                if cached:
                    logger.info("Returning cached tasks")
                    return jsonify(json.loads(cached))
            except:
                logger.warning("Cache read failed")

        # Get from database
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute('SELECT * FROM tasks ORDER BY created_at DESC')
            tasks = cur.fetchall()
            cur.close()
            conn.close()

            # Convert to list of dicts
            task_list = [dict(task) for task in tasks]

            # Cache the results
            if redis_client:
                try:
                    redis_client.setex('tasks:all', 60, json.dumps(task_list, default=str))
                    logger.info("Tasks cached successfully")
                except:
                    logger.warning("Cache write failed")

            return jsonify(task_list)
        except Exception as e:
            logger.error(f"Error fetching tasks: {e}")
            return jsonify({'error': 'Failed to fetch tasks'}), 500

    elif request.method == 'POST':
        data = request.json

        if not data or 'title' not in data:
            return jsonify({'error': 'Title is required'}), 400

        try:
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
            if redis_client:
                try:
                    redis_client.delete('tasks:all')
                except:
                    pass

            return jsonify(dict(task)), 201
        except Exception as e:
            logger.error(f"Error creating task: {e}")
            return jsonify({'error': 'Failed to create task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET', 'PUT', 'DELETE'])
def task_detail(task_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        if request.method == 'GET':
            cur.execute('SELECT * FROM tasks WHERE id = %s', (task_id,))
            task = cur.fetchone()
            cur.close()
            conn.close()

            if task:
                return jsonify(dict(task))
            return jsonify({'error': 'Task not found'}), 404

        elif request.method == 'PUT':
            data = request.json
            cur.execute(
                '''UPDATE tasks
                   SET title = COALESCE(%s, title),
                       description = COALESCE(%s, description),
                       status = COALESCE(%s, status)
                   WHERE id = %s
                   RETURNING *''',
                (data.get('title'), data.get('description'), data.get('status'), task_id)
            )
            task = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()

            # Invalidate cache
            if redis_client:
                try:
                    redis_client.delete('tasks:all')
                except:
                    pass

            if task:
                return jsonify(dict(task))
            return jsonify({'error': 'Task not found'}), 404

        elif request.method == 'DELETE':
            cur.execute('DELETE FROM tasks WHERE id = %s RETURNING id', (task_id,))
            deleted = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()

            # Invalidate cache
            if redis_client:
                try:
                    redis_client.delete('tasks:all')
                except:
                    pass

            if deleted:
                return jsonify({'message': 'Task deleted', 'id': dict(deleted)['id']})
            return jsonify({'error': 'Task not found'}), 404

    except Exception as e:
        logger.error(f"Error in task_detail: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/stats')
def stats():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            SELECT status, COUNT(*) as count
            FROM tasks
            GROUP BY status
        ''')
        stats = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([dict(s) for s in stats])
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return jsonify({'error': 'Failed to fetch stats'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
