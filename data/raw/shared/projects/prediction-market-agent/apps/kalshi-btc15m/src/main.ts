import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadExternalConfig, publicConfig } from "./config.ts";
import { runBot, checkOnce, showBalance } from "./run.ts";
import { parseRunOptions } from "./schedule.ts";

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function confirmLive(): Promise<void> {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question("Live mode: type LIVE to continue: ");
    if (answer !== "LIVE") throw new Error("LIVE confirmation was not received; no orders will be sent.");
  } finally {
    prompt.close();
  }
}

async function main(): Promise<void> {
  const options = parseRunOptions(process.argv.slice(2));
  if (options.command === 'ui') {
    const {startUiServer}=await import('./ui/server.ts');startUiServer();return;
  }
  const config = await loadExternalConfig();
  if (options.command === "balance") {
    console.log(JSON.stringify({ config: publicConfig(config), balance: await showBalance(config) }, null, 2));
    return;
  }
  if (options.command === "check") {
    const result = await checkOnce(config, appRoot);
    console.log(result.text);
    console.log("orders_sent=0");
    return;
  }
  if (options.live) await confirmLive();
  await runBot(config, options, appRoot);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exitCode = 1;
});
