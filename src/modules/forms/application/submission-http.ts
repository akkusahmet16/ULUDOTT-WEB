import "server-only";
import { z } from "zod";
import { readJson } from "../../../lib/http/read-json.ts";
import { adminActor, privateHeaders, formError } from "./admin-http.ts";
import {
  listSubmissions,
  getSubmission,
  changeSubmissionStatus,
  correctSubmission,
  deleteSubmission,
  purgeExpiredSubmissions,
  statusSchema,
} from "./submission-admin.ts";
import { exportSubmissions } from "./export-submissions.ts";
export async function handleSubmissions(
  req: Request,
  id?: string,
  exporting = false,
) {
  try {
    const actor = await adminActor(req);
    if (req.method === "GET") {
      if (id)
        return Response.json(await getSubmission(actor, id), {
          headers: privateHeaders,
        });
      const p = new URL(req.url).searchParams;
      const filters = Object.fromEntries(
        [...p].filter(([key]) =>
          ["q", "status", "versionId", "from", "to"].includes(key),
        ),
      );
      const limit = p.get("limit");
      return Response.json(
        await listSubmissions(
          actor,
          z.uuid().parse(p.get("formId")),
          p.get("cursor"),
          { ...filters, ...(limit ? { limit: Number(limit) } : {}) },
        ),
        { headers: privateHeaders },
      );
    }
    if (exporting) {
      const d = z
        .strictObject({
          formId: z.uuid(),
          format: z.enum(["csv", "xlsx"]),
          filters: z.unknown().optional(),
        })
        .parse(await readJson(req, 4096));
      const result = await exportSubmissions(
        actor,
        d.formId,
        d.format,
        d.filters ?? {},
      );
      return new Response(new Uint8Array(result.data), {
        headers: {
          ...privateHeaders,
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
      });
    }
    if (!id) {
      const d = z
        .strictObject({ action: z.literal("purge"), formId: z.uuid() })
        .parse(await readJson(req, 4096));
      return Response.json(await purgeExpiredSubmissions(actor, d.formId), {
        headers: privateHeaders,
      });
    }
    const d = z
      .strictObject({
        action: z.enum(["status", "correct", "delete"]),
        expectedRevision: z.int().positive(),
        status: statusSchema.optional(),
        answers: z.unknown().optional(),
      })
      .parse(await readJson(req, 128 * 1024));
    const result =
      d.action === "status"
        ? await changeSubmissionStatus(actor, id, d.status, d.expectedRevision)
        : d.action === "correct"
          ? await correctSubmission(actor, id, d.answers, d.expectedRevision)
          : await deleteSubmission(actor, id, d.expectedRevision);
    return Response.json(result, { headers: privateHeaders });
  } catch (e) {
    return formError(e);
  }
}
