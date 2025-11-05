# Environment Variables Guide

## Available Environment Variables

The Straightner API server supports the following environment variables for configuration:

---

## Server Configuration

### `PORT`
- **Description**: Port number for the API server
- **Default**: `3000`
- **Example**:
  ```bash
  PORT=8080 node server/app.js
  ```

---

## Redis Configuration

### `REDIS_URL`
- **Description**: Redis connection URL for queue-based compilation jobs
- **Default**: `redis://localhost:6379`
- **Example**:
  ```bash
  REDIS_URL=redis://localhost:6379 node server/app.js
  # Or with auth
  REDIS_URL=redis://:password@localhost:6379 node server/app.js
  ```

### `QUEUE_NAME`
- **Description**: Name of the BullMQ queue for compilation jobs
- **Default**: `compile`
- **Example**:
  ```bash
  QUEUE_NAME=my-compile-queue node server/app.js
  ```

---

## Job Management

### `REMOVE_ON_COMPLETE`
- **Description**: Number of completed jobs to retain in the queue
- **Default**: `1000`
- **Example**:
  ```bash
  REMOVE_ON_COMPLETE=500 node server/app.js
  ```

### `REMOVE_ON_FAIL`
- **Description**: Number of failed jobs to retain in the queue
- **Default**: `1000`
- **Example**:
  ```bash
  REMOVE_ON_FAIL=100 node server/app.js
  ```

### `JOB_TTL_MS`
- **Description**: Job time-to-live in milliseconds
- **Default**: `600000` (10 minutes)
- **Example**:
  ```bash
  JOB_TTL_MS=300000 node server/app.js  # 5 minutes
  ```

### `WORKER_CONCURRENCY`
- **Description**: Number of compilation jobs to process simultaneously
- **Default**: `1`
- **Example**:
  ```bash
  WORKER_CONCURRENCY=4 node server/app.js
  ```

---

## Rate Limiting

### `RATE_LIMIT_PER_MIN`
- **Description**: Maximum number of API requests allowed per minute
- **Default**: `60`
- **Example**:
  ```bash
  RATE_LIMIT_PER_MIN=100 node server/app.js
  ```

---

## Using Environment Variables

### Method 1: Command Line (Temporary)

Set environment variables for a single run:

```bash
PORT=8080 RATE_LIMIT_PER_MIN=100 node server/app.js
```

### Method 2: .env File (Recommended)

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```env
   PORT=8080
   REDIS_URL=redis://localhost:6379
   RATE_LIMIT_PER_MIN=100
   ```

3. Install dotenv (if not already installed):
   ```bash
   npm install dotenv
   ```

4. Load in your code:
   ```javascript
   require('dotenv').config();
   ```

### Method 3: Shell Export

Set for the current shell session:

```bash
export PORT=8080
export RATE_LIMIT_PER_MIN=100
node server/app.js
```

---

## Common Configurations

### Development (High Limits)
```bash
PORT=3000
RATE_LIMIT_PER_MIN=1000
WORKER_CONCURRENCY=4
```

### Production (Conservative)
```bash
PORT=80
RATE_LIMIT_PER_MIN=60
WORKER_CONCURRENCY=2
REMOVE_ON_COMPLETE=100
REMOVE_ON_FAIL=50
```

### Testing (Permissive)
```bash
PORT=3001
RATE_LIMIT_PER_MIN=10000
WORKER_CONCURRENCY=1
```

---

## Notes

### Redis Requirement
- Redis is **only required** for async/queue-based endpoints (`POST /compile`)
- Synchronous endpoints (`/api/process`, `/api/flatten`, `/api/compile-sync`) work **without Redis**

### Installing Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

---

## Verification

Check which environment variables are being used:

```bash
# Start server with custom port
PORT=8080 node server/app.js

# You should see: [api] Listening on :8080
```

Check health endpoint:
```bash
curl http://localhost:8080/health
```

---

## Default Values Summary

| Variable | Default | Required | Purpose |
|----------|---------|----------|---------|
| `PORT` | `3000` | No | API server port |
| `REDIS_URL` | `redis://localhost:6379` | For async endpoints | Redis connection |
| `QUEUE_NAME` | `compile` | No | Queue name |
| `REMOVE_ON_COMPLETE` | `1000` | No | Jobs to keep |
| `REMOVE_ON_FAIL` | `1000` | No | Failed jobs to keep |
| `JOB_TTL_MS` | `600000` | No | Job lifetime |
| `WORKER_CONCURRENCY` | `1` | No | Parallel jobs |
| `RATE_LIMIT_PER_MIN` | `60` | No | Request limit |

---

## Troubleshooting

### Port Already in Use
```bash
# Change port
PORT=8080 node server/app.js
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Rate Limit Too Low
```bash
# Increase limit
RATE_LIMIT_PER_MIN=200 node server/app.js
```

---

## Example Startup Scripts

### development.sh
```bash
#!/bin/bash
export PORT=3000
export RATE_LIMIT_PER_MIN=1000
export WORKER_CONCURRENCY=4
node server/app.js
```

### production.sh
```bash
#!/bin/bash
export PORT=80
export RATE_LIMIT_PER_MIN=60
export WORKER_CONCURRENCY=2
export REDIS_URL=redis://production-redis:6379
node server/app.js
```

Make executable:
```bash
chmod +x development.sh production.sh
```

Run:
```bash
./development.sh
```
