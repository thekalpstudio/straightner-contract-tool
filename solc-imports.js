"use strict";

const fs = require("fs");
const path = require("path");
const solc = require("solc");

function resolveImport(baseDir, importPath) {
  // Absolute or relative
  if (importPath.startsWith("/") || importPath.startsWith("./") || importPath.startsWith("../")) {
    const p = path.resolve(baseDir, importPath);
    if (fs.existsSync(p)) return p;
  }
  // Node modules
  try {
    const p = require.resolve(importPath, { paths: [baseDir] });
    return p;
  } catch {}
  // Try joining under node_modules as a fallback
  const nm = path.join(process.cwd(), "node_modules", importPath);
  if (fs.existsSync(nm)) return nm;
  return null;
}

function makeImporter(rootDir) {
  return (importPath) => {
    const p = resolveImport(rootDir, importPath);
    if (!p) {
      return { error: "File not found" };
    }
    try {
      const contents = fs.readFileSync(p, "utf8");
      return { contents };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  };
}

function extractContracts(output) {
  const result = {};
  for (const file of Object.keys(output.contracts || {})) {
    const fileContracts = output.contracts[file] || {};
    for (const name of Object.keys(fileContracts)) {
      const c = fileContracts[name];
      if (!c?.evm?.bytecode?.object) continue;
      result[name] = {
        bytecode: "0x" + c.evm.bytecode.object,
        deployedBytecode: "0x" + (c.evm.deployedBytecode?.object || ""),
        abi: c.abi,
        metadata: c.metadata,
        gasEstimates: c.evm?.gasEstimates,
        sourceName: file,
        contractName: name,
      };
    }
  }
  return result;
}

function buildInput(entryPath, optimizer = { enabled: true, runs: 200 }, evmVersion) {
  const absEntry = path.isAbsolute(entryPath) ? entryPath : path.resolve(entryPath);
  return {
    language: "Solidity",
    sources: {
      [path.basename(absEntry)]: { urls: [absEntry] }
    },
    settings: {
      optimizer,
      evmVersion,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata", "evm.gasEstimates"]
        }
      }
    }
  };
}

function compileWithImports(entryPath, options = {}) {
  const absEntry = path.isAbsolute(entryPath) ? entryPath : path.resolve(entryPath);
  const rootDir = path.dirname(absEntry);
  const importer = makeImporter(rootDir);
  const input = buildInput(absEntry, options.optimizer, options.evmVersion);
  const outputJSON = solc.compile(JSON.stringify(input), { import: importer });
  const output = JSON.parse(outputJSON);
  return output;
}

module.exports = { compileWithImports, extractContracts };
