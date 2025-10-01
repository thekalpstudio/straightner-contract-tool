"use strict";

const axios = require("axios");

const API = process.env.API_BASE || "http://localhost:4000";
const complex = [
  "/app/contracts/TestCase2_ComplexNFT.sol",
  "/app/contracts/TestCase3_Upgradeable.sol",
  "/app/contracts/TestCase4_Governor.sol"
];

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function enqueue(contractPath) {
  const { data } = await axios.post(`${API}/compile`, { contractPath, options: { useSandbox: true } });
  return data.jobId;
}
async function wait(jobId) {
  const started = Date.now();
  while (Date.now() - started < 300000) {
    const { data } = await axios.get(`${API}/jobs/${jobId}`);
    if (data.state === 'completed') return data.result;
    if (data.state === 'failed') throw new Error(data.failedReason);
    await sleep(1000);
  }
  throw new Error('timeout');
}

async function main(){
  console.log(`[complex-sandbox] API: ${API}`);
  const ids = await Promise.all(complex.map(enqueue));
  const results = [];
  for (const id of ids) {
    const r = await wait(id);
    const names = Object.keys(r.contracts || {});
    const deployables = names.filter(n => (r.contracts[n]?.bytecode || '0x') !== '0x');
    results.push({ method: r.method, names, deployables });
  }
  console.log("[complex-sandbox] OK", results.map(r => ({ method: r.method, deployables: r.deployables.length })));
}

main().catch(e => { console.error('[complex-sandbox] FAIL:', e.message); process.exit(1); });

