# Straightner Demonstration Script

## Introduction (30 seconds)
"Hello, I'd like to demonstrate Straightner - a Solidity contract flattener that handles complex import scenarios including OpenZeppelin dependencies, local imports, and circular dependencies."

---

## Step 1: Show Help Documentation (15 seconds)

```bash
node index.js --help
```

**Say:** "First, let me show you the available commands."

**Expected Output:**
```
Solidity Flattener
==================

Usage: node index.js <command> [options]

Commands:
  flatten <contract>    - Flatten a contract and its dependencies
  help                  - Show this help message

Examples:
  node index.js flatten contracts/MyToken.sol
```

---

## Step 2: Run Test Suite (20 seconds)

```bash
npm test
```

**Say:** "Let me verify everything is working by running our test suite."

**Expected Output:**
```
Testing Straightner...

Test 1: Flattening contract...
✓ Flattening successful! Output: 16961 characters
✓ File saved to output/straightenedFile.sol

Test 2: Verifying output file...
✓ Output file exists and readable
✓ Contains pragma: true
✓ Contains contract code: true

✓ All tests passed!
```

---

## Step 3: Show Sample Contract (30 seconds)

```bash
cat contracts/ImportFromNodeModules.sol
```

**Say:** "Here's a sample contract that imports from OpenZeppelin's node_modules. Notice the import statements at the top."

**Expected Output:** Shows a contract with OpenZeppelin imports like:
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
```

---

## Step 4: Flatten the Contract (30 seconds)

```bash
node index.js flatten contracts/ImportFromNodeModules.sol > output/demo_output.sol
```

**Say:** "Now let's flatten this contract. This will resolve all imports and create a single file."

---

## Step 5: Verify Output Size (20 seconds)

```bash
# Show original file size
wc -l contracts/ImportFromNodeModules.sol

# Show flattened file size
wc -l output/demo_output.sol
```

**Say:** "Notice how the original contract was just 20 lines, but the flattened version is over 600 lines because it includes all the OpenZeppelin dependencies."

---

## Step 6: Preview Flattened Output (30 seconds)

```bash
head -30 output/demo_output.sol
```

**Say:** "Let's look at the beginning of the flattened file. You can see the pragma statement is preserved, and all the imported contracts are now included."

---

## Step 7: Verify All Imports Resolved (20 seconds)

```bash
grep -c "^import " contracts/ImportFromNodeModules.sol
grep -c "^import " output/demo_output.sol
```

**Say:** "The original file had multiple import statements. The flattened version has zero imports - everything is resolved."

---

## Step 8: Advanced Demo - Circular Dependencies (30 seconds)

```bash
# Show contracts with circular imports
cat contracts/TestCase6_CircularA.sol
echo "---"
cat contracts/TestCase6_CircularB.sol

# Flatten it
node index.js flatten contracts/TestCase6_CircularA.sol > output/circular_demo.sol

# Verify it worked
wc -l output/circular_demo.sol
```

**Say:** "Straightner can even handle circular dependencies. Contract A imports B, and B imports A. Our tool intelligently resolves these without duplication."

---

## Step 9: Show Output Directory (15 seconds)

```bash
ls -lh output/
```

**Say:** "All flattened contracts are saved in the output directory, ready for verification or deployment."

---

## Summary (30 seconds)

**Say:** "To summarize, Straightner provides:
1. Automatic import resolution from node_modules
2. Local import handling
3. Circular dependency resolution
4. Clean, single-file output ready for verification
5. Simple CLI interface

The tool is production-ready and has been tested with complex contract scenarios."

---

## Quick Reference

### Common Commands
```bash
# Show help
node index.js --help

# Run tests
npm test

# Flatten a contract
node index.js flatten <contract-path>

# Save to specific file
node index.js flatten <contract-path> > output/myfile.sol
```

### Demo Files Available
- `contracts/ImportFromNodeModules.sol` - OpenZeppelin imports
- `contracts/TestCase5_LocalImports.sol` - Local file imports
- `contracts/TestCase6_CircularA.sol` - Circular dependencies

---

## Total Time: ~4 minutes
