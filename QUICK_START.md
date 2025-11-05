# Quick Start Guide - Straightner

## Prerequisites

```bash
# Install dependencies (if not already installed)
npm install
```

---

## 🚀 Running the Service

### Option 1: CLI (Command Line Interface)

#### Flatten a Contract
```bash
node index.js flatten contracts/MyToken.sol
```

#### Compile a Contract (Get Bytecode)
```bash
node index.js compile contracts/MyToken.sol
```

#### Help
```bash
node index.js --help
```

---

### Option 2: API Server

#### Start the Server
```bash
node server/app.js
```

The server will start on **port 3000** by default.

You should see:
```
[api] Listening on :3000
```

---

## 🧪 Testing the Service

### Method 1: Using cURL

#### Test Health Check
```bash
curl http://localhost:3000/health
```

#### Test Unified Endpoint (All-in-One)
```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

#### Test Flatten Endpoint
```bash
curl -X POST http://localhost:3000/api/flatten \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

#### Test Compile Endpoint
```bash
curl -X POST http://localhost:3000/api/compile-sync \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

#### Test Bytecode Endpoint
```bash
curl -X POST http://localhost:3000/api/bytecode \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

---

### Method 2: Using Test Scripts

#### Run Quick API Test
```bash
./test_api.sh
```

#### Run Full Test Suite
```bash
npm test
```

---

### Method 3: Using Postman/Insomnia

**Import this collection:**

#### Endpoint 1: Process (All-in-One)
```
POST http://localhost:3000/api/process
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```

#### Endpoint 2: Flatten
```
POST http://localhost:3000/api/flatten
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```

#### Endpoint 3: Compile
```
POST http://localhost:3000/api/compile-sync
Content-Type: application/json

{
  "contractPath": "contracts/MyToken.sol"
}
```

---

## 📝 Complete Workflow

### Step-by-Step Testing

#### 1. Start the Server
```bash
# Terminal 1
node server/app.js
```

#### 2. Test in Another Terminal
```bash
# Terminal 2 - Test health
curl http://localhost:3000/health

# Test compilation
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}' | jq .
```

Note: `jq` formats JSON output (install with `brew install jq` on Mac)

---

## 🔧 Environment Variables

You can customize the server with environment variables:

```bash
# Set custom port
PORT=8080 node server/app.js

# Set Redis URL (for queue-based endpoints)
REDIS_URL=redis://localhost:6379 node server/app.js

# Set rate limit
RATE_LIMIT_PER_MIN=100 node server/app.js
```

---

## 📊 Expected Responses

### Success Response from /api/process
```json
{
  "success": true,
  "contractPath": "contracts/MyToken.sol",
  "contractName": "MyToken",
  "flattened": "...(26,107 characters)",
  "bytecode": "0x608060405234801561000f575f5ffd5b50...",
  "bytecodeLength": 3628,
  "abi": [...29 entries],
  "allContracts": ["Context", "ERC20", "ERC20Burnable", ...]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -ti:3000)

# Start on different port
PORT=8080 node server/app.js
```

### Contract not found
```bash
# List available contracts
ls -la contracts/

# Make sure path is relative to project root
# Correct:   "contracts/MyToken.sol"
# Incorrect: "MyToken.sol"
```

### Redis connection error (for queue endpoints)
```bash
# Install and start Redis (macOS)
brew install redis
brew services start redis

# Or start Redis manually
redis-server
```

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Install
npm install

# Run CLI
node index.js flatten contracts/MyToken.sol
node index.js compile contracts/MyToken.sol

# Start API Server
node server/app.js

# Test API (in another terminal)
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"contractPath":"contracts/MyToken.sol"}'

# Run Tests
npm test

# Quick Test Script
./test_api.sh

# Stop Server
Ctrl + C
# Or
kill -9 $(lsof -ti:3000)
```

---

## 📖 Next Steps

1. **Read the Documentation**
   - `README.md` - Overview and features
   - `API.md` - Complete API reference
   - `EXAMPLE_USAGE.md` - Code examples in multiple languages

2. **Try Different Contracts**
   - Create your own contract in `contracts/`
   - Test with the API or CLI

3. **Deploy Your Contract**
   - Use the bytecode and ABI from the API response
   - Deploy to any EVM-compatible network

---

## 💡 Pro Tips

1. **Pretty Print JSON**
   ```bash
   curl ... | jq .
   ```

2. **Save Response to File**
   ```bash
   curl ... > response.json
   ```

3. **Test Multiple Contracts**
   ```bash
   for file in contracts/*.sol; do
     echo "Testing $file"
     node index.js compile "$file"
   done
   ```

4. **Background Server**
   ```bash
   node server/app.js > server.log 2>&1 &
   ```

---

## 🆘 Getting Help

```bash
# CLI Help
node index.js --help

# Check server logs
tail -f server.log

# View API documentation
open API.md
```

---

**Happy Compiling! 🚀**
