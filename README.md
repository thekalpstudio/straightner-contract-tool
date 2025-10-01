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

### Compile a Contract

```bash
node index.js compile contracts/MyToken.sol
```

### Get Bytecode

```bash
node index.js bytecode contracts/MyToken.sol MyToken
```

### Help

```bash
node index.js --help
```

## Programmatic Usage

```javascript
const straightner = require('./index');

// Flatten a contract
const flattened = await straightner.flatten('contracts/MyToken.sol');

// Compile a contract
const compiled = await straightner.compile('contracts/MyToken.sol');

// Get bytecode
const bytecode = await straightner.getBytecode('contracts/MyToken.sol', 'MyToken');

// Get all bytecodes
const allBytecodes = await straightner.getAllBytecodes('contracts/MyToken.sol');

// Fix contract issues
const fixed = await straightner.fixContract(sourceCode);
```

## Server API

Start the server:

```bash
node server/app.js
```

### API Endpoints

#### Flatten Contract
```bash
POST /flatten
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```

#### Compile Contract
```bash
POST /compile
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```

#### Get Bytecode
```bash
POST /bytecode
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol",
  "contractName": "MyToken"
}
```

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
