"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, ExternalLink, FlaskConical, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { SearchBar } from "./shell";
import { ProductArt } from "./brand";
import { EmptyCard, SampleBadge } from "./dashboard";
import type { GuideProductDTO } from "@/lib/types";

export function GuideSection() {
  const { guides, refreshGuides, setView } = useApp();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<GuideProductDTO | null>(null);

  useEffect(() => {
    refreshGuides({ q, category: category === "all" ? "" : category });
     
  }, [q, category]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Product Guide</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Educational product and ingredient information — approachable language, no efficacy promises, and sample
            entries clearly labelled. Always confirm details on your actual label.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="sm:w-96">
          <SearchBar value={q} onChange={setQ} placeholder="Search products, brands or ingredients…" />
        </div>
        <div className="flex gap-2">
          {["all", "Skincare", "Hair Care", "Body Care"].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium transition-colors",
                category === c ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      {guides.length === 0 ? (
        <EmptyCard
          icon={BookOpen}
          title="Nothing matches that search"
          body="Try a different product name or ingredient — or add the product to My Products and note its details yourself."
          action={
            <Button variant="outline" className="rounded-full bg-transparent" onClick={() => useApp.getState().openProductForm(null)}>
              Add it to My Products
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {guides.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
              onClick={() => setSelected(g)}
              className="text-left bg-white rounded-2xl border border-border p-5 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start gap-4">
                <ProductArt artKey={guessArt(g.name)} hue={hashHue(g.name + g.brand)} category={g.category} size={68} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{g.brand}</p>
                    {g.isSample && <SampleBadge />}
                  </div>
                  <h2 className="font-semibold text-[15px] leading-snug">{g.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.tagline}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <FlaskConical className="h-3.5 w-3.5" /> {g.ingredients.length} ingredients explained
                <span className="mx-1">·</span> {g.category}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <GuideDetailDialog guide={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function GuideDetailDialog({ guide, onClose }: { guide: GuideProductDTO | null; onClose: () => void }) {
  if (!guide) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin bg-[#FAF8F3] rounded-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <ProductArt artKey={guessArt(guide.name)} hue={hashHue(guide.name + guide.brand)} category={guide.category} size={84} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="font-display text-2xl">{guide.name}</DialogTitle>
                {guide.isSample && <SampleBadge />}
              </div>
              <DialogDescription className="mt-1">
                {guide.brand} · {guide.category} {guide.sizeInfo ? `· ${guide.sizeInfo}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-[13.5px] leading-relaxed">{guide.description}</p>

        <Section title="Ingredients & what they do" icon={FlaskConical}>
          <ul className="space-y-2.5">
            {guide.ingredients.map((ing) => (
              <li key={ing.name} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-[13px] leading-relaxed">
                  <span className="font-semibold">{ing.name}</span>
                  <span className="text-muted-foreground"> — {ing.fn}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground italic mt-3">
            Ingredients are explained educationally. Presence in a formula doesn&apos;t mean it&apos;s right for every
            person — patch-test and check your own label.
          </p>
        </Section>

        {guide.directions && (
          <Section title="Directions for use" icon={BookOpen}>
            <p className="text-[13px] leading-relaxed">{guide.directions}</p>
          </Section>
        )}

        {guide.precautions && (
          <Section title="Precautions" icon={ShieldCheck}>
            <p className="text-[13px] leading-relaxed">{guide.precautions}</p>
          </Section>
        )}

        {guide.faqs.length > 0 && (
          <Section title="Frequently asked questions">
            <div className="space-y-2">
              {guide.faqs.map((f, i) => (
                <details key={i} className="group rounded-xl border border-border bg-white overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-3 text-[13px] font-medium cursor-pointer list-none">
                    {f.q}
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-3.5 text-[13px] text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </Section>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Information last verified: {guide.lastVerified ?? "not recorded"}
          </p>
          {guide.purchaseLink ? (
            <Button variant="outline" className="rounded-full gap-2 bg-transparent" asChild>
              <a href={guide.purchaseLink} target="_blank" rel="noopener noreferrer">
                <ShoppingBag className="h-4 w-4" /> Official page <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">No verified purchase link on file — we don&apos;t invent links.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof BookOpen; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-border p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-4 w-4 text-primary" />} {title}
      </h3>
      {children}
    </div>
  );
}

function guessArt(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("butter") || n.includes("cream")) return "jar";
  if (n.includes("cleanser") || n.includes("shampoo") || n.includes("wash")) return "pump";
  if (n.includes("serum")) return "dropper";
  if (n.includes("lotion") || n.includes("sunscreen")) return "tube";
  return "bottle";
}

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return h % 360;
}
