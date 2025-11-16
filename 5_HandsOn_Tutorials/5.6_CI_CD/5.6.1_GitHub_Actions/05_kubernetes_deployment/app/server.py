"""Flask server with Kubernetes-ready health checks."""

from flask import Flask, jsonify
import os
import sys

app = Flask(__name__)

VERSION = os.environ.get("APP_VERSION", "1.0.0")

@app.route("/")
def home():
    return jsonify({
        "message": "Hello from Kubernetes!",
        "version": VERSION,
        "python_version": sys.version
    })

@app.route("/health")
def health():
    """Kubernetes health check endpoint."""
    return jsonify({"status": "healthy"}), 200

@app.route("/ready")
def ready():
    """Kubernetes readiness check endpoint."""
    # Add actual readiness checks here (database, cache, etc.)
    return jsonify({"status": "ready"}), 200

@app.route("/version")
def version():
    return jsonify({"version": VERSION})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
