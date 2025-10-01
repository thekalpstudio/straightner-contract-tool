'use strict';

const path = require('path'),
  { execSync } = require('child_process'),
  axios = require('axios'),
  fs = require('fs'),
  { getInstalledPath } = require('get-installed-path');

const regEx = {
  pragma: /(pragma solidity (.+?);)/g,
  import: /import\s+(?:(?:(?:"[^"]+"|'[^']+')\s+as\s+\w+)|(?:{[^}]+}\s+from\s+)?(?:"([^"]+)"|'([^']+)'))/g,
  spdxLicense: /\/\/\s*SPDX-License-Identifier:\s*(.+)/gi,
  github: /^(https?:\/\/)?(www.)?github.com\/([^/]*\/[^/]*)\/(.*)/,
};

let processedFiles = new Set();
let collectedLicenses = new Set();
let pragmaVersion = null;

const getNodeModulesFolders = async (dir) => {
  const parts = path.dirname(dir).split(path.sep);
  const folders = [];
  for (let partIdx = 0; partIdx < parts.length; partIdx++) {
    const part = parts[partIdx];

    if (folders.length === 0) {
      folders.push(path.join(path.sep, part, 'node_modules'));
    }
    else {
      folders.push(path.join(path.dirname(folders[partIdx - 1]), part, 'node_modules'));
    }
  }

  const rootNodeModules = (await execSync('npm root', { cwd: dir })).toString().trim();

  return [...folders.reverse(), rootNodeModules];
};

const getNodeModulePath = async (name, { cwd }) => {
  return getInstalledPath(name, {
    paths: await getNodeModulesFolders(cwd),
    cwd,
  });
};

const extractImportPath = (importStatement) => {
  const matches = regEx.import.exec(importStatement);
  if (matches) {
    return matches[1] || matches[2];
  }
  return null;
};

const processFile = async (file, fromGithub, root = false) => {
  try {
    if (root) {
      processedFiles = new Set();
      collectedLicenses = new Set();
      pragmaVersion = null;
    }

    // Normalize the file path to avoid duplicates
    const normalizedFile = path.normalize(file);
    
    if (processedFiles.has(normalizedFile)) {
      return '';
    }

    processedFiles.add(normalizedFile);
    
    let contents;
    let baseDir;

    if (fromGithub) {
      const metadata = regEx.github.exec(file);
      const url = 'https://api.github.com/repos/' + metadata[3] + '/contents/' + metadata[4];
      axios.defaults.headers.post['User-Agent'] = 'sol-straightener';
      contents = Buffer.from((await axios.get(url)).data.content, 'base64').toString();
      baseDir = path.dirname(metadata[0]);
    } else {
      contents = fs.readFileSync(file, { encoding: 'utf-8' });
      baseDir = path.dirname(file);
    }

    // Extract and collect SPDX licenses
    let licenseMatch;
    regEx.spdxLicense.lastIndex = 0;
    while ((licenseMatch = regEx.spdxLicense.exec(contents)) !== null) {
      collectedLicenses.add(licenseMatch[1].trim());
    }
    
    // Remove SPDX license identifiers from content
    contents = contents.replace(regEx.spdxLicense, '');

    // Extract pragma and store the first one found
    const pragmaMatch = regEx.pragma.exec(contents);
    if (pragmaMatch && !pragmaVersion) {
      pragmaVersion = pragmaMatch[1];
    }
    
    // Remove pragma statements
    contents = contents.replace(regEx.pragma, '').trim();

    // Process all imports recursively first
    let processedImports = [];
    let importMatch;
    const importStatements = [];
    
    // Collect all import statements
    regEx.import.lastIndex = 0;
    while ((importMatch = regEx.import.exec(contents)) !== null) {
      importStatements.push({
        statement: importMatch[0],
        path: importMatch[1] || importMatch[2]
      });
    }

    // Process each import
    for (const imp of importStatements) {
      let importFile = imp.path;
      
      if (!importFile) continue;
      
      let filePath;
      
      if (fromGithub && !importFile.startsWith('github.com')) {
        importFile = path.join(baseDir, importFile);
      }

      if (importFile.substring(0, 10) === 'github.com') {
        const importContent = await processFile(importFile, true);
        if (importContent) {
          processedImports.push(importContent);
        }
      } else {
        // Try to resolve the file path
        if (fromGithub) {
          filePath = importFile;
        } else {
          filePath = path.join(baseDir, importFile);
          
          // If it doesn't exist, try to find it in node_modules
          if (!fs.existsSync(filePath)) {
            try {
              const nodeModulesPath = await getNodeModulePath(
                path.dirname(importFile), 
                { cwd: baseDir }
              );
              filePath = path.join(nodeModulesPath, path.basename(importFile));
            } catch (e) {
              console.warn(`Warning: Could not resolve import ${importFile}`);
              continue;
            }
          }
        }
        
        filePath = path.normalize(filePath);
        const importContent = await processFile(filePath, false);
        if (importContent) {
          processedImports.push(importContent);
        }
      }
    }

    // Remove all import statements and their trailing semicolons
    for (const imp of importStatements) {
      // Match the import statement and any trailing semicolon
      const importPattern = imp.statement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fullPattern = new RegExp(importPattern + '\\s*;?', 'g');
      contents = contents.replace(fullPattern, '');
    }
    
    // Clean up any remaining standalone semicolons and extra whitespace
    contents = contents.replace(/^\s*;\s*$/gm, '').trim();

    // Combine imported content with current file content
    let result = '';
    if (processedImports.length > 0) {
      result = processedImports.join('\n\n') + '\n\n';
    }
    result += contents;

    return result;
  } catch (error) {
    console.error(`Error processing file ${file}:`, error.message);
    throw error;
  }
};

const getPragma = async (path) => {
  const contents = fs.readFileSync(path, { encoding: 'utf-8' });
  const group = regEx.pragma.exec(contents);
  return group && group[1];
};

const getLicenseHeader = () => {
  if (collectedLicenses.size === 0) {
    return '';
  }
  
  if (collectedLicenses.size === 1) {
    return `// SPDX-License-Identifier: ${Array.from(collectedLicenses)[0]}`;
  }
  
  // Multiple licenses - combine with AND
  const licenses = Array.from(collectedLicenses).join(' AND ');
  return `// SPDX-License-Identifier: ${licenses}`;
};

const processFileWithHeader = async (file, fromGithub, root = false) => {
  const content = await processFile(file, fromGithub, root);
  
  if (root) {
    // Add license and pragma at the top for root file
    let header = '';
    
    const license = getLicenseHeader();
    if (license) {
      header += license + '\n';
    }
    
    if (pragmaVersion) {
      header += pragmaVersion + '\n\n';
    }
    
    return header + content;
  }
  
  return content;
};

module.exports.processFile = processFileWithHeader;
module.exports.getPragma = getPragma;