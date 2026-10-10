"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  PackagePlus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Avatar, ProductArt, ProgressRing } from "./brand";
import { fmtDate, relativeDays } from "@/lib/calc";
import type { DashboardDTO } from "@/lib/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const CHANGE_LABELS: Record<string, string> = {
  improved: "Improved",
  same: "No noticeable change",
  worsened: "Worsened",
  unsure: "Unsure",
};

export function Dashboard() {
  const { dashboard, profile, setView, openProduct, openJourney } = useApp();
  if (!dashboard || !profile) return null;
  const d: DashboardDTO = dashboard;

  const quickActions = [
    { label: "Log a check-in", icon: ClipboardList, action: () => setView("journey"), tint: "bg-sage/70 text-primary" },
    { label: "Add a product", icon: PackagePlus, action: () => useApp.getState().openProductForm(null), tint: "bg-lavender/70 text-accent-foreground" },
    { label: "Ask AI Skin Support", icon: Sparkles, action: () => setView("ai"), tint: "bg-rose-soft text-[#7A4A44]" },
    { label: "View my progress", icon: TrendingUp, action: () => setView("journey"), tint: "bg-muted text-foreground" },
  ];

  const recentProducts = profile.recentlyViewed
    .map((id) => d.activeProducts.find((p) => p.id === id) ?? null)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
          {greeting()}, {profile.displayName}.
        </h1>
        <p className="mt-1.5 text-muted-foreground">Small steps. Meaningful insights.</p>
      </motion.section>

      {/* Active product journeys */}
      <section aria-labelledby="active-journeys">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 id="active-journeys" className="font-display text-xl">
              Active product journeys
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Products you&apos;re currently using and tracking.</p>
          </div>
          {d.activeProducts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setView("products")} className="gap-1 text-xs text-primary">
              All products <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {d.activeProducts.length === 0 ? (
          <EmptyCard
            icon={PackagePlus}
            title="No products yet"
            body="Add your first product and ProofPath will help you track supply, routine and how your experience unfolds."
            action={
              <Button onClick={() => setView("products", { productId: "new" })} className="rounded-full gap-2">
                <PackagePlus className="h-4 w-4" /> Add your first product
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {d.activeProducts.slice(0, 6).map((p, i) => {
              const journey = d.journeys.find((j) => j.productId === p.id);
              const started = p.openingDate ?? p.purchaseDate ?? p.createdAt;
              const durationDays = Math.max(1, Math.round((Date.now() - new Date(started).getTime()) / 86400000));
              return (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => openProduct(p.id)}
                  className="text-left bg-white rounded-2xl border border-border p-5 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="flex items-start gap-4">
                    <ProductArt artKey={p.artKey} hue={p.artHue} category={p.category} seed={p.id} size={76} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                            {p.brand || p.category}
                          </p>
                          <h3 className="font-semibold text-[15px] leading-snug line-clamp-2">{p.name}</h3>
                        </div>
                        {p.isDemo && <SampleBadge />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.category} · started {fmtDate(started)} · {durationDays} {durationDays === 1 ? "day" : "days"} in
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3.5">
                    <div className="min-w-0">
                      {journey?.lastCheckIn ? (
                        <>
                          <p className="text-[11px] text-muted-foreground">Latest check-in</p>
                          <p className="text-xs font-medium truncate">
                            {journey.lastCheckIn.change
                              ? CHANGE_LABELS[journey.lastCheckIn.change]
                              : journey.lastCheckIn.overallRating
                                ? `Rated ${journey.lastCheckIn.overallRating}/5`
                                : "Recorded"}{" "}
                            · {relativeDays(journey.lastCheckIn.date)}
                          </p>
                        </>
                      ) : journey ? (
                        <p className="text-xs text-muted-foreground">Journey created — first check-in due {relativeDays(journey.nextDue)}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No journey started yet</p>
                      )}
                    </div>
                    {p.estimate.known && p.estimate.percentUsed != null && (
                      <ProgressRing percent={p.estimate.percentUsed} size={46} stroke={5} />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="font-display text-xl mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((qa, i) => (
            <motion.button
              key={qa.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={qa.action}
              className="group flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 text-left shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", qa.tint)}>
                <qa.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                {qa.label}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Supply overview */}
        <section aria-labelledby="supply" className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <h2 id="supply" className="font-display text-xl">
            Supply overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">
            Estimates from your usage data — update quantities any time to sharpen them.
          </p>
          {d.supplyOverview.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Once your products have quantities and usage rates, supply estimates will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {d.supplyOverview.slice(0, 4).map((s) => (
                <li key={s.product.id}>
                  <button
                    onClick={() => openProduct(s.product.id)}
                    className="w-full flex items-center gap-3 rounded-xl border border-border/70 p-3 hover:bg-[#FAF8F3] transition-colors text-left"
                  >
                    <span
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                        s.tone === "low" ? "bg-rose text-[#7A4A44]" : s.tone === "soon" ? "bg-sage text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.estimate.daysRemaining != null && s.estimate.daysRemaining <= 99 ? s.estimate.daysRemaining : "…"}
                    </span>
                    <p className="text-[13px] leading-snug flex-1">{s.message}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Weekly reflection */}
        <section aria-labelledby="reflection" className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <h2 id="reflection" className="font-display text-xl">
            Weekly reflection
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">A summary grounded in your recorded check-ins only.</p>
          {d.weeklyReflection.hasData ? (
            <div>
              <p className="text-[15px] leading-relaxed">{d.weeklyReflection.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(d.weeklyReflection.changeCounts).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-[#FAF8F3] border border-border px-3 py-1 text-xs text-muted-foreground">
                    {CHANGE_LABELS[k] ?? k}: <span className="font-semibold text-foreground">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{d.weeklyReflection.message}</p>
              <Button variant="outline" onClick={() => setView("journey")} className="mt-4 rounded-full gap-2 bg-transparent">
                <CalendarCheck className="h-4 w-4" /> Record your first check-in
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section aria-labelledby="activity">
        <h2 id="activity" className="font-display text-xl mb-4">
          Recent activity
        </h2>
        <div className="grid lg:grid-cols-3 gap-4">
          <ActivityCard title="Recent check-ins">
            {d.recentCheckIns.length === 0 ? (
              <Empty text="Check-ins you record will appear here." />
            ) : (
              d.recentCheckIns.map((c) => (
                <button key={c.id} onClick={() => openJourney(c.journeyId)} className="w-full text-left group">
                  <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                    <span className="h-8 w-8 rounded-full bg-sage/60 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                      {c.overallRating ?? "·"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                        {c.journeyTitle}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.change ? CHANGE_LABELS[c.change] : "Check-in"} · {relativeDays(c.date)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </ActivityCard>

          <ActivityCard title="Reminders & updates">
            {d.recentNotifications.length === 0 ? (
              <Empty text="Reminders and updates will appear here." />
            ) : (
              d.recentNotifications.map((n) => (
                <div key={n.id} className="py-2.5 border-b border-border/50 last:border-0">
                  <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                </div>
              ))
            )}
          </ActivityCard>

          <ActivityCard title="Recently viewed journeys">
            {recentProducts.length === 0 ? (
              <Empty text="Products you open will appear here for quick access." />
            ) : (
              recentProducts.map((p) => (
                <button key={p!.id} onClick={() => openProduct(p!.id)} className="w-full text-left group">
                  <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                    <ProductArt artKey={p!.artKey} hue={p!.artHue} category={p!.category} seed={p!.id} size={38} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">{p!.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p!.category}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
            {d.journeys.length > 0 && (
              <button
                onClick={() => setView("journey")}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Browse all journeys
              </button>
            )}
          </ActivityCard>
        </div>
      </section>
    </div>
  );
}

function ActivityCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-soft">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground py-6 text-center">{text}</p>;
}

export function EmptyCard({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border bg-white/60 p-10 text-center", className)}>
      <div className="mx-auto w-12 h-12 rounded-2xl bg-sage/60 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-muted border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      Sample
    </span>
  );
}

export function DemoBanner() {
  const { profile, updateProfile } = useApp();
  if (!profile?.demoMode) return null;
  return (
    <div className="rounded-2xl border border-border bg-lavender-soft px-5 py-3.5 flex flex-wrap items-center gap-3">
      <Avatar name="D" color="#5B4A6E" size={30} />
      <p className="text-[13px] flex-1 min-w-[200px]">
        You&apos;re exploring <span className="font-semibold">demo mode</span> — products, journeys and posts marked{" "}
        <span className="italic">sample</span> are fictional. Everything you add yourself is real, private data.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full bg-transparent h-8"
        onClick={async () => {
          await updateProfile({ demoMode: false });
          window.location.reload();
        }}
      >
        Start fresh without samples
      </Button>
    </div>
  );
}
