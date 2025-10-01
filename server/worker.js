"use strict";

const { Worker, Job } = require("bullmq");
const { connection } = require("./queue");
const config = require("./config");

// Reuse existing compile capability
const { compileUltimate } = require("../index");
const { compileInSandbox } = require("./hardhat-sandbox");

const worker = new Worker(
  config.queueName,
  async (job) => {
    const { contractPath, options = {}, sources } = job.data || {};
    if ((!contractPath || typeof contractPath !== 'string') && (!sources || typeof sources !== 'object')) {
      throw new Error("Provide contractPath or sources");
    }

    const start = Date.now();
    let result = null;
    if (contractPath) {
      try {
        result = await compileUltimate(contractPath, Object.assign({ silent: true }, options));
      } catch (e) {
        result = { success: false, error: e?.message || String(e) };
      }
    }

    // Fallback to ESM Hardhat sandbox for complex cases or when forced
    if (!result || result.success !== true || options?.useSandbox === true || sources) {
      const sbx = await compileInSandbox({ contractPath, sources, solcVersion: options?.solcVersion || "0.8.20" });
      if (sbx && sbx.success) result = sbx;
      else if (!result || !result.success) result = sbx; // bubble sandbox error if universal also failed
    }
    const durationMs = Date.now() - start;

    if (!result || result.success !== true) {
      const err = new Error(result?.error || "Compilation failed");
      err.result = result;
      throw err;
    }

    return { durationMs, method: result.method, contracts: result.contracts };
  },
  { connection, concurrency: config.workerConcurrency }
);

worker.on("completed", (job, returnvalue) => {
  console.log(`[worker] completed job ${job.id} in queue ${job.queueName} (method=${returnvalue?.method})`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] failed job ${job?.id}:`, err?.message);
});

process.on("SIGINT", async () => {
  console.log("\n[worker] Shutting down...");
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[worker] Shutting down...");
  await worker.close();
  process.exit(0);
});
