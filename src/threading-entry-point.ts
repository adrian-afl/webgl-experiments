import { runThread } from "./util/nodeThreading.ts";

async function test(delay: number, message: string): Promise<string> {
  await new Promise((res) => setInterval(res, delay));
  return message + delay.toString();
}

async function main() {
  void runThread(() => test(1000, "dupaA")).then((x) => {
    console.log(x);
  });
  void runThread(() => test(2000, "dupaB")).then((x) => {
    console.log(x);
  });
  void runThread(() => test(3000, "dupaC")).then((x) => {
    console.log(x);
  });
  void runThread(() => test(4000, "dupaD")).then((x) => {
    console.log(x);
  });
  void runThread(() => test(5000, "dupaE")).then((x) => {
    console.log(x);
  });
}

main();
