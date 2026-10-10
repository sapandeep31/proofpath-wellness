import { db } from "@/lib/db";
import { jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const KINDS = ["supportive", "insightful", "been-there"];

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const post = await db.communityPost.findUnique({ where: { id } });
  if (!post) return jsonError("Post not found", 404);

  const body = await req.json().catch(() => null);
  const kind = String(body?.kind ?? "");
  if (!KINDS.includes(kind)) return jsonError("Unknown reaction");

  await db.reaction.create({ data: { postId: id, kind } });

  const all = await db.reaction.findMany({ where: { postId: id } });
  const counts: Record<string, number> = {};
  for (const r of all) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  return Response.json({ reactions: Object.entries(counts).map(([k, count]) => ({ kind: k, count })) });
}
