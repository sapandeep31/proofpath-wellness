import { db } from "@/lib/db";
import type { GuideProductDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const category = url.searchParams.get("category") ?? "";

  const guides = await db.guideProduct.findMany({ orderBy: { name: "asc" } });

  const mapped: GuideProductDTO[] = guides
    .filter((g) => (category ? g.category === category : true))
    .filter((g) => {
      if (!q) return true;
      const ingredients = (g.ingredients ?? "").toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.brand.toLowerCase().includes(q) ||
        ingredients.includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    })
    .map((g) => {
      let ingredients: { name: string; fn: string }[] = [];
      let faqs: { q: string; a: string }[] = [];
      try {
        ingredients = (g.ingredients ?? "")
          .split("\n")
          .map((line) => {
            const [name, fn] = line.split("|");
            return { name: (name ?? "").trim(), fn: (fn ?? "").trim() };
          })
          .filter((i) => i.name);
        faqs = g.faqs ? JSON.parse(g.faqs) : [];
      } catch {
        // ignore parse errors
      }
      return {
        id: g.id,
        name: g.name,
        brand: g.brand,
        category: g.category,
        tagline: g.tagline,
        description: g.description,
        ingredients,
        directions: g.directions,
        precautions: g.precautions,
        sizeInfo: g.sizeInfo,
        faqs,
        purchaseLink: g.purchaseLink,
        lastVerified: g.lastVerified,
        isSample: g.isSample,
      };
    });

  return Response.json({ guides: mapped });
}
