import { readFile, realpath } from "node:fs/promises";
import { createPrivateKey } from 'node:crypto';
import os from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

import type { BotConfig } from "./types.ts";

const REQUIRED = ["PREDICTEFY_API_KEY", "KALSHI_API_KEY_ID", "KALSHI_PRIVATE_KEY_PATH"] as const;
const APP_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function insideProject(candidate: string, projectRoot:string): boolean {
  const relative = path.relative(projectRoot, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function defaultEnvPath(): string {
  const home = process.env.USERPROFILE || os.homedir();
  return path.join(home, "Documents", "prediction-market-secrets", ".env");
}

export async function loadExternalConfig(envFile = process.env.KALSHI_BOT_ENV_FILE || defaultEnvPath()): Promise<BotConfig> {
  const resolvedEnv = path.resolve(envFile);
  const projectRoot=await realpath(path.resolve(APP_ROOT,'../..'));
  if(insideProject(await realpath(resolvedEnv),projectRoot))throw new Error('The .env file must be outside the repository.');
  const parsed = parseEnv(await readFile(resolvedEnv, "utf8"));
  for (const name of REQUIRED) {
    if (!parsed[name]?.trim()) throw new Error(`Missing ${name} in the external configuration file.`);
  }
  const privateKeyPath = await realpath(path.resolve(path.dirname(resolvedEnv),parsed.KALSHI_PRIVATE_KEY_PATH));
  if (insideProject(privateKeyPath,projectRoot)) {
    throw new Error("The .env and PEM files must be outside the repository.");
  }
  const privateKeyPem = await readFile(privateKeyPath, "utf8");
  try{
    if(createPrivateKey(privateKeyPem).asymmetricKeyType!=='rsa')throw new Error('rsa');
  }catch{throw new Error('The Kalshi PEM file must contain a valid RSA private key.');}
  return {
    envFile: resolvedEnv,
    predictefyApiKey: parsed.PREDICTEFY_API_KEY.trim(),
    kalshiApiKeyId: parsed.KALSHI_API_KEY_ID.trim(),
    kalshiPrivateKeyPath: privateKeyPath,
    kalshiPrivateKeyPem: privateKeyPem,
    timeZone: "America/Lima",
    snapshotMinute: 5,
    limits: { minStakeUsd: 1, maxStakeUsd: 2, dailyLossLimitUsd: 3, balanceFloorUsd: 4 },
    model: "gpt-6-sol",
    reasoningEffort: "medium",
  };
}

export function publicConfig(config: BotConfig) {
  return {
    envFile: config.envFile,
    privateKeyPath: config.kalshiPrivateKeyPath,
    credentialsPresent: true,
    timeZone: config.timeZone,
    snapshotMinute: config.snapshotMinute,
    limits: config.limits,
    model: config.model,
    reasoningEffort: config.reasoningEffort,
  };
}
