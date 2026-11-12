import { NextResponse } from "next/server";
import {
  getSozlukAuthorFromCookies,
  sozlukErrorResponse,
} from "../../../../../../modules/sozluk/application/sozluk-http.ts";
import { voteSozlukEntry } from "../../../../../../modules/sozluk/application/sozluk-service.ts";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const author = await getSozlukAuthorFromCookies();
  if (!author) {
    return NextResponse.json(
      { error: "Oy vermek için yazar girişi yapmalısınız." },
      { status: 401 },
    );
  }
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { value?: number };
    const result = await voteSozlukEntry(author, id, Number(body.value ?? 0));
    return NextResponse.json(result);
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}
