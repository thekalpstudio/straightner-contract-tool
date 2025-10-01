// ESM Hardhat config for v3
import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: {
    compilers: [
      { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.8.19", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.8.9",  settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.8.4",  settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.8.0",  settings: { optimizer: { enabled: true, runs: 200 } } }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: { chainId: 1337 }
  }
});
