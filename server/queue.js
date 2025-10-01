"use strict";

const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const config = require("./config");

const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

const compileQueue = new Queue(config.queueName, { connection });

async function enqueueCompile(payload, opts = {}) {
  const job = await compileQueue.add(
    "compile",
    payload,
    Object.assign(
      {
        attempts: 2,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: config.removeOnComplete,
        removeOnFail: config.removeOnFail,
        timeout: config.jobTTLms
      },
      opts
    )
  );
  return job.id;
}

module.exports = { compileQueue, enqueueCompile, connection };
