// Shared types used by both server routes and client UI

export type ProductStatus = "active" | "paused" | "finished" | "archived";
export type Visibility = "private" | "community";
export type UsageMethod = "manual" | "usage" | "visual";

export interface ProductDTO {
  id: string;
  name: string;
  brand: string;
  category: string;
  artKey: string;
  artHue: number;
  sizeValue: number | null;
  unit: string;
  purchaseDate: string | null;
  openingDate: string | null;
  startingQuantity: number | null;
  currentQuantity: number | null;
  quantityKnown: boolean;
  amountPerUse: number | null;
  frequency: string | null;
  applicationsPerWeek: number | null;
  price: number | null;
  purchaseLink: string | null;
  expiryDate: string | null;
  batchNumber: string | null;
  notes: string | null;
  instructions: string | null;
  ingredients: string | null;
  status: ProductStatus;
  firstReminderDays: number;
  secondReminderEnabled: boolean;
  secondReminderDays: number;
  finalReminderEnabled: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageLogDTO {
  id: string;
  productId: string;
  amountUsed: number;
  unit: string;
  method: UsageMethod;
  note: string | null;
  loggedAt: string;
}

export interface QuantityEstimate {
  known: boolean;
  percentUsed: number | null;
  dailyConsumption: number | null;
  weeklyConsumption: number | null;
  daysRemaining: number | null;
  runOutDate: string | null;
  basis: "logs" | "configured" | "mixed" | "none";
  basisLabel: string;
}

export interface ReminderPlanItem {
  type: string;
  title: string;
  body: string;
  scheduledFor: string;
  dedupeKey: string;
}

export interface JourneyDTO {
  id: string;
  title: string;
  productId: string | null;
  product?: ProductDTO | null;
  concern: string;
  startDate: string;
  baselineCurrent: string | null;
  baselineConcern: string | null;
  baselineSatisfaction: number | null;
  baselineNotes: string | null;
  goal: string | null;
  checkinFrequency: "daily" | "weekly" | "biweekly";
  privateNotes: string | null;
  visibility: Visibility;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInDTO {
  id: string;
  journeyId: string;
  date: string;
  overallRating: number | null;
  change: "improved" | "same" | "worsened" | "unsure" | null;
  consistency: string | null;
  reactions: "none" | "mild" | "moderate" | "severe" | null;
  reactionDetails: string | null;
  notes: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  type: string;
  category: "replenishment" | "checkin" | "community" | "system";
  title: string;
  body: string;
  productId: string | null;
  journeyId: string | null;
  scheduledFor: string;
  read: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface CommentDTO {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  isSample: boolean;
  createdAt: string;
}

export interface CommunityPostDTO {
  id: string;
  authorName: string;
  authorColor: string;
  title: string;
  content: string;
  category: string;
  productName: string | null;
  concern: string | null;
  stage: string | null;
  durationWeeks: number | null;
  observations: string | null;
  isSample: boolean;
  saved: boolean;
  reported: boolean;
  reportReason: string | null;
  createdAt: string;
  comments: CommentDTO[];
  reactions: { kind: string; count: number }[];
}

export interface GuideProductDTO {
  id: string;
  name: string;
  brand: string;
  category: string;
  tagline: string | null;
  description: string;
  ingredients: { name: string; fn: string }[];
  directions: string | null;
  precautions: string | null;
  sizeInfo: string | null;
  faqs: { q: string; a: string }[];
  purchaseLink: string | null;
  lastVerified: string | null;
  isSample: boolean;
}

export interface ChatMessageDTO {
  id: string;
  role: "user" | "model";
  content: string;
  productId: string | null;
  imageMime: string | null;
  hasImage: boolean;
  demo: boolean;
  createdAt: string;
}

export interface ReminderPrefs {
  checkin: boolean;
  replenishment: boolean;
  community: boolean;
  routine: boolean;
  secondReminder: boolean;
  finalReminder: boolean;
}

export interface NotifCats {
  replenishment: boolean;
  checkin: boolean;
  community: boolean;
  system: boolean;
}

export interface ProfileDTO {
  id: string;
  displayName: string;
  avatarColor: string;
  interests: string[];
  goal: string | null;
  onboarded: boolean;
  demoMode: boolean;
  reminderPrefs: ReminderPrefs;
  notifCats: NotifCats;
  recentlyViewed: string[];
  aiConfigured: boolean;
  aiKeySource: "env" | "saved" | null;
  aiKeyHint: string | null;
  aiModel: string;
}

export interface DashboardDTO {
  profile: ProfileDTO;
  activeProducts: (ProductDTO & { estimate: QuantityEstimate })[];
  journeys: (JourneyDTO & { lastCheckIn: CheckInDTO | null; checkInCount: number; nextDue: string | null })[];
  supplyOverview: { product: ProductDTO; estimate: QuantityEstimate; message: string; tone: "low" | "soon" | "ok" }[];
  upcomingReminders: NotificationDTO[];
  recentCheckIns: (CheckInDTO & { journeyTitle: string })[];
  recentNotifications: NotificationDTO[];
  weeklyReflection: {
    monthCount: number;
    positiveCount: number;
    changeCounts: Record<string, number>;
    avgRating: number | null;
    lastCheckInDate: string | null;
    message: string;
    hasData: boolean;
  };
  totalProducts: number;
}

export const CATEGORIES = ["Skincare", "Hair Care", "Body Care"] as const;
export const UNITS = ["mL", "L", "g", "kg", "pieces", "capsules", "tablets"] as const;
export const CONCERNS = [
  "Dryness",
  "Acne & breakouts",
  "Texture & pores",
  "Hair fall",
  "Frizz & shine",
  "Sensitive skin",
  "Dull skin",
  "Body moisturising",
  "Other",
] as const;

export const INTEREST_OPTIONS = [
  "Skincare",
  "Hair care",
  "Body care",
  "Product routine management",
  "Ingredient education",
  "Personal progress tracking",
  "Product replenishment",
] as const;

export const GOAL_OPTIONS = [
  "Understand my product experience",
  "Track changes over time",
  "Maintain a consistent routine",
  "Get guidance when something feels wrong",
  "Never run out of my essentials",
  "Learn from other people's experiences",
] as const;

export const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  checkin: true,
  replenishment: true,
  community: true,
  routine: true,
  secondReminder: true,
  finalReminder: false,
};

export const DEFAULT_NOTIF_CATS: NotifCats = {
  replenishment: true,
  checkin: true,
  community: true,
  system: true,
};
