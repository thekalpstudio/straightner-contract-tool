# Example Usage - Unified API Endpoint

## Overview

The `/api/process` endpoint is an all-in-one solution that returns:
1. **Flattened Source Code** - All dependencies merged into one file
2. **Bytecode** - Deployment-ready contract bytecode
3. **ABI** - Application Binary Interface for interacting with the contract

## Quick Start

### 1. Start the Server

```bash
node server/app.js
```

### 2. Make a Request

```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

## Response Structure

```json
{
  "success": true,
  "contractPath": "contracts/MyToken.sol",
  "contractName": "MyToken",
  "flattened": "pragma solidity ^0.8.20;\n\n...",
  "bytecode": "0x610160604052...",
  "bytecodeLength": 5328,
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "initialOwner",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
    // ... more ABI entries
  ],
  "allContracts": ["Context", "ECDSA", "EIP712", "ERC20", "MyToken", ...]
}
```

## Using the Response

### Extract Contract Data

```javascript
const response = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractPath: 'contracts/MyToken.sol' })
});

const data = await response.json();

// Extract what you need
const contractName = data.contractName;  // "MyToken"
const bytecode = data.bytecode;          // "0x610160604052..."
const abi = data.abi;                    // [...]
const flattened = data.flattened;        // Full source code
```

### Deploy with Web3.js

```javascript
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

// Get contract data from API
const response = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractPath: 'contracts/MyToken.sol' })
});

const { contractName, bytecode, abi } = await response.json();

// Deploy the contract
const MyContract = new web3.eth.Contract(abi);
const deployed = await MyContract.deploy({
  data: bytecode,
  arguments: ['0x...initialOwner']
}).send({
  from: '0x...',
  gas: 5000000
});

console.log('Contract deployed at:', deployed.options.address);
```

### Deploy with Ethers.js

```javascript
const { ethers } = require('ethers');

// Get contract data from API
const response = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractPath: 'contracts/MyToken.sol' })
});

const { contractName, bytecode, abi } = await response.json();

// Deploy
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner();

const factory = new ethers.ContractFactory(abi, bytecode, signer);
const contract = await factory.deploy('0x...initialOwner');
await contract.deployed();

console.log('Contract deployed at:', contract.address);
```

### Verify on Etherscan

```javascript
// Get flattened source for verification
const response = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractPath: 'contracts/MyToken.sol' })
});

const { flattened } = await response.json();

// Use 'flattened' for Etherscan source code verification
// The flattened source is ready to paste directly into Etherscan
```

## Node.js Example

```javascript
const http = require('http');

function processContract(contractPath) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ contractPath });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Usage
(async () => {
  const result = await processContract('contracts/MyToken.sol');

  console.log('Contract Name:', result.contractName);
  console.log('Bytecode Length:', result.bytecodeLength, 'bytes');
  console.log('ABI Functions:', result.abi.length);
  console.log('Flattened Source:', result.flattened.length, 'characters');
})();
```

## Python Example

```python
import requests
import json

def process_contract(contract_path):
    url = 'http://localhost:3000/api/process'
    payload = {'contractPath': contract_path}

    response = requests.post(url, json=payload)
    return response.json()

# Usage
result = process_contract('contracts/MyToken.sol')

contract_name = result['contractName']
bytecode = result['bytecode']
abi = result['abi']
flattened = result['flattened']

print(f"Contract: {contract_name}")
print(f"Bytecode: {bytecode[:66]}...")
print(f"ABI entries: {len(abi)}")
print(f"Flattened source length: {len(flattened)} characters")

# Deploy with web3.py
from web3 import Web3

w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
MyContract = w3.eth.contract(abi=abi, bytecode=bytecode)

# Deploy
tx_hash = MyContract.constructor('0x...initialOwner').transact()
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

print(f"Contract deployed at: {tx_receipt.contractAddress}")
```

## Error Handling

```javascript
try {
  const response = await fetch('http://localhost:3000/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractPath: 'contracts/MyToken.sol' })
  });

  const data = await response.json();

  if (!data.success) {
    console.error('Compilation failed:', data.error);
    return;
  }

  // Use the data
  console.log('Contract:', data.contractName);
  console.log('Bytecode:', data.bytecode);
  console.log('ABI:', data.abi);

} catch (error) {
  console.error('Request failed:', error);
}
```

## Benefits of Using the Unified Endpoint

1. **Single Request** - Get everything you need in one API call
2. **Optimized** - Flattening happens once for both source and compilation
3. **Complete Data** - Flattened source (for verification), bytecode (for deployment), and ABI (for interaction)
4. **Time Saving** - No need to make multiple API calls or run multiple CLI commands
5. **Perfect for CI/CD** - Integrate contract compilation into your deployment pipeline

## See Also

- [Full API Documentation](API.md)
- [README](README.md)
