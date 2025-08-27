#!/bin/bash

# Script untuk test V0 API endpoint
echo "Testing V0 API endpoint..."

# Test local
echo "Testing localhost..."
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test message"}' \
  -v

echo -e "\n\nTesting SSL domain..."
# Test SSL domain
curl -X POST https://v0.madewgn.eu.org/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test message"}' \
  -v
