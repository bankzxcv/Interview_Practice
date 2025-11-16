from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return '''
    <html>
    <head>
        <title>Docker Flask App</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hello from Docker!</h1>
            <p>This Flask application is running inside a Docker container.</p>
            <ul>
                <li>Python: Fast and elegant</li>
                <li>Flask: Lightweight web framework</li>
                <li>Docker: Containerized deployment</li>
            </ul>
        </div>
    </body>
    </html>
    '''

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'flask-app'
    })

@app.route('/api/info')
def info():
    return jsonify({
        'app': 'Docker Flask Demo',
        'version': '1.0.0',
        'framework': 'Flask',
        'containerized': True
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
