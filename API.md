# Straightner API Documentation

## Overview

The Straightner API provides RESTful endpoints for flattening and compiling Solidity contracts.

**Base URL**: `http://localhost:3000`

---

## Endpoints

### 1. **Process Contract (Unified)** ⭐ NEW

**The all-in-one endpoint** that returns flattened source, bytecode, and ABI in a single call.

**Endpoint**: `POST /api/process`

**Request Body**:
```json
{
  "contractPath": "contracts/MyToken.sol"
}
```

**Response**:
```json
{
  "success": true,
  "contractPath": "contracts/MyToken.sol",
  "contractName": "MyToken",
  "flattened": "pragma solidity ^0.8.20;\n\n...",
  "bytecode": "0x610160604052348015610010575f5ffd5b50...",
  "bytecodeLength": 5328,
  "abi": [
    {
      "inputs": [...],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    ...
  ],
  "allContracts": ["MyToken", "ERC20", "Ownable", ...]
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

---

### 2. Flatten Contract

Flattens a Solidity contract and all its dependencies into a single file.

**Endpoint**: `POST /api/flatten`

**Request Body**:
```json
{
  "contractPath": "contracts/MyToken.sol"
}
```

**Response**:
```json
{
  "success": true,
  "contractPath": "contracts/MyToken.sol",
  "flattened": "pragma solidity ^0.8.20;\n\n..."
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/flatten \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

---

### 2. Compile Contract

Flattens and compiles a contract, returning the bytecode, ABI, and metadata.

**Endpoint**: `POST /api/compile-sync`

**Request Body**:
```json
{
  "contractPath": "contracts/MyToken.sol"
}
```

**Response**:
```json
{
  "success": true,
  "contractPath": "contracts/MyToken.sol",
  "contractName": "MyToken",
  "bytecode": "0x610160604052348015610010575f5ffd5b50...",
  "bytecodeLength": 5328,
  "abi": [...],
  "allContracts": ["MyToken", "ERC20", "Ownable", ...]
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/compile-sync \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

---

### 3. Get Bytecode & ABI

Returns the bytecode and ABI (alias for compile-sync with simplified response).

**Endpoint**: `POST /api/bytecode`

**Request Body**:
```json
{
  "contractPath": "contracts/MyToken.sol"
}
```

**Response**:
```json
{
  "success": true,
  "contractPath": "contracts/MyToken.sol",
  "contractName": "MyToken",
  "bytecode": "0x610160604052348015610010575f5ffd5b50...",
  "bytecodeLength": 5328,
  "abi": [...]
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/bytecode \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

---

## Queue-Based Endpoints (Async)

For longer running compilations, use the queue-based endpoints:

### Enqueue Compilation Job

**Endpoint**: `POST /compile`

**Request Body**:
```json
{
  "contractPath": "contracts/MyToken.sol",
  "options": {}
}
```

**Response**:
```json
{
  "jobId": "1"
}
```

### Check Job Status

**Endpoint**: `GET /jobs/:id`

**Response**:
```json
{
  "id": "1",
  "state": "completed",
  "result": {
    "durationMs": 1234,
    "method": "universal",
    "contracts": {...}
  },
  "attemptsMade": 1
}
```

---

## Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "ok": true,
  "counts": {
    "active": 0,
    "completed": 0,
    "delayed": 0,
    "failed": 0,
    "paused": 0,
    "waiting": 0
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `500` - Server Error (compilation failed, file not found, etc.)

---

## Rate Limiting

The API is rate-limited to **60 requests per minute** by default. This can be configured via the `RATE_LIMIT_PER_MIN` environment variable.

---

## Starting the Server

```bash
# Install dependencies (if needed)
npm install express express-rate-limit bullmq

# Start the server
node server/app.js

# Server will start on port 3000 (configurable via PORT env var)
```

**Environment Variables**:
- `PORT` - Server port (default: 3000)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `RATE_LIMIT_PER_MIN` - Rate limit per minute (default: 60)

---

## JavaScript/Node.js Examples

### Using fetch

```javascript
// Flatten a contract
const flattenResponse = await fetch('http://localhost:3000/api/flatten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractPath: 'contracts/MyToken.sol' })
});
const flattenData = await flattenResponse.json();
console.log(flattenData.flattened);

// Get bytecode
const bytecodeResponse = await fetch('http://localhost:3000/api/bytecode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractPath: 'contracts/MyToken.sol' })
});
const bytecodeData = await bytecodeResponse.json();
console.log(bytecodeData.bytecode); // 0x6101604...
```

### Using axios

```javascript
const axios = require('axios');

// Compile a contract
const response = await axios.post('http://localhost:3000/api/compile-sync', {
  contractPath: 'contracts/MyToken.sol'
});

console.log('Contract:', response.data.contractName);
console.log('Bytecode:', response.data.bytecode);
console.log('Size:', response.data.bytecodeLength, 'bytes');
```

---

## Python Example

```python
import requests

# Compile and get bytecode
response = requests.post('http://localhost:3000/api/bytecode', json={
    'contractPath': 'contracts/MyToken.sol'
})

data = response.json()
print(f"Contract: {data['contractName']}")
print(f"Bytecode: {data['bytecode'][:66]}...")
print(f"Size: {data['bytecodeLength']} bytes")
```
