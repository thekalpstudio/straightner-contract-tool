"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const workerFixed = require("../worker-fixed");

async function mkTmp(prefix = "hh-sbx-") {
  return await fsp.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function writeFileRecursive(filePath, content) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content);
}

function runHardhatCLI(cwd, args) {
  const cli = path.join(process.cwd(), "node_modules", "hardhat", "dist", "src", "cli.js");
  return execFileSync("node", [cli, ...args], { cwd, stdio: "pipe" });
}

async function collectArtifacts(artifactsDir) {
  const result = {};
  const walk = async (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name.endsWith(".json") && !e.name.includes(".dbg.")) {
        try {
          const artifact = JSON.parse(await fsp.readFile(full, "utf8"));
          const name = artifact.contractName;
          if (!name) continue;
          result[name] = {
            bytecode: artifact.bytecode,
            deployedBytecode: artifact.deployedBytecode,
            abi: artifact.abi,
            contractName: name,
            sourceName: artifact.sourceName,
            networks: {},
            metadata: {
              compiler: artifact.compiler,
              language: "Solidity",
              settings: artifact.compiler?.settings,
            },
          };
        } catch {}
      }
    }
  };
  await walk(artifactsDir);
  return result;
}

async function compileInSandbox({ contractPath, sources, solcVersion = "0.8.20" }) {
  const tmp = await mkTmp();
  try {
    // Minimal ESM project
    await writeFileRecursive(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "hh-sandbox", private: true, type: "module", version: "1.0.0" }, null, 2)
    );

    const hhConfig = `export default {
  solidity: { version: "${solcVersion}", settings: { optimizer: { enabled: true, runs: 200 } } },
  paths: { sources: "./contracts", cache: "./.cache", artifacts: "./.artifacts" }
};
`;
    await writeFileRecursive(path.join(tmp, "hardhat.config.js"), hhConfig);

    // Link node_modules from app so imports like 'hardhat/config' resolve
    try {
      const appNodeModules = path.join(process.cwd(), "node_modules");
      await fsp.symlink(appNodeModules, path.join(tmp, "node_modules"), "dir");
    } catch {}

    const contractsDir = path.join(tmp, "contracts");
    await fsp.mkdir(contractsDir, { recursive: true });

    if (sources && typeof sources === "object") {
      // Write all sources; run fixer on each
      const fixer = new (require("../contract-fixer"))();
      for (const [rel, content] of Object.entries(sources)) {
        let out = content;
        try { out = (await fixer.analyzeAndFix(content)).fixedSource || content; } catch {}
        await writeFileRecursive(path.join(contractsDir, rel), out);
      }
    } else if (contractPath) {
      const projectContracts = path.join(process.cwd(), "contracts");
      const isUnderProjectContracts = contractPath.startsWith(projectContracts + path.sep);
      if (isUnderProjectContracts) {
        // Copy and auto-fix project contracts
        const fixer = new (require("../contract-fixer"))();
        const copyRecursive = async (src, dst) => {
          const stat = await fsp.stat(src);
          if (stat.isDirectory()) {
            await fsp.mkdir(dst, { recursive: true });
            const entries = await fsp.readdir(src, { withFileTypes: true });
            for (const e of entries) {
              await copyRecursive(path.join(src, e.name), path.join(dst, e.name));
            }
          } else if (stat.isFile()) {
            let buf = await fsp.readFile(src, 'utf8');
            try { buf = (await fixer.analyzeAndFix(buf)).fixedSource || buf; } catch {}
            await writeFileRecursive(dst, buf);
          }
        };
        await copyRecursive(projectContracts, contractsDir);
      } else {
        // Fall back to flattening for paths outside project contracts
        let flat = await workerFixed.processFile(contractPath, false, true);
        await writeFileRecursive(path.join(contractsDir, "Contract.sol"), flat);
      }
    } else {
      throw new Error("Either sources or contractPath is required");
    }

    // Compile
    runHardhatCLI(tmp, ["compile", "--quiet", "--config", path.join(tmp, "hardhat.config.js")]);

    const artifacts = await collectArtifacts(path.join(tmp, ".artifacts"));
    return { success: true, contracts: artifacts, method: "hardhat-sandbox" };
  } catch (e) {
    return { success: false, error: e?.message || String(e), method: "hardhat-sandbox" };
  } finally {
    // cleanup best-effort
    try { await fsp.rm(tmp, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { compileInSandbox };
