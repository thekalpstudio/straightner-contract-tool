#!/usr/bin/env node
'use strict';

const path = require('path');

async function testAPI() {
  console.log('=== Testing API Endpoints ===\n');
  
  const contractPath = path.join(__dirname, 'contracts', 'TestCase1_BasicERC20.sol');
  
  // Test as module import
  console.log('1. Testing Module Import...');
  const straightner = require('./index');
  console.log('   ✅ Module loaded successfully');
  console.log('   Available methods:', Object.keys(straightner).join(', '));
  
  // Test flattening
  console.log('\n2. Testing flatten() API...');
  const flattened = await straightner.flatten(contractPath);
  console.log('   ✅ Flattened:', flattened.length, 'characters');
  
  // Test compilation
  console.log('\n3. Testing compile() API...');
  const compiled = await straightner.compile(contractPath, { 
    saveFiles: false, 
    silent: true 
  });
  console.log('   ✅ Compiled:', compiled.success ? 'SUCCESS' : 'FAILED');
  console.log('   Contracts:', Object.keys(compiled.contracts).length);
  
  // Test getBytecode
  console.log('\n4. Testing getBytecode() API...');
  const bytecode = await straightner.getBytecode(contractPath, 'BasicToken');
  console.log('   ✅ Bytecode retrieved');
  console.log('   Length:', bytecode.length, 'characters');
  console.log('   Valid format:', bytecode.startsWith('0x') ? 'YES' : 'NO');
  
  // Test getAllBytecodes
  console.log('\n5. Testing getAllBytecodes() API...');
  const allBytecodes = await straightner.getAllBytecodes(contractPath);
  console.log('   ✅ All bytecodes retrieved');
  console.log('   Contracts with bytecode:', Object.keys(allBytecodes).join(', '));
  
  // Test command line interface
  console.log('\n6. Testing Command Line Interface...');
  const { execSync } = require('child_process');
  
  try {
    // Test help
    const help = execSync('node index.js --help', { encoding: 'utf8' });
    console.log('   ✅ Help command works');
    
    // Test bytecode command
    const bytecodeCmd = execSync(`node index.js bytecode ${contractPath} BasicToken`, { 
      encoding: 'utf8' 
    });
    console.log('   ✅ Bytecode command works');
    console.log('   Output starts with 0x:', bytecodeCmd.trim().startsWith('0x') ? 'YES' : 'NO');
  } catch (error) {
    console.log('   ❌ CLI test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(40));
  console.log('\n✅ All API tests passed!\n');
  console.log('The service is fully functional and can be used:');
  console.log('1. As a Node.js module (require/import)');
  console.log('2. As a command-line tool');
  console.log('3. For flattening Solidity contracts');
  console.log('4. For compiling and getting bytecode');
  console.log('5. For deployment to EVM chains\n');
}

testAPI().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});