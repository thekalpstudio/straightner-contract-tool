"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const { enqueueCompile, compileQueue } = require("./queue");
const { port, requestLimitPerMin } = require("./config");
const straightner = require("../index");

const app = express();
app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({ windowMs: 60_000, max: requestLimitPerMin });
app.use(limiter);

// =====================================================
// File Upload Configuration
// =====================================================

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const CONTRACTS_DIR = path.join(UPLOAD_DIR, "contracts");

// Ensure upload directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".sol", ".zip"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .sol and .zip files are allowed"));
    }
  }
});

app.get("/health", async (req, res) => {
  try {
    const counts = await compileQueue.getJobCounts();
    return res.json({ ok: true, counts });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// =====================================================
// File Upload Endpoints
// =====================================================

// Upload a .sol file or .zip archive
// POST /api/upload
// Form-data: file (must be .sol or .zip)
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please provide a file with key 'file'"
      });
    }

    const uploadedFile = req.file;
    const ext = path.extname(uploadedFile.originalname).toLowerCase();
    const result = {
      success: true,
      originalName: uploadedFile.originalname,
      uploadedAt: new Date().toISOString(),
      files: []
    };

    if (ext === ".sol") {
      // Handle single .sol file
      const contractPath = path.join(CONTRACTS_DIR, path.basename(uploadedFile.filename));
      fs.renameSync(uploadedFile.path, contractPath);

      result.files.push({
        filename: path.basename(uploadedFile.filename),
        originalName: uploadedFile.originalname,
        path: contractPath,
        size: uploadedFile.size
      });

      result.message = "Solidity file uploaded successfully";
    } else if (ext === ".zip") {
      // Handle .zip file - extract all .sol files
      const zip = new AdmZip(uploadedFile.path);
      const zipEntries = zip.getEntries();

      let extractedCount = 0;
      const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1E9);

      zipEntries.forEach((entry) => {
        if (!entry.isDirectory && path.extname(entry.entryName).toLowerCase() === ".sol") {
          const filename = `${uniquePrefix}-${path.basename(entry.entryName)}`;
          const contractPath = path.join(CONTRACTS_DIR, filename);

          // Extract and save the .sol file
          fs.writeFileSync(contractPath, entry.getData());

          result.files.push({
            filename: filename,
            originalName: entry.entryName,
            path: contractPath,
            size: entry.header.size
          });

          extractedCount++;
        }
      });

      // Clean up the uploaded zip file
      fs.unlinkSync(uploadedFile.path);

      if (extractedCount === 0) {
        return res.status(400).json({
          success: false,
          error: "No .sol files found in the zip archive"
        });
      }

      result.message = `Extracted ${extractedCount} Solidity file(s) from zip archive`;
    }

    res.json(result);
  } catch (e) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// List all uploaded contract files
// GET /api/uploads
app.get("/api/uploads", async (req, res) => {
  try {
    const files = fs.readdirSync(CONTRACTS_DIR);
    const fileDetails = files
      .filter(file => path.extname(file).toLowerCase() === ".sol")
      .map(file => {
        const filePath = path.join(CONTRACTS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          uploadedAt: stats.birthtime
        };
      })
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    res.json({
      success: true,
      count: fileDetails.length,
      files: fileDetails
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// Delete an uploaded file
// DELETE /api/uploads/:filename
app.delete("/api/uploads/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(CONTRACTS_DIR, filename);

    // Security check: ensure the file is within CONTRACTS_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedContractsDir = path.resolve(CONTRACTS_DIR);

    if (!resolvedPath.startsWith(resolvedContractsDir)) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File not found"
      });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `File ${filename} deleted successfully`
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// Compile an uploaded file
// POST /api/upload/compile
// Body: { filename: string } - the filename from the upload response
app.post("/api/upload/compile", async (req, res) => {
  try {
    const { filename } = req.body || {};

    if (!filename || typeof filename !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: filename (string)"
      });
    }

    const contractPath = path.join(CONTRACTS_DIR, filename);

    // Security check
    const resolvedPath = path.resolve(contractPath);
    const resolvedContractsDir = path.resolve(CONTRACTS_DIR);

    if (!resolvedPath.startsWith(resolvedContractsDir)) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    if (!fs.existsSync(contractPath)) {
      return res.status(404).json({
        success: false,
        error: "File not found. Please upload the file first."
      });
    }

    // Compile the contract
    const result = await straightner.compile(contractPath);

    res.json({
      success: true,
      filename: filename,
      contractName: result.contractName,
      bytecode: result.bytecode,
      bytecodeLength: (result.bytecode.length - 2) / 2,
      abi: result.abi,
      allContracts: result.allContracts
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// Flatten an uploaded file
// POST /api/upload/flatten
// Body: { filename: string }
app.post("/api/upload/flatten", async (req, res) => {
  try {
    const { filename } = req.body || {};

    if (!filename || typeof filename !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: filename (string)"
      });
    }

    const contractPath = path.join(CONTRACTS_DIR, filename);

    // Security check
    const resolvedPath = path.resolve(contractPath);
    const resolvedContractsDir = path.resolve(CONTRACTS_DIR);

    if (!resolvedPath.startsWith(resolvedContractsDir)) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    if (!fs.existsSync(contractPath)) {
      return res.status(404).json({
        success: false,
        error: "File not found. Please upload the file first."
      });
    }

    const flattened = await straightner.flatten(contractPath);

    res.json({
      success: true,
      filename: filename,
      flattened: flattened
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// Enqueue a compile job
// Body: { contractPath?: string, options?: object, sources?: Record<string,string> }
app.post("/compile", async (req, res) => {
  const { contractPath, options, sources } = req.body || {};
  if ((!contractPath || typeof contractPath !== "string") && (!sources || typeof sources !== "object")) {
    return res.status(400).json({ error: "Provide contractPath (string) or sources (object)" });
  }

  try {
    const id = await enqueueCompile({ contractPath, options, sources });
    res.status(202).json({ jobId: id });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Get job status/result
app.get("/jobs/:id", async (req, res) => {
  try {
    const job = await compileQueue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    const state = await job.getState();
    const result = state === "completed" ? await job.returnvalue : undefined;
    const failedReason = state === "failed" ? job.failedReason : undefined;
    res.json({ id: job.id, state, result, failedReason, attemptsMade: job.attemptsMade });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// =====================================================
// Synchronous Endpoints (Direct Processing)
// =====================================================

// Flatten a contract (synchronous)
// POST /api/flatten
// Body: { contractPath: string } or { source: string, fileName?: string }
app.post("/api/flatten", async (req, res) => {
  try {
    const { contractPath } = req.body || {};

    if (!contractPath || typeof contractPath !== "string") {
      return res.status(400).json({
        error: "Missing required field: contractPath (string)"
      });
    }

    const flattened = await straightner.flatten(contractPath);

    res.json({
      success: true,
      contractPath,
      flattened
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// Compile a contract and return bytecode (synchronous)
// POST /api/compile-sync
// Body: { contractPath: string }
app.post("/api/compile-sync", async (req, res) => {
  try {
    const { contractPath } = req.body || {};

    if (!contractPath || typeof contractPath !== "string") {
      return res.status(400).json({
        error: "Missing required field: contractPath (string)"
      });
    }

    const result = await straightner.compile(contractPath);

    res.json({
      success: true,
      contractPath,
      contractName: result.contractName,
      bytecode: result.bytecode,
      bytecodeLength: (result.bytecode.length - 2) / 2,
      abi: result.abi,
      allContracts: result.allContracts
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// Get bytecode only (synchronous) - alias for compile-sync
// POST /api/bytecode
// Body: { contractPath: string }
app.post("/api/bytecode", async (req, res) => {
  try {
    const { contractPath } = req.body || {};

    if (!contractPath || typeof contractPath !== "string") {
      return res.status(400).json({
        error: "Missing required field: contractPath (string)"
      });
    }

    const result = await straightner.compile(contractPath);

    res.json({
      success: true,
      contractPath,
      contractName: result.contractName,
      bytecode: result.bytecode,
      bytecodeLength: (result.bytecode.length - 2) / 2,
      abi: result.abi
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

// Unified endpoint - Returns flattened source, bytecode, and ABI in one call
// POST /api/process
// Body: { contractPath: string }
app.post("/api/process", async (req, res) => {
  try {
    const { contractPath } = req.body || {};

    if (!contractPath || typeof contractPath !== "string") {
      return res.status(400).json({
        error: "Missing required field: contractPath (string)"
      });
    }

    // Step 1: Flatten the contract
    const flattened = await straightner.flatten(contractPath);

    // Step 2: Compile to get bytecode and ABI
    const compiled = await straightner.compile(contractPath);

    // Return everything in one response
    res.json({
      success: true,
      contractPath,
      contractName: compiled.contractName,
      flattened: flattened,
      bytecode: compiled.bytecode,
      bytecodeLength: (compiled.bytecode.length - 2) / 2,
      abi: compiled.abi,
      allContracts: compiled.allContracts
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: String(e.message || e)
    });
  }
});

app.listen(port, () => console.log(`[api] Listening on :${port}`));
