import { createServer } from "node:http";
import { open, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { demoSnapshot } from "./demo.ts";

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
]);

const securityHeaders = (contentType: string) => ({
  "content-type": contentType,
  "cache-control": "no-store",
  "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
});

function json(response: import("node:http").ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, securityHeaders("application/json; charset=utf-8"));
  response.end(JSON.stringify(payload));
}

async function readReview(directory:string){
  let state:any=null;
  try{state=JSON.parse(await readFile(path.join(directory,'state-dry.json'),'utf8'));}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const files=(await readdir(directory).catch(()=>[])).filter(name=>/^events-\d{4}-\d{2}-\d{2}\.jsonl$/.test(name)).sort().slice(-2);
  const events:any[]=[];
  for(const filename of files){
    const handle=await open(path.join(directory,filename),'r');
    try{
      const {size}=await handle.stat();const offset=Math.max(0,size-512_000);const buffer=Buffer.alloc(size-offset);
      await handle.read(buffer,0,buffer.length,offset);
      const lines=buffer.toString('utf8').split('\n');if(offset)lines.shift();
      for(const line of lines){try{
        const row=JSON.parse(line);if(row.mode!=='dry')continue;
        events.push({at:row.at,type:row.type,windowId:row.windowId,code:row.code,
          decision:row.decision?.decision,risk:row.risk?.code,filled:row.fill?.filled});
      }catch{/* An append may leave a partial last line. */}}
    }finally{await handle.close();}
  }
  return {mode:'dry',ordersSent:0,hasRun:state!==null,day:state?.day??null,
    dailyPnlUsd:(state?.dailyPnlCents??0)/100,settledPnlUsd:(state?.settledPnlCents??0)/100,
    windowsDecided:state?.decidedWindows?.length??0,openReservations:Object.keys(state?.openReservations??{}).length,
    permanentStop:state?.permanentStop??false,dailyStop:state?.dailyStop??false,events:events.slice(-30)};
}

export function buildUiServer(dataDirectory=path.join(PUBLIC,'../../../data')) {
  return createServer(async (request, response) => {
    const route = new URL(request.url ?? "/", "http://localhost").pathname;
    try {
      if (request.method !== "GET") return json(response, 405, { error: "METHOD_NOT_ALLOWED" });
      if (route === "/api/status") return json(response, 200, {
        product: "Kalshi BTC 15M",
        mode: "dry_run_review",
        series: "KXBTC15M",
        strategy: "default",
        timeZone: "America/Lima",
        liveExecution: false,
        automaticOrders: false,
      });
      if (route === "/api/demo") return json(response, 200, demoSnapshot());
      if (route === '/api/review')return json(response,200,await readReview(dataDirectory));
      const asset = FILES.get(route);
      if (!asset) return json(response, 404, { error: "NOT_FOUND" });
      const [filename, contentType] = asset;
      const body = await readFile(path.join(PUBLIC, filename));
      response.writeHead(200, securityHeaders(contentType));
      response.end(body);
    } catch {
      json(response, 500, { error: "INTERNAL_ERROR", message: "Could not complete the request." });
    }
  });
}

export function startUiServer() {
  const host = "127.0.0.1";
  const port = Number(process.env.KALSHI_BOT_UI_PORT || 8770);
  return buildUiServer().listen(port, host, () => console.log(`Kalshi BTC 15M available at http://${host}:${port}`));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) startUiServer();
