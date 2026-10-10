import { db } from "@/lib/db";
import { getProfileRow, jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "";
  const concern = url.searchParams.get("concern") ?? "";
  const stage = url.searchParams.get("stage") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const posts = await db.communityPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { comments: { orderBy: { createdAt: "asc" } }, reactions: true },
    take: 60,
  });

  const filtered = posts
    .filter((p) => (category ? p.category === category : true))
    .filter((p) => (concern ? p.concern === concern : true))
    .filter((p) => (stage ? p.stage === stage : true))
    .filter((p) =>
      q
        ? p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.productName ?? "").toLowerCase().includes(q)
        : true
    )
    .map((p) => {
      const reactionCounts: Record<string, number> = {};
      for (const r of p.reactions) reactionCounts[r.kind] = (reactionCounts[r.kind] ?? 0) + 1;
      return {
        id: p.id,
        authorName: p.authorName,
        authorColor: p.authorColor,
        title: p.title,
        content: p.content,
        category: p.category,
        productName: p.productName,
        concern: p.concern,
        stage: p.stage,
        durationWeeks: p.durationWeeks,
        observations: p.observations,
        isSample: p.isSample,
        saved: p.saved,
        reported: p.reported,
        createdAt: p.createdAt.toISOString(),
        comments: p.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
        reactions: Object.entries(reactionCounts).map(([kind, count]) => ({ kind, count })),
      };
    });

  return Response.json({ posts: filtered });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  if (title.length < 3) return jsonError("Give your post a title (at least 3 characters)");
  if (content.length < 20) return jsonError("Please write a little more about your experience (at least 20 characters)");
  if (title.length > 120) return jsonError("Title is too long (max 120 characters)");
  if (content.length > 4000) return jsonError("Post is too long (max 4000 characters)");

  const profile = await getProfileRow();
  const category = ["skincare", "haircare", "bodycare"].includes(String(body.category)) ? String(body.category) : "skincare";
  const visibility = body.visibility === "private" ? "private" : "community";

  // Consent gate: publishing to the community requires explicit confirmation (spec 10.2)
  if (visibility === "community" && body.confirmed !== true) {
    return Response.json(
      {
        error: "consent-required",
        message:
          "Publishing shares this post with The ProofPath Circle under your display identity. Your private journeys, notes and AI conversations are never shared. Please confirm to publish.",
      },
      { status: 403 }
    );
  }

  const post = await db.communityPost.create({
    data: {
      authorName: String(body.authorName ?? profile.displayName).slice(0, 40) || "Anonymous",
      authorColor: /^#[0-9a-fA-F]{6}$/.test(String(body.authorColor)) ? String(body.authorColor) : profile.avatarColor,
      title,
      content,
      category,
      productName: body.productName ? String(body.productName).slice(0, 80) : null,
      concern: body.concern ? String(body.concern).slice(0, 60) : null,
      stage: ["just-started", "one-month", "three-months", "long-term"].includes(String(body.stage))
        ? String(body.stage)
        : null,
      durationWeeks:
        body.durationWeeks != null && Number.isFinite(Number(body.durationWeeks))
          ? Math.min(520, Math.max(1, Number(body.durationWeeks)))
          : null,
      observations: body.observations ? String(body.observations).slice(0, 600) : null,
      isSample: false,
    },
  });

  // A warm sample welcome reply so new posters see how replies work (clearly labelled)
  if (visibility === "community") {
    await db.comment.create({
      data: {
        postId: post.id,
        authorName: "Meera S. (sample)",
        content: "Thank you for sharing your experience with the Circle. It's helpful to see how you tracked it week by week.",
        isSample: true,
      },
    });
    await db.notification.create({
      data: {
        type: "community",
        category: "community",
        title: "You have a new reply to your community post",
        body: `Someone replied to "${post.title}".`,
        scheduledFor: new Date(),
      },
    });
  }

  return Response.json({ post: { ...post, createdAt: post.createdAt.toISOString(), comments: [], reactions: [] } }, { status: 201 });
}
