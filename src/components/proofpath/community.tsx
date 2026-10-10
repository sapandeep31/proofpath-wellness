"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Flag,
  Heart,
  Lightbulb,
  MessageCircle,
  PenLine,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar } from "./brand";
import { SearchBar } from "./shell";
import { EmptyCard, SampleBadge } from "./dashboard";

 

const CATEGORY_LABELS: Record<string, string> = {
  skincare: "Skincare",
  haircare: "Hair care",
  bodycare: "Body care",
};
const STAGE_LABELS: Record<string, string> = {
  "just-started": "Just started",
  "one-month": "About a month in",
  "three-months": "Around 3 months",
  "long-term": "Long term",
};
const REACTION_META: Record<string, { label: string; icon: typeof Heart; cls: string }> = {
  supportive: { label: "Supportive", icon: Heart, cls: "text-[#7A4A44] bg-rose-soft" },
  insightful: { label: "Insightful", icon: Lightbulb, cls: "text-primary bg-sage/70" },
  "been-there": { label: "Been there", icon: Sparkles, cls: "text-[#5B4A6E] bg-lavender" },
};

export function CommunitySection() {
  const { posts, refreshPosts, profile } = useApp();
  const { toast } = useToast();
  const [category, setCategory] = useState("all");
  const [stage, setStage] = useState("all");
  const [q, setQ] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    refreshPosts({
      category: category === "all" ? "" : category,
      stage: stage === "all" ? "" : stage,
      q,
    });
     
  }, [category, stage, q]);

  return (
    <div>
      <div className="rounded-3xl bg-gradient-to-br from-[#F6EBE9] via-white to-[#EEF3EC] border border-border p-8 mb-8">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-border px-3.5 py-1.5 text-xs font-medium text-primary mb-4">
            <Users className="h-3.5 w-3.5" /> The ProofPath Circle
          </div>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight text-balance">
            Different journeys. Shared experiences. More informed choices.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Real people sharing what they noticed — voluntarily, privately by default, and never as medical evidence.
            What works for one person may not work for you.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="lg:w-80">
          <SearchBar value={q} onChange={setQ} placeholder="Search experiences…" />
        </div>
        <div className="flex gap-2 flex-wrap flex-1">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[150px] h-10 rounded-full bg-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="skincare">Skincare</SelectItem>
              <SelectItem value="haircare">Hair care</SelectItem>
              <SelectItem value="bodycare">Body care</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-[170px] h-10 rounded-full bg-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any stage</SelectItem>
              <SelectItem value="just-started">Just started</SelectItem>
              <SelectItem value="one-month">About a month</SelectItem>
              <SelectItem value="three-months">Around 3 months</SelectItem>
              <SelectItem value="long-term">Long term</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowComposer(true)} className="rounded-full gap-2 bg-primary hover:bg-primary/90 ml-auto">
            <PenLine className="h-4 w-4" /> Share an experience
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <AnimatePresence>
          {posts.map((p, i) => (
            <PostCard
              key={p.id}
              post={p}
              index={i}
              expanded={expanded === p.id}
              onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {posts.length === 0 && (
        <EmptyCard
          icon={Users}
          title="No experiences match"
          body="Try clearing the filters — or be the first to share your journey with the Circle."
          action={
            <Button onClick={() => setShowComposer(true)} className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Share an experience
            </Button>
          }
        />
      )}

      <ComposerDialog open={showComposer} onClose={() => setShowComposer(false)} />

      <div className="mt-8 rounded-2xl bg-white border border-border p-5 flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-sage/70 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Community guidelines</h3>
          <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-1">
            Share your own experience, not prescriptions for others. Posts here are personal stories — never clinical
            evidence. No harassment, spam, misleading health claims, or personal information about anyone. Report
            anything that concerns you using the flag on any post; reports are taken seriously and reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, index, expanded, onToggle }: { post: any; index: number; expanded: boolean; onToggle: () => void }) {
  const { refreshPosts } = useApp();
  const { toast } = useToast();
  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const react = async (kind: string) => {
    try {
      await api(`/api/community/${post.id}/reactions`, { method: "POST", body: JSON.stringify({ kind }) });
      await refreshPosts();
    } catch {
      toast({ title: "Could not react", variant: "destructive" });
    }
  };

  const toggleSave = async () => {
    try {
      await api(`/api/community/${post.id}`, { method: "PATCH", body: JSON.stringify({ action: "save", saved: !post.saved }) });
      await refreshPosts();
    } catch {
      toast({ title: "Could not save post", variant: "destructive" });
    }
  };

  const addComment = async () => {
    if (comment.trim().length < 2) return;
    setBusy(true);
    try {
      await api(`/api/community/${post.id}/comments`, { method: "POST", body: JSON.stringify({ content: comment.trim() }) });
      setComment("");
      await refreshPosts();
    } catch (e) {
      toast({ title: "Could not comment", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removePost = async () => {
    if (!confirm("Delete this post? Comments on it will also be removed.")) return;
    try {
      await api(`/api/community/${post.id}`, { method: "DELETE" });
      await refreshPosts();
      toast({ title: "Post deleted" });
    } catch {
      toast({ title: "Could not delete", variant: "destructive" });
    }
  };

  const isOwn = !post.isSample;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="bg-white rounded-2xl border border-border shadow-soft p-6"
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={post.authorName} color={post.authorColor} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{post.authorName}</p>
            {post.isSample && <SampleBadge />}
            {!post.isSample && (
              <span className="text-[9px] uppercase tracking-wide rounded-full bg-sage/60 text-primary px-2 py-0.5 font-semibold">
                You
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {CATEGORY_LABELS[post.category] ?? post.category}
            {post.durationWeeks ? ` · ${post.durationWeeks} weeks in` : ""}
            {post.stage ? ` · ${STAGE_LABELS[post.stage] ?? post.stage}` : ""} ·{" "}
            {new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSave}
            aria-label={post.saved ? "Remove bookmark" : "Save post"}
            className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors", post.saved ? "text-primary bg-sage/60" : "text-muted-foreground hover:bg-muted")}
          >
            <Bookmark className="h-4 w-4" fill={post.saved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setShowReport(true)}
            aria-label="Report post"
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
          {isOwn && (
            <button
              onClick={removePost}
              aria-label="Delete your post"
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <h3 className="font-display text-xl mt-4 leading-snug">{post.title}</h3>
      <p className={cn("text-[13.5px] text-foreground/85 leading-relaxed mt-2 whitespace-pre-wrap", !expanded && "line-clamp-4")}>
        {post.content}
      </p>
      {post.observations && expanded && (
        <div className="mt-3 rounded-xl bg-[#FAF8F3] border border-border/70 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Self-reported observations</p>
          <p className="text-[13px] mt-1">{post.observations}</p>
        </div>
      )}
      {post.productName && (
        <p className="text-xs text-muted-foreground mt-2.5">
          Product mentioned: <span className="text-foreground font-medium">{post.productName}</span>
        </p>
      )}
      {(post.content.length > 220 || post.observations) && (
        <button onClick={onToggle} className="text-xs font-medium text-primary hover:underline mt-2">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <div className="flex items-center gap-1.5 mt-4 flex-wrap">
        {Object.entries(REACTION_META).map(([kind, meta]) => {
          const r = post.reactions.find((x: any) => x.kind === kind);
          const count = r?.count ?? 0;
          return (
            <button
              key={kind}
              onClick={() => react(kind)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.03]",
                meta.cls,
                count === 0 && "opacity-60"
              )}
              aria-label={`${meta.label} reaction`}
            >
              <meta.icon className="h-3.5 w-3.5" fill={kind === "supportive" && count > 0 ? "currentColor" : "none"} />
              {count > 0 ? count : meta.label}
            </button>
          );
        })}
        <button
          onClick={() => setShowComments((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors ml-auto"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t border-border/70 space-y-3">
              {post.comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.authorName} color="#777970" size={30} />
                  <div className="flex-1 rounded-xl bg-[#FAF8F3] border border-border/60 px-3.5 py-2.5">
                    <p className="text-xs font-semibold">
                      {c.authorName}
                      {c.isSample && <span className="ml-1.5 text-[9px] uppercase tracking-wide text-muted-foreground font-medium">sample</span>}
                    </p>
                    <p className="text-[13px] mt-0.5 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Add a supportive reply…"
                  className="h-10 rounded-full bg-[#FAF8F3] text-[13px]"
                />
                <Button onClick={addComment} disabled={busy || comment.trim().length < 2} size="icon" className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shrink-0" aria-label="Send reply">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportDialog open={showReport} onClose={() => setShowReport(false)} postId={post.id} />
    </motion.article>
  );
}

/* ------------------------------ Composer ------------------------------ */

function ComposerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, refreshPosts } = useApp();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    title: "",
    content: "",
    category: "skincare",
    productName: "",
    concern: "",
    stage: "one-month",
    durationWeeks: "",
    observations: "",
  });
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (open) {
      setConsent(false);
      setF({ title: "", content: "", category: "skincare", productName: "", concern: "", stage: "one-month", durationWeeks: "", observations: "" });
    }
  }, [open]);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (f.title.trim().length < 3) return toast({ title: "Give your post a title", variant: "destructive" });
    if (f.content.trim().length < 20) return toast({ title: "Write a little more (at least 20 characters)", variant: "destructive" });
    setBusy(true);
    try {
      await api("/api/community", {
        method: "POST",
        body: JSON.stringify({
          ...f,
          durationWeeks: f.durationWeeks ? Number(f.durationWeeks) : null,
          visibility: "community",
          confirmed: consent,
        }),
      });
      await refreshPosts();
      toast({ title: "Shared with the Circle", description: "You can edit or withdraw it any time." });
      onClose();
    } catch (e) {
      const err = e as Error & { payload?: { message?: string } };
      if (err.payload && (err.payload as any).error === "consent-required") {
        toast({ title: "Please confirm to publish", description: err.payload.message, variant: "destructive" });
      } else {
        toast({ title: "Could not publish", description: err.message, variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-[#FAF8F3] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Share an experience</DialogTitle>
          <DialogDescription>
            Your story, in your words. Private journeys are never auto-shared — publishing always needs your explicit
            confirmation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Title</Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder='e.g. "My four-week skincare journal"' maxLength={120} className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Your experience</Label>
            <Textarea value={f.content} onChange={(e) => set("content", e.target.value)} rows={5} placeholder="What you noticed, what stayed the same, what you learned…" className="bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Category</Label>
              <Select value={f.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="skincare">Skincare</SelectItem>
                  <SelectItem value="haircare">Hair care</SelectItem>
                  <SelectItem value="bodycare">Body care</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Journey stage</Label>
              <Select value={f.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="just-started">Just started</SelectItem>
                  <SelectItem value="one-month">About a month in</SelectItem>
                  <SelectItem value="three-months">Around 3 months</SelectItem>
                  <SelectItem value="long-term">Long term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Product name (optional)</Label>
              <Input value={f.productName} onChange={(e) => set("productName", e.target.value)} placeholder="Only if you want to share it" className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Weeks into your journey (optional)</Label>
              <Input type="number" min="1" max="520" value={f.durationWeeks} onChange={(e) => set("durationWeeks", e.target.value)} className="bg-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Self-reported observations (optional)</Label>
            <Textarea value={f.observations} onChange={(e) => set("observations", e.target.value)} rows={2} placeholder="A short factual summary of what changed for you…" className="bg-white" />
          </div>

          <div className="rounded-xl bg-lavender-soft border border-border p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#314C3C]"
              />
              <span className="text-[12.5px] leading-relaxed text-foreground/85">
                I understand that publishing shares this post with The ProofPath Circle under my display name (
                <span className="font-semibold">{profile?.displayName ?? "Anonymous"}</span>
                ). My private journeys, private notes and AI conversations are <span className="font-semibold">never</span>{" "}
                shared. I can edit or withdraw this post at any time. I confirm my post contains no phone numbers, email
                addresses, or private information about anyone.
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="rounded-full bg-primary hover:bg-primary/90 gap-2">
            {busy ? "Publishing…" : <><Send className="h-4 w-4" /> Publish to the Circle</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Report ------------------------------- */

const REPORT_REASONS = [
  { k: "medical-advice", label: "Harmful medical advice" },
  { k: "harassment", label: "Harassment or bullying" },
  { k: "spam", label: "Spam" },
  { k: "misleading", label: "False or misleading health claims" },
  { k: "non-consensual", label: "Non-consensual images" },
  { k: "personal-info", label: "Personal information shared without permission" },
  { k: "other", label: "Something else" },
];

function ReportDialog({ open, onClose, postId }: { open: boolean; onClose: () => void; postId: string }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      const d = await api<{ message: string }>(`/api/community/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "report", reason }),
      });
      toast({ title: "Report received", description: d.message });
      onClose();
    } catch (e) {
      toast({ title: "Could not report", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-[#FAF8F3] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Report this post</DialogTitle>
          <DialogDescription>Why are you reporting it? Reports are reviewed by moderators.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.k}
              onClick={() => setReason(r.k)}
              className={cn(
                "w-full text-left rounded-xl border px-4 py-2.5 text-[13px] transition-colors",
                reason === r.k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white hover:border-primary/40"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={!reason || busy} className="rounded-full bg-primary hover:bg-primary/90">
            {busy ? "Reporting…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
