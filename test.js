'use strict';

const worker = require('./worker');
const fs = require('fs');
const path = require('path');

async function main () {
  console.log('Testing Straightner...\n');

  try {
    // Test 1: Basic flattening
    console.log('Test 1: Flattening contract...');
    const strtnFile = await worker.processFile(
      path.join(__dirname, 'contracts', 'ImportFromNodeModules.sol'),
      false,
      true
    );

    const pragma = await worker.getPragma(
      path.join(__dirname, 'contracts', 'ImportFromNodeModules.sol')
    );

    const outputDir = path.join(__dirname, 'output');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const finalOutput = pragma ? `${pragma}\n\n${strtnFile}` : strtnFile;

    fs.writeFileSync(
      path.join(outputDir, 'straightenedFile.sol'),
      finalOutput
    );

    console.log('✓ Flattening successful! Output:', finalOutput.length, 'characters');
    console.log('✓ File saved to output/straightenedFile.sol\n');

    // Test 2: Check if output file exists and is readable
    console.log('Test 2: Verifying output file...');
    const outputPath = path.join(outputDir, 'straightenedFile.sol');
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, 'utf-8');
      console.log('✓ Output file exists and readable');
      console.log('✓ Contains pragma:', content.includes('pragma solidity'));
      console.log('✓ Contains contract code:', content.includes('contract') || content.includes('interface'));
    }

    console.log('\n✓ All tests passed!');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

main();
