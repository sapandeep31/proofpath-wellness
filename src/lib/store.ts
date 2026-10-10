"use client";

import { create } from "zustand";
import type {
  ChatMessageDTO,
  CommunityPostDTO,
  DashboardDTO,
  GuideProductDTO,
  NotificationDTO,
  ProductDTO,
  ProfileDTO,
} from "@/lib/types";

 

export interface SavedSummary {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export type ViewKey =
  | "home"
  | "products"
  | "journey"
  | "ai"
  | "community"
  | "guide"
  | "profile";

interface AppState {
  ready: boolean;
  view: ViewKey;
  selectedProductId: string | null;
  selectedJourneyId: string | null;
  productForm: { open: boolean; editId: string | null };
  journeyForm: { open: boolean; editId: string | null };
  checkInForm: { open: boolean; journeyId: string | null; existingId: string | null };
  profile: ProfileDTO | null;
  dashboard: DashboardDTO | null;
  products: ProductDTO[];
  journeys: any[];
  notifications: NotificationDTO[];
  posts: CommunityPostDTO[];
  guides: GuideProductDTO[];
  chat: ChatMessageDTO[];
  summaries: SavedSummary[];
  chatBusy: boolean;
  chatDemo: boolean;
  chatError: string | null;
  aiConfigured: boolean;

  setView: (v: ViewKey, opts?: { productId?: string | null; journeyId?: string | null }) => void;
  openProduct: (id: string) => void;
  openJourney: (id: string) => void;
  openProductForm: (editId: string | null) => void;
  closeProductForm: () => void;
  openJourneyForm: (editId: string | null) => void;
  closeJourneyForm: () => void;
  openCheckInForm: (journeyId: string, existingId?: string | null) => void;
  closeCheckInForm: () => void;
  refreshAll: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshJourneys: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshPosts: (filters?: { category?: string; concern?: string; stage?: string; q?: string }) => Promise<void>;
  refreshGuides: (filters?: { q?: string; category?: string }) => Promise<void>;
  refreshChat: () => Promise<void>;
  refreshSummaries: () => Promise<void>;
  sendChat: (message: string, productId: string | null, image?: { mime: string; data: string } | null) => Promise<boolean>;
  clearChat: () => Promise<void>;
  updateProfile: (patch: Record<string, unknown>) => Promise<ProfileDTO | null>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  saveAiKey: (apiKey: string, model?: string) => Promise<{ ok: boolean; message?: string }>;
  removeAiKey: () => Promise<void>;
  testAiKey: (apiKey?: string, model?: string) => Promise<{ ok: boolean; message: string }>;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    (err as Error & { payload?: unknown }).payload = data;
    throw err;
  }
  return data as T;
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  view: "home",
  selectedProductId: null,
  selectedJourneyId: null,
  productForm: { open: false, editId: null },
  journeyForm: { open: false, editId: null },
  checkInForm: { open: false, journeyId: null, existingId: null },
  profile: null,
  dashboard: null,
  products: [],
  journeys: [],
  notifications: [],
  posts: [],
  guides: [],
  chat: [],
  summaries: [],
  chatBusy: false,
  chatDemo: false,
  chatError: null,
  aiConfigured: false,

  setView: (v, opts) =>
    set({
      view: v,
      selectedProductId: opts?.productId !== undefined ? opts.productId : v === "products" ? null : get().selectedProductId,
      selectedJourneyId: opts?.journeyId !== undefined ? opts.journeyId : v === "journey" ? null : get().selectedJourneyId,
    }),

  openProduct: (id) => {
    set({ view: "products", selectedProductId: id });
    const p = get().profile;
    if (p) {
      const rv = [id, ...p.recentlyViewed.filter((x) => x !== id)].slice(0, 8);
      set({ profile: { ...p, recentlyViewed: rv } });
      api("/api/profile", { method: "PATCH", body: JSON.stringify({ recentlyViewed: rv }) }).catch(() => {});
    }
  },

  openJourney: (id) => set({ view: "journey", selectedJourneyId: id }),

  openProductForm: (editId) => set({ productForm: { open: true, editId } }),
  closeProductForm: () => set({ productForm: { open: false, editId: null } }),
  openJourneyForm: (editId) => set({ journeyForm: { open: true, editId } }),
  closeJourneyForm: () => set({ journeyForm: { open: false, editId: null } }),
  openCheckInForm: (journeyId, existingId = null) => set({ checkInForm: { open: true, journeyId, existingId } }),
  closeCheckInForm: () => set({ checkInForm: { open: false, journeyId: null, existingId: null } }),

  refreshAll: async () => {
    const boot = await api<{ profile: ProfileDTO }>("/api/bootstrap");
    set({ profile: boot.profile, aiConfigured: boot.profile.aiConfigured, ready: true });
    await Promise.all([
      get().refreshDashboard(),
      get().refreshProducts(),
      get().refreshJourneys(),
      get().refreshNotifications(),
      get().refreshGuides(),
      get().refreshSummaries(),
    ]);
  },

  refreshDashboard: async () => {
    const d = await api<DashboardDTO>("/api/dashboard");
    set({ dashboard: d, profile: d.profile, aiConfigured: d.profile.aiConfigured });
  },

  refreshProducts: async () => {
    const d = await api<{ products: ProductDTO[] }>("/api/products");
    set({ products: d.products });
  },

  refreshJourneys: async () => {
    const d = await api<{ journeys: any[] }>("/api/journeys");
    set({ journeys: d.journeys });
  },

  refreshNotifications: async () => {
    const d = await api<{ notifications: NotificationDTO[] }>("/api/notifications");
    set({ notifications: d.notifications });
  },

  refreshPosts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.concern) params.set("concern", filters.concern);
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.q) params.set("q", filters.q);
    const d = await api<{ posts: CommunityPostDTO[] }>(`/api/community?${params.toString()}`);
    set({ posts: d.posts });
  },

  refreshGuides: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    const d = await api<{ guides: GuideProductDTO[] }>(`/api/guide?${params.toString()}`);
    set({ guides: d.guides });
  },

  refreshChat: async () => {
    const d = await api<{ messages: ChatMessageDTO[]; aiConfigured: boolean; aiModel: string }>("/api/chat");
    set({ chat: d.messages, aiConfigured: d.aiConfigured, chatDemo: d.messages.length > 0 ? d.messages[d.messages.length - 1].demo : false });
  },

  refreshSummaries: async () => {
    const d = await api<{ summaries: SavedSummary[] }>("/api/chat/summary");
    set({ summaries: d.summaries });
  },

  sendChat: async (message, productId, image) => {
    const optimisticId = `tmp-${Date.now()}`;
    set((s) => ({
      chatBusy: true,
      chatError: null,
      chat: [
        ...s.chat,
        {
          id: optimisticId,
          role: "user" as const,
          content: message || "(shared a photo)",
          productId,
          imageMime: image?.mime ?? null,
          hasImage: !!image,
          demo: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    try {
      const d = await api<{ reply: ChatMessageDTO; demo: boolean }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          productId,
          imageMime: image?.mime,
          imageData: image?.data,
        }),
      });
      set((s) => ({
        chat: [...s.chat.filter((m) => m.id !== optimisticId), d.reply],
        chatBusy: false,
        chatDemo: d.demo,
      }));
      await get().refreshChat();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      set((s) => ({
        chat: s.chat.filter((m) => m.id !== optimisticId),
        chatBusy: false,
        chatError: msg,
      }));
      return false;
    }
  },

  clearChat: async () => {
    await api("/api/chat", { method: "DELETE" });
    set({ chat: [], chatError: null });
    await get().refreshChat();
  },

  updateProfile: async (patch) => {
    const d = await api<{ profile: ProfileDTO }>("/api/profile", { method: "PATCH", body: JSON.stringify(patch) });
    set({ profile: d.profile });
    return d.profile;
  },

  markAllRead: async () => {
    await api("/api/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) });
    await get().refreshNotifications();
  },

  markRead: async (id) => {
    await api("/api/notifications", { method: "PATCH", body: JSON.stringify({ id }) });
    await get().refreshNotifications();
  },

  saveAiKey: async (apiKey, model) => {
    try {
      await api("/api/settings/ai", { method: "PUT", body: JSON.stringify({ apiKey, model }) });
      await get().refreshChat();
      await get().refreshDashboard();
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Could not save key" };
    }
  },

  removeAiKey: async () => {
    await api("/api/settings/ai", { method: "DELETE" });
    await get().refreshChat();
    await get().refreshDashboard();
  },

  testAiKey: async (apiKey, model) => {
    try {
      const d = await api<{ ok: boolean; message: string }>("/api/settings/ai/test", {
        method: "POST",
        body: JSON.stringify({ apiKey, model }),
      });
      return d;
    } catch (e) {
      const err = e as Error & { payload?: { message?: string } };
      return { ok: false, message: err.payload?.message ?? err.message ?? "Test failed" };
    }
  },
}));

export { api };
