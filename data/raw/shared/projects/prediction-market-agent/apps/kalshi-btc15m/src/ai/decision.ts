import type { Decision } from "../types.ts";
import path from 'node:path';
import { existsSync } from 'node:fs';

export function validateDecision(value: unknown): Decision {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The decision must be a JSON object.");
  const row = value as Record<string, unknown>;
  const expected = ["confidence", "decision", "limit", "reason", "stake"];
  if (Object.keys(row).sort().join(",") !== expected.join(",")) throw new Error("The decision contains unexpected or missing fields.");
  if (!["UP", "DOWN", "SKIP"].includes(String(row.decision))) throw new Error("decision is invalid.");
  if (![row.stake, row.limit, row.confidence].every((item) => typeof item === "number" && Number.isFinite(item))) throw new Error("Numeric values are invalid.");
  if ((row.confidence as number) < 0 || (row.confidence as number) > 1) throw new Error("confidence must be between 0 and 1.");
  if (typeof row.reason !== "string" || row.reason.length < 1 || row.reason.length > 200) throw new Error("reason must contain between 1 and 200 characters.");
  if (row.decision === "SKIP") {
    if (row.stake !== 0 || row.limit !== 0) throw new Error("SKIP requires stake and limit to be zero.");
  } else if ((row.stake as number) <= 0 || (row.limit as number) < 0.01 || (row.limit as number) > 0.99) {
    throw new Error("UP/DOWN requires a positive stake and a limit between 0.01 and 0.99.");
  }
  return row as Decision;
}

export function sanitizedChildEnv(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(source).filter(([name]) =>
    !/^(PREDICTEFY_|KALSHI_)/i.test(name),
  ));
}

export function resolveCodexExecutable(env:NodeJS.ProcessEnv=process.env):string {
  if(process.platform!=='win32')return 'codex';
  const vendor=path.join(env.APPDATA??'', 'npm','node_modules','@openai','codex','node_modules','@openai','codex-win32-x64','vendor','x86_64-pc-windows-msvc','bin','codex.exe');
  const candidates=[...(env.PATH??env.Path??'').split(path.delimiter).filter(Boolean).map(p=>path.join(p,'codex.exe')),vendor];
  const executable=candidates.find(p=>existsSync(p));
  if(!executable)throw new Error('Native codex.exe was not found. Install Codex CLI before running the dry run.');
  return executable;
}

export function buildCodexInvocation(prompt: string, answerFile: string, env: NodeJS.ProcessEnv = process.env, appRoot=process.cwd()) {
  return {
    command: "codex",
    args: [
      "exec", "--ignore-user-config", "--ignore-rules", "--ephemeral", "--json", "-m", "gpt-6-sol",
      "-c", 'model_reasoning_effort="medium"',
      "-c", 'model_reasoning_summary="concise"',
      "-c", 'web_search="disabled"',
      ...['shell_tool','apps','plugins','browser_use','computer_use','code_mode_host','multi_agent','hooks','image_generation','sleep_tool','skill_search','workspace_dependencies'].flatMap(name=>['--disable',name]),
      "-s", "read-only",
      "--skip-git-repo-check",
      "-C", path.join(appRoot,'agent'),
      "--output-schema", path.join(appRoot,'agent','decision.schema.json'),
      "-o", path.resolve(answerFile),
      prompt,
    ],
    env: sanitizedChildEnv(env),
    shell: false as const,
  };
}
