'use strict';

const workerFixed = require('./worker-fixed');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Starting flattening process...');
  
  const inputFile = path.join(__dirname, 'contracts', 'ImportFromNodeModules.sol');
  
  // Process the file with the fixed worker
  const strtnFile = await workerFixed.processFile(inputFile, false, true);
  
  const outputDir = path.join(__dirname, 'output');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const outputPath = path.join(outputDir, 'straightenedFileFixed.sol');
  
  fs.writeFileSync(outputPath, strtnFile);
  console.log(`Flattened file saved to: ${outputPath}`);
  
  // Show some stats
  const importCount = (strtnFile.match(/import\s/g) || []).length;
  const licenseCount = (strtnFile.match(/SPDX-License-Identifier/g) || []).length;
  const pragmaCount = (strtnFile.match(/pragma solidity/g) || []).length;
  
  console.log('\nFlattening Statistics:');
  console.log(`- Remaining imports: ${importCount}`);
  console.log(`- License identifiers: ${licenseCount}`);
  console.log(`- Pragma statements: ${pragmaCount}`);
  
  if (importCount > 0) {
    console.log('\n⚠️  Warning: The flattened file still contains import statements!');
  } else {
    console.log('\n✅ Success: All imports have been resolved!');
  }
}

main().catch(console.error);