"use strict";

const axios = require("axios");
const path = require("path");

const API = process.env.API_BASE || "http://localhost:4000";

const complex = [
  "/app/contracts/TestCase2_ComplexNFT.sol",
  "/app/contracts/TestCase3_Upgradeable.sol",
  "/app/contracts/TestCase4_Governor.sol"
];

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function enqueue(contractPath) {
  const { data } = await axios.post(`${API}/compile`, { contractPath, options: { preferHardhat: false } });
  return data.jobId;
}

async function wait(jobId) {
  const started = Date.now();
  while (Date.now() - started < 180000) {
    const { data } = await axios.get(`${API}/jobs/${jobId}`);
    if (data.state === 'completed') return data.result;
    if (data.state === 'failed') throw new Error(data.failedReason);
    await sleep(1000);
  }
  throw new Error('timeout');
}

async function main(){
  console.log(`[complex] API: ${API}`);
  const ids = [];
  for (const c of complex) {
    const id = await enqueue(c);
    console.log(`[complex] enqueued ${c} -> ${id}`);
    ids.push({ c, id });
  }
  const results = [];
  for (const { c, id } of ids) {
    const r = await wait(id);
    const names = Object.keys(r.contracts || {});
    const deployables = names.filter(n => (r.contracts[n]?.bytecode || '0x') !== '0x');
    console.log(`[complex] ${c} -> OK method=${r.method} contracts=${names.length} deployables=${deployables.length}`);
    results.push({ c, method: r.method, names, deployables });
  }
  console.log("[complex] All complex cases compiled successfully");
}

main().catch(e => { console.error('[complex] FAIL:', e.message); process.exit(1); });

