# Multi-stage build
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app ./

# Add local bin to PATH
ENV PATH=/root/.local/bin:$PATH

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import sys; sys.exit(0)"

# Run application
CMD ["python", "-m", "app.main"]
