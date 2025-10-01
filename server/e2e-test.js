"use strict";

const axios = require("axios");
const path = require("path");

const API = process.env.API_BASE || "http://localhost:3000";
const CONTRACT = process.env.CONTRACT || path.join(__dirname, "..", "contracts", "TestCase1_BasicERC20.sol");

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`[e2e] Target API: ${API}`);
  console.log(`[e2e] Contract: ${CONTRACT}`);
  
  // Health
  const health = await axios.get(`${API}/health`).then(r => r.data);
  console.log("[e2e] Health:", health);

  // Enqueue
  const enq = await axios.post(`${API}/compile`, { contractPath: CONTRACT, options: { preferHardhat: false } }).then(r => r.data);
  console.log("[e2e] Enqueued job:", enq);
  const id = enq.jobId;

  // Poll
  let state = "waiting";
  let result = null;
  const started = Date.now();
  while (Date.now() - started < 120000) {
    const s = await axios.get(`${API}/jobs/${id}`).then(r => r.data);
    state = s.state;
    if (state === "completed") { result = s.result; break; }
    if (state === "failed") throw new Error(`Job failed: ${s.failedReason}`);
    await sleep(1000);
  }

  if (!result) throw new Error("Timeout waiting for job completion");
  const names = Object.keys(result.contracts || {});
  console.log("[e2e] Completed. Contracts:", names);
  if (names.length === 0) throw new Error("No contracts in result");
  console.log("[e2e] OK");
}

main().catch(e => { console.error("[e2e] FAIL:", e.message); process.exit(1); });

