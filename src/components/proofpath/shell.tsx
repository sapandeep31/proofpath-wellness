"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  Bookmark,
  Check,
  CheckCheck,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Heart,
  Home,
  Info,
  LayoutGrid,
  MessageCircleHeart,
  Package,
  Search,
  Settings,
  Sparkles,
  BookOpen,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApp, type ViewKey } from "@/lib/store";
import { BeBodywiseBadge, ProofPathMark, ProofPathWordmark } from "./brand";
import { fmtDateTime } from "@/lib/calc";
import { Avatar } from "./brand";

const NAV: { key: ViewKey; label: string; icon: typeof Home; hint: string }[] = [
  { key: "home", label: "Home", icon: Home, hint: "Your dashboard" },
  { key: "products", label: "My Products", icon: Package, hint: "Inventory & supply" },
  { key: "journey", label: "My Journey", icon: LayoutGrid, hint: "Progress tracking" },
  { key: "ai", label: "AI Skin Support", icon: Sparkles, hint: "Ask Skin Guide" },
  { key: "community", label: "Community", icon: Heart, hint: "The ProofPath Circle" },
  { key: "guide", label: "Product Guide", icon: BookOpen, hint: "Ingredients & education" },
  { key: "profile", label: "Profile & Settings", icon: Settings, hint: "Preferences & privacy" },
];

const MOBILE_NAV: { key: ViewKey; short: string }[] = [
  { key: "home", short: "Home" },
  { key: "products", short: "Products" },
  { key: "journey", short: "Journey" },
  { key: "ai", short: "Skin AI" },
  { key: "community", short: "Circle" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { view, setView, profile } = useApp();
  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r border-border bg-[#F4F1E9] transition-[width] duration-300 ease-out",
        collapsed ? "w-[76px]" : "w-[264px]"
      )}
    >
      <div className={cn("px-4 pt-6 pb-4", collapsed && "px-3 flex justify-center")}>
        {collapsed ? <ProofPathMark size={34} /> : <ProofPathWordmark />}
      </div>
      <div className={cn("px-4 pb-4", collapsed && "px-3 flex justify-center")}>
        {collapsed ? null : <BeBodywiseBadge compact />}
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin" aria-label="Main navigation">
        {NAV.map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-foreground/80 hover:bg-white hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              {!collapsed && (
                <span className="flex flex-col items-start leading-tight">
                  <span>{item.label}</span>
                  <span className={cn("text-[10.5px]", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {item.hint}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/70">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && profile && (
          <div className="flex items-center gap-2.5 px-3 pt-2 pb-1">
            <Avatar name={profile.displayName} color={profile.avatarColor} size={30} />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{profile.displayName}</p>
              <p className="text-[10px] text-muted-foreground">
                {profile.demoMode ? "Demo mode" : "Your workspace"}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileTopBar({ onOpenNotifications }: { onOpenNotifications: () => void }) {
  const { profile, view } = useApp();
  const current = NAV.find((n) => n.key === view);
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-[#FAF8F3]/90 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <ProofPathWordmark compact />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 hidden max-w-[120px] truncate sm:block">
            {current?.label}
          </span>
          <NotificationBellButton onClick={onOpenNotifications} />
          {profile && (
            <button onClick={() => useApp.getState().setView("profile")} aria-label="Open profile">
              <Avatar name={profile.displayName} color={profile.avatarColor} size={32} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { view, setView } = useApp();
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {MOBILE_NAV.map(({ key, short }) => {
          const item = NAV.find((n) => n.key === key)!;
          const active = view === key;
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] min-h-[56px] transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} />
              <span className="leading-none">{short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function NotificationBellButton({ onClick }: { onClick: () => void }) {
  const { notifications } = useApp();
  const unread = notifications.filter((n) => !n.read && new Date(n.scheduledFor).getTime() <= Date.now()).length;
  return (
    <button
      onClick={onClick}
      className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-white transition-colors"
      aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
    >
      <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

// ---------------- Notification centre (desktop popover / mobile sheet) ----------------

export function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markRead, markAllRead, setView, openProduct, openJourney } = useApp();
  const [tab, setTab] = useState<"due" | "upcoming">("due");
  const now = Date.now();

  const due = notifications.filter((n) => new Date(n.scheduledFor).getTime() <= now);
  const upcoming = notifications.filter((n) => new Date(n.scheduledFor).getTime() > now);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const list = tab === "due" ? due : upcoming;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6" role="dialog" aria-label="Notification centre">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lift border border-border animate-pop-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg leading-tight">Notifications</h2>
            <p className="text-xs text-muted-foreground">Calm, useful reminders — never pressure.</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs gap-1">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close notifications">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-5 pt-3 flex gap-2">
          {(["due", "upcoming"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "due" ? `Active (${due.length})` : `Upcoming (${upcoming.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2">
          {list.length === 0 && (
            <div className="text-center py-14 px-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-sage/60 flex items-center justify-center mb-3">
                <BellOff className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">
                {tab === "due" ? "You're all caught up" : "Nothing scheduled yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {tab === "due"
                  ? "Reminders appear here when products are running low or check-ins are due."
                  : "As supply estimates update, upcoming reminders will be scheduled here."}
              </p>
            </div>
          )}
          {list.map((n) => {
            const catColor =
              n.category === "replenishment"
                ? "bg-sage/70 text-primary"
                : n.category === "checkin"
                  ? "bg-lavender/70 text-accent-foreground"
                  : n.category === "community"
                    ? "bg-rose-soft text-[#7A4A44]"
                    : "bg-muted text-muted-foreground";
            return (
              <button
                key={n.id}
                onClick={async () => {
                  if (!n.read) await markRead(n.id);
                  if (n.productId) {
                    onClose();
                    openProduct(n.productId);
                  } else if (n.journeyId) {
                    onClose();
                    openJourney(n.journeyId);
                  } else if (n.category === "community") {
                    onClose();
                    setView("community");
                  }
                }}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-colors hover:bg-[#FAF8F3]",
                  n.read ? "border-border/60 opacity-70" : "border-border bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 h-2.5 w-2.5 rounded-full shrink-0", !n.read ? "bg-primary" : "bg-border")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold leading-snug">{n.title}</p>
                      <span className={cn("text-[9px] uppercase tracking-wide rounded-full px-2 py-0.5 font-semibold", catColor)}>
                        {n.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {tab === "due" ? fmtDateTime(n.scheduledFor) : `Scheduled ${fmtDateTime(n.scheduledFor)}`}
                      {n.isDemo && <span className="ml-1 italic">sample</span>}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="px-5 py-3 border-t border-border text-[10.5px] text-muted-foreground flex items-center gap-1.5">
          <Info className="h-3 w-3" /> In-app reminders only — they don&apos;t send email or browser push.
        </p>
      </div>
    </div>
  );
}

// Small search header used on Community & Guide pages
export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-9 h-11 bg-white rounded-full border-border"
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { Bookmark, CircleAlert, Check, MessageCircleHeart };
