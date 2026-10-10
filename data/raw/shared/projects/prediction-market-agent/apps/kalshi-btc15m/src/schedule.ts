export type RunOptions = {
  command: "balance" | "check" | "bot" | "ui";
  live: boolean;
  testOrder: "auto" | "up" | "down" | null;
  windows: number | null;
};

export function snapshotAt(openTime: string, minute: number): Date {
  const open = new Date(openTime);
  if (!Number.isFinite(open.getTime())) throw new Error("open_time is invalid.");
  return new Date(open.getTime() + minute * 60_000);
}

export function parseRunOptions(argv: string[]): RunOptions {
  const copy = [...argv];
  const first = copy[0];
  const command = first && !first.startsWith("--") ? copy.shift() : "bot";
  if (!["balance", "check", "bot", "ui"].includes(command ?? "")) throw new Error("Invalid command.");
  let live = false;
  let testOrder: RunOptions["testOrder"] = null;
  let windows: number | null = null;
  for (const value of copy) {
    if (value === "--live") live = true;
    else if (value === "--test-order") testOrder = "auto";
    else if (value === "--test-order=up") testOrder = "up";
    else if (value === "--test-order=down") testOrder = "down";
    else if (value.startsWith("--windows=")) {
      windows = Number(value.slice(10));
      if (!Number.isInteger(windows) || windows < 1) throw new Error("--windows must be a positive integer.");
    } else throw new Error(`Unrecognized argument: ${value}`);
  }
  if (testOrder && !live) throw new Error("--test-order requires --live and LIVE confirmation.");
  if (live && command !== "bot") throw new Error("--live can only be used with bot.");
  return { command: command as RunOptions["command"], live, testOrder, windows };
}
