#!/bin/bash

echo "🐳 Testing Docker Setup"
echo "======================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Build the image
echo "📦 Building Docker image..."
docker build -t straightner:test . > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

echo ""

# Run container
echo "🚀 Starting container..."
docker run -d --name straightner-test -p 3001:3000 straightner:test > /dev/null 2>&1
sleep 3

# Test health endpoint
echo "🧪 Testing health endpoint..."
RESPONSE=$(curl -s http://localhost:3001/health)

if echo "$RESPONSE" | grep -q "\"ok\":true"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    docker logs straightner-test
fi

echo ""

# Cleanup
echo "🧹 Cleaning up..."
docker stop straightner-test > /dev/null 2>&1
docker rm straightner-test > /dev/null 2>&1
docker rmi straightner:test > /dev/null 2>&1

echo ""
echo "✅ Docker test complete!"

