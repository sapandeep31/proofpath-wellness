import { db } from "@/lib/db";
import { getProfileRow, jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const post = await db.communityPost.findUnique({ where: { id } });
  if (!post) return jsonError("Post not found", 404);

  const body = await req.json().catch(() => null);
  const content = body?.content ? String(body.content).trim() : "";
  if (content.length < 2) return jsonError("Write a short, supportive reply");
  if (content.length > 1000) return jsonError("Comment is too long (max 1000 characters)");

  const profile = await getProfileRow();
  const comment = await db.comment.create({
    data: {
      postId: id,
      authorName: profile.displayName || "You",
      content,
      isSample: false,
    },
  });

  // If replying to a sample post, notify as a simulated community reply (labelled sample)
  if (post.isSample) {
    await db.notification.create({
      data: {
        type: "community",
        category: "community",
        title: "You have a new reply in The ProofPath Circle",
        body: `Your reply on "${post.title}" was posted.`,
        scheduledFor: new Date(),
      },
    });
  }

  return Response.json({ comment: { ...comment, createdAt: comment.createdAt.toISOString() } }, { status: 201 });
}
