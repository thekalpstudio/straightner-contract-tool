'use strict';

const { straighten } = require('./straighten'),
  fs = require('fs');
const path = require('path');

async function main () {
  const strtnFile = await straighten(
    path.join(__dirname, 'contracts', 'ImportFromNodeModules.sol'),
  );

  const outputDir = path.join(__dirname, 'output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFile(
    path.join(outputDir, 'straightenedFile.sol'),
    strtnFile,
    (err) => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('File has been saved!');
      }
    },
  );
}

main();
