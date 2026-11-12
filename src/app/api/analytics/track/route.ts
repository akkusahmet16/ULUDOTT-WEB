import { NextResponse } from "next/server";
import { recordPageView, recordEvent } from "../../../../modules/admin/application/analytics-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let body: {
      type?: string;
      path?: string;
      eventType?: string;
      eventName?: string;
      metadata?: Record<string, unknown>;
      referer?: string;
      screenWidth?: number;
      durationSeconds?: number;
    } = {};

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json") || contentType.includes("text/plain")) {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } else {
      body = await request.json();
    }

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || undefined;
    const referer = body.referer || request.headers.get("referer") || undefined;

    if (body.type === "event" && body.eventType && body.eventName) {
      await recordEvent({
        eventType: body.eventType,
        eventName: body.eventName,
        path: body.path || "/",
        ip,
        userAgent,
        metadata: body.metadata,
      });
    } else if (body.path) {
      await recordPageView({
        path: body.path,
        ip,
        userAgent,
        referer,
        screenWidth: typeof body.screenWidth === "number" ? body.screenWidth : undefined,
        durationSeconds: typeof body.durationSeconds === "number" ? body.durationSeconds : undefined,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
