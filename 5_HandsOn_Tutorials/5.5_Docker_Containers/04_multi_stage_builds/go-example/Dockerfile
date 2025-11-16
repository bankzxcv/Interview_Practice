# Multi-stage build for Go application
# Final image size: ~10-20MB (compared to ~800MB single-stage)

# Stage 1: Build the Go binary
FROM golang:1.21-alpine AS builder

# Install git (needed for go modules)
RUN apk add --no-cache git

WORKDIR /app

# Copy go.mod and go.sum if they exist
COPY go.* ./
RUN go mod download 2>/dev/null || true

# Copy source code
COPY *.go ./

# Build the binary
# CGO_ENABLED=0: Build a static binary
# -a: Force rebuilding of packages
# -installsuffix cgo: Suffix to use when building static binary
# -ldflags: Linker flags to strip debug info and reduce size
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o main .

# Stage 2: Final minimal image
FROM scratch

# Copy CA certificates for HTTPS requests
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary from builder
COPY --from=builder /app/main /main

# Expose port
EXPOSE 8080

# Run the binary
CMD ["/main"]
