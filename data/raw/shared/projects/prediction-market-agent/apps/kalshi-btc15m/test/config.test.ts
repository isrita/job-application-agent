import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { generateKeyPairSync } from 'node:crypto';

import { loadExternalConfig, publicConfig } from "../src/config.ts";

test("loads secrets from an external env without mutating process.env or exposing them", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kxbtc-config-"));
  const pemPath = path.join(dir, "kalshi.pem");
  const envPath = path.join(dir, ".env");
  const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  await writeFile(pemPath, privateKey.export({format:'pem',type:'pkcs8'}));
  await writeFile(envPath, [
    "PREDICTEFY_API_KEY=pred-test-secret",
    "KALSHI_API_KEY_ID=key-test-secret",
    `KALSHI_PRIVATE_KEY_PATH=${pemPath}`,
  ].join("\n"));
  const before = process.env.PREDICTEFY_API_KEY;
  const config = await loadExternalConfig(envPath);
  assert.equal(config.kalshiPrivateKeyPem.includes("PRIVATE KEY"), true);
  assert.equal(process.env.PREDICTEFY_API_KEY, before);
  assert.equal(JSON.stringify(publicConfig(config)).includes("secret"), false);
});

test('rejects malformed PEM even when it has a PRIVATE KEY header',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'kx-invalid-'));
  const key=path.join(dir,'bad.pem');const env=path.join(dir,'.env');
  await writeFile(key,'-----BEGIN PRIVATE KEY-----\nINVALID\n-----END PRIVATE KEY-----');
  await writeFile(env,`PREDICTEFY_API_KEY=test\nKALSHI_API_KEY_ID=test\nKALSHI_PRIVATE_KEY_PATH=${key}`);
  await assert.rejects(loadExternalConfig(env),/PEM/);
});
