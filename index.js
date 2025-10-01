#!/usr/bin/env node
'use strict';

const workerFixed = require('./worker-fixed');
const UniversalCompiler = require('./universal-compiler');
const ContractFixer = require('./contract-fixer');
const { getBytecodeOnly, getAllBytecodes } = require('./get-bytecode');

module.exports = {
  flatten: async (contractPath) => {
    return await workerFixed.processFile(contractPath, false, true);
  },
  
  compile: async (contractPath, options = {}) => {
    // Single unified flow: universal compiler with import-based strategy + auto-fixes
    const compiler = new UniversalCompiler();
    return await compiler.compileAny(contractPath, { saveFiles: false, ...options });
  },
  
  getBytecode: async (contractPath, contractName = null) => {
    return await getBytecodeOnly(contractPath, contractName);
  },
  
  getAllBytecodes: async (contractPath) => {
    return await getAllBytecodes(contractPath);
  },
  // Unified entry (alias)
  compileAny: async (contractPath, options = {}) => {
    const compiler = new UniversalCompiler();
    return await compiler.compileAny(contractPath, { saveFiles: false, ...options });
  },
  
  fixContract: async (sourceCode) => {
    const fixer = new ContractFixer();
    return await fixer.analyzeAndFix(sourceCode);
  },
  
  // Backward-compatible alias for removed multi-flow
  compileUltimate: async (contractPath, options = {}) => {
    const compiler = new UniversalCompiler();
    return await compiler.compileAny(contractPath, { saveFiles: false, ...options });
  }
};

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Solidity Flattener and Compiler');
    console.log('================================\n');
    console.log('Usage: node index.js <command> [options]\n');
    console.log('Commands:');
    console.log('  flatten <contract>           - Flatten a contract and its dependencies');
    console.log('  compile <contract>           - Flatten and compile a contract');
    console.log('  bytecode <contract> [name]   - Get bytecode for deployment');
    console.log('  help                         - Show this help message\n');
    console.log('Examples:');
    console.log('  node index.js flatten contracts/MyToken.sol');
    console.log('  node index.js compile contracts/MyToken.sol');
    console.log('  node index.js bytecode contracts/MyToken.sol MyToken');
    process.exit(0);
  }
  
  const command = args[0];
  const contractPath = args[1];
  
  (async () => {
    try {
      switch(command) {
        case 'flatten':
          const flattened = await workerFixed.processFile(contractPath, false, true);
          console.log(flattened);
          break;
          
        case 'compile':
          const compiler = new UniversalCompiler();
          await compiler.compileAny(contractPath, { saveFiles: true });
          break;
          
        case 'bytecode':
          const contractName = args[2] || null;
          const bytecode = await getBytecodeOnly(contractPath, contractName);
          console.log(bytecode);
          break;
          
        default:
          console.error(`Unknown command: ${command}`);
          console.log('Run "node index.js --help" for usage information');
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
