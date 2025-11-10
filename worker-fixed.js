'use strict';

// This is a wrapper around the main worker module
// It provides the same functionality but can be used independently
const worker = require('./worker');

module.exports = {
  processFile: worker.processFile,
  getPragma: worker.getPragma,
  compile: worker.compile
};
