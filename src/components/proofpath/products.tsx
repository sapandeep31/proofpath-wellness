"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Droplets,
  ExternalLink,
  Info,
  Pencil,
  PackagePlus,
  Pause,
  Play,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, useApp } from "@/lib/store";
import { ProductArt, ProgressRing } from "./brand";
import { EmptyCard, SampleBadge } from "./dashboard";
import { fmtDate, FREQUENCY_LABELS } from "@/lib/calc";
import { CATEGORIES, UNITS, type ProductDTO, type QuantityEstimate } from "@/lib/types";

 

type ProductWithEstimate = ProductDTO & { estimate: QuantityEstimate; usageCount?: number };

export function ProductsSection() {
  const { products, selectedProductId, openProductForm, closeProductForm, productForm } = useApp();

  const editing = productForm.editId ? products.find((p) => p.id === productForm.editId) ?? null : null;
  const selected = products.find((p) => p.id === selectedProductId) ?? null;

  if (selected) {
    return (
      <>
        <ProductDetail product={selected} onEdit={() => openProductForm(selected.id)} />
        <ProductFormDialog open={productForm.open} onClose={closeProductForm} product={editing} />
      </>
    );
  }

  return (
    <>
      <ProductList onAdd={() => openProductForm(null)} onEdit={(p) => openProductForm(p.id)} />
      <ProductFormDialog open={productForm.open} onClose={closeProductForm} product={editing} />
    </>
  );
}

/* ------------------------------- List ------------------------------- */

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-sage/70 text-primary" },
  paused: { label: "Paused", cls: "bg-lavender/70 text-accent-foreground" },
  finished: { label: "Finished", cls: "bg-muted text-muted-foreground" },
  archived: { label: "Archived", cls: "bg-muted text-muted-foreground/70" },
};

function ProductList({ onAdd, onEdit }: { onAdd: () => void; onEdit: (p: ProductDTO) => void }) {
  const { products, openProduct, dashboard } = useApp();
  const [filter, setFilter] = useState("active");
  const { toast } = useToast();

  const estimates = useMemo(() => {
    const map = new Map<string, QuantityEstimate>();
    dashboard?.activeProducts.forEach((p) => map.set(p.id, p.estimate));
    return map;
  }, [dashboard]);

  const filtered = products.filter((p) => (filter === "all" ? true : filter === "inventory" ? true : p.status === filter));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">My Products</h1>
          <p className="text-muted-foreground mt-1">Your inventory — track supply, routine details and usage.</p>
        </div>
        <Button onClick={onAdd} className="rounded-full gap-2 bg-primary hover:bg-primary/90">
          <PackagePlus className="h-4 w-4" /> Add to My Products
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { k: "active", label: "Active" },
          { k: "paused", label: "Paused" },
          { k: "finished", label: "Finished" },
          { k: "archived", label: "Archived" },
          { k: "inventory", label: "Everything" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors",
              filter === f.k ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyCard
          icon={PackagePlus}
          title={filter === "active" ? "No active products" : "Nothing here yet"}
          body="Add a product with its size and usage rate — ProofPath estimates how long it will last and reminds you before it runs out. All estimates are clearly labelled."
          action={
            <Button onClick={onAdd} className="rounded-full gap-2">
              <PackagePlus className="h-4 w-4" /> Add to My Products
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((p) => {
              const est = estimates.get(p.id);
              const status = STATUS_META[p.status] ?? STATUS_META.active;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-white rounded-2xl border border-border p-5 shadow-soft flex flex-col"
                >
                  <div className="flex items-start gap-4">
                    <ProductArt artKey={p.artKey} hue={p.artHue} category={p.category} seed={p.id} size={72} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{p.brand || p.category}</p>
                          <button onClick={() => openProduct(p.id)} className="font-semibold text-[15px] leading-snug text-left hover:text-primary transition-colors">
                            {p.name}
                          </button>
                        </div>
                        {p.isDemo && <SampleBadge />}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide", status.cls)}>
                          {status.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{p.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    {p.quantityKnown && p.currentQuantity != null ? (
                      <ProgressRing percent={est?.percentUsed ?? null} size={52} stroke={6} />
                    ) : (
                      <div className="h-[52px] w-[52px] rounded-full border border-dashed border-border flex items-center justify-center text-[9px] text-muted-foreground text-center leading-tight px-1">
                        set qty
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground min-w-0">
                      {p.quantityKnown && p.currentQuantity != null ? (
                        est?.daysRemaining != null ? (
                          <>
                            <p className="text-foreground font-medium">
                              ≈ {est.daysRemaining} {est.daysRemaining === 1 ? "day" : "days"} remaining
                            </p>
                            <p>Run-out {fmtDate(est.runOutDate)} (estimate)</p>
                          </>
                        ) : (
                          <>
                            <p className="text-foreground font-medium">
                              {p.currentQuantity} {p.unit} left
                            </p>
                            <p>Add usage rate for an estimate</p>
                          </>
                        )
                      ) : (
                        <>
                          <p className="text-foreground font-medium">Quantity not tracked</p>
                          <p>Update it to unlock estimates</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/70 flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openProduct(p.id)} className="text-xs gap-1 text-primary flex-1">
                      Open <ArrowLeft className="h-3 w-3 rotate-180" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="text-xs gap-1">
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={async () => {
                        if (!confirm(`Delete "${p.name}"? This also removes its usage history.`)) return;
                        try {
                          await api(`/api/products/${p.id}`, { method: "DELETE" });
                          await useApp.getState().refreshProducts();
                          await useApp.getState().refreshDashboard();
                          toast({ title: "Product deleted" });
                        } catch (e) {
                          toast({ title: "Could not delete", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Detail ------------------------------ */

const VISUAL_LEVELS = [
  { k: "full", label: "Full" },
  { k: "three-quarter", label: "About ¾" },
  { k: "half", label: "About ½" },
  { k: "quarter", label: "About ¼" },
  { k: "almost-empty", label: "Almost empty" },
];

function ProductDetail({ product, onEdit }: { product: ProductDTO; onEdit: () => void }) {
  const { dashboard, journeys, openJourney, setView } = useApp();
  const { toast } = useToast();
  const [usage, setUsage] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [showMath, setShowMath] = useState(false);
  const [tab, setTab] = useState<"track" | "history" | "details">("track");

  const refresh = async () => {
    await Promise.all([useApp.getState().refreshProducts(), useApp.getState().refreshDashboard()]);
    const d = await api<{ usageLogs: any[] }>(`/api/products/${product.id}`);
    setUsage(d.usageLogs);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([useApp.getState().refreshProducts(), useApp.getState().refreshDashboard()])
      .then(() => api<{ usageLogs: any[] }>(`/api/products/${product.id}`))
      .then((d) => {
        if (!cancelled) setUsage(d.usageLogs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  // live estimate from dashboard if present, else compute locally-lite
  const est: QuantityEstimate =
    dashboard?.activeProducts.find((p) => p.id === product.id)?.estimate ??
    ({
      known: product.quantityKnown,
      percentUsed:
        product.startingQuantity && product.currentQuantity != null
          ? ((product.startingQuantity - product.currentQuantity) / product.startingQuantity) * 100
          : null,
      dailyConsumption: null,
      weeklyConsumption: null,
      daysRemaining: null,
      runOutDate: null,
      basis: "none",
      basisLabel: "Open the dashboard to refresh estimates.",
    } as QuantityEstimate);

  const journey = journeys.find((j) => j.productId === product.id);
  const upcoming = (dashboard?.upcomingReminders ?? []).filter((n) => n.productId === product.id);

  const submitUsage = async (payload: Record<string, unknown>, successMsg: string) => {
    try {
      await api(`/api/products/${product.id}/usage`, { method: "POST", body: JSON.stringify(payload) });
      await refresh();
      toast({ title: successMsg });
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  const setStatus = async (status: string) => {
    try {
      await api(`/api/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
      toast({ title: status === "archived" ? "Product archived" : status === "finished" ? "Marked finished" : status === "paused" ? "Paused" : "Active again" });
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <div>
      <button onClick={() => setView("products")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft className="h-4 w-4" /> All products
      </button>

      <div className="bg-white rounded-2xl border border-border shadow-soft p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <ProductArt artKey={product.artKey} hue={product.artHue} category={product.category} seed={product.id} size={128} className="mx-auto sm:mx-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand || "Brand not set"}</p>
                <h1 className="font-display text-2xl sm:text-3xl mt-0.5">{product.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.category} · {product.sizeValue != null ? `${product.sizeValue} ${product.unit}` : "size not set"}
                  {product.isDemo && (
                    <span className="ml-2 italic text-[11px]">(sample product)</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={onEdit} className="rounded-full gap-1.5 bg-transparent">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {product.status === "active" ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus("paused")} className="rounded-full gap-1.5 bg-transparent">
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </Button>
                ) : product.status === "paused" ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus("active")} className="rounded-full gap-1.5 bg-transparent">
                    <Play className="h-3.5 w-3.5" /> Resume
                  </Button>
                ) : null}
                {product.status !== "finished" && (
                  <Button variant="outline" size="sm" onClick={() => setStatus("finished")} className="rounded-full gap-1.5 bg-transparent">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Finished
                  </Button>
                )}
                {product.status !== "archived" && (
                  <Button variant="outline" size="sm" onClick={() => setStatus("archived")} className="rounded-full gap-1.5 bg-transparent">
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </Button>
                )}
              </div>
            </div>

            {/* Quantity hero */}
            <div className="mt-6 grid sm:grid-cols-[auto_1fr] gap-5 items-center rounded-2xl bg-[#FAF8F3] border border-border/70 p-5">
              {product.quantityKnown && product.currentQuantity != null ? (
                <>
                  <ProgressRing percent={est.percentUsed} size={88} stroke={9} label={est.percentUsed != null ? `${Math.round(est.percentUsed)}% used` : `${product.currentQuantity}${product.unit}`} />
                  <div>
                    <p className="text-lg font-semibold">
                      {est.daysRemaining != null ? (
                        <>Estimated supply remaining: {est.daysRemaining} {est.daysRemaining === 1 ? "day" : "days"}</>
                      ) : (
                        <>{product.currentQuantity} {product.unit} remaining</>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {est.runOutDate ? (
                        <>Projected run-out date: <span className="font-medium text-foreground">{fmtDate(est.runOutDate)}</span> — an estimate, not a measurement.</>
                      ) : (
                        <>Add a usage rate or log usage to see a projected run-out date. We won&apos;t invent one.</>
                      )}
                    </p>
                    <button onClick={() => setShowMath((s) => !s)} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Info className="h-3.5 w-3.5" /> How we calculate this
                    </button>
                    <AnimatePresence>
                      {showMath && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 rounded-xl bg-white border border-border p-4 text-xs text-muted-foreground leading-relaxed">
                            <p className="font-semibold text-foreground mb-1">The maths behind the estimate</p>
                            <p>Estimated daily consumption = total consumption over the tracking period ÷ days in that period.</p>
                            <p className="mt-1">Estimated days remaining = current quantity ÷ daily consumption. Run-out date = today + days remaining.</p>
                            <p className="mt-2 italic">{est.basisLabel}</p>
                            {est.dailyConsumption != null && (
                              <p className="mt-1">Current assumption: ≈ {est.dailyConsumption} {product.unit}/day ({est.weeklyConsumption} {product.unit}/week).</p>
                            )}
                            <p className="mt-2">Irregular usage makes any estimate uncertain — you can correct the assumptions any time from “Update quantity”.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <p className="font-medium">Quantity isn&apos;t being tracked for this product.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update it below so supply estimates and reminders can work — nothing is assumed without your input.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-border">
          {([
            { k: "track", label: "Update quantity", icon: Droplets },
            { k: "history", label: "Usage history", icon: BarChart3 },
            { k: "details", label: "Details & reminders", icon: CalendarDays },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors",
                tab === t.k ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {tab === "track" && (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Method A */}
              <div className="rounded-2xl border border-border p-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Method A</p>
                <h3 className="font-semibold mt-1">Manual update</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Enter the quantity you estimate is left.</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    placeholder={`Current ${product.unit}`}
                    aria-label="Current quantity"
                  />
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={async () => {
                      if (!manualQty) return toast({ title: "Enter a quantity first", variant: "destructive" });
                      await submitUsage({ method: "manual", currentQuantity: Number(manualQty) }, "Quantity updated");
                      setManualQty("");
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Method B */}
              <div className="rounded-2xl border border-border p-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Method B</p>
                <h3 className="font-semibold mt-1">Log usage</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Record how much an application used.</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Amount used (${product.unit})`}
                    aria-label="Amount used"
                  />
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={async () => {
                      if (!amount) return toast({ title: "Enter the amount used", variant: "destructive" });
                      await submitUsage({ method: "usage", amountUsed: Number(amount) }, "Usage logged");
                      setAmount("");
                    }}
                  >
                    Log
                  </Button>
                </div>
                {product.amountPerUse != null && (
                  <p className="text-[11px] text-muted-foreground mt-2">Typical application: {product.amountPerUse} {product.unit}</p>
                )}
              </div>

              {/* Method C */}
              <div className="rounded-2xl border border-border p-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Method C</p>
                <h3 className="font-semibold mt-1">Quick visual update</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Your estimate by eye — not a measurement.</p>
                <div className="flex flex-wrap gap-1.5">
                  {VISUAL_LEVELS.map((v) => (
                    <button
                      key={v.k}
                      onClick={() => submitUsage({ method: "visual", level: v.k }, `Updated: ${v.label}`)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-colors"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "history" && (
            <div>
              {usage.length === 0 ? (
                <EmptyCard icon={TrendingUp} title="No usage records yet" body="Log usage or update the quantity — every entry builds your history and sharpens the supply estimate." className="border-dashed" />
              ) : (
                <ul className="space-y-2">
                  {usage.map((u) => (
                    <li key={u.id} className="flex items-center gap-4 rounded-xl border border-border/70 px-4 py-3">
                      <span className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold", u.method === "usage" ? "bg-sage/70 text-primary" : "bg-muted text-muted-foreground")}>
                        {u.amountUsed > 0 ? "−" : "="}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          {u.method === "usage" ? (
                            <>Used <span className="font-semibold">{u.amountUsed} {u.unit}</span></>
                          ) : (
                            <span className="text-muted-foreground">{u.note || "Quantity updated"}</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{fmtDate(u.loggedAt)} · {u.method === "usage" ? "usage log" : u.method === "visual" ? "visual estimate" : "manual update"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "details" && (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-border p-5 space-y-3 text-sm">
                <h3 className="font-semibold mb-1">Product information</h3>
                <Row label="Purchase date" value={fmtDate(product.purchaseDate)} />
                <Row label="Opening date" value={fmtDate(product.openingDate)} />
                <Row label="Starting quantity" value={product.startingQuantity != null ? `${product.startingQuantity} ${product.unit}` : "—"} />
                <Row label="Current quantity" value={product.currentQuantity != null ? `${product.currentQuantity} ${product.unit}` : "Not tracked"} />
                <Row label="Usage rate" value={product.applicationsPerWeek != null ? `${product.applicationsPerWeek}× per week${product.amountPerUse != null ? ` · ${product.amountPerUse} ${product.unit} per use` : ""}` : "Not set"} />
                <Row label="Frequency" value={product.frequency ? FREQUENCY_LABELS[product.frequency] ?? product.frequency : "—"} />
                <Row label="Price" value={product.price != null ? `₹${product.price}` : "—"} />
                <Row label="Expiry" value={fmtDate(product.expiryDate)} />
                <Row label="Batch number" value={product.batchNumber ?? "—"} />
                {product.purchaseLink && (
                  <Row
                    label="Purchase link"
                    value={
                      <a href={product.purchaseLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        Official link <ExternalLink className="h-3 w-3" />
                      </a>
                    }
                  />
                )}
                {product.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                    <p className="text-[13px] mt-1 whitespace-pre-wrap">{product.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border p-5">
                  <h3 className="font-semibold mb-2">Upcoming reminders</h3>
                  {upcoming.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No reminders scheduled. They appear automatically as your supply estimate approaches its thresholds — and are cancelled if you mark the product finished or archived.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {upcoming.map((n) => (
                        <li key={n.id} className="rounded-xl bg-[#FAF8F3] border border-border/70 p-3">
                          <p className="text-[13px] font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">Scheduled {fmtDate(n.scheduledFor)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {journey ? (
                  <button onClick={() => openJourney(journey.id)} className="w-full rounded-2xl border border-border p-5 text-left hover:border-primary/50 transition-colors">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Associated journey</p>
                    <p className="font-semibold mt-1">{journey.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {journey.concern} · {journey.checkins?.length ?? 0} check-ins · {journey.visibility === "community" ? "shared with Circle" : "private"}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                      Open journey <ArrowLeft className="h-3 w-3 rotate-180" />
                    </span>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-5">
                    <p className="text-[13px] font-medium">No journey yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Start one to track your experience with this product over time.</p>
                    <Button variant="outline" size="sm" className="rounded-full bg-transparent" onClick={() => useApp.getState().openJourneyForm(null)}>
                      Create a journey
                    </Button>
                  </div>
                )}

                {product.instructions && (
                  <div className="rounded-2xl bg-lavender-soft border border-border p-5">
                    <p className="text-[10px] uppercase tracking-wider text-accent-foreground">Directions for use</p>
                    <p className="text-[13px] mt-1.5 leading-relaxed">{product.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium text-right">{value}</span>
    </div>
  );
}

/* ------------------------------- Form ------------------------------- */

const ART_KEYS = ["bottle", "jar", "tube", "dropper", "pump", "sachet"] as const;

function ProductFormDialog({ open, onClose, product }: { open: boolean; onClose: () => void; product: ProductDTO | null }) {
  const { toast } = useToast();
  const isEdit = !!product;
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [f, setF] = useState(() => defaultsFrom(product));

  useEffect(() => {
    if (open) {
      setF(defaultsFrom(product));
      setStep(0);
    }
  }, [open, product]);

  const set = <K extends keyof ReturnType<typeof defaultsFrom>>(k: K, v: (ReturnType<typeof defaultsFrom>)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) return toast({ title: "Product name is required", variant: "destructive" });
    setBusy(true);
    try {
      const body = {
        ...f,
        name: f.name.trim(),
        startingQuantity: f.startingQuantity === "" ? null : Number(f.startingQuantity),
        currentQuantity: f.quantityKnown ? (f.currentQuantity === "" ? null : Number(f.currentQuantity)) : null,
        sizeValue: f.sizeValue === "" ? null : Number(f.sizeValue),
        amountPerUse: f.amountPerUse === "" ? null : Number(f.amountPerUse),
        applicationsPerWeek: f.applicationsPerWeek === "" ? null : Number(f.applicationsPerWeek),
        price: f.price === "" ? null : Number(f.price),
        purchaseDate: f.purchaseDate || null,
        openingDate: f.openingDate || null,
        expiryDate: f.expiryDate || null,
      };
      if (isEdit) {
        await api(`/api/products/${product!.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast({ title: "Product updated" });
      } else {
        await api("/api/products", { method: "POST", body: JSON.stringify(body) });
        toast({ title: "Product added", description: "Supply estimates and reminders will update automatically." });
      }
      await Promise.all([useApp.getState().refreshProducts(), useApp.getState().refreshDashboard()]);
      onClose();
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-[#FAF8F3] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{isEdit ? "Edit product" : "Add to My Products"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update any detail — estimates and reminders recalculate automatically." : "Fill in what you know. Only the name is required; more detail means better estimates."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 mb-1">
          {["Basics", "Quantity & usage", "Optional"].map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium", step === i ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground")}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Product name" required className="sm:col-span-2">
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Hydra Calm Daily Moisturiser" maxLength={80} />
            </Field>
            <Field label="Brand">
              <Input value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Be Bodywise" maxLength={60} />
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Size / total volume">
              <Input type="number" min="0" step="0.1" value={f.sizeValue} onChange={(e) => set("sizeValue", e.target.value)} placeholder="e.g. 100" />
            </Field>
            <Field label="Unit">
              <Select value={f.unit} onValueChange={(v) => set("unit", v)}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Product illustration" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {ART_KEYS.map((k, i) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("artKey", k)}
                    className={cn("rounded-xl border-2 p-1 transition-colors", f.artKey === k ? "border-primary" : "border-transparent hover:border-border")}
                    aria-label={k}
                  >
                    <ProductArt artKey={k} hue={f.artHue || 140 + i * 30} category={f.category} size={52} />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Illustrated placeholders keep the app fast; official product photos can replace them later.</p>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Purchase date">
              <Input type="date" value={f.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
            </Field>
            <Field label="Opening date">
              <Input type="date" value={f.openingDate} onChange={(e) => set("openingDate", e.target.value)} />
            </Field>
            <Field label="Starting quantity">
              <Input type="number" min="0" step="0.1" value={f.startingQuantity} onChange={(e) => set("startingQuantity", e.target.value)} placeholder="e.g. 100" />
            </Field>
            <Field label="Track current quantity?">
              <div className="flex items-center gap-3 h-10">
                <Switch checked={f.quantityKnown} onCheckedChange={(v) => set("quantityKnown", v)} aria-label="Track quantity" />
                <span className="text-xs text-muted-foreground">{f.quantityKnown ? "Yes — I'll keep it updated" : "No — can't measure precisely"}</span>
              </div>
            </Field>
            {f.quantityKnown && (
              <Field label="Estimated current quantity">
                <Input type="number" min="0" step="0.1" value={f.currentQuantity} onChange={(e) => set("currentQuantity", e.target.value)} placeholder="e.g. 30" />
              </Field>
            )}
            <Field label="Typical amount per application">
              <Input type="number" min="0" step="0.1" value={f.amountPerUse} onChange={(e) => set("amountPerUse", e.target.value)} placeholder="e.g. 2" />
            </Field>
            <Field label="Frequency of use">
              <Select value={f.frequency} onValueChange={(v) => set("frequency", v)}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="twice-daily">Twice daily</SelectItem>
                  <SelectItem value="alternate-days">Every other day</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {f.frequency === "custom" ? (
              <Field label="Estimated applications per week">
                <Input type="number" min="0" step="0.5" value={f.applicationsPerWeek} onChange={(e) => set("applicationsPerWeek", e.target.value)} placeholder="e.g. 5" />
              </Field>
            ) : (
              <Field label="Applications per week (auto)" help="Calculated from your frequency — adjust if your routine differs.">
                <Input type="number" min="0" step="0.5" value={f.applicationsPerWeek} onChange={(e) => set("applicationsPerWeek", e.target.value)} />
              </Field>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Price paid (optional)">
              <Input type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 449" />
            </Field>
            <Field label="Expiry date (optional)">
              <Input type="date" value={f.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </Field>
            <Field label="Purchase link (optional)" className="sm:col-span-2" help="Only an official link you provide will ever be shown — we never invent URLs.">
              <Input type="url" value={f.purchaseLink} onChange={(e) => set("purchaseLink", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Batch number (optional)">
              <Input value={f.batchNumber} onChange={(e) => set("batchNumber", e.target.value)} />
            </Field>
            <Field label="Ingredient list (optional)" className="sm:col-span-2" help="Used for product-aware AI guidance — only what you enter is ever used.">
              <Textarea value={f.ingredients} onChange={(e) => set("ingredients", e.target.value)} rows={2} placeholder="As printed on the label…" />
            </Field>
            <Field label="Directions for use (optional)" className="sm:col-span-2">
              <Textarea value={f.instructions} onChange={(e) => set("instructions", e.target.value)} rows={2} placeholder="How the product says to use it…" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Anything you want to remember…" />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-full bg-transparent">Back</Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="rounded-full bg-primary hover:bg-primary/90">Continue</Button>
            ) : (
              <Button onClick={submit} disabled={busy} className="rounded-full bg-primary hover:bg-primary/90 gap-2">
                {busy ? "Saving…" : isEdit ? "Save changes" : "Add product"} <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function defaultsFrom(p: ProductDTO | null) {
  return {
    name: p?.name ?? "",
    brand: p?.brand ?? "",
    category: p?.category ?? "Skincare",
    artKey: p?.artKey ?? "bottle",
    artHue: p?.artHue ?? 140,
    sizeValue: p?.sizeValue != null ? String(p.sizeValue) : "",
    unit: p?.unit ?? "mL",
    purchaseDate: p?.purchaseDate ? p.purchaseDate.slice(0, 10) : "",
    openingDate: p?.openingDate ? p.openingDate.slice(0, 10) : "",
    startingQuantity: p?.startingQuantity != null ? String(p.startingQuantity) : "",
    currentQuantity: p?.currentQuantity != null ? String(p.currentQuantity) : "",
    quantityKnown: p ? p.quantityKnown : true,
    amountPerUse: p?.amountPerUse != null ? String(p.amountPerUse) : "",
    frequency: p?.frequency ?? "",
    applicationsPerWeek: p?.applicationsPerWeek != null ? String(p.applicationsPerWeek) : "",
    price: p?.price != null ? String(p.price) : "",
    purchaseLink: p?.purchaseLink ?? "",
    expiryDate: p?.expiryDate ? p.expiryDate.slice(0, 10) : "",
    batchNumber: p?.batchNumber ?? "",
    notes: p?.notes ?? "",
    instructions: p?.instructions ?? "",
    ingredients: p?.ingredients ?? "",
  };
}

function Field({
  label,
  children,
  className,
  required,
  help,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[13px]">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {help && <p className="text-[11px] text-muted-foreground leading-snug">{help}</p>}
    </div>
  );
}
