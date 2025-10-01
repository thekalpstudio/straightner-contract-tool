#!/usr/bin/env node
'use strict';

const path = require('path');
const straightner = require('./index');

async function runOne(relPath, preferHardhat = false) {
  const p = path.join(__dirname, 'contracts', relPath);
  console.log(`\n=== ${relPath} ===`);

  console.log('Flattening...');
  const flat = await straightner.flatten(p);
  console.log('  OK length:', flat.length);

  console.log('Compiling (ultimate pipeline)...');
  const result = await straightner.compileUltimate(p, { silent: true, saveFiles: false, preferHardhat });
  if (!result.success) {
    console.log('  FAIL:', result.error);
    return { relPath, success: false, error: result.error };
  }
  const names = Object.keys(result.contracts || {});
  const deployables = names.filter(n => (result.contracts[n]?.bytecode || '0x') !== '0x');
  console.log('  Method:', result.method);
  console.log('  Contracts:', names.length, 'Deployables:', deployables.length);
  return { relPath, success: true, method: result.method, names, deployables };
}

async function main() {
  const tests = [
    'TestCase2_ComplexNFT.sol',
    'TestCase3_Upgradeable.sol',
    'TestCase4_Governor.sol'
  ];
  const results = [];
  for (const t of tests) {
    results.push(await runOne(t));
  }
  const failed = results.filter(r => !r.success);
  if (failed.length) {
    console.error('\nSome complex tests failed:', failed.map(f => `${f.relPath}: ${f.error}`).join('; '));
    process.exit(1);
  }
  console.log('\n✅ Complex flatten + compile tests passed');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

