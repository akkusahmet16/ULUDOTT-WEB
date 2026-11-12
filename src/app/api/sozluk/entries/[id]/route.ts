import { NextResponse } from "next/server";
import {
  getSozlukAuthorFromCookies,
  sozlukErrorResponse,
} from "../../../../../modules/sozluk/application/sozluk-http.ts";
import {
  deleteSozlukEntry,
  updateSozlukEntry,
} from "../../../../../modules/sozluk/application/sozluk-service.ts";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const author = await getSozlukAuthorFromCookies();
  if (!author) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { content?: string };
    const updated = await updateSozlukEntry(author, id, body.content ?? "");
    return NextResponse.json({ entry: updated });
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const author = await getSozlukAuthorFromCookies();
  if (!author) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    await deleteSozlukEntry(author, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}
