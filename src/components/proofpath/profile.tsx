"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Database,
  Eye,
  KeyRound,
  Leaf,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, useApp } from "@/lib/store";
import { Avatar } from "./brand";
import { GeminiKeyDialog } from "./ai-support";
import { BeBodywiseBadge, MosaicLine } from "./brand";
import type { NotifCats, ReminderPrefs } from "@/lib/types";

 

export function ProfileSection() {
  const { profile, updateProfile, refreshDashboard, refreshProducts } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setName(profile.displayName);
  }, [profile?.displayName]);

  if (!profile) return null;

  const prefs: ReminderPrefs = profile.reminderPrefs;
  const cats: NotifCats = profile.notifCats;

  const setPref = async (patch: Partial<ReminderPrefs>) => {
    await updateProfile({ reminderPrefs: { ...prefs, ...patch } });
    await refreshDashboard();
    toast({ title: "Reminder preferences updated" });
  };

  const setCat = async (patch: Partial<NotifCats>) => {
    await updateProfile({ notifCats: { ...cats, ...patch } });
    await refreshDashboard();
  };

  const clearDemo = async () => {
    if (!confirm("Remove all sample products, journeys and posts? Your own entries are kept.")) return;
    setBusy("demo");
    try {
      await api("/api/demo", { method: "POST" });
      await refreshProducts();
      await refreshDashboard();
      await useApp.getState().refreshJourneys();
      await useApp.getState().refreshPosts();
      toast({ title: "Sample data removed" });
    } catch (e) {
      toast({ title: "Could not clear", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const wipeAll = async () => {
    if (!confirm("Delete ALL data — products, journeys, check-ins, posts and conversations? This cannot be undone.")) return;
    setBusy("wipe");
    try {
      await api("/api/demo", { method: "DELETE" });
      toast({ title: "Everything deleted", description: "Starting fresh…" });
      setTimeout(() => window.location.reload(), 800);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl">Profile &amp; Settings</h1>
        <p className="text-muted-foreground mt-1">Your identity, reminders, privacy and data — all in plain language.</p>
      </div>

      {/* Identity */}
      <Card icon={UserRound} title="Display identity">
        <div className="flex items-center gap-4">
          <Avatar name={name || "F"} color={profile.avatarColor} size={56} />
          <div className="flex-1 max-w-xs space-y-1.5">
            <Label className="text-[13px]">Display name</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
              <Button
                className="bg-primary hover:bg-primary/90 rounded-xl"
                onClick={async () => {
                  await updateProfile({ displayName: name.trim() || "Friend" });
                  toast({ title: "Name updated" });
                }}
              >
                Save
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Used on your community posts if you publish. No email or sensitive details are collected.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <BeBodywiseBadge compact />
          <MosaicLine />
        </div>
      </Card>

      {/* AI connection */}
      <Card icon={Sparkles} title="AI connection — Google Gemini">
        <div className="rounded-xl bg-lavender-soft border border-border p-4 mb-4 flex items-start gap-3">
          {profile.aiConfigured ? (
            <>
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold">Gemini is connected — Ask Skin Guide is live.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile.aiKeySource === "env" ? "Key provided via server environment (GEMINI_API_KEY)." : `Key saved in settings (${profile.aiKeyHint}).`}{" "}
                  Model: <span className="font-medium">{profile.aiModel}</span>. Stored server-side only; never sent to
                  the browser.
                </p>
              </div>
            </>
          ) : (
            <>
              <KeyRound className="h-5 w-5 text-[#5B4A6E] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold">No API key yet — demo assistant active.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste a Gemini API key to enable live AI guidance. It takes under a minute and works immediately.
                </p>
              </div>
            </>
          )}
        </div>
        <Button onClick={() => setShowKeyDialog(true)} className="rounded-full gap-2 bg-primary hover:bg-primary/90">
          <KeyRound className="h-4 w-4" /> {profile.aiConfigured ? "Manage key" : "Connect Gemini API key"}
        </Button>
      </Card>

      {/* Notifications */}
      <Card icon={Bell} title="Reminders & notifications">
        <p className="text-xs text-muted-foreground mb-4">
          Reminders live inside the app — calm and date-based, never pushy, never pressuring you to buy.
        </p>
        <ToggleRow
          label="Replenishment reminders"
          desc="First reminder 7 days before estimated run-out (adjustable per product), low-stock alerts within 7 days."
          checked={prefs.replenishment}
          onChange={(v) => setPref({ replenishment: v })}
        />
        <ToggleRow
          label="Second reminder"
          desc="An extra nudge 3 days before estimated run-out."
          checked={prefs.secondReminder}
          onChange={(v) => setPref({ secondReminder: v })}
        />
        <ToggleRow
          label="Run-out day reminder"
          desc="A final reminder on the estimated run-out date."
          checked={prefs.finalReminder}
          onChange={(v) => setPref({ finalReminder: v })}
        />
        <ToggleRow
          label="Check-in reflections"
          desc="A gentle nudge when a journey check-in is due."
          checked={prefs.checkin}
          onChange={(v) => setPref({ checkin: v })}
        />
        <div className="mt-5 pt-4 border-t border-border/60">
          <p className="text-[13px] font-medium mb-3">Notification categories</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              ["replenishment", "Supply & replenishment"],
              ["checkin", "Check-in reflections"],
              ["community", "Community replies"],
              ["system", "System & safety notices"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 cursor-pointer">
                <span className="text-[13px]">{label}</span>
                <Switch checked={cats[k]} onCheckedChange={(v) => setCat({ [k]: v } as Partial<NotifCats>)} aria-label={label} />
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card icon={Lock} title="Privacy, in plain language">
        <ul className="space-y-3 text-[13px] leading-relaxed">
          {[
            ["Private by default", "Every journey and check-in starts private. Nothing is shared unless you explicitly confirm it."],
            ["AI stays private", "Your Ask Skin Guide conversations are never visible to the community and never used for brand analytics without separate, explicit consent."],
            ["No invented links", "Purchase links appear only if you saved one — ProofPath never fabricates product URLs or orders."],
            ["No hidden tracking", "There is no third-party analytics. Your data lives in this app's own database only."],
            ["Estimates, always labelled", "Supply and run-out figures are clearly marked estimates, not measurements."],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-2.5">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p>
                <span className="font-semibold">{t}.</span> <span className="text-muted-foreground">{d}</span>
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Data controls */}
      <Card icon={Database} title="Your data">
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
          Everything you create here is real, persistent data in the app database. Demo sample content is labelled and can
          be removed at any time without touching your own records.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setBusy("export");
              try {
                const [products, journeys, dash] = await Promise.all([
                  api<any>("/api/products"),
                  api<any>("/api/journeys"),
                  api<any>("/api/dashboard"),
                ]);
                const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile, products, journeys, dashboard: dash }, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `proofpath-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Data exported as JSON" });
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-full gap-2 bg-transparent"
          >
            {busy === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Export my data (JSON)
          </Button>
          <Button variant="outline" onClick={clearDemo} disabled={busy != null} className="rounded-full gap-2 bg-transparent">
            {busy === "demo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Remove sample data
          </Button>
          <Button
            variant="outline"
            onClick={wipeAll}
            disabled={busy != null}
            className="rounded-full gap-2 text-destructive hover:text-destructive border-destructive/30 bg-transparent"
          >
            {busy === "wipe" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete everything
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
          <Leaf className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Data is stored in this application&apos;s own SQLite database. It doesn&apos;t sync across devices — no accounts,
          no hidden sharing.
        </p>
      </Card>

      <GeminiKeyDialog open={showKeyDialog} onClose={() => setShowKeyDialog(false)} />
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Bell; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-border shadow-soft p-6 sm:p-7">
      <h2 className="font-display text-xl flex items-center gap-2.5 mb-4">
        <span className="h-9 w-9 rounded-xl bg-[#FAF8F3] border border-border flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-3 border-b border-border/40 last:border-0")}>
      <div>
        <p className="text-[13.5px] font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
