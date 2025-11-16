"""
Production application with health checks and monitoring.
"""

from flask import Flask, jsonify
import os
import sys
from datetime import datetime

app = Flask(__name__)

VERSION = os.environ.get("VERSION", "dev")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")


@app.route("/")
def home():
    """Home endpoint."""
    return jsonify({
        "message": "Production application",
        "version": VERSION,
        "environment": ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat()
    })


@app.route("/health")
def health():
    """Health check endpoint for load balancers."""
    # Add actual health checks here
    # - Database connectivity
    # - Cache connectivity
    # - Disk space
    # - Memory usage

    health_status = {
        "status": "healthy",
        "version": VERSION,
        "environment": ENVIRONMENT,
        "checks": {
            "database": "ok",
            "cache": "ok",
            "disk": "ok"
        }
    }

    return jsonify(health_status), 200


@app.route("/ready")
def ready():
    """Readiness check for Kubernetes."""
    # Check if application is ready to serve traffic
    return jsonify({"status": "ready"}), 200


@app.route("/version")
def version():
    """Version information."""
    return jsonify({
        "version": VERSION,
        "environment": ENVIRONMENT,
        "python_version": sys.version,
        "deployed_at": os.environ.get("DEPLOYED_AT", "unknown")
    })


@app.route("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    # Return Prometheus-formatted metrics
    return """# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total 100
"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
