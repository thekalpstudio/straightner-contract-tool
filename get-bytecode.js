#!/usr/bin/env node
'use strict';

const UniversalCompiler = require('./universal-compiler');
const path = require('path');

async function getBytecodeOnly(contractPath, contractName = null) {
  try {
    const compiler = new UniversalCompiler();
    const result = await compiler.compileAny(contractPath, { saveFiles: false, silent: true });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    if (contractName) {
      if (result.contracts[contractName]) {
        return result.contracts[contractName].bytecode;
      } else {
        throw new Error(`Contract "${contractName}" not found in compilation output`);
      }
    }
    
    const mainContractName = Object.keys(result.contracts).find(name => 
      result.contracts[name].bytecode !== '0x'
    );
    
    if (!mainContractName) {
      throw new Error('No deployable contract found in compilation output');
    }
    
    return result.contracts[mainContractName].bytecode;
    
  } catch (error) {
    throw error;
  }
}

async function getAllBytecodes(contractPath) {
  try {
    const compiler = new UniversalCompiler();
    const result = await compiler.compileAny(contractPath, { saveFiles: false, silent: true });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const bytecodes = {};
    for (const contractName in result.contracts) {
      if (result.contracts[contractName].bytecode !== '0x') {
        bytecodes[contractName] = result.contracts[contractName].bytecode;
      }
    }
    
    return bytecodes;
    
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getBytecodeOnly,
  getAllBytecodes
};

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node get-bytecode.js <contract-path> [contract-name]');
    console.log('\nExamples:');
    console.log('  node get-bytecode.js contracts/MyToken.sol');
    console.log('  node get-bytecode.js contracts/MyToken.sol MyToken');
    console.log('\nOptions:');
    console.log('  --all    Return bytecode for all contracts');
    console.log('  --json   Output as JSON');
    process.exit(1);
  }
  
  const contractPath = args[0];
  const options = {
    all: args.includes('--all'),
    json: args.includes('--json'),
    contractName: args.find(arg => !arg.startsWith('--') && arg !== contractPath) || null
  };
  
  (async () => {
    try {
      let result;
      
      if (options.all) {
        result = await getAllBytecodes(contractPath);
      } else {
        const bytecode = await getBytecodeOnly(contractPath, options.contractName);
        result = options.contractName ? bytecode : { bytecode };
      }
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (typeof result === 'string') {
          console.log(result);
        } else {
          for (const [key, value] of Object.entries(result)) {
            if (options.all) {
              console.log(`\n${key}:`);
            }
            console.log(value);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
