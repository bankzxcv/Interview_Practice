#!/bin/bash

echo "Generating traffic to sample app..."

while true; do
  # Regular requests
  curl -s http://localhost:8080/ > /dev/null

  # Slow requests
  curl -s http://localhost:8080/slow > /dev/null

  # Error requests (20% chance)
  if [ $((RANDOM % 5)) -eq 0 ]; then
    curl -s http://localhost:8080/error > /dev/null
  fi

  sleep 0.5
done
