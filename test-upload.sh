#!/bin/bash

# Test script for file upload endpoints
# Usage: ./test-upload.sh

set -e

API_URL="http://localhost:3000"
TEST_FILE="test-contract.sol"

echo "=========================================="
echo "Straightner File Upload Test Script"
echo "=========================================="
echo ""

# Create a simple test contract
echo "Creating test contract..."
cat > $TEST_FILE << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleToken {
    string public name = "Test Token";
    string public symbol = "TEST";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18;

    mapping(address => uint256) public balanceOf;

    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}
EOF

echo "Test contract created: $TEST_FILE"
echo ""

# Test 1: Upload the file
echo "Test 1: Uploading file..."
UPLOAD_RESPONSE=$(curl -s -X POST $API_URL/api/upload \
  -F "file=@$TEST_FILE")

echo "Response:"
echo $UPLOAD_RESPONSE | jq .
echo ""

# Extract filename from response
FILENAME=$(echo $UPLOAD_RESPONSE | jq -r '.files[0].filename')

if [ "$FILENAME" = "null" ] || [ -z "$FILENAME" ]; then
    echo "Error: Failed to upload file"
    rm $TEST_FILE
    exit 1
fi

echo "Uploaded filename: $FILENAME"
echo ""

# Test 2: List uploaded files
echo "Test 2: Listing uploaded files..."
curl -s $API_URL/api/uploads | jq .
echo ""

# Test 3: Flatten the uploaded file
echo "Test 3: Flattening uploaded file..."
curl -s -X POST $API_URL/api/upload/flatten \
  -H "Content-Type: application/json" \
  -d "{\"filename\": \"$FILENAME\"}" | jq .
echo ""

# Test 4: Compile the uploaded file
echo "Test 4: Compiling uploaded file..."
COMPILE_RESPONSE=$(curl -s -X POST $API_URL/api/upload/compile \
  -H "Content-Type: application/json" \
  -d "{\"filename\": \"$FILENAME\"}")

echo $COMPILE_RESPONSE | jq '{success, filename, contractName, bytecodeLength, abiLength: (.abi | length)}'
echo ""

# Test 5: Delete the uploaded file
echo "Test 5: Deleting uploaded file..."
curl -s -X DELETE $API_URL/api/uploads/$FILENAME | jq .
echo ""

# Cleanup
rm $TEST_FILE

echo "=========================================="
echo "All tests completed successfully!"
echo "=========================================="
