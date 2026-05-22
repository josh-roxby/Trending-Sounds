import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily snapshot cron — full implementation TODO (TODO.md section D).
// For now: auth-checks the bearer, no-ops, and returns the placeholder body
// so Vercel Cron health checks pass once the schedule is enabled.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    note: "cron handler stub — implementation pending (see TODO.md D-1..D-5)",
    phases: { chart_pull: "pending", song_snapshots: "pending", account_snapshots: "pending" },
  });
}

export async function POST(request: Request) {
  return GET(request);
}
