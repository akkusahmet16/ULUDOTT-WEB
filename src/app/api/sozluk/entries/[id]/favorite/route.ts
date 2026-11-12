import { NextResponse } from "next/server";
import {
  getSozlukAuthorFromCookies,
  sozlukErrorResponse,
} from "../../../../../../modules/sozluk/application/sozluk-http.ts";
import { favoriteSozlukEntry } from "../../../../../../modules/sozluk/application/sozluk-service.ts";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const author = await getSozlukAuthorFromCookies();
  if (!author) {
    return NextResponse.json(
      { error: "Favorilemek için yazar girişi yapmalısınız." },
      { status: 401 },
    );
  }
  try {
    const { id } = await context.params;
    const result = await favoriteSozlukEntry(author, id);
    return NextResponse.json(result);
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}
