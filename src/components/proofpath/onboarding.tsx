"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Leaf, Sparkles, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { BeBodywiseBadge, MosaicLine, ProofPathMark, ProductArt, ProgressRing } from "./brand";
import { GOAL_OPTIONS, INTEREST_OPTIONS } from "@/lib/types";

export function Onboarding() {
  const { updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const finish = async (skip = false) => {
    setBusy(true);
    await updateProfile({
      displayName: skip ? "Friend" : name.trim() || "Friend",
      interests: skip ? [] : interests,
      goal: skip ? null : goal || null,
      onboarded: true,
    });
    setBusy(false);
  };

  const steps = 3;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-thin bg-[#FAF8F3]">
      <div className="min-h-full flex flex-col">
        <header className="flex items-center justify-between px-6 sm:px-10 py-5">
          <div className="flex items-center gap-2.5">
            <ProofPathMark size={32} />
            <span className="font-display text-lg">Proof<span className="text-primary">Path</span></span>
          </div>
          <div className="flex items-center gap-3">
            <BeBodywiseBadge compact />
            <button
              onClick={() => finish(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              disabled={busy}
            >
              Skip for now
            </button>
          </div>
        </header>

        <main className="flex-1 grid lg:grid-cols-2 gap-10 items-center px-6 sm:px-10 pb-10 max-w-6xl w-full mx-auto">
          {/* Visual side */}
          <div className="hidden lg:block relative h-[520px]">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#DCE7D8] via-[#F3EFF8] to-[#F6EBE9]" />
            <div className="absolute inset-0 rounded-[32px] border border-white/60" />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-10 top-12 bg-white rounded-2xl shadow-soft p-5 w-64"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Your journey</p>
              <div className="flex items-center gap-3">
                <ProductArt artKey="jar" hue={150} category="Skincare" size={64} />
                <div>
                  <p className="text-sm font-semibold">Week 4</p>
                  <p className="text-xs text-muted-foreground">Hydra Calm Moisturiser</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[1, 2, 3, 4].map((w) => (
                  <div key={w} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-8">W{w}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${w * 22}%` }}
                        transition={{ delay: 0.4 + w * 0.15, duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-primary/80"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-10 top-48 bg-white rounded-2xl shadow-soft p-5 w-60"
            >
              <div className="flex items-center gap-4">
                <ProgressRing percent={65} size={64} stroke={7} />
                <div>
                  <p className="text-sm font-semibold">65% used</p>
                  <p className="text-xs text-muted-foreground">≈ 18 days remaining</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 italic">estimate</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-16 bottom-14 bg-white rounded-2xl shadow-soft p-5 w-72"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-lavender flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-[#5B4A6E]" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Ask Skin Guide</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    &ldquo;Let&apos;s note when the redness started and pause the product for now — I can help you prepare
                    questions for a dermatologist.&rdquo;
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Text/steps side */}
          <div className="max-w-md w-full mx-auto">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="s0"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-sage/60 px-3.5 py-1.5 text-xs font-medium text-primary mb-6">
                    <Leaf className="h-3.5 w-3.5" /> A calm place for your routine
                  </div>
                  <h1 className="font-display text-4xl sm:text-[44px] leading-[1.12] text-balance">
                    Your wellness journey deserves more than guesswork.
                  </h1>
                  <p className="mt-5 text-muted-foreground leading-relaxed">
                    Track your product experience, understand your progress, manage your essentials, and find your next
                    step — all in one place.
                  </p>
                  <div className="mt-8 grid gap-3">
                    <Button
                      onClick={() => setStep(1)}
                      className="h-12 rounded-full text-[15px] bg-primary hover:bg-primary/90 gap-2"
                    >
                      Start my journey <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => finish(true)}
                      className="h-12 rounded-full text-[15px] bg-transparent gap-2"
                      disabled={busy}
                    >
                      <TimerReset className="h-4 w-4" /> Explore demo
                    </Button>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      Demo mode fills ProofPath with clearly-labelled sample data so you can explore everything
                      instantly. You can start fresh at any time from Profile &amp; Settings.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Step 1 of {steps}</p>
                  <h2 className="font-display text-3xl">What are you interested in?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Choose any that apply — you can change these later.</p>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {INTEREST_OPTIONS.map((opt) => {
                      const active = interests.includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            setInterests((prev) => (active ? prev.filter((i) => i !== opt) : [...prev, opt]))
                          }
                          aria-pressed={active}
                          className={cn(
                            "rounded-full border px-4 py-2.5 text-sm transition-all",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-soft"
                              : "border-border bg-white text-foreground/80 hover:border-primary/40"
                          )}
                        >
                          {active && <Check className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex gap-3">
                    <Button variant="outline" onClick={() => setStep(0)} className="rounded-full h-11 px-6 bg-transparent">
                      Back
                    </Button>
                    <Button onClick={() => setStep(2)} className="rounded-full h-11 px-7 gap-2 bg-primary hover:bg-primary/90">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Step 2 of {steps}</p>
                  <h2 className="font-display text-3xl">What brings you here?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Pick your main goal for now.</p>
                  <div className="mt-6 grid gap-2.5">
                    {GOAL_OPTIONS.map((opt) => {
                      const active = goal === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setGoal(opt)}
                          aria-pressed={active}
                          className={cn(
                            "text-left rounded-xl border px-4 py-3 text-sm transition-all flex items-center justify-between",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-soft"
                              : "border-border bg-white text-foreground/80 hover:border-primary/40"
                          )}
                        >
                          {opt}
                          {active && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="rounded-full h-11 px-6 bg-transparent">
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="rounded-full h-11 px-7 gap-2 bg-primary hover:bg-primary/90"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Step 3 of {steps}</p>
                  <h2 className="font-display text-3xl">What should we call you?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your display name appears in the app and on anything you choose to share with the community. Optional
                    — no email or sensitive details needed.
                  </p>
                  <div className="mt-6">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya"
                      maxLength={40}
                      className="h-12 rounded-xl bg-white"
                      aria-label="Display name"
                    />
                    <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
                      <Leaf className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      Reminders stay inside the app — gentle nudges for check-ins and running-low products, never
                      pressure to buy.
                    </p>
                  </div>
                  <div className="mt-8 flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="rounded-full h-11 px-6 bg-transparent">
                      Back
                    </Button>
                    <Button
                      onClick={() => finish(false)}
                      disabled={busy}
                      className="rounded-full h-11 px-7 gap-2 bg-primary hover:bg-primary/90"
                    >
                      {busy ? "Setting up…" : "Enter ProofPath"} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="px-6 sm:px-10 py-4 border-t border-border/60">
          <MosaicLine />
        </footer>
      </div>
    </div>
  );
}
