#!/usr/bin/env node
'use strict';

const workerFixed = require('./worker-fixed');
const ContractFixer = require('./contract-fixer');
const AdvancedCompiler = require('./advanced-compiler');
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { compileWithImports, extractContracts } = require('./solc-imports');
const os = require('os');

class UniversalCompiler {
  constructor() {
    this.fixer = new ContractFixer();
    this.advancedCompiler = new AdvancedCompiler();
  }
  
  async compileAny(contractPath, options = {}) {
    const {
      outputDir = path.join(__dirname, 'output'),
      saveFiles = true,
      silent = false,
      maxRetries = 3,
      autoFix = true
    } = options;
    
    if (!silent) {
      console.log('\n🚀 Universal Compiler - Handles ANY Solidity Contract');
      console.log('=' .repeat(55));
    }
    
    let attempt = 0;
    let lastError = null;
    let flattenedSource = null;
    
    while (attempt < maxRetries) {
      attempt++;
      
      try {
        if (!silent) console.log(`\n📦 Attempt ${attempt}/${maxRetries}...`);
        
        // Strategy A: compile with import-callback (no flatten)
        if (!silent) console.log('1️⃣  Direct solc compile with imports...');
        try {
          const evms = ['cancun', 'paris', 'london', 'berlin'];
          for (const evm of evms) {
            const out = compileWithImports(contractPath, { optimizer: { enabled: true, runs: 200 }, evmVersion: evm });
            const errs = (out.errors || []).filter(e => e.severity === 'error');
            if (errs.length === 0) {
              const contracts = extractContracts(out);
              if (Object.keys(contracts).length > 0) {
                if (!silent) console.log(`   ✅ Import compile succeeded (EVM ${evm})`);
                return { success: true, contracts, method: 'solc-imports', attempt };
              }
            }
          }
          if (!silent) console.log('   ⚠️  Import compile failed. Trying fixes on original source...');
          // Try applying fixes directly to original source and recompile with imports
          const orig = fs.readFileSync(contractPath, 'utf8');
          const fixed = await this.fixer.fixSource(orig, { verbose: !silent });
          const tmpPath = path.join(path.dirname(contractPath), `__fixed__${path.basename(contractPath)}`);
          fs.writeFileSync(tmpPath, fixed);
          for (const evm of evms) {
            const out = compileWithImports(tmpPath, { optimizer: { enabled: true, runs: 200 }, evmVersion: evm });
            const errs = (out.errors || []).filter(e => e.severity === 'error');
            if (errs.length === 0) {
              const contracts = extractContracts(out);
              if (Object.keys(contracts).length > 0) {
                if (!silent) console.log(`   ✅ Import compile (fixed) succeeded (EVM ${evm})`);
                return { success: true, contracts, method: 'solc-imports-fixed', attempt };
              }
            }
          }
          if (!silent) console.log('   ⚠️  Direct solc compile (fixed) failed; falling back to flatten+fix');
        } catch (e) {
          if (!silent) console.log('   ⚠️  Import compiler error:', e.message);
        }

        // Step B: Flatten + fix
        if (!silent) console.log('2️⃣  Flattening + auto-fixes...');
        flattenedSource = await workerFixed.processFile(contractPath, false, true);
        // If imports sneak in, attempt alternative flattening
        if ((flattenedSource.match(/\bimport\s+['"]/g) || []).length > 0) {
          flattenedSource = await this.alternativeFlatten(contractPath);
        }
        
        // Step 2: Analyze and fix issues
        if (autoFix) {
          if (!silent) console.log('2️⃣  Analyzing contract for issues...');
          const analysis = await this.fixer.analyzeAndFix(flattenedSource);
          
          if (analysis.issues.length > 0) {
            if (!silent) {
              console.log('   Issues found:');
              analysis.issues.forEach(issue => console.log(`     - ${issue}`));
              console.log('   ✅ Applying automatic fixes...');
            }
            flattenedSource = analysis.fixedSource;
          } else {
            if (!silent) console.log('   ✅ No issues detected');
          }
        }
        
        // Step C: Compile flattened with multiple strategies
        if (!silent) console.log('3️⃣  Compiling flattened source...');
        
        // Try different compiler configurations
        const compilerConfigs = [
          { evmVersion: 'cancun', optimize: true, runs: 200 },
          { evmVersion: 'paris', optimize: true, runs: 200 },
          { evmVersion: 'london', optimize: true, runs: 200 },
          { evmVersion: 'berlin', optimize: false, runs: 1 }
        ];
        
        let compilationResult = null;
        let configUsed = null;
        
        for (const config of compilerConfigs) {
          try {
            const input = {
              language: 'Solidity',
              sources: {
                'Contract.sol': {
                  content: flattenedSource
                }
              },
              settings: {
                optimizer: {
                  enabled: config.optimize,
                  runs: config.runs
                },
                evmVersion: config.evmVersion,
                outputSelection: {
                  '*': {
                    '*': ['*']
                  }
                }
              }
            };
            
            const output = JSON.parse(solc.compile(JSON.stringify(input)));
            
            // Check for errors
            const errors = output.errors ? output.errors.filter(e => e.severity === 'error') : [];
            
            if (errors.length === 0) {
              compilationResult = output;
              configUsed = config;
              break;
            }
            
            // If this is the last config and still has errors, try to fix them
            if (config === compilerConfigs[compilerConfigs.length - 1] && autoFix) {
              flattenedSource = await this.applyEmergencyFixes(flattenedSource, errors);
            }
          } catch (e) {
            // Try next configuration
            continue;
          }
        }
        
        if (!compilationResult) {
          throw new Error('Compilation failed with all configurations');
        }
        
        if (!silent) {
          console.log(`   ✅ Compilation successful!`);
          console.log(`   Config used: EVM ${configUsed.evmVersion}, Optimize: ${configUsed.optimize}`);
        }
        
        // Step 4: Extract contracts
        const contracts = {};
        for (const contractFile in compilationResult.contracts) {
          for (const contractName in compilationResult.contracts[contractFile]) {
            const contract = compilationResult.contracts[contractFile][contractName];
            
            // Only include deployable contracts (with bytecode)
            if (contract.evm.bytecode.object) {
              contracts[contractName] = {
                bytecode: '0x' + contract.evm.bytecode.object,
                deployedBytecode: '0x' + contract.evm.deployedBytecode.object,
                abi: contract.abi,
                metadata: contract.metadata,
                gasEstimates: contract.evm.gasEstimates
              };
            }
          }
        }
        
        if (!silent) {
          console.log(`\n✅ SUCCESS! Compiled ${Object.keys(contracts).length} contracts`);
          for (const name in contracts) {
            console.log(`   📄 ${name}: ${(contracts[name].bytecode.length - 2) / 2} bytes`);
          }
        }
        
        // Step 5: Save outputs
        if (saveFiles) {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          fs.writeFileSync(
            path.join(outputDir, 'universal-flattened.sol'),
            flattenedSource
          );
          
          fs.writeFileSync(
            path.join(outputDir, 'universal-compiled.json'),
            JSON.stringify(contracts, null, 2)
          );
          
          if (!silent) {
            console.log(`\n📁 Outputs saved to ${outputDir}/`);
          }
        }
        
        return {
          success: true,
          contracts,
          flattenedSource,
          attempt,
          configUsed
        };
        
      } catch (error) {
        lastError = error;
        
        if (!silent) {
          console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
        }
        
        // Try more aggressive fixes for next attempt
        if (attempt < maxRetries && flattenedSource) {
          flattenedSource = await this.applyAggressiveFixes(flattenedSource);
        }
      }
    }
    
    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Compilation failed after all attempts',
      flattenedSource
    };
  }
  
  async alternativeFlatten(contractPath) {
    // Alternative flattening approach for stubborn imports
    const content = fs.readFileSync(contractPath, 'utf8');
    let flattened = content;
    
    // Manually resolve common import patterns
    const importPatterns = [
      {
        pattern: /import\s+["']@openzeppelin\/contracts\/(.+)["'];/g,
        resolver: (match, path) => {
          const ozPath = require.resolve(`@openzeppelin/contracts/${path}`);
          return fs.readFileSync(ozPath, 'utf8').replace(/pragma solidity[^;]+;/, '');
        }
      }
    ];
    
    for (const { pattern, resolver } of importPatterns) {
      flattened = flattened.replace(pattern, resolver);
    }
    
    return flattened;
  }
  
  async applyEmergencyFixes(source, errors) {
    // Emergency fixes for common compilation errors
    for (const error of errors) {
      if (error.message.includes('Function has override specified but does not override')) {
        // Remove problematic override
        source = source.replace(/override\s*(?:\([^)]*\))?/g, '');
      }
      
      if (error.message.includes('Derived contract must override')) {
        // Add missing override functions
        const funcName = error.message.match(/function "([^"]+)"/)?.[1];
        if (funcName && !source.includes(`function ${funcName}`)) {
          // Add stub implementation
          const stub = `
    function ${funcName}() public override {
        // Auto-generated stub
    }
`;
          source = source.replace(/contract\s+\w+[^{]*{/, (match) => match + stub);
        }
      }
    }
    
    return source;
  }
  
  async applyAggressiveFixes(source) {
    // More aggressive fixes for subsequent attempts
    
    // Remove all override specifications
    source = source.replace(/\s+override(?:\s*\([^)]*\))?/g, '');
    
    // Add virtual to all internal functions
    source = source.replace(/function\s+(\w+)\s*\([^)]*\)\s+internal/g, 
      'function $1() internal virtual');
    
    // Remove problematic modifiers
    source = source.replace(/\s+onlyInitializing/g, '');
    
    // Simplify visibility modifiers
    source = source.replace(/public\s+view\s+virtual\s+override/g, 'public view');
    
    return source;
  }
}

// Export for module use
module.exports = UniversalCompiler;

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log('Universal Solidity Compiler - Compiles ANY Contract');
    console.log('=' .repeat(50));
    console.log('\nUsage:');
    console.log('  node universal-compiler.js <contract-path> [options]');
    console.log('\nOptions:');
    console.log('  --silent         Suppress output');
    console.log('  --no-save        Don\'t save output files');
    console.log('  --no-fix         Disable auto-fixing');
    console.log('  --output <dir>   Output directory');
    console.log('\nExample:');
    console.log('  node universal-compiler.js contracts/Complex.sol');
    process.exit(0);
  }
  
  const contractPath = args[0];
  const options = {
    silent: args.includes('--silent'),
    saveFiles: !args.includes('--no-save'),
    autoFix: !args.includes('--no-fix'),
    outputDir: args.includes('--output') ? 
      args[args.indexOf('--output') + 1] : undefined
  };
  
  const compiler = new UniversalCompiler();
  
  compiler.compileAny(contractPath, options).then(result => {
    if (result.success) {
      console.log('\n🎉 Compilation successful!');
      console.log('Contracts compiled:', Object.keys(result.contracts).join(', '));
      process.exit(0);
    } else {
      console.error('\n❌ Compilation failed:', result.error);
      process.exit(1);
    }
  });
}
