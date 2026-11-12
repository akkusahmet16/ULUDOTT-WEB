import { NextResponse } from "next/server";
import {
  getSozlukAuthorFromCookies,
  sozlukErrorResponse,
} from "../../../../../../modules/sozluk/application/sozluk-http.ts";
import { reportSozlukEntry } from "../../../../../../modules/sozluk/application/sozluk-service.ts";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const author = await getSozlukAuthorFromCookies();
  if (!author) {
    return NextResponse.json(
      { error: "Şikayet etmek için yazar girişi yapmalısınız." },
      { status: 401 },
    );
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const report = await reportSozlukEntry(author, id, body);
    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}
