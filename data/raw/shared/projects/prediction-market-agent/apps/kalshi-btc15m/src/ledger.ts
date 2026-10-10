import { appendFile, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import type { Decision } from './types.ts';

export type Reservation = {
  windowId: string;
  clientOrderId: string;
  worstCaseCents: number;
  ticker?: string;
  direction?: "UP" | "DOWN";
  contracts?: number;
  filled?: number;
  fillPrice?: number | null;
  feeCents?: number;
  costCents?: number;
  orderId?: string;
  status?: "reserved" | "submitted" | "unknown" | "simulated";
};
type LedgerState = {
  version: 1;
  mode: "dry" | "live";
  day: string;
  dailyPnlCents: number;
  permanentStop: boolean;
  permanentStopReason?: string;
  openReservations: Record<string, Reservation>;
  settledPnlCents: number;
  tradedWindows: string[];
  decidedWindows: string[];
  recentCalls: Decision[];
  dryInitialBalanceUsd: number | null;
  dailyStop: boolean;
};

function dayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export class Ledger {
  private directory: string;
  private mode: "dry" | "live";
  private clock: () => Date;
  private timeZone: string;

  constructor(
    directory: string,
    mode: "dry" | "live",
    clock: () => Date = () => new Date(),
    timeZone = "America/Lima",
  ) {
    this.directory = directory;
    this.mode = mode;
    this.clock = clock;
    this.timeZone = timeZone;
  }

  private statePath(): string {
    return path.join(this.directory, `state-${this.mode}.json`);
  }

  async readState(): Promise<LedgerState> {
    const today = dayKey(this.clock(), this.timeZone);
    try {
      const state = JSON.parse(await readFile(this.statePath(), "utf8")) as Partial<LedgerState>;
      if (state.version !== 1 || state.mode !== this.mode || !Number.isSafeInteger(state.settledPnlCents) ||
          !Number.isSafeInteger(state.dailyPnlCents)||typeof state.permanentStop!=='boolean'||
          !state.openReservations || Array.isArray(state.openReservations)||!Array.isArray(state.tradedWindows)) throw new Error('Invalid ledger: stop and review the state.');
      for(const reservation of Object.values(state.openReservations)){
        if(!reservation||!Number.isSafeInteger(reservation.worstCaseCents)||reservation.worstCaseCents<0||
          !reservation.windowId||!reservation.clientOrderId)throw new Error('Invalid reservation: stop and review the state.');
        for(const field of ['filled','contracts','costCents','feeCents'] as const){
          const n=reservation[field];if(n!==undefined&&(!Number.isSafeInteger(n)||n<0))throw new Error('Invalid reservation.');
        }
      }
      if(state.dryInitialBalanceUsd!==undefined&&state.dryInitialBalanceUsd!==null&&
        (!Number.isFinite(state.dryInitialBalanceUsd)||state.dryInitialBalanceUsd<0))throw new Error('Invalid dry-run balance.');
      if(state.decidedWindows!==undefined&&!Array.isArray(state.decidedWindows))throw new Error('Invalid window records.');
      if(state.recentCalls!==undefined&&!Array.isArray(state.recentCalls))throw new Error('Invalid decision records.');
      const normalized: LedgerState = {
        version: 1,
        mode: this.mode,
        day: state.day ?? today,
        dailyPnlCents: state.dailyPnlCents ?? 0,
        permanentStop: state.permanentStop ?? false,
        permanentStopReason: state.permanentStopReason,
        openReservations: state.openReservations ?? {},
        settledPnlCents: state.settledPnlCents ?? 0,
        tradedWindows: state.tradedWindows ?? [],
        decidedWindows: state.decidedWindows ?? state.tradedWindows ?? [],
        recentCalls: state.recentCalls ?? [],
        dryInitialBalanceUsd: state.dryInitialBalanceUsd ?? null,
        dailyStop: state.dailyStop ?? false,
      };
      if (normalized.day !== today) {
        normalized.day = today;
        normalized.dailyPnlCents = 0;
        normalized.dailyStop = false;
        await this.writeState(normalized);
      }
      return normalized;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return {
        version: 1, mode: this.mode, day: today, dailyPnlCents: 0,
        permanentStop: false, openReservations: {}, settledPnlCents: 0, tradedWindows: [],
        decidedWindows: [], recentCalls: [], dryInitialBalanceUsd: null, dailyStop:false,
      };
    }
  }

  private async writeState(state: LedgerState): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const temporary = this.statePath() + ".tmp";
    const handle = await open(temporary,'w',0o600);
    try { await handle.writeFile(JSON.stringify(state,null,2)+'\n'); await handle.sync(); }
    finally { await handle.close(); }
    await rename(temporary, this.statePath());
  }

  async event(type: string, data: Record<string, unknown>): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const now = this.clock();
    const file = path.join(this.directory, `events-${dayKey(now, this.timeZone)}.jsonl`);
    await appendFile(file, JSON.stringify({ at: now.toISOString(), mode: this.mode, type, ...data }) + "\n", { mode: 0o600 });
  }

  async reserve(reservation: Reservation): Promise<void> {
    const state = await this.readState();
    if (state.openReservations[reservation.windowId] || state.tradedWindows.includes(reservation.windowId)) {
      throw new Error("This window already has a recorded reservation or trade.");
    }
    state.openReservations[reservation.windowId] = reservation;
    state.tradedWindows.push(reservation.windowId);
    await this.writeState(state);
    await this.event("ORDER_RESERVED", reservation);
  }

  async record(type: string, data: Record<string, unknown>): Promise<void> {
    await this.event(type, data);
  }

  async updateReservation(windowId: string, update: Partial<Reservation>): Promise<void> {
    const state = await this.readState();
    const current = state.openReservations[windowId];
    if (!current) throw new Error("No reservation exists for this window.");
    state.openReservations[windowId] = { ...current, ...update };
    await this.writeState(state);
    await this.event("RESERVATION_UPDATED", { windowId, ...update });
  }

  async release(windowId: string, reason: string): Promise<void> {
    const state = await this.readState();
    delete state.openReservations[windowId];
    await this.writeState(state);
    await this.event("RESERVATION_RELEASED", { windowId, reason });
  }

  async settle(windowId: string, pnlCents: number, result: "yes" | "no"): Promise<void> {
    if(!Number.isSafeInteger(pnlCents))throw new Error('Invalid PnL.');
    const state = await this.readState();
    if (!state.openReservations[windowId]) return;
    delete state.openReservations[windowId];
    state.settledPnlCents += Math.trunc(pnlCents);
    state.dailyPnlCents += Math.trunc(pnlCents);
    await this.writeState(state);
    await this.event("WINDOW_SETTLED", { windowId, pnlCents: Math.trunc(pnlCents), result });
  }

  async latchPermanentStop(reason: string): Promise<void> {
    const state = await this.readState();
    state.permanentStop = true;
    state.permanentStopReason = reason;
    await this.writeState(state);
    await this.event("PERMANENT_STOP", { reason });
  }

  async claimWindow(windowId:string): Promise<boolean> {
    const state=await this.readState();
    if(state.decidedWindows.includes(windowId)) return false;
    state.decidedWindows.push(windowId);
    await this.writeState(state);
    await this.event('WINDOW_CLAIMED',{windowId});
    return true;
  }

  async rememberDecision(decision:Decision):Promise<void> {
    const state=await this.readState();state.recentCalls=[...state.recentCalls,decision].slice(-5);
    await this.writeState(state);
  }

  async initializeDryBalance(balanceUsd:number):Promise<void> {
    if(this.mode!=='dry'|| !Number.isFinite(balanceUsd)||balanceUsd<0) throw new Error('Invalid dry-run balance.');
    const state=await this.readState();
    if(state.dryInitialBalanceUsd===null){state.dryInitialBalanceUsd=balanceUsd;await this.writeState(state);}
  }

  async latchDailyStop():Promise<void> {
    const state=await this.readState();state.dailyStop=true;await this.writeState(state);
  }

  async acquireLock():Promise<void> {
    await mkdir(this.directory,{recursive:true});
    const file=path.join(this.directory,'.bot.lock');
    try {
      const handle=await open(file,'wx',0o600);
      try {await handle.writeFile(String(process.pid));await handle.sync();}finally{await handle.close();}
    } catch(error) {
      if((error as NodeJS.ErrnoException).code!=='EEXIST') throw error;
      const pid=Number(await readFile(file,'utf8'));
      if(!Number.isSafeInteger(pid)||pid<=0) throw new Error('Another process or an invalid lock was detected: review .bot.lock.');
      try {process.kill(pid,0);throw new Error('Another bot process is already running.');}
      catch(check){
        if((check as NodeJS.ErrnoException).code!=='ESRCH')throw check;
        await unlink(file);await this.acquireLock();
      }
    }
  }

  async releaseLock():Promise<void> {
    const file=path.join(this.directory,'.bot.lock');
    if(await readFile(file,'utf8').catch(()=>null)===String(process.pid))await unlink(file);
  }
}
