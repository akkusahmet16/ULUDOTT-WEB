import { NextResponse } from "next/server";
import { searchSozlukTopics } from "../../../../modules/sozluk/application/sozluk-service.ts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return NextResponse.json({ topics: [] });
  }
  const topics = await searchSozlukTopics(query);
  return NextResponse.json({ topics });
}
