#!/usr/bin/env node
'use strict';

const worker = require('./worker');

module.exports = {
  flatten: async (contractPath) => {
    const pragma = await worker.getPragma(contractPath);
    const flattened = await worker.processFile(contractPath, false, true);
    return pragma ? `${pragma}\n\n${flattened}` : flattened;
  },

  processFile: async (contractPath) => {
    return await worker.processFile(contractPath, false, true);
  },

  getPragma: async (contractPath) => {
    return await worker.getPragma(contractPath);
  },

  compile: async (contractPath) => {
    return await worker.compile(contractPath);
  }
};

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Solidity Flattener and Compiler');
    console.log('================================\n');
    console.log('Usage: node index.js <command> [options]\n');
    console.log('Commands:');
    console.log('  flatten <contract>    - Flatten a contract and its dependencies');
    console.log('  compile <contract>    - Flatten and compile a contract, returning bytecode');
    console.log('  help                  - Show this help message\n');
    console.log('Examples:');
    console.log('  node index.js flatten contracts/MyToken.sol');
    console.log('  node index.js compile contracts/MyToken.sol');
    process.exit(0);
  }

  const command = args[0];
  const contractPath = args[1];

  (async () => {
    try {
      switch(command) {
        case 'flatten':
          const pragma = await worker.getPragma(contractPath);
          const flattened = await worker.processFile(contractPath, false, true);
          const output = pragma ? `${pragma}\n\n${flattened}` : flattened;
          console.log(output);
          break;

        case 'compile':
          console.log('Compiling contract...');
          const result = await worker.compile(contractPath);
          console.log('\nCompilation successful!');
          console.log('\nContract:', result.contractName);
          console.log('\nBytecode:');
          console.log(result.bytecode);
          console.log('\nBytecode length:', (result.bytecode.length - 2) / 2, 'bytes');
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
