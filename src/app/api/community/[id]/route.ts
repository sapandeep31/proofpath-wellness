import { db } from "@/lib/db";
import { jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// PATCH — save/bookmark, edit, or report a post
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.communityPost.findUnique({ where: { id } });
  if (!existing) return jsonError("Post not found", 404);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  if (body.action === "save") {
    const post = await db.communityPost.update({ where: { id }, data: { saved: Boolean(body.saved) } });
    return Response.json({ ok: true, saved: post.saved });
  }

  if (body.action === "report") {
    const reason = String(body.reason ?? "").trim();
    const allowed = ["medical-advice", "harassment", "spam", "misleading", "non-consensual", "personal-info", "other"];
    if (!allowed.includes(reason)) return jsonError("Please choose a report reason");
    await db.communityPost.update({
      where: { id },
      data: {
        reported: true,
        reportReason: reason,
      },
    });
    return Response.json({
      ok: true,
      message: "Thank you. Our moderation guidance: reported posts are flagged for review and hidden from the feed while pending.",
    });
  }

  if (body.action === "edit") {
    const title = String(body.title ?? existing.title).trim();
    const content = String(body.content ?? existing.content).trim();
    if (title.length < 3 || content.length < 20) return jsonError("Title and content are required");
    const post = await db.communityPost.update({
      where: { id },
      data: {
        title: title.slice(0, 120),
        content: content.slice(0, 4000),
        observations: body.observations ? String(body.observations).slice(0, 600) : existing.observations,
      },
    });
    return Response.json({ ok: true, post: { ...post, createdAt: post.createdAt.toISOString() } });
  }

  if (body.action === "withdraw") {
    // Withdraw consent: remove from community view (kept privately per spec: "withdraw consent")
    await db.communityPost.delete({ where: { id } });
    return Response.json({ ok: true, deleted: true });
  }

  return jsonError("Unknown action");
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.communityPost.findUnique({ where: { id } });
  if (!existing) return jsonError("Post not found", 404);
  await db.comment.deleteMany({ where: { postId: id } });
  await db.reaction.deleteMany({ where: { postId: id } });
  await db.communityPost.delete({ where: { id } });
  return Response.json({ ok: true });
}
