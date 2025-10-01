"use strict";

const url = process.env.REDIS_URL || "redis://localhost:6379";

module.exports = {
  port: Number(process.env.PORT || 3000),
  redis: { url },
  queueName: process.env.QUEUE_NAME || "compile",
  removeOnComplete: Number(process.env.REMOVE_ON_COMPLETE || 1000),
  removeOnFail: Number(process.env.REMOVE_ON_FAIL || 1000),
  jobTTLms: Number(process.env.JOB_TTL_MS || 10 * 60 * 1000),
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 1),
  requestLimitPerMin: Number(process.env.RATE_LIMIT_PER_MIN || 60)
};

