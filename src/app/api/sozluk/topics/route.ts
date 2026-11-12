import { NextResponse } from "next/server";
import {
  getSozlukAuthorFromCookies,
  sozlukErrorResponse,
} from "../../../../modules/sozluk/application/sozluk-http.ts";
import { createSozlukTopicWithEntry } from "../../../../modules/sozluk/application/sozluk-service.ts";

export async function POST(request: Request) {
  const author = await getSozlukAuthorFromCookies();
  if (!author) {
    return NextResponse.json(
      { error: "Başlık açmak için yazar girişi yapmalısınız." },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const result = await createSozlukTopicWithEntry(author, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}
