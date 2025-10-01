"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const { enqueueCompile, compileQueue } = require("./queue");
const { port, requestLimitPerMin } = require("./config");

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

app.listen(port, () => console.log(`[api] Listening on :${port}`));
