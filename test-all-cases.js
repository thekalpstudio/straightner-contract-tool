'use strict';

const workerFixed = require('./worker-fixed');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testCases = [
  {
    name: 'Basic ERC20',
    file: 'contracts/TestCase1_BasicERC20.sol',
    description: 'Simple ERC20 token with minimal imports'
  },
  {
    name: 'Complex NFT',
    file: 'contracts/TestCase2_ComplexNFT.sol',
    description: 'NFT with multiple extensions and AccessControl'
  },
  {
    name: 'Upgradeable Contract',
    file: 'contracts/TestCase3_Upgradeable.sol',
    description: 'UUPS upgradeable contract with security features'
  },
  {
    name: 'Governor DAO',
    file: 'contracts/TestCase4_Governor.sol',
    description: 'Complex governance contract with multiple extensions'
  },
  {
    name: 'Mixed Local and External Imports',
    file: 'contracts/TestCase5_LocalImports.sol',
    description: 'Contract with both local and OpenZeppelin imports'
  },
  {
    name: 'Circular Dependencies',
    file: 'contracts/TestCase6_CircularA.sol',
    description: 'Testing circular dependency handling'
  }
];

async function testFlattening(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`File: ${testCase.file}`);
  console.log('='.repeat(60));
  
  const inputFile = path.join(__dirname, testCase.file);
  const outputDir = path.join(__dirname, 'output', 'test-results');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFileName = `flattened_${path.basename(testCase.file)}`;
  const outputPath = path.join(outputDir, outputFileName);
  
  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.log(`❌ Input file not found: ${inputFile}`);
      return {
        testCase: testCase.name,
        status: 'FAILED',
        error: 'Input file not found'
      };
    }
    
    // Process the file
    console.log('⏳ Flattening...');
    const startTime = Date.now();
    const flattened = await workerFixed.processFile(inputFile, false, true);
    const processingTime = Date.now() - startTime;
    
    // Save the flattened file
    fs.writeFileSync(outputPath, flattened);
    console.log(`✅ Flattened in ${processingTime}ms`);
    console.log(`📁 Output saved to: ${outputFileName}`);
    
    // Analyze the result
    const stats = {
      linesOfCode: flattened.split('\n').length,
      fileSize: Buffer.byteLength(flattened, 'utf8'),
      remainingImports: (flattened.match(/import\s/g) || []).length,
      licenseCount: (flattened.match(/SPDX-License-Identifier/g) || []).length,
      pragmaCount: (flattened.match(/pragma solidity/g) || []).length,
      contractCount: (flattened.match(/contract\s+\w+/g) || []).length,
      interfaceCount: (flattened.match(/interface\s+\w+/g) || []).length,
      libraryCount: (flattened.match(/library\s+\w+/g) || []).length
    };
    
    console.log('\n📊 Statistics:');
    console.log(`   Lines of code: ${stats.linesOfCode}`);
    console.log(`   File size: ${(stats.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   Remaining imports: ${stats.remainingImports}`);
    console.log(`   License identifiers: ${stats.licenseCount}`);
    console.log(`   Pragma statements: ${stats.pragmaCount}`);
    console.log(`   Contracts: ${stats.contractCount}`);
    console.log(`   Interfaces: ${stats.interfaceCount}`);
    console.log(`   Libraries: ${stats.libraryCount}`);
    
    // Try to compile (only if no remaining imports)
    if (stats.remainingImports === 0) {
      console.log('\n🔧 Testing compilation...');
      try {
        execSync(`npx solc --abi ${outputPath}`, { stdio: 'pipe' });
        console.log('✅ Compilation successful!');
        stats.compilable = true;
      } catch (compileError) {
        console.log('❌ Compilation failed');
        console.log('   Error:', compileError.message.split('\n')[0]);
        stats.compilable = false;
        stats.compileError = compileError.message;
      }
    } else {
      console.log('\n⚠️  Skipping compilation test (unresolved imports remain)');
      stats.compilable = false;
      stats.compileError = 'Unresolved imports';
    }
    
    return {
      testCase: testCase.name,
      status: 'SUCCESS',
      processingTime,
      stats,
      outputFile: outputFileName
    };
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    return {
      testCase: testCase.name,
      status: 'FAILED',
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Flattener Test Suite');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📁 Working Directory: ${__dirname}`);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testFlattening(testCase);
    results.push(result);
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const compilable = results.filter(r => r.stats && r.stats.compilable).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🔧 Compilable: ${compilable}`);
  
  console.log('\nDetailed Results:');
  console.log('-'.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.status === 'SUCCESS' ? '✅' : '❌';
    const compilable = result.stats?.compilable ? '🔧' : '⚠️';
    
    console.log(`\n${index + 1}. ${result.testCase}`);
    console.log(`   Status: ${status} ${result.status}`);
    
    if (result.status === 'SUCCESS') {
      console.log(`   Processing Time: ${result.processingTime}ms`);
      console.log(`   Output: ${result.outputFile}`);
      console.log(`   Stats:`);
      console.log(`     - Lines: ${result.stats.linesOfCode}`);
      console.log(`     - Size: ${(result.stats.fileSize / 1024).toFixed(2)} KB`);
      console.log(`     - Imports: ${result.stats.remainingImports}`);
      console.log(`     - Compilable: ${compilable} ${result.stats.compilable ? 'Yes' : 'No'}`);
      
      if (result.stats.compileError) {
        console.log(`     - Compile Error: ${result.stats.compileError.split('\n')[0]}`);
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Save report to file
  const reportPath = path.join(__dirname, 'output', 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  // Overall assessment
  console.log('\n' + '='.repeat(60));
  console.log('🎯 OVERALL ASSESSMENT');
  console.log('='.repeat(60));
  
  if (failed === 0 && compilable === successful) {
    console.log('✅ EXCELLENT: All tests passed and compiled successfully!');
  } else if (failed === 0) {
    console.log('⚠️  GOOD: All tests flattened successfully, but some have compilation issues.');
  } else if (successful > failed) {
    console.log('⚠️  PARTIAL: Most tests passed, but some failed.');
  } else {
    console.log('❌ POOR: Many tests failed. Review the implementation.');
  }
  
  return results;
}

// Run tests
runAllTests().catch(console.error);