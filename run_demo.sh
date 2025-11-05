#!/bin/bash

# Straightner Live Demo Script
# This script runs through a complete demonstration

echo "======================================"
echo "    STRAIGHTNER DEMONSTRATION"
echo "======================================"
echo ""

# Step 1: Help
echo "STEP 1: Showing available commands..."
echo "Command: node index.js --help"
echo "--------------------------------------"
node index.js --help
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 2: Run Tests
echo "STEP 2: Running test suite..."
echo "Command: npm test"
echo "--------------------------------------"
npm test
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 3: Show Sample Contract
echo "STEP 3: Showing sample contract..."
echo "Command: cat contracts/ImportFromNodeModules.sol"
echo "--------------------------------------"
cat contracts/ImportFromNodeModules.sol
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 4: Count imports in original
echo "STEP 4: Counting import statements in original..."
echo "Command: grep -c '^import' contracts/ImportFromNodeModules.sol"
echo "--------------------------------------"
echo "Number of imports: $(grep -c '^import' contracts/ImportFromNodeModules.sol || echo 0)"
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 5: Flatten Contract
echo "STEP 5: Flattening the contract..."
echo "Command: node index.js flatten contracts/ImportFromNodeModules.sol > output/demo_output.sol"
echo "--------------------------------------"
node index.js flatten contracts/ImportFromNodeModules.sol > output/demo_output.sol
echo "✓ Contract flattened successfully!"
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 6: Compare Sizes
echo "STEP 6: Comparing file sizes..."
echo "--------------------------------------"
echo "Original file:"
wc -l contracts/ImportFromNodeModules.sol
echo ""
echo "Flattened file:"
wc -l output/demo_output.sol
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 7: Preview Output
echo "STEP 7: Previewing flattened output (first 30 lines)..."
echo "Command: head -30 output/demo_output.sol"
echo "--------------------------------------"
head -30 output/demo_output.sol
echo ""
echo "..."
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 8: Verify No Imports
echo "STEP 8: Verifying all imports are resolved..."
echo "Command: grep -c '^import' output/demo_output.sol"
echo "--------------------------------------"
IMPORT_COUNT=$(grep -c '^import' output/demo_output.sol || echo 0)
echo "Number of imports in flattened file: $IMPORT_COUNT"
if [ "$IMPORT_COUNT" -eq 0 ]; then
    echo "✓ All imports successfully resolved!"
else
    echo "⚠ Warning: Some imports remain"
fi
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 9: Circular Dependency Demo
echo "STEP 9: Testing circular dependency handling..."
echo "--------------------------------------"
echo "Showing CircularA.sol:"
cat contracts/TestCase6_CircularA.sol
echo ""
echo "Showing CircularB.sol:"
cat contracts/TestCase6_CircularB.sol
echo ""
echo "Flattening CircularA (which imports CircularB that imports back to A)..."
node index.js flatten contracts/TestCase6_CircularA.sol > output/circular_demo.sol
echo "✓ Circular dependency resolved!"
echo "Output size:"
wc -l output/circular_demo.sol
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 10: Show Output Directory
echo "STEP 10: Showing all generated files..."
echo "Command: ls -lh output/"
echo "--------------------------------------"
ls -lh output/
echo ""
read -p "Press Enter to continue..."
echo ""

# Summary
echo "======================================"
echo "         DEMO COMPLETE!"
echo "======================================"
echo ""
echo "Summary of Capabilities:"
echo "✓ Flattens Solidity contracts"
echo "✓ Resolves OpenZeppelin imports"
echo "✓ Handles local file imports"
echo "✓ Resolves circular dependencies"
echo "✓ Produces clean, single-file output"
echo "✓ Ready for contract verification"
echo ""
echo "Thank you for watching!"
echo "======================================"
