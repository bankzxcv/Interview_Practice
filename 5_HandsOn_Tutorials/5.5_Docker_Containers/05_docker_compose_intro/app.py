from flask import Flask, jsonify
import redis
import os
import datetime

app = Flask(__name__)

# Connect to Redis
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True
)

@app.route('/')
def home():
    try:
        # Increment visit counter
        visits = redis_client.incr('visits')

        return jsonify({
            'message': 'Hello from Docker Compose!',
            'visits': visits,
            'timestamp': datetime.datetime.now().isoformat(),
            'redis_host': os.getenv('REDIS_HOST'),
            'status': 'connected'
        })
    except redis.ConnectionError:
        return jsonify({
            'message': 'Redis connection failed',
            'status': 'error'
        }), 500

@app.route('/health')
def health():
    try:
        redis_client.ping()
        return jsonify({
            'status': 'healthy',
            'redis': 'connected',
            'visits': redis_client.get('visits') or 0
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'redis': 'disconnected',
            'error': str(e)
        }), 500

@app.route('/reset')
def reset():
    redis_client.set('visits', 0)
    return jsonify({'message': 'Counter reset', 'visits': 0})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
