from flask import Flask, jsonify
import datetime
import os
import sys
import platform

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        'message': 'Python Multi-Stage Build Demo',
        'timestamp': datetime.datetime.now().isoformat(),
        'version': os.getenv('APP_VERSION', '1.0.0'),
        'python_version': sys.version
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'python-multistage-app'
    })

@app.route('/info')
def info():
    return jsonify({
        'python': {
            'version': platform.python_version(),
            'implementation': platform.python_implementation(),
        },
        'system': {
            'platform': platform.platform(),
            'machine': platform.machine(),
        },
        'flask_version': '3.0.0'
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
