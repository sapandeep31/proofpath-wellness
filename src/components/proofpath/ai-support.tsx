"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BookOpenCheck,
  ImagePlus,
  Info,
  KeyRound,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, useApp } from "@/lib/store";
import { Avatar } from "./brand";
import type { SavedSummary } from "@/lib/store";

 

const SUGGESTIONS = [
  "I noticed bumps after starting a new product.",
  "My skin feels itchy after applying a moisturiser.",
  "I have redness after using an exfoliating product.",
  "Help me understand this ingredient list.",
  "Help me prepare questions for a dermatologist.",
];

export function AiSupportSection() {
  const { chat, chatBusy, chatError, sendChat, clearChat, products, profile, aiConfigured, refreshChat, refreshSummaries } = useApp();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [productId, setProductId] = useState<string>("none");
  const [image, setImage] = useState<{ mime: string; data: string; preview: string } | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [showSummaries, setShowSummaries] = useState(false);
  const [summaries, setSummaries] = useState<SavedSummary[]>([]);
  const [savingSummary, setSavingSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshChat();
     
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, chatBusy]);

  const activeProduct = products.find((p) => p.id === productId && productId !== "none");

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message && !image) return;
    setInput("");
    const img = image;
    setImage(null);
    await sendChat(message, productId !== "none" ? productId : null, img ? { mime: img.mime, data: img.data } : null);
  };

  const pickImage = (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please choose one under 3 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const [meta, data] = result.split(",");
      const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
      setImage({ mime, data, preview: result });
    };
    reader.readAsDataURL(file);
  };

  const saveSummary = async () => {
    setSavingSummary(true);
    try {
      await api("/api/chat/summary", { method: "POST" });
      await refreshSummaries();
      toast({ title: "Private summary saved", description: "Find it any time under Saved summaries." });
    } catch (e) {
      toast({ title: "Could not save summary", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setSavingSummary(false);
    }
  };

  const openSummaries = async () => {
    await refreshSummaries();
    setSummaries(useApp.getState().summaries);
    setShowSummaries(true);
  };

  const hasMessages = chat.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-12 w-12 rounded-2xl bg-lavender flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-[#5B4A6E]" strokeWidth={1.7} />
          </div>
          <div>
            <h1 className="font-display text-3xl">Ask Skin Guide</h1>
            <p className="text-sm text-muted-foreground">
              Tell us what you&apos;re experiencing. Let&apos;s work out a safe next step.
            </p>
          </div>
          <div className="ml-auto flex gap-1.5">
            <Button variant="outline" size="sm" onClick={openSummaries} className="rounded-full gap-1.5 bg-transparent">
              <Save className="h-3.5 w-3.5" /> Saved summaries
            </Button>
            {hasMessages && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5 bg-transparent text-destructive hover:text-destructive"
                onClick={async () => {
                  if (!confirm("Clear this conversation? Saved summaries are kept.")) return;
                  await clearChat();
                  toast({ title: "Conversation cleared" });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AI status banner */}
      {!aiConfigured && (
        <div className="rounded-2xl border border-border bg-lavender-soft p-4 mb-4 flex items-start gap-3">
          <KeyRound className="h-5 w-5 text-[#5B4A6E] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold">Demo assistant active</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Add a Google Gemini API key to make this assistant fully live — it takes under a minute. Your key is stored
              server-side only and never exposed to the browser. Until then, the clearly-labelled demo assistant below
              answers with scripted guidance.
            </p>
            <Button size="sm" onClick={() => setShowKeyDialog(true)} className="mt-2.5 rounded-full gap-1.5 bg-primary hover:bg-primary/90 h-8">
              <KeyRound className="h-3.5 w-3.5" /> Connect Gemini API key
            </Button>
          </div>
        </div>
      )}

      {/* Limitations + emergency route */}
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl border border-border bg-white p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">What this is:</span> a safety-conscious educational
            assistant. It is not a doctor or dermatologist, cannot diagnose, and won&apos;t prescribe. Timing alone can&apos;t
            prove a product caused a reaction.
          </p>
        </div>
        <div className="rounded-2xl border border-destructive/25 bg-[#FBF1F0] p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#7A4A44] leading-relaxed">
            <span className="font-semibold">For emergencies:</span> difficulty breathing, throat or tongue swelling,
            fainting, or rapidly worsening symptoms need <span className="font-semibold">emergency medical help
            immediately</span> — don&apos;t wait for this app.
          </p>
        </div>
      </div>

      {/* Chat card */}
      <div className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
        <div ref={scrollRef} className="h-[440px] overflow-y-auto scrollbar-thin p-5 space-y-4">
          {!hasMessages && (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-lavender flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-[#5B4A6E]" />
              </div>
              <h3 className="font-display text-xl">Hello, {profile?.displayName ?? "friend"}.</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                Describe what you&apos;re noticing — redness, itching, bumps, dryness — and I&apos;ll ask a couple of short
                questions, share cautious educational context, and help you find a safe next step. I never diagnose or
                judge.
              </p>
            </div>
          )}

          {chat.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "model" && (
                <div className="h-8 w-8 rounded-full bg-lavender flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-[#5B4A6E]" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-[#FAF8F3] border border-border rounded-bl-md"
                )}
              >
                {m.role === "user" && (m as any)._preview ? (
                   
                  <img src={(m as any)._preview} alt="Shared" className="rounded-lg mb-2 max-h-44 w-auto" />
                ) : null}
                {m.hasImage && m.role === "user" && !(m as any)._preview && (
                  <p className="text-xs opacity-70 mb-1 italic">Photo attached</p>
                )}
                <Markdownish text={m.content} />
                {m.demo && m.role === "model" && (
                  <span className="block mt-2 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    demo assistant · scripted response
                  </span>
                )}
              </div>
              {m.role === "user" && profile && (
                <Avatar name={profile.displayName} color={profile.avatarColor} size={32} />
              )}
            </motion.div>
          ))}

          {chatBusy && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-lavender flex items-center justify-center shrink-0">
                <Loader2 className="h-4 w-4 text-[#5B4A6E] animate-spin" />
              </div>
              <div className="bg-[#FAF8F3] border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-[13px] text-muted-foreground">Thinking carefully…</p>
              </div>
            </div>
          )}

          {chatError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3.5 text-[13px] text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                {chatError}
                <button onClick={() => useApp.setState({ chatError: null })} className="ml-2 underline">
                  dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        {!hasMessages && (
          <div className="px-5 pb-1 flex gap-2 overflow-x-auto scrollbar-thin">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="whitespace-nowrap rounded-full border border-border bg-[#FAF8F3] px-3.5 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Product context */}
        <div className="px-5 pt-3">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Product context (optional)</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 w-full h-10 rounded-xl border border-border bg-[#FAF8F3] px-3 text-[13px] focus:outline-2 focus:outline-ring"
          >
            <option value="none">No specific product</option>
            {products.filter((p) => p.status === "active" || p.status === "paused").map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {activeProduct && (
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1">
              <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
              The assistant will use only the verified details you saved for &ldquo;{activeProduct.name}&rdquo;
              {activeProduct.ingredients ? " (including its ingredient list)" : " — no ingredient list saved, and it will never invent one"}.
            </p>
          )}
        </div>

        {/* Input */}
        <div className="p-4">
          {image && (
            <div className="mb-3 relative inline-block">
              <img src={image.preview} alt="Attachment preview" className="h-20 rounded-xl border border-border" />
              <button
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-foreground text-white flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer shrink-0" title="Attach a photo (used with Gemini live mode)">
              <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])}
              />
            </label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Describe what you're experiencing…"
              className="h-11 rounded-xl bg-[#FAF8F3]"
              aria-label="Message"
            />
            <Button
              onClick={() => send()}
              disabled={chatBusy || (!input.trim() && !image)}
              className="h-11 rounded-xl px-5 gap-2 bg-primary hover:bg-primary/90 shrink-0"
            >
              {chatBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
            <p className="text-[10.5px] text-muted-foreground">
              Private conversation — never shown in the community. Photos are sent only to the AI service, never published.
            </p>
            <button
              onClick={saveSummary}
              disabled={savingSummary || !hasMessages}
              className="text-[11px] font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline inline-flex items-center gap-1"
            >
              {savingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookOpenCheck className="h-3 w-3" />}
              Save private summary
            </button>
          </div>
        </div>
      </div>

      {/* Route to medical help */}
      <div className="mt-5 rounded-2xl bg-white border border-border p-5 flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-rose-soft flex items-center justify-center shrink-0">
          <Stethoscope className="h-5 w-5 text-[#7A4A44]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">The right professional, at the right time</h3>
          <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-1">
            If symptoms are severe, rapidly worsening, widespread, painful or blistering, seek urgent professional
            assessment. For anything persistent or concerning, a doctor or dermatologist is the appropriate next step —
            your saved summary can help you prepare for that conversation.
          </p>
        </div>
      </div>

      {/* API key dialog */}
      <GeminiKeyDialog open={showKeyDialog} onClose={() => setShowKeyDialog(false)} />

      {/* Summaries dialog */}
      <Dialog open={showSummaries} onOpenChange={(o) => !o && setShowSummaries(false)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin bg-[#FAF8F3] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Saved summaries</DialogTitle>
            <DialogDescription>Private notes compiled from your AI conversations — useful for appointments.</DialogDescription>
          </DialogHeader>
          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No summaries yet. After chatting, tap &ldquo;Save private summary&rdquo;.
            </p>
          ) : (
            <div className="space-y-3">
              {summaries.map((s) => (
                <div key={s.id} className="rounded-xl bg-white border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <button
                      onClick={async () => {
                        await api(`/api/chat/summary?id=${s.id}`, { method: "DELETE" });
                        await refreshSummaries();
                        setSummaries(useApp.getState().summaries);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete summary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{new Date(s.createdAt).toLocaleString("en-GB")}</p>
                  <div className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap"><Markdownish text={s.content} /></div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Lightweight markdown-ish renderer for AI replies (bold, bullets, italics) */
function Markdownish({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const rendered = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
          seg.startsWith("**") && seg.endsWith("**") ? (
            <strong key={j}>{seg.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{seg.replace(/_/g, "")}</span>
          )
        );
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <span key={i} className="flex gap-2 my-0.5">
              <span className="text-primary mt-px">•</span>
              <span>{rendered.slice(1)}</span>
            </span>
          );
        }
        return (
          <span key={i} className="block my-0.5">
            {rendered.length ? rendered : "\u00A0"}
          </span>
        );
      })}
    </>
  );
}

/* ------------------------- Gemini key dialog ------------------------- */

export function GeminiKeyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useApp();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <DialogContent className="max-w-md bg-[#FAF8F3] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Connect Google Gemini</DialogTitle>
            <DialogDescription>
              Ask Skin Guide uses the official Gemini API. Paste an API key from{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                Google AI Studio
              </a>{" "}
              — it is stored server-side only (never in the browser) and can be removed at any time.
            </DialogDescription>
          </DialogHeader>
          <GeminiKeyForm onClose={onClose} currentHint={profile?.aiKeyHint ?? null} currentSource={profile?.aiKeySource ?? null} defaultModel={profile?.aiModel ?? "gemini-3.8-flash"} hasSaved={profile?.aiKeySource === "saved"} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function GeminiKeyForm({
  onClose,
  currentHint,
  currentSource,
  defaultModel,
  hasSaved,
}: {
  onClose: () => void;
  currentHint: string | null;
  currentSource: "env" | "saved" | null;
  defaultModel: string;
  hasSaved: boolean;
}) {
  const { saveAiKey, removeAiKey, testAiKey } = useApp();
  const { toast } = useToast();
  const [key, setKey] = useState("");
  const [model, setModel] = useState(defaultModel);
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const save = async () => {
    if (!key.trim()) {
      setResult({ ok: false, message: "Paste your Gemini API key first." });
      return;
    }
    setBusy("save");
    const r = await saveAiKey(key.trim(), model);
    setBusy(null);
    setResult(r.ok ? { ok: true, message: "Key saved. Ask Skin Guide is now live with Gemini." } : { ok: false, message: r.message ?? "Could not save key" });
    if (r.ok) {
      toast({ title: "Gemini connected", description: "AI Skin Support now uses your key for live guidance." });
      setTimeout(onClose, 1200);
    }
  };

  const test = async () => {
    setBusy("test");
    const r = await testAiKey(key.trim() || undefined, model);
    setBusy(null);
    setResult(r);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium">Gemini API key</label>
        <Input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza…"
          autoComplete="off"
          className="bg-white"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full h-10 rounded-xl border border-border bg-white px-3 text-[13px] focus:outline-2 focus:outline-ring"
        >
          <option value="gemini-3.8-flash">gemini-3.8-flash (recommended)</option>
          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
          <option value="gemini-2.5-pro">gemini-2.5-pro</option>
        </select>
      </div>

      {currentSource && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          A key is currently active ({currentSource === "env" ? "from environment" : "saved in settings"})
          {currentHint ? ` — ${currentHint}` : ""}.
        </p>
      )}

      {result && (
        <div className={cn("rounded-xl p-3 text-[13px] flex items-start gap-2", result.ok ? "bg-sage-soft text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/25")}>
          {result.ok ? <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
          {result.message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={busy != null} className="rounded-full gap-2 bg-primary hover:bg-primary/90 flex-1">
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Save &amp; connect
        </Button>
        <Button onClick={test} disabled={busy != null} variant="outline" className="rounded-full gap-2 bg-transparent">
          {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Test
        </Button>
        {hasSaved && (
          <Button
            onClick={async () => {
              await removeAiKey();
              toast({ title: "Key removed" });
              onClose();
            }}
            variant="outline"
            className="rounded-full text-destructive hover:text-destructive bg-transparent"
          >
            Remove
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Without a key, Ask Skin Guide runs in clearly-labelled demo mode with scripted, safety-first responses. With a
        key, responses are generated live by Google Gemini under strict safety instructions. Nothing you type here is
        ever shown to the community.
      </p>
    </div>
  );
}
