#!/usr/bin/env node
'use strict';

const { flatten, compile, getBytecode, getAllBytecodes } = require('./index');

async function exampleUsage() {
  console.log('=== Solidity Flattener & Compiler Usage Examples ===\n');
  
  const contractPath = 'contracts/TestCase1_BasicERC20.sol';
  
  try {
    console.log('1. Getting bytecode only (for deployment):');
    console.log('-------------------------------------------');
    const bytecode = await getBytecode(contractPath, 'BasicToken');
    console.log('Bytecode:', bytecode.substring(0, 100) + '...');
    console.log('Length:', bytecode.length, 'characters');
    console.log('Size:', (bytecode.length - 2) / 2, 'bytes\n');
    
    console.log('2. Getting all contract bytecodes:');
    console.log('-----------------------------------');
    const allBytecodes = await getAllBytecodes(contractPath);
    for (const [name, code] of Object.entries(allBytecodes)) {
      console.log(`${name}: ${code.substring(0, 66)}... (${(code.length - 2) / 2} bytes)`);
    }
    console.log();
    
    console.log('3. Full compilation with ABI and metadata:');
    console.log('------------------------------------------');
    const result = await compile(contractPath, { 
      saveFiles: false, 
      silent: true 
    });
    
    if (result.success) {
      for (const [name, contract] of Object.entries(result.contracts)) {
        if (contract.bytecode !== '0x') {
          console.log(`${name}:`);
          console.log(`  - Bytecode: ${contract.bytecode.substring(0, 66)}...`);
          console.log(`  - ABI methods: ${contract.abi.length}`);
          console.log(`  - Has metadata: ${!!contract.metadata}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

if (require.main === module) {
  exampleUsage();
}