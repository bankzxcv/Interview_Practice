"""
Simple Flask web server for Docker demo.
"""

from flask import Flask, jsonify
import os
import sys

app = Flask(__name__)

VERSION = os.environ.get("APP_VERSION", "1.0.0")


@app.route("/")
def home():
    """Home endpoint."""
    return jsonify({
        "message": "Hello from Docker!",
        "version": VERSION,
        "python_version": sys.version
    })


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}), 200


@app.route("/version")
def version():
    """Version endpoint."""
    return jsonify({"version": VERSION})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
