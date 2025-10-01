#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { flatten, compile, getBytecode, getAllBytecodes } = require('./index');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(`${colors.cyan}${colors.bright}🧪 Running Comprehensive Test Suite${colors.reset}\n`);
    console.log('=' .repeat(60) + '\n');

    const startTime = Date.now();

    for (const test of this.tests) {
      process.stdout.write(`Testing: ${test.name}... `);
      try {
        await test.testFn();
        this.results.passed++;
        console.log(`${colors.green}✓ PASSED${colors.reset}`);
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({ test: test.name, error: error.message });
        console.log(`${colors.red}✗ FAILED${colors.reset}`);
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '=' .repeat(60));
    console.log(`\n${colors.bright}📊 Test Results:${colors.reset}`);
    console.log(`  ${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`  Total: ${this.tests.length}`);
    console.log(`  Duration: ${duration}s`);
    
    if (this.results.passed === this.tests.length) {
      console.log(`\n${colors.green}${colors.bright}✅ All tests passed!${colors.reset}`);
    } else {
      console.log(`\n${colors.red}${colors.bright}❌ Some tests failed${colors.reset}`);
    }

    return this.results;
  }
}

async function runTests() {
  const runner = new TestRunner();
  const testContracts = [
    'TestCase1_BasicERC20.sol',
    'TestCase2_ComplexNFT.sol',
    'TestCase3_Upgradeable.sol',
    'TestCase4_Governor.sol',
    'TestCase5_LocalImports.sol'
  ];

  // Test 1: Flattening Basic ERC20
  runner.test('Flatten Basic ERC20', async () => {
    const flattened = await flatten(path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'));
    if (!flattened || flattened.length < 1000) {
      throw new Error('Flattening produced insufficient output');
    }
    const importCount = (flattened.match(/import\s/g) || []).length;
    if (importCount > 0) {
      throw new Error(`Flattened file still contains ${importCount} imports`);
    }
  });

  // Test 2: Compile Basic ERC20
  runner.test('Compile Basic ERC20', async () => {
    const result = await compile(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      { saveFiles: false, silent: true }
    );
    if (!result.success) {
      throw new Error('Compilation failed: ' + result.error);
    }
    if (!result.contracts.BasicToken) {
      throw new Error('BasicToken contract not found in output');
    }
    if (!result.contracts.BasicToken.bytecode.startsWith('0x')) {
      throw new Error('Invalid bytecode format');
    }
  });

  // Test 3: Get Bytecode for Specific Contract
  runner.test('Get Bytecode for BasicToken', async () => {
    const bytecode = await getBytecode(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      'BasicToken'
    );
    if (!bytecode || !bytecode.startsWith('0x608060405234')) {
      throw new Error('Invalid bytecode returned');
    }
    if (bytecode.length < 100) {
      throw new Error('Bytecode too short');
    }
  });

  // Test 4: Get All Bytecodes
  runner.test('Get All Bytecodes from Contract', async () => {
    const bytecodes = await getAllBytecodes(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol')
    );
    if (!bytecodes.BasicToken) {
      throw new Error('BasicToken bytecode not found');
    }
    const deployableContracts = Object.keys(bytecodes).length;
    if (deployableContracts < 1) {
      throw new Error('No deployable contracts found');
    }
  });

  // Test 5: Complex NFT Contract
  runner.test('Compile Complex NFT Contract', async () => {
    const result = await compile(
      path.join(__dirname, 'contracts', 'TestCase2_ComplexNFT.sol'),
      { saveFiles: false, silent: true }
    );
    if (!result.success) {
      throw new Error('Failed to compile NFT contract');
    }
    if (!result.contracts.ComplexNFT) {
      throw new Error('ComplexNFT contract not found');
    }
  });

  // Test 6: Upgradeable Contract
  runner.test('Compile Upgradeable Contract', async () => {
    const result = await compile(
      path.join(__dirname, 'contracts', 'TestCase3_Upgradeable.sol'),
      { saveFiles: false, silent: true }
    );
    if (!result.success) {
      throw new Error('Failed to compile upgradeable contract');
    }
    if (!result.contracts.UpgradeableVault) {
      throw new Error('UpgradeableVault contract not found');
    }
  });

  // Test 7: Governor Contract
  runner.test('Compile Governor Contract', async () => {
    const result = await compile(
      path.join(__dirname, 'contracts', 'TestCase4_Governor.sol'),
      { saveFiles: false, silent: true }
    );
    if (!result.success) {
      throw new Error('Failed to compile governor contract');
    }
    if (!result.contracts.DAOGovernor) {
      throw new Error('DAOGovernor contract not found');
    }
  });

  // Test 8: ABI Extraction
  runner.test('Extract ABI from Compiled Contract', async () => {
    const result = await compile(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      { saveFiles: false, silent: true }
    );
    if (!result.contracts.BasicToken.abi) {
      throw new Error('ABI not found');
    }
    const abi = result.contracts.BasicToken.abi;
    if (!Array.isArray(abi) || abi.length < 5) {
      throw new Error('Invalid or incomplete ABI');
    }
    const hasTransfer = abi.some(item => item.name === 'transfer');
    if (!hasTransfer) {
      throw new Error('ERC20 transfer function not found in ABI');
    }
  });

  // Test 9: Gas Estimates
  runner.test('Get Gas Estimates', async () => {
    const result = await compile(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      { saveFiles: false, silent: true }
    );
    if (!result.contracts.BasicToken.gasEstimates) {
      throw new Error('Gas estimates not found');
    }
    if (!result.contracts.BasicToken.gasEstimates.creation) {
      throw new Error('Creation gas estimate not found');
    }
  });

  // Test 10: Output File Generation
  runner.test('Generate Output Files', async () => {
    const outputDir = path.join(__dirname, 'output', 'test-results');
    const result = await compile(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      { 
        saveFiles: true, 
        silent: true,
        outputDir: outputDir
      }
    );
    
    if (!fs.existsSync(path.join(outputDir, 'flattened.sol'))) {
      throw new Error('Flattened file not created');
    }
    if (!fs.existsSync(path.join(outputDir, 'compiled.json'))) {
      throw new Error('Compiled JSON not created');
    }
    
    // Verify content
    const compiledJson = JSON.parse(
      fs.readFileSync(path.join(outputDir, 'compiled.json'), 'utf8')
    );
    if (!compiledJson.BasicToken) {
      throw new Error('Invalid compiled JSON structure');
    }
  });

  // Test 11: Multiple Contract Files
  runner.test('Process Multiple Contract Types', async () => {
    let successCount = 0;
    for (const contractFile of testContracts.slice(0, 3)) {
      try {
        const result = await compile(
          path.join(__dirname, 'contracts', contractFile),
          { saveFiles: false, silent: true }
        );
        if (result.success) successCount++;
      } catch (e) {
        // Continue testing other contracts
      }
    }
    if (successCount < 2) {
      throw new Error(`Only ${successCount} out of 3 contracts compiled successfully`);
    }
  });

  // Test 12: Error Handling - Invalid Path
  runner.test('Handle Invalid Contract Path', async () => {
    try {
      await getBytecode('contracts/NonExistent.sol');
      throw new Error('Should have thrown error for non-existent file');
    } catch (error) {
      if (error.message.includes('Should have thrown')) {
        throw error;
      }
      // Expected error - test passes
    }
  });

  // Test 13: Bytecode Size Validation
  runner.test('Validate Bytecode Size', async () => {
    const bytecode = await getBytecode(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      'BasicToken'
    );
    const sizeInBytes = (bytecode.length - 2) / 2;
    if (sizeInBytes > 24576) { // 24KB limit
      throw new Error(`Contract too large: ${sizeInBytes} bytes`);
    }
  });

  // Test 14: License and Pragma Handling
  runner.test('Handle Multiple Licenses and Pragmas', async () => {
    const flattened = await flatten(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol')
    );
    const licenseCount = (flattened.match(/SPDX-License-Identifier/g) || []).length;
    const pragmaCount = (flattened.match(/pragma solidity/g) || []).length;
    
    if (licenseCount !== 1) {
      throw new Error(`Expected 1 license, found ${licenseCount}`);
    }
    if (pragmaCount !== 1) {
      throw new Error(`Expected 1 pragma, found ${pragmaCount}`);
    }
  });

  // Test 15: Optimization Settings
  runner.test('Test Compilation with Optimization', async () => {
    const optimized = await compile(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      { saveFiles: false, silent: true, optimize: true, runs: 200 }
    );
    
    const unoptimized = await compile(
      path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol'),
      { saveFiles: false, silent: true, optimize: false }
    );
    
    if (!optimized.success || !unoptimized.success) {
      throw new Error('Compilation with different settings failed');
    }
    
    // Optimized bytecode should generally be smaller
    const optSize = optimized.contracts.BasicToken.bytecode.length;
    const unoptSize = unoptimized.contracts.BasicToken.bytecode.length;
    
    if (optSize >= unoptSize) {
      console.log(`\n  Warning: Optimized (${optSize}) not smaller than unoptimized (${unoptSize})`);
    }
  });

  // Run all tests
  const results = await runner.run();
  
  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: runner.tests.length,
    passed: results.passed,
    failed: results.failed,
    successRate: ((results.passed / runner.tests.length) * 100).toFixed(2) + '%',
    errors: results.errors,
    testedContracts: testContracts
  };

  // Save report
  const reportPath = path.join(__dirname, 'output', 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.cyan}📄 Test report saved to: ${reportPath}${colors.reset}`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
