import cluster from "node:cluster";
import * as process from "node:process";

//
// const {
//   Worker,
//   isMainThread,
//   parentPort,
//   workerData,
// } = require("node:worker_threads");
//
// if (isMainThread) {
//   module.exports = function parseJSAsync(script) {
//     return new Promise((resolve, reject) => {
//       const worker = new Worker("threading-entry-point.ts", {
//         workerData: script,
//       });
//       worker.on("message", resolve);
//       worker.on("error", reject);
//       worker.on("exit", (code) => {
//         if (code !== 0)
//           reject(new Error(`Worker stopped with exit code ${code}`));
//       });
//     });
//   };
// } else {
//   const { parse } = require("some-js-parsing-library");
//   const script = workerData;
//   parentPort.postMessage(parse(script));
// }

export const runThread = async <T>(fn: () => T | Promise<T>): Promise<T> => {
  const rand = Math.random();
  const promise = Promise.withResolvers<T>();
  if (cluster.isPrimary) {
    const worker = cluster.fork({ RAND_THREAD: rand });
    worker.on("message", (v) => {
      console.log(v);
      if (worker.process.pid === v.pid && rand === v.env) {
        worker.kill(9);
        promise.resolve(v.result as T);
      }
    });
  }
  if (!cluster.isPrimary) {
    const result = await fn();
    process.send({ pid: process.pid, rand: process.env.RAND_THREAD, result });
  }
  return promise.promise;
};
