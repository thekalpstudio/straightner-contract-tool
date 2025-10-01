# Solidity Compiler API Documentation

## Base URL
```
http://localhost:3000
```

## API Endpoints

### 1. Health Check
**GET** `/health`

Check if the service is running and get queue statistics.

**Response:**
```json
{
  "ok": true,
  "counts": {
    "waiting": 0,
    "active": 0,
    "completed": 10,
    "failed": 2
  }
}
```

---

### 2. Compile Contract (Main Endpoint)
**POST** `/compile`

Submit a Solidity contract for compilation and get bytecode.

**Request Body:**
```json
{
  "contractPath": "path/to/contract.sol",
  "options": {
    "optimize": true,
    "runs": 200,
    "evmVersion": "cancun"
  }
}
```

OR for direct source code:
```json
{
  "sources": {
    "MyContract.sol": "pragma solidity ^0.8.0;\n\ncontract MyToken { ... }"
  },
  "options": {
    "solcVersion": "0.8.20"
  }
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "abc123def456"
}
```

---

### 3. Get Job Result
**GET** `/jobs/:jobId`

Retrieve compilation results including bytecode.

**Response (Success):**
```json
{
  "id": "abc123def456",
  "state": "completed",
  "result": {
    "durationMs": 1234,
    "method": "universal",
    "contracts": {
      "MyToken": {
        "bytecode": "0x608060405234801561001057600080fd5b50...",
        "deployedBytecode": "0x608060405234801561001057600080fd5b50...",
        "abi": [...],
        "gasEstimates": {
          "creation": {
            "codeDepositCost": "592600",
            "executionCost": "infinite",
            "totalCost": "infinite"
          }
        }
      }
    }
  },
  "attemptsMade": 1
}
```

**Response (Pending):**
```json
{
  "id": "abc123def456",
  "state": "active",
  "attemptsMade": 1
}
```

**Response (Failed):**
```json
{
  "id": "abc123def456",
  "state": "failed",
  "failedReason": "Compilation error: ...",
  "attemptsMade": 3
}
```

---

## Frontend Integration Example

### JavaScript/TypeScript
```javascript
async function compileAndGetBytecode(contractPath) {
  // Step 1: Submit compilation job
  const submitResponse = await fetch('http://localhost:3000/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contractPath: contractPath,
      options: {
        optimize: true
      }
    })
  });
  
  const { jobId } = await submitResponse.json();
  
  // Step 2: Poll for results
  let result;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout
  
  while (attempts < maxAttempts) {
    const jobResponse = await fetch(`http://localhost:3000/jobs/${jobId}`);
    const jobData = await jobResponse.json();
    
    if (jobData.state === 'completed') {
      result = jobData.result;
      break;
    } else if (jobData.state === 'failed') {
      throw new Error(jobData.failedReason);
    }
    
    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  if (!result) {
    throw new Error('Compilation timeout');
  }
  
  // Step 3: Extract bytecode
  const contracts = result.contracts;
  const contractNames = Object.keys(contracts);
  
  // Return first contract's bytecode (or handle multiple contracts)
  const mainContract = contracts[contractNames[0]];
  
  return {
    bytecode: mainContract.bytecode,
    deployedBytecode: mainContract.deployedBytecode,
    abi: mainContract.abi,
    allContracts: contracts
  };
}

// Usage
compileAndGetBytecode('contracts/MyToken.sol')
  .then(({ bytecode, abi }) => {
    console.log('Bytecode:', bytecode);
    console.log('ABI:', abi);
    // Deploy to blockchain...
  })
  .catch(error => {
    console.error('Compilation failed:', error);
  });
```

### React Hook Example
```jsx
import { useState, useEffect } from 'react';

function useContractCompiler(contractPath) {
  const [loading, setLoading] = useState(false);
  const [bytecode, setBytecode] = useState(null);
  const [error, setError] = useState(null);
  
  const compile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Submit job
      const res = await fetch('/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractPath })
      });
      const { jobId } = await res.json();
      
      // Poll for result
      const pollInterval = setInterval(async () => {
        const jobRes = await fetch(`/jobs/${jobId}`);
        const job = await jobRes.json();
        
        if (job.state === 'completed') {
          clearInterval(pollInterval);
          setBytecode(job.result.contracts);
          setLoading(false);
        } else if (job.state === 'failed') {
          clearInterval(pollInterval);
          setError(job.failedReason);
          setLoading(false);
        }
      }, 1000);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  return { compile, loading, bytecode, error };
}
```

---

## Starting the Service

### Prerequisites
1. Redis server running
2. Node.js installed

### Start Commands
```bash
# Start Redis (if not running)
redis-server

# Terminal 1: Start API server
npm start
# or
node server/app.js

# Terminal 2: Start worker
npm run worker
# or
node server/worker.js
```

### Environment Variables
```bash
PORT=3000                    # API server port
REDIS_URL=redis://localhost:6379
QUEUE_NAME=compile
WORKER_CONCURRENCY=1
RATE_LIMIT_PER_MIN=60
```

---

## Rate Limiting
- Default: 60 requests per minute per IP
- Configurable via `RATE_LIMIT_PER_MIN` environment variable

## Error Handling
All endpoints return errors in format:
```json
{
  "error": "Error message here"
}
```

## HTTP Status Codes
- `200` - Success
- `202` - Job accepted for processing
- `400` - Bad request (invalid input)
- `404` - Job not found
- `429` - Rate limit exceeded
- `500` - Server error