"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const { enqueueCompile, compileQueue } = require("./queue");
const { port, requestLimitPerMin } = require("./config");
const straightner = require("../index");

const app = express();
app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({ windowMs: 60_000, max: requestLimitPerMin });
app.use(limiter);

app.get("/health", async (req, res) => {
  try {
    const counts = await compileQueue.getJobCounts();
    return res.json({ ok: true, counts });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
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
