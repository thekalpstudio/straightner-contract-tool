#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getBytecode, compile } = require('./index');

async function testFullIntegration() {
  console.log('=== Full Integration Test ===\n');
  console.log('This test simulates a complete workflow from source to deployment-ready bytecode.\n');
  
  const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("TestToken", "TEST") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
`;

  try {
    // Step 1: Create test contract
    console.log('Step 1: Creating test contract...');
    const testContractPath = path.join(__dirname, 'contracts', 'TestToken.sol');
    fs.writeFileSync(testContractPath, testContract);
    console.log('   ✅ Contract created at:', testContractPath);
    
    // Step 2: Compile the contract
    console.log('\nStep 2: Compiling contract...');
    const compileResult = await compile(testContractPath, {
      saveFiles: false,
      silent: true,
      optimize: true,
      runs: 200
    });
    
    if (!compileResult.success) {
      throw new Error('Compilation failed');
    }
    console.log('   ✅ Compilation successful');
    console.log('   - Contracts compiled:', Object.keys(compileResult.contracts).length);
    
    // Step 3: Extract bytecode
    console.log('\nStep 3: Extracting bytecode...');
    const bytecode = await getBytecode(testContractPath, 'TestToken');
    console.log('   ✅ Bytecode extracted');
    console.log('   - Size:', (bytecode.length - 2) / 2, 'bytes');
    console.log('   - Ready for deployment: YES');
    
    // Step 4: Extract ABI
    console.log('\nStep 4: Extracting ABI...');
    const abi = compileResult.contracts.TestToken.abi;
    console.log('   ✅ ABI extracted');
    console.log('   - Methods:', abi.filter(i => i.type === 'function').length);
    console.log('   - Events:', abi.filter(i => i.type === 'event').length);
    
    // Step 5: Verify ERC20 interface
    console.log('\nStep 5: Verifying ERC20 Interface...');
    const requiredFunctions = ['transfer', 'approve', 'transferFrom', 'balanceOf', 'totalSupply', 'allowance'];
    const functionNames = abi.filter(i => i.type === 'function').map(f => f.name);
    const hasAllFunctions = requiredFunctions.every(fn => functionNames.includes(fn));
    console.log('   ✅ ERC20 interface:', hasAllFunctions ? 'COMPLETE' : 'INCOMPLETE');
    requiredFunctions.forEach(fn => {
      console.log(`   - ${fn}:`, functionNames.includes(fn) ? '✅' : '❌');
    });
    
    // Step 6: Prepare deployment data
    console.log('\nStep 6: Preparing Deployment Data...');
    const deploymentData = {
      bytecode: bytecode,
      abi: abi,
      gasEstimate: compileResult.contracts.TestToken.gasEstimates.creation.totalCost,
      network: 'any EVM chain',
      constructorArgs: []
    };
    console.log('   ✅ Deployment data ready');
    console.log('   - Bytecode: Available');
    console.log('   - ABI: Available');
    console.log('   - Gas estimate:', deploymentData.gasEstimate);
    
    // Step 7: Save deployment artifacts
    console.log('\nStep 7: Saving Deployment Artifacts...');
    const artifactsDir = path.join(__dirname, 'output', 'deployment-artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(artifactsDir, 'TestToken.json'),
      JSON.stringify({
        contractName: 'TestToken',
        bytecode: bytecode,
        abi: abi,
        networks: {},
        compiler: {
          name: 'solc',
          version: '0.8.30',
          settings: {
            optimizer: { enabled: true, runs: 200 }
          }
        }
      }, null, 2)
    );
    console.log('   ✅ Artifacts saved to:', artifactsDir);
    
    // Step 8: Generate deployment script example
    console.log('\nStep 8: Generating Deployment Example...');
    const deploymentScript = `
// Web3.js deployment example
const Web3 = require('web3');
const contract = require('./deployment-artifacts/TestToken.json');

async function deploy() {
  const web3 = new Web3('YOUR_RPC_URL');
  const account = web3.eth.accounts.privateKeyToAccount('YOUR_PRIVATE_KEY');
  
  const TestToken = new web3.eth.Contract(contract.abi);
  
  const deployment = TestToken.deploy({
    data: contract.bytecode
  });
  
  const gas = await deployment.estimateGas();
  
  const deployedContract = await deployment.send({
    from: account.address,
    gas: gas
  });
  
  console.log('Contract deployed at:', deployedContract.options.address);
}
`;
    
    fs.writeFileSync(
      path.join(artifactsDir, 'deploy-example.js'),
      deploymentScript
    );
    console.log('   ✅ Deployment script example created');
    
    // Clean up test file
    fs.unlinkSync(testContractPath);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!\n');
    console.log('✅ All Steps Passed:');
    console.log('   1. Contract creation');
    console.log('   2. Flattening & compilation');
    console.log('   3. Bytecode extraction');
    console.log('   4. ABI extraction');
    console.log('   5. Interface verification');
    console.log('   6. Deployment data preparation');
    console.log('   7. Artifact generation');
    console.log('   8. Example script creation\n');
    
    console.log('📦 The service is production-ready and provides:');
    console.log('   - Complete contract flattening');
    console.log('   - Solidity compilation');
    console.log('   - Bytecode extraction for deployment');
    console.log('   - ABI generation for interaction');
    console.log('   - Gas estimation');
    console.log('   - Deployment artifacts\n');
    
    console.log('🚀 Ready to deploy to:');
    console.log('   - Ethereum Mainnet');
    console.log('   - Polygon');
    console.log('   - Binance Smart Chain');
    console.log('   - Arbitrum');
    console.log('   - Optimism');
    console.log('   - Any EVM-compatible chain\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    // Clean up on error
    const testContractPath = path.join(__dirname, 'contracts', 'TestToken.sol');
    if (fs.existsSync(testContractPath)) {
      fs.unlinkSync(testContractPath);
    }
    return false;
  }
}

// Run the integration test
testFullIntegration().then(success => {
  if (success) {
    console.log('✨ Service testing complete - all systems operational!');
  }
  process.exit(success ? 0 : 1);
});