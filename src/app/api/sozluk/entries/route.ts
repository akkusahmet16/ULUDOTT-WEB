import { NextResponse } from "next/server";
import {
  getSozlukAuthorFromCookies,
  sozlukErrorResponse,
} from "../../../../modules/sozluk/application/sozluk-http.ts";
import { createSozlukEntry } from "../../../../modules/sozluk/application/sozluk-service.ts";

export async function POST(request: Request) {
  const author = await getSozlukAuthorFromCookies();
  if (!author) {
    return NextResponse.json(
      { error: "Entry girmek için yazar girişi yapmalısınız." },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const result = await createSozlukEntry(author, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}
