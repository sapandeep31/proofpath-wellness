"use client";

import { cn } from "@/lib/utils";

// ---------------- ProofPath identity ----------------

export function ProofPathMark({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#314C3C" />
      <path
        d="M7 23 C11 21, 12 17, 16 15 C20 13, 21 10, 25 8"
        stroke="#DCE7D8"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="7" cy="23" r="2.2" fill="#E8C9C5" />
      <circle cx="16" cy="15" r="2.2" fill="#FFFFFF" />
      <circle cx="25" cy="8" r="2.2" fill="#DCE7D8" />
    </svg>
  );
}

export function ProofPathWordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <ProofPathMark size={compact ? 28 : 34} />
      <div className="leading-none">
        <span className={cn("font-display tracking-tight text-foreground", compact ? "text-lg" : "text-[21px]")}>
          Proof<span className="text-primary">Path</span>
        </span>
        {!compact && (
          <span className="block text-[10.5px] text-muted-foreground mt-0.5 tracking-wide">
            Your journey. Your progress. Your next step.
          </span>
        )}
      </div>
    </div>
  );
}

// Elegant text-based placeholder for the Be Bodywise brand (spec 1.2 — marked as placeholder)
export function BeBodywiseBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5",
        className
      )}
      title="Temporary brand placeholder — replace with the official Be Bodywise logo"
    >
      <span className={cn("font-semibold tracking-wide text-foreground", compact ? "text-[11px]" : "text-xs")}>
        Be Bodywise
      </span>
      {!compact && (
        <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground border-l border-border pl-2">
          brand placeholder
        </span>
      )}
    </div>
  );
}

export function MosaicLine({ className }: { className?: string }) {
  return (
    <span className={cn("text-[10.5px] text-muted-foreground", className)}>
      A companion concept for Be Bodywise · <span className="italic">Mosaic Wellness</span>
    </span>
  );
}

// ---------------- Avatar ----------------

export function Avatar({
  name,
  color = "#314C3C",
  size = 36,
  className,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials || "·"}
    </div>
  );
}

// ---------------- Product artwork (reliable, premium SVG illustrations) ----------------

const CATEGORY_TINTS: Record<string, string> = {
  Skincare: "#DCE7D8",
  "Hair Care": "#E9E2F2",
  "Body Care": "#E8C9C5",
};

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return h;
}

export function ProductArt({
  artKey,
  hue,
  category,
  seed = "",
  size = 96,
  className,
}: {
  artKey: string;
  hue: number;
  category?: string;
  seed?: string;
  size?: number;
  className?: string;
}) {
  const h = hue && hue > 0 ? hue : hashHue(seed);
  const tint = category ? CATEGORY_TINTS[category] ?? "#DCE7D8" : "#DCE7D8";
  const body = `hsl(${h}, 32%, 88%)`;
  const bodyDeep = `hsl(${h}, 30%, 78%)`;
  const cap = `hsl(${h}, 26%, 34%)`;
  const glass = `hsl(${h}, 38%, 93%)`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl flex items-end justify-center shrink-0",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 100% at 20% 0%, #ffffff 0%, ${tint}66 55%, ${tint} 100%)`,
      }}
      aria-hidden="true"
    >
      <svg width={size * 0.62} height={size * 0.78} viewBox="0 0 64 80" className="drop-shadow-sm">
        {artKey === "jar" && (
          <g>
            <rect x="10" y="30" width="44" height="42" rx="10" fill={body} stroke={bodyDeep} strokeWidth="1.5" />
            <rect x="7" y="18" width="50" height="16" rx="7" fill={cap} />
            <rect x="16" y="40" width="32" height="18" rx="5" fill="#ffffff" opacity="0.55" />
            <rect x="13" y="34" width="6" height="30" rx="3" fill="#ffffff" opacity="0.4" />
          </g>
        )}
        {artKey === "bottle" && (
          <g>
            <rect x="22" y="26" width="20" height="8" rx="2" fill={cap} />
            <rect x="24" y="10" width="16" height="18" rx="3" fill={cap} />
            <rect x="14" y="32" width="36" height="40" rx="9" fill={glass} stroke={bodyDeep} strokeWidth="1.5" />
            <rect x="20" y="42" width="24" height="18" rx="4" fill={body} opacity="0.8" />
            <rect x="18" y="38" width="5" height="26" rx="2.5" fill="#ffffff" opacity="0.5" />
          </g>
        )}
        {artKey === "tube" && (
          <g>
            <rect x="26" y="8" width="12" height="10" rx="3" fill={cap} />
            <path d="M18 20 h28 l6 44 a8 8 0 0 1 -8 8 h-24 a8 8 0 0 1 -8 -8 z" fill={body} stroke={bodyDeep} strokeWidth="1.5" />
            <rect x="22" y="34" width="20" height="16" rx="4" fill="#ffffff" opacity="0.55" />
          </g>
        )}
        {artKey === "dropper" && (
          <g>
            <rect x="25" y="8" width="14" height="14" rx="4" fill={cap} />
            <rect x="28" y="22" width="8" height="10" fill={cap} opacity="0.85" />
            <rect x="18" y="32" width="28" height="40" rx="8" fill={glass} stroke={bodyDeep} strokeWidth="1.5" />
            <rect x="23" y="44" width="18" height="16" rx="4" fill={body} opacity="0.8" />
          </g>
        )}
        {artKey === "pump" && (
          <g>
            <path d="M30 6 h10 v6 h-6 v6" fill="none" stroke={cap} strokeWidth="4" strokeLinecap="round" />
            <rect x="26" y="18" width="12" height="10" rx="2" fill={cap} />
            <rect x="16" y="28" width="32" height="44" rx="9" fill={body} stroke={bodyDeep} strokeWidth="1.5" />
            <rect x="22" y="40" width="20" height="16" rx="4" fill="#ffffff" opacity="0.5" />
          </g>
        )}
        {(artKey === "sachet" || !artKey) && (
          <g>
            <path d="M14 14 h36 v48 l-6 8 h-24 l-6 -8 z" fill={body} stroke={bodyDeep} strokeWidth="1.5" />
            <path d="M14 22 h36" stroke={bodyDeep} strokeWidth="1" opacity="0.6" />
            <rect x="21" y="34" width="22" height="14" rx="4" fill="#ffffff" opacity="0.55" />
          </g>
        )}
      </svg>
    </div>
  );
}

// Progress ring used across dashboard & product pages
export function ProgressRing({
  percent,
  size = 56,
  stroke = 6,
  color = "#314C3C",
  track = "#E8E5DD",
  label,
  className,
}: {
  percent: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = percent == null ? null : Math.min(100, Math.max(0, percent));
  const offset = p == null ? c : c - (p / 100) * c;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {p != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}
      </svg>
      <span className="absolute text-[11px] font-semibold text-foreground">{label ?? (p != null ? `${Math.round(p)}%` : "—")}</span>
    </div>
  );
}
