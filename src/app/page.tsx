"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { BottomNav, MobileTopBar, NotificationCenter, Sidebar } from "@/components/proofpath/shell";
import { Onboarding } from "@/components/proofpath/onboarding";
import { Dashboard, DemoBanner } from "@/components/proofpath/dashboard";
import { ProductsSection } from "@/components/proofpath/products";
import { JourneySection } from "@/components/proofpath/journey";
import { AiSupportSection } from "@/components/proofpath/ai-support";
import { CommunitySection } from "@/components/proofpath/community";
import { GuideSection } from "@/components/proofpath/guide";
import { ProfileSection } from "@/components/proofpath/profile";

export default function Home() {
  const { ready, view, setView, profile, refreshAll, openProduct, openJourney } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    refreshAll().catch(() => {});
     
  }, []);

  // deep links like /#product=<id> / #journey=<id> / #view=community
  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const [k, v] = hash.split("=");
    if (k === "product" && v) openProduct(v);
    else if (k === "journey" && v) openJourney(v);
    else if (k === "view" && v) {
      const views = ["home", "products", "journey", "ai", "community", "guide", "profile"] as const;
      if (views.includes(v as (typeof views)[number])) setView(v as (typeof views)[number]);
    }
     
  }, [ready]);

  if (!ready || !profile) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#314C3C] flex items-center justify-center animate-pulse">
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M7 23 C11 21, 12 17, 16 15 C20 13, 21 10, 25 8" stroke="#DCE7D8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <circle cx="7" cy="23" r="2.2" fill="#E8C9C5" />
              <circle cx="16" cy="15" r="2.2" fill="#FFFFFF" />
              <circle cx="25" cy="8" r="2.2" fill="#DCE7D8" />
            </svg>
          </div>
          <p className="font-display text-xl mt-5">
            Proof<span className="text-primary">Path</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 justify-center">
            <Loader2 className="h-3 w-3 animate-spin" /> Preparing your journey…
          </p>
        </div>
      </main>
    );
  }

  const showOnboarding = !profile.onboarded;

  return (
    <div className="min-h-screen flex bg-[#FAF8F3]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <MobileTopBar onOpenNotifications={() => setNotifOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-9 pb-28 lg:pb-12 w-full max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {view === "home" && (
                <div className="space-y-6">
                  <DemoBanner />
                  <Dashboard />
                </div>
              )}
              {view === "products" && (
                <div className="space-y-6">
                  <DemoBanner />
                  <ProductsSection />
                </div>
              )}
              {view === "journey" && (
                <div className="space-y-6">
                  <DemoBanner />
                  <JourneySection />
                </div>
              )}
              {view === "ai" && <AiSupportSection />}
              {view === "community" && <CommunitySection />}
              {view === "guide" && <GuideSection />}
              {view === "profile" && <ProfileSection />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="hidden lg:block mt-auto border-t border-border/70 px-10 py-5">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-3">
            <p className="text-[11px] text-muted-foreground">
              ProofPath — a digital companion concept for Be Bodywise customers · Mosaic Wellness. Educational
              information only, not medical advice.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <button onClick={() => setView("profile")} className="hover:text-foreground">
                Privacy
              </button>
              <button onClick={() => setView("guide")} className="hover:text-foreground">
                Product guide
              </button>
              <button onClick={() => setNotifOpen(true)} className="hover:text-foreground">
                Notifications
              </button>
            </div>
          </div>
        </footer>
      </div>

      <BottomNav />
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
      {showOnboarding && <Onboarding />}
    </div>
  );
}
