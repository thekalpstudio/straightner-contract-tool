# Integration Prompt for Cursor AI

## Smart Contract Deployment API Endpoint Integration

I need to integrate a smart contract deployment API endpoint into my Express.js project. This endpoint should handle file uploads (.sol or .zip), compile Solidity contracts, and return all deployment-ready information including bytecode, ABI, and flattened source code.

### Requirements:

1. **Create a POST endpoint `/api/deploy`** that:
   - Accepts file uploads via `multipart/form-data` with field name `file` (.sol or .zip files)
   - Also accepts JSON body with `contractPath` string for existing files
   - Handles ZIP file extraction to find .sol files
   - Flattens the contract (resolves imports)
   - Compiles the contract using solc
   - Returns deployment-ready JSON response

2. **Dependencies needed:**
   - `multer` (^1.4.5-lts.1 or ^2.0.0) - for file upload handling
   - `adm-zip` (^0.5.10) - for ZIP file extraction
   - `solc` (^0.8.20) - for Solidity compilation
   - `express` - already in project
   - A contract processing module that can flatten and compile contracts

3. **File Upload Configuration:**
   - Create upload directories: `uploads/` and `uploads/contracts/`
   - Configure multer with disk storage
   - File size limit: 10MB
   - Only allow .sol and .zip file extensions
   - Generate unique filenames with timestamp and random suffix

4. **Endpoint Logic:**
   - If file is uploaded:
     - For .sol files: Save to uploads/contracts/ directory
     - For .zip files: Extract all .sol files, save them, use the first one found
   - If no file uploaded: Use contractPath from request body
   - Validate contract file exists
   - Flatten the contract (resolve all imports)
   - Compile the contract to get bytecode and ABI
   - Return structured JSON response with all deployment details
   - Clean up temporary uploaded files after processing

5. **Response Structure:**
```json
{
  "success": true,
  "contract": {
    "name": "ContractName",
    "originalPath": "original-filename.sol",
    "path": "full/path/to/contract.sol"
  },
  "deployment": {
    "bytecode": "0x6080604052...",
    "bytecodeLength": 1234,
    "abi": [...],
    "flattenedSource": "// SPDX-License-Identifier..."
  },
  "metadata": {
    "compiledAt": "2024-01-01T00:00:00.000Z",
    "allContracts": {...}
  }
}
```

6. **Error Handling:**
   - Return 400 if no file or contractPath provided
   - Return 404 if contract file not found
   - Return 400 if ZIP contains no .sol files
   - Return 500 with error message for compilation/flattening errors
   - Always clean up temporary files in finally block

7. **Code Structure:**
   - Use async/await for all async operations
   - Track temporary files in an array for cleanup
   - Use try-catch-finally for proper error handling and cleanup
   - Validate file extensions and file existence
   - Handle both file upload and JSON body input methods

### Implementation Notes:

- The endpoint should be flexible: accept either file upload OR contractPath in body
- For ZIP files, extract all .sol files but process only the first one found
- Flattening should resolve all import statements and dependencies
- Compilation should use solc with optimizer enabled (runs: 200)
- Return bytecode length in bytes (excluding 0x prefix)
- Include flattened source code for verification purposes
- Clean up all temporary files after successful or failed processing

### Usage Examples:

**Upload .sol file:**
```bash
curl -X POST http://localhost:3000/api/deploy \
  -F "file=@contract.sol"
```

**Upload .zip file:**
```bash
curl -X POST http://localhost:3000/api/deploy \
  -F "file=@contracts.zip"
```

**Use existing contract path:**
```bash
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{"contractPath": "contracts/MyToken.sol"}'
```

### Integration Steps:

1. Install required dependencies: `multer`, `adm-zip`, `solc`
2. Set up file upload directories and multer configuration
3. Create the `/api/deploy` endpoint with the logic described above
4. Integrate with existing contract processing/flattening module
5. Test with sample .sol and .zip files
6. Ensure proper error handling and cleanup

Please implement this endpoint following Express.js best practices and ensure it integrates seamlessly with the existing codebase structure.

