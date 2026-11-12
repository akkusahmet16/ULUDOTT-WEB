import { NextResponse } from "next/server";
import { getSozlukRandomSlug } from "../../../../modules/sozluk/application/sozluk-service.ts";

export async function GET() {
  const slug = await getSozlukRandomSlug();
  return NextResponse.json({ slug });
}
