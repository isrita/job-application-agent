import { spawn } from "node:child_process";
import { mkdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";

import { buildCodexInvocation, resolveCodexExecutable, validateDecision } from "./decision.ts";
import type { Decision } from "../types.ts";

export async function runCodexDecision(snapshot: string, appRoot: string, timeoutMs = 180_000, signal?:AbortSignal): Promise<Decision> {
  signal?.throwIfAborted();
  const temporaryDirectory = path.join(appRoot, "data", ".tmp");
  await mkdir(temporaryDirectory, { recursive: true });
  const answerFile = path.join(temporaryDirectory, `decision-${Date.now()}.json`);
  const prompt = [
    await readFile(path.join(appRoot,'agent','AGENTS.md'),'utf8'),
    "Make exactly one decision from this frozen snapshot. Use no tools.",
    "Return JSON only, matching decision.schema.json.",
    "",
    snapshot,
  ].join("\n");
  const invocation = buildCodexInvocation(prompt, answerFile,process.env,appRoot);
  invocation.command=resolveCodexExecutable();
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(invocation.command, invocation.args, {
        cwd: appRoot,
        env: invocation.env,
        shell: false,
        stdio: ["ignore", "pipe", "ignore"],
        signal,
        windowsHide: true,
      });
      let pending='';let unsafe=false;
      child.stdout?.on('data',chunk=>{
        pending+=chunk.toString();
        if(pending.length>1_000_000){unsafe=true;child.kill();return;}
        const lines=pending.split('\n');pending=lines.pop()??'';
        for(const line of lines){
          try{
            const event=JSON.parse(line);
            if(event.item?.type&&!['agent_message','reasoning'].includes(event.item.type)){unsafe=true;child.kill();}
          }catch{/* CLI non-JSON diagnostics are never copied to logs. */}
        }
      });
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("The AI exceeded the 180-second time limit."));
      }, timeoutMs);
      child.once("error", (error) => { clearTimeout(timer); reject(error); });
      child.once("exit", (code) => {
        clearTimeout(timer);
        if (code === 0&&!unsafe) resolve();
        else reject(new Error('Codex did not produce a valid decision without tools; skipping this window.'));
      });
    });
    return validateDecision(JSON.parse(await readFile(answerFile, "utf8")));
  } finally {
    await unlink(answerFile).catch(() => undefined);
  }
}
