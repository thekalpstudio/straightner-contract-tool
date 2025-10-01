"use strict";

const axios = require("axios");
const path = require("path");

const API = process.env.API_BASE || "http://localhost:3000";
const CONTRACT = process.env.CONTRACT || path.join(__dirname, "..", "contracts", "TestCase1_BasicERC20.sol");
const N = Number(process.env.JOBS || 5);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitJob(id) {
  const started = Date.now();
  while (Date.now() - started < 180000) {
    const s = (await axios.get(`${API}/jobs/${id}`)).data;
    if (s.state === "completed") return s.result;
    if (s.state === "failed") throw new Error(`Job ${id} failed: ${s.failedReason}`);
    await sleep(1000);
  }
  throw new Error(`Job ${id} timeout`);
}

async function main() {
  console.log(`[e2e-concurrency] Posting ${N} jobs to ${API}`);
  const ids = [];
  for (let i = 0; i < N; i++) {
    const enq = (await axios.post(`${API}/compile`, { contractPath: CONTRACT, options: { preferHardhat: false } })).data;
    ids.push(enq.jobId);
  }
  console.log(`[e2e-concurrency] Job IDs:`, ids.join(", "));

  const results = await Promise.all(ids.map(waitJob));
  const methods = results.map(r => r.method);
  console.log(`[e2e-concurrency] Completed ${results.length} jobs, methods:`, methods);
  console.log("[e2e-concurrency] OK");
}

main().catch(e => { console.error("[e2e-concurrency] FAIL:", e.message); process.exit(1); });

