# Docker Deployment Guide

## Quick Start

### Option 1: Docker Compose (Recommended)

The easiest way to run Straightner with all dependencies:

```bash
# Start all services (API + Redis + Worker)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Access the API at: **http://localhost:3000**

---

### Option 2: Docker Only (Without Redis)

Run just the API server without queue functionality:

```bash
# Build the image
docker build -t straightner .

# Run the container
docker run -d \
  --name straightner-api \
  -p 3000:3000 \
  -v $(pwd)/contracts:/app/contracts:ro \
  -v $(pwd)/output:/app/output \
  straightner

# Check logs
docker logs -f straightner-api

# Stop container
docker stop straightner-api
docker rm straightner-api
```

---

## Docker Compose Services

### Services Included

1. **api** - Main API server (port 3000)
2. **redis** - Redis for job queue (port 6379)
3. **worker** - Background worker for processing jobs

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d api

# Start without detached mode (see logs)
docker-compose up
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop api
```

---

## Testing the Docker Deployment

### 1. Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "ok": true,
  "counts": {
    "active": 0,
    "completed": 0,
    ...
  }
}
```

### 2. Test API Endpoint

```bash
# Create a test contract
cat > contracts/TestToken.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test", "TST") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}
EOF

# Test the API
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/TestToken.sol"}'
```

---

## Environment Variables

Configure services via docker-compose.yml or command line:

```yaml
environment:
  - PORT=3000
  - REDIS_URL=redis://redis:6379
  - RATE_LIMIT_PER_MIN=100
  - WORKER_CONCURRENCY=4
```

Or via command line:

```bash
docker run -d \
  -e PORT=8080 \
  -e RATE_LIMIT_PER_MIN=200 \
  -p 8080:8080 \
  straightner
```

See `ENV_VARIABLES.md` for all available variables.

---

## Volume Mounts

### Contracts Directory (Read-Only)

```yaml
volumes:
  - ./contracts:/app/contracts:ro
```

Mount your contracts directory to make them accessible in the container.

### Output Directory

```yaml
volumes:
  - ./output:/app/output
```

Mount output directory to save flattened contracts on your host.

---

## Production Deployment

### Build Production Image

```bash
# Build optimized image
docker build -t straightner:latest .

# Tag for registry
docker tag straightner:latest your-registry.com/straightner:latest

# Push to registry
docker push your-registry.com/straightner:latest
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass your-password

  api:
    image: your-registry.com/straightner:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - REDIS_URL=redis://:your-password@redis:6379
      - RATE_LIMIT_PER_MIN=60
      - WORKER_CONCURRENCY=2
    depends_on:
      - redis

  worker:
    image: your-registry.com/straightner:latest
    restart: always
    command: node server/worker.js
    environment:
      - REDIS_URL=redis://:your-password@redis:6379
      - WORKER_CONCURRENCY=4
    depends_on:
      - redis

volumes:
  redis-data:
```

---

## Useful Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Execute Commands in Container

```bash
# Open shell in API container
docker-compose exec api sh

# Run CLI command
docker-compose exec api node index.js compile contracts/MyToken.sol

# Check Redis
docker-compose exec redis redis-cli ping
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

---

## Resource Limits

Add resource limits in docker-compose.yml:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Scaling Workers

Scale worker instances for parallel processing:

```bash
# Scale to 3 workers
docker-compose up -d --scale worker=3

# Check status
docker-compose ps
```

---

## Monitoring

### Health Checks

Docker automatically monitors service health:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect straightner-api --format='{{json .State.Health}}'
```

### Metrics

Access Redis metrics:

```bash
docker-compose exec redis redis-cli INFO stats
```

---

## Troubleshooting

### Port Already in Use

```bash
# Use different port
docker run -p 8080:3000 straightner

# Or in docker-compose.yml:
ports:
  - "8080:3000"
```

### Container Won't Start

```bash
# Check logs
docker-compose logs api

# Check health
docker-compose ps
docker inspect straightner-api
```

### Redis Connection Issues

```bash
# Test Redis connection
docker-compose exec api sh -c 'wget -qO- http://localhost:3000/health'

# Check Redis
docker-compose exec redis redis-cli ping
```

### Permission Issues

```bash
# Fix output directory permissions
chmod 777 output/
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t straightner .

      - name: Run tests
        run: |
          docker run --rm straightner npm test

      - name: Push to registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login -u "${{ secrets.REGISTRY_USERNAME }}" --password-stdin
          docker push your-registry.com/straightner:latest
```

---

## Security Best Practices

1. **Don't expose Redis port publicly**
   ```yaml
   redis:
     ports: []  # Remove port exposure
   ```

2. **Use Redis password**
   ```yaml
   command: redis-server --requirepass your-password
   ```

3. **Run as non-root user** (already configured in Dockerfile)

4. **Use secrets for sensitive data**
   ```yaml
   secrets:
     redis_password:
       external: true
   ```

5. **Keep images updated**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## Multi-Stage Builds (Advanced)

For smaller production images:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "server/app.js"]
```

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify health: `curl http://localhost:3000/health`
- See main documentation: `README.md`
- Environment variables: `ENV_VARIABLES.md`
