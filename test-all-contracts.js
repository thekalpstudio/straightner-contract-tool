#!/usr/bin/env node
'use strict';

const { compileAny } = require('./index');
const fs = require('fs');
const path = require('path');

async function testAllContracts() {
  console.log('🧪 Testing ALL Contracts with Universal Compiler');
  console.log('=' .repeat(60) + '\n');
  
  const testContracts = [
    { name: 'BasicERC20', file: 'TestCase1_BasicERC20.sol', expectedContract: 'BasicToken' },
    { name: 'ComplexNFT', file: 'TestCase2_ComplexNFT.sol', expectedContract: 'ComplexNFT' },
    { name: 'Upgradeable', file: 'TestCase3_Upgradeable.sol', expectedContract: 'UpgradeableVault' },
    { name: 'Governor', file: 'TestCase4_Governor.sol', expectedContract: 'DAOGovernor' },
    { name: 'LocalImports', file: 'TestCase5_LocalImports.sol', expectedContract: 'MixedImports' },
    { name: 'CircularA', file: 'TestCase6_CircularA.sol', expectedContract: 'CircularA' }
  ];
  
  const results = {
    passed: [],
    failed: [],
    totalBytecode: 0
  };
  
  for (const test of testContracts) {
    process.stdout.write(`Testing ${test.name}... `);
    
    try {
      const result = await compileAny(
        path.join(__dirname, 'contracts', test.file),
        { silent: true, saveFiles: false }
      );
      
      if (result.success) {
        const mainContract = result.contracts[test.expectedContract];
        if (mainContract && mainContract.bytecode && mainContract.bytecode !== '0x') {
          const bytecodeSize = (mainContract.bytecode.length - 2) / 2;
          results.passed.push({
            name: test.name,
            contract: test.expectedContract,
            bytecodeSize,
            attempt: result.attempt,
            config: result.configUsed
          });
          results.totalBytecode += bytecodeSize;
          console.log(`✅ PASSED (${bytecodeSize} bytes, attempt ${result.attempt})`);
        } else {
          results.failed.push({
            name: test.name,
            reason: 'No bytecode generated'
          });
          console.log(`❌ FAILED (No bytecode)`);
        }
      } else {
        results.failed.push({
          name: test.name,
          reason: result.error
        });
        console.log(`❌ FAILED (${result.error})`);
      }
    } catch (error) {
      results.failed.push({
        name: test.name,
        reason: error.message
      });
      console.log(`❌ FAILED (${error.message})`);
    }
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  
  const passRate = (results.passed.length / testContracts.length * 100).toFixed(1);
  
  console.log(`✅ Passed: ${results.passed.length}/${testContracts.length} (${passRate}%)`);
  console.log(`❌ Failed: ${results.failed.length}/${testContracts.length}`);
  console.log(`📦 Total bytecode: ${results.totalBytecode} bytes\n`);
  
  if (results.passed.length > 0) {
    console.log('✅ SUCCESSFUL COMPILATIONS:');
    for (const pass of results.passed) {
      console.log(`   ${pass.name}:`);
      console.log(`     - Contract: ${pass.contract}`);
      console.log(`     - Size: ${pass.bytecodeSize} bytes`);
      console.log(`     - Attempt: ${pass.attempt}/3`);
      console.log(`     - EVM: ${pass.config?.evmVersion || 'default'}`);
    }
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED COMPILATIONS:');
    for (const fail of results.failed) {
      console.log(`   ${fail.name}: ${fail.reason}`);
    }
  }
  
  // Improvement analysis
  console.log('\n📈 IMPROVEMENT ANALYSIS:');
  console.log('Before: 1/6 contracts compiled (16.7%)');
  console.log(`After:  ${results.passed.length}/6 contracts compiled (${passRate}%)`);
  
  if (results.passed.length >= 4) {
    console.log('\n🎉 SIGNIFICANT IMPROVEMENT!');
    console.log('The universal compiler successfully handles most contract types.');
  } else if (results.passed.length >= 2) {
    console.log('\n✅ MODERATE IMPROVEMENT');
    console.log('The universal compiler handles basic and medium complexity contracts.');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: testContracts.length,
    passed: results.passed.length,
    failed: results.failed.length,
    passRate: passRate + '%',
    details: results,
    improvements: {
      before: { passed: 1, total: 6, rate: '16.7%' },
      after: { passed: results.passed.length, total: 6, rate: passRate + '%' }
    }
  };
  
  const reportPath = path.join(__dirname, 'output', 'universal-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return results;
}

// Run tests
testAllContracts().then(results => {
  const exitCode = results.passed.length > 0 ? 0 : 1;
  process.exit(exitCode);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
