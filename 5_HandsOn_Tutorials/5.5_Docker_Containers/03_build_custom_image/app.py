from flask import Flask, jsonify, request
from config import Config
from models import User
from utils import setup_logging
import os

app = Flask(__name__)
app.config.from_object(Config)
logger = setup_logging()

# In-memory storage (for demo purposes)
users = []
user_id_counter = 1

@app.route('/')
def home():
    return jsonify({
        'service': 'User Management API',
        'version': os.getenv('APP_VERSION', '1.0.0'),
        'environment': os.getenv('ENVIRONMENT', 'production'),
        'endpoints': {
            'GET /': 'API information',
            'GET /health': 'Health check',
            'GET /users': 'List all users',
            'POST /users': 'Create new user',
            'GET /users/<id>': 'Get specific user'
        }
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'user-api',
        'users_count': len(users)
    })

@app.route('/users', methods=['GET', 'POST'])
def users_handler():
    global user_id_counter

    if request.method == 'GET':
        return jsonify({
            'users': [vars(u) for u in users],
            'count': len(users)
        })

    elif request.method == 'POST':
        data = request.get_json()

        # Validation
        if not data or 'username' not in data or 'email' not in data:
            return jsonify({'error': 'Missing required fields: username, email'}), 400

        user = User(
            id=user_id_counter,
            username=data['username'],
            email=data['email']
        )
        users.append(user)
        user_id_counter += 1
        logger.info(f"Created user: {user.username} ({user.email})")

        return jsonify(vars(user)), 201

@app.route('/users/<int:user_id>', methods=['GET', 'DELETE'])
def user_detail(user_id):
    user = next((u for u in users if u.id == user_id), None)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify(vars(user))

    elif request.method == 'DELETE':
        users.remove(user)
        logger.info(f"Deleted user: {user.username}")
        return jsonify({'message': 'User deleted'}), 200

if __name__ == '__main__':
    logger.info(f"Starting User API version {os.getenv('APP_VERSION', '1.0.0')}")
    app.run(
        host='0.0.0.0',
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
