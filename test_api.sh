#!/bin/bash

# Quick API Test Script
# This script tests the unified /api/process endpoint

echo "🧪 Testing Straightner API"
echo "=========================="
echo ""

# Start server in background
echo "Starting server..."
node server/app.js > /tmp/server_test.log 2>&1 &
SERVER_PID=$!
sleep 3

# Test the unified endpoint
echo "Testing /api/process endpoint..."
echo ""

curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/ImportFromNodeModules.sol"}' \
  -s | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log('✅ Success:', data.success);
console.log('✅ Contract Name:', data.contractName);
console.log('✅ Flattened Length:', data.flattened.length, 'characters');
console.log('✅ Bytecode Length:', data.bytecodeLength, 'bytes');
console.log('✅ ABI Functions:', data.abi.length, 'entries');
console.log('✅ All Contracts:', data.allContracts.length, 'total');
"

echo ""
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null

echo "✅ Test complete!"
