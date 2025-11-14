# File Upload API Documentation

This document describes the file upload endpoints for uploading and processing Solidity contracts.

## Overview

The API supports uploading both individual `.sol` files and `.zip` archives containing multiple Solidity files. Uploaded files are stored in the `uploads/contracts` directory and can be compiled or flattened using dedicated endpoints.

---

## Endpoints

### 1. Upload File (POST /api/upload)

Upload a `.sol` file or `.zip` archive containing Solidity contracts.

**Request:**
- Method: `POST`
- Endpoint: `/api/upload`
- Content-Type: `multipart/form-data`
- Body:
  - `file` (required): The file to upload (must be `.sol` or `.zip`)

**Response (Success - .sol file):**
```json
{
  "success": true,
  "originalName": "MyToken.sol",
  "uploadedAt": "2025-11-10T13:30:00.000Z",
  "message": "Solidity file uploaded successfully",
  "files": [
    {
      "filename": "1699610000000-123456789-MyToken.sol",
      "originalName": "MyToken.sol",
      "path": "/app/uploads/contracts/1699610000000-123456789-MyToken.sol",
      "size": 1234
    }
  ]
}
```

**Response (Success - .zip file):**
```json
{
  "success": true,
  "originalName": "contracts.zip",
  "uploadedAt": "2025-11-10T13:30:00.000Z",
  "message": "Extracted 3 Solidity file(s) from zip archive",
  "files": [
    {
      "filename": "1699610000000-123456789-Token.sol",
      "originalName": "contracts/Token.sol",
      "path": "/app/uploads/contracts/1699610000000-123456789-Token.sol",
      "size": 1234
    },
    {
      "filename": "1699610000000-123456789-NFT.sol",
      "originalName": "contracts/NFT.sol",
      "path": "/app/uploads/contracts/1699610000000-123456789-NFT.sol",
      "size": 2345
    }
  ]
}
```

**Example (curl):**
```bash
# Upload a .sol file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@MyToken.sol"

# Upload a .zip file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@contracts.zip"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

---

### 2. List Uploaded Files (GET /api/uploads)

Get a list of all uploaded Solidity files.

**Request:**
- Method: `GET`
- Endpoint: `/api/uploads`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "files": [
    {
      "filename": "1699610000000-123456789-MyToken.sol",
      "path": "/app/uploads/contracts/1699610000000-123456789-MyToken.sol",
      "size": 1234,
      "uploadedAt": "2025-11-10T13:30:00.000Z"
    },
    {
      "filename": "1699609000000-987654321-NFT.sol",
      "path": "/app/uploads/contracts/1699609000000-987654321-NFT.sol",
      "size": 2345,
      "uploadedAt": "2025-11-10T13:25:00.000Z"
    }
  ]
}
```

**Example (curl):**
```bash
curl http://localhost:3000/api/uploads
```

---

### 3. Compile Uploaded File (POST /api/upload/compile)

Compile an uploaded Solidity file and get the bytecode and ABI.

**Request:**
- Method: `POST`
- Endpoint: `/api/upload/compile`
- Content-Type: `application/json`
- Body:
```json
{
  "filename": "1699610000000-123456789-MyToken.sol"
}
```

**Response:**
```json
{
  "success": true,
  "filename": "1699610000000-123456789-MyToken.sol",
  "contractName": "MyToken",
  "bytecode": "0x6080604052...",
  "bytecodeLength": 1234,
  "abi": [...],
  "allContracts": ["MyToken", "ERC20"]
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:3000/api/upload/compile \
  -H "Content-Type: application/json" \
  -d '{"filename": "1699610000000-123456789-MyToken.sol"}'
```

---

### 4. Flatten Uploaded File (POST /api/upload/flatten)

Flatten an uploaded Solidity file (merge all imports into a single file).

**Request:**
- Method: `POST`
- Endpoint: `/api/upload/flatten`
- Content-Type: `application/json`
- Body:
```json
{
  "filename": "1699610000000-123456789-MyToken.sol"
}
```

**Response:**
```json
{
  "success": true,
  "filename": "1699610000000-123456789-MyToken.sol",
  "flattened": "pragma solidity ^0.8.0;\n\ncontract MyToken {...}"
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:3000/api/upload/flatten \
  -H "Content-Type: application/json" \
  -d '{"filename": "1699610000000-123456789-MyToken.sol"}'
```

---

### 5. Delete Uploaded File (DELETE /api/uploads/:filename)

Delete an uploaded file from the server.

**Request:**
- Method: `DELETE`
- Endpoint: `/api/uploads/:filename`

**Response:**
```json
{
  "success": true,
  "message": "File 1699610000000-123456789-MyToken.sol deleted successfully"
}
```

**Example (curl):**
```bash
curl -X DELETE http://localhost:3000/api/uploads/1699610000000-123456789-MyToken.sol
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "No file uploaded. Please provide a file with key 'file'"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "File not found. Please upload the file first."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Compilation failed: ..."
}
```

---

## File Size Limits

- Maximum file size: 10MB
- Supported file types: `.sol`, `.zip`

---

## Security Features

1. **File Type Validation**: Only `.sol` and `.zip` files are accepted
2. **Path Traversal Protection**: All file operations are restricted to the uploads directory
3. **File Size Limits**: Prevents large file uploads that could overwhelm the server
4. **Unique Filenames**: Uploaded files are renamed with timestamps to prevent collisions

---

## Complete Workflow Example

```bash
# 1. Upload a contract
UPLOAD_RESPONSE=$(curl -X POST http://localhost:3000/api/upload \
  -F "file=@MyToken.sol")

echo $UPLOAD_RESPONSE
# Extract filename from response
FILENAME=$(echo $UPLOAD_RESPONSE | jq -r '.files[0].filename')

# 2. List all uploads
curl http://localhost:3000/api/uploads

# 3. Compile the uploaded file
curl -X POST http://localhost:3000/api/upload/compile \
  -H "Content-Type: application/json" \
  -d "{\"filename\": \"$FILENAME\"}"

# 4. Flatten the uploaded file
curl -X POST http://localhost:3000/api/upload/flatten \
  -H "Content-Type: application/json" \
  -d "{\"filename\": \"$FILENAME\"}"

# 5. Delete the file when done
curl -X DELETE http://localhost:3000/api/uploads/$FILENAME
```

---

## Notes

- Uploaded files are stored in the `uploads/contracts` directory
- Filenames are automatically prefixed with a timestamp and random number to ensure uniqueness
- When uploading a `.zip` file, only `.sol` files within the archive are extracted
- All endpoints support CORS (if configured)
- Rate limiting applies to all endpoints (default: 60 requests per minute)
