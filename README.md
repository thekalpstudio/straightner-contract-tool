# Straightner

A powerful Solidity contract flattener and compiler that handles complex import scenarios, including node_modules dependencies, local imports, and circular dependencies.

## Features

- **Smart Flattening**: Automatically flatten Solidity contracts with all dependencies
- **Universal Compiler**: Compile contracts with automatic import resolution
- **Bytecode Extraction**: Get deployment-ready bytecode for your contracts
- **Contract Fixing**: Automatically fix common Solidity compilation issues
- **Server API**: RESTful API for contract compilation and flattening
- **Node Modules Support**: Seamlessly handle OpenZeppelin and other npm dependencies
- **Circular Dependency Resolution**: Intelligently handle circular imports

## Installation

```bash
npm install
```

## CLI Usage

### Flatten a Contract

```bash
node index.js flatten contracts/MyToken.sol
```

### Help

```bash
node index.js --help
```

## Programmatic Usage

```javascript
const straightner = require('./index');

// Flatten a contract (with pragma)
const flattened = await straightner.flatten('contracts/MyToken.sol');

// Process file (without pragma)
const processed = await straightner.processFile('contracts/MyToken.sol');

// Get pragma version
const pragma = await straightner.getPragma('contracts/MyToken.sol');
```

## Server API

The server provides a queueing system for contract compilation using Redis and BullMQ.

### Prerequisites

- Redis server running on `localhost:6379` or set `REDIS_URL` environment variable

### Start the server

```bash
node server/app.js
```

### API Endpoints

#### Synchronous Endpoints (Direct Processing)

**Process Contract (All-in-One)** ⭐ NEW
```bash
POST /api/process
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```
Returns flattened source, bytecode, and ABI in a single call.

**Flatten Contract**
```bash
POST /api/flatten
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```
Returns flattened contract source code.

**Compile Contract**
```bash
POST /api/compile-sync
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```
Returns bytecode, contract name, and ABI.

**Get Bytecode**
```bash
POST /api/bytecode
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```
Returns deployment-ready bytecode and ABI.

#### Async Endpoints (Queue-Based)

**Health Check**
```bash
GET /health
```
Returns server status and job queue statistics.

**Enqueue Compilation Job**
```bash
POST /compile
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol",
  "options": {}
}
```
Returns: `{"jobId": "1"}`

**Check Job Status**
```bash
GET /jobs/:id
```
Returns job state, result, and failure reason if applicable.

See [API.md](API.md) for detailed API documentation with examples.

## Testing

```bash
npm test
```

## Project Structure

```
straightner/
├── index.js              # Main entry point and CLI
├── worker.js             # Core flattening logic
├── test.js               # Test suite
├── contracts/            # Sample contracts
├── server/               # API server
│   ├── app.js           # Express server
│   ├── worker.js        # Server worker
│   ├── queue.js         # Job queue
│   └── config.js        # Configuration
└── package.json
```

## Supported Import Patterns

- ✅ Node modules imports (`@openzeppelin/contracts/...`)
- ✅ Relative imports (`./MyContract.sol`, `../utils/Helper.sol`)
- ✅ Absolute imports (`contracts/interfaces/...`)
- ✅ Circular dependencies
- ✅ Interface imports
- ✅ Library imports

## Dependencies

- `@openzeppelin/contracts`: OpenZeppelin contract library
- `axios`: HTTP client for API requests
- `get-installed-path`: Resolve node_modules paths

## Author

**0xprabal.eth**
Email:0xprabal.eth@gmail.com

## License

MIT
