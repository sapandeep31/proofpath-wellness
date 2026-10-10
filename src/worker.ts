// Cloudflare Worker entrypoint for ProofPath (Mosaic Wellness Fellowship)
// Serves static assets via env.ASSETS and handles all API endpoints with Gemini AI integration.

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString();

// System instruction for Gemini AI (Safety-first Ask Skin Guide)
const SKIN_GUIDE_SYSTEM = `You are "Ask Skin Guide", a safety-conscious educational skincare support assistant inside ProofPath, a wellness companion app for Be Bodywise customers (Mosaic Wellness).

YOUR IDENTITY AND LIMITS:
- You are an educational assistant, NOT a doctor, dermatologist, or licensed medical professional. Never claim or imply otherwise.
- You provide general educational information only. You never diagnose conditions, never prescribe medication, and never give definitive medical conclusions.
- Timing alone cannot prove a product caused a reaction. Always keep this uncertainty visible.

HOW TO RESPOND:
1. Acknowledge the user's experience warmly and calmly, in plain supportive language.
2. If severe symptoms are described (difficulty breathing, swelling, dizziness, blistering, severe reaction), advise urgent emergency medical attention immediately.
3. For non-urgent concerns, ask 2-3 short, relevant questions (which product, when noticed, severity, whether paused).
4. Provide cautious educational possibilities, framed as general information.
5. Suggest avoiding further use of the suspected product until advice is obtained. Never recommend home remedies or testing more product on irritated skin.
6. When symptoms persist, recommend a qualified healthcare professional or pharmacist.
7. Use UK/Indian English spellings (moisturiser, colour). Keep answers warm, reassuring, concise.`;

// In-Memory Database store initialized with full fellowship seed data
function createInitialState() {
  const products = [
    {
      id: "prod_moisturiser",
      name: "Hydra Calm Daily Moisturiser",
      brand: "Be Bodywise",
      category: "Skincare",
      artKey: "jar",
      artHue: 150,
      sizeValue: 100,
      unit: "mL",
      purchaseDate: daysAgo(40),
      openingDate: daysAgo(35),
      startingQuantity: 100,
      currentQuantity: 30,
      quantityKnown: true,
      amountPerUse: 2,
      frequency: "twice-daily",
      applicationsPerWeek: 14,
      price: 449,
      expiryDate: new Date(Date.now() + 300 * DAY).toISOString(),
      batchNumber: "HC-240115",
      notes: "Use after cleansing, morning and night.",
      instructions: "Apply a pea-sized amount to cleansed face and neck. Avoid immediate eye area.",
      ingredients: "Aqua, Glycerin, Niacinamide, Ceramide NP, Squalane, Cetearyl Alcohol, Panthenol, Allantoin",
      status: "active",
      firstReminderDays: 7,
      secondReminderEnabled: true,
      secondReminderDays: 3,
      finalReminderEnabled: true,
      isDemo: true,
      createdAt: daysAgo(40),
      updatedAt: daysAgo(1),
    },
    {
      id: "prod_shampoo",
      name: "Anti-Hairfall Ritual Shampoo",
      brand: "Be Bodywise",
      category: "Hair Care",
      artKey: "pump",
      artHue: 30,
      sizeValue: 200,
      unit: "mL",
      purchaseDate: daysAgo(100),
      openingDate: daysAgo(93),
      startingQuantity: 200,
      currentQuantity: 14,
      quantityKnown: true,
      amountPerUse: 10,
      frequency: "custom",
      applicationsPerWeek: 1.4,
      price: 399,
      expiryDate: new Date(Date.now() + 150 * DAY).toISOString(),
      notes: "Massage into scalp, twice weekly.",
      instructions: "Massage into wet scalp, lather, rinse thoroughly.",
      ingredients: "Aqua, Coco-glucoside, Rosemary Leaf Extract, Caffeine, Panthenol, Citric Acid",
      status: "active",
      firstReminderDays: 7,
      secondReminderEnabled: true,
      secondReminderDays: 3,
      finalReminderEnabled: true,
      isDemo: true,
      createdAt: daysAgo(100),
      updatedAt: daysAgo(2),
    },
    {
      id: "prod_butter",
      name: "Deep Comfort Body Butter",
      brand: "Be Bodywise",
      category: "Body Care",
      artKey: "jar",
      artHue: 340,
      sizeValue: 150,
      unit: "g",
      purchaseDate: daysAgo(35),
      openingDate: daysAgo(30),
      startingQuantity: 150,
      currentQuantity: 90,
      quantityKnown: true,
      amountPerUse: 8,
      frequency: "daily",
      applicationsPerWeek: 7,
      price: 549,
      notes: "Focus on elbows, knees and shins.",
      instructions: "Massage into clean, dry skin until absorbed. Use daily after bathing.",
      ingredients: "Butyrospermum Parkii Butter, Glycerin, Urea, Coco-caprylate, Tocopherol",
      status: "active",
      firstReminderDays: 7,
      secondReminderEnabled: true,
      secondReminderDays: 3,
      finalReminderEnabled: true,
      isDemo: true,
      createdAt: daysAgo(35),
      updatedAt: daysAgo(3),
    },
  ];

  const journeys = [
    {
      id: "journey_butter",
      title: "Body moisturiser journey",
      productId: "prod_butter",
      concern: "Body moisturising",
      startDate: daysAgo(30),
      baselineCurrent: "Shins and elbows feel tight and flaky by the end of the day.",
      baselineConcern: "Dry, flaky patches on shins and arms",
      baselineSatisfaction: 2,
      baselineNotes: "Tracking if daily butter keeps skin comfortable through the season.",
      goal: "Keep my skin comfortable and hydrated all day",
      checkinFrequency: "weekly",
      privateNotes: "Check knees after morning walks.",
      visibility: "private",
      isDemo: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(7),
    },
    {
      id: "journey_shampoo",
      title: "Hair-care routine",
      productId: "prod_shampoo",
      concern: "Hair fall",
      startDate: daysAgo(56),
      baselineCurrent: "Noticed more hair shedding in the shower drain.",
      baselineConcern: "Increased hair fall while washing",
      baselineSatisfaction: 3,
      baselineNotes: "Starting gentler routine and tracking weekly.",
      goal: "Understand shedding pattern and keep consistent gentle routine",
      checkinFrequency: "weekly",
      privateNotes: null,
      visibility: "private",
      isDemo: true,
      createdAt: daysAgo(56),
      updatedAt: daysAgo(14),
    },
  ];

  const checkins = [
    {
      id: "c_1",
      journeyId: "journey_butter",
      date: daysAgo(28),
      overallRating: 3,
      change: "same",
      consistency: "most-days",
      reactions: "none",
      reactionDetails: null,
      notes: "Skin feels softer right after applying. No change in flakiness yet.",
      isDemo: true,
      createdAt: daysAgo(28),
    },
    {
      id: "c_2",
      journeyId: "journey_butter",
      date: daysAgo(21),
      overallRating: 3,
      change: "same",
      consistency: "every-day",
      reactions: "none",
      reactionDetails: null,
      notes: "Kept the routine daily. Shins still a little dry by evening.",
      isDemo: true,
      createdAt: daysAgo(21),
    },
    {
      id: "c_3",
      journeyId: "journey_butter",
      date: daysAgo(14),
      overallRating: 4,
      change: "improved",
      consistency: "every-day",
      reactions: "none",
      reactionDetails: null,
      notes: "Flakiness on shins looks much better this week.",
      isDemo: true,
      createdAt: daysAgo(14),
    },
    {
      id: "c_4",
      journeyId: "journey_butter",
      date: daysAgo(7),
      overallRating: 4,
      change: "improved",
      consistency: "every-day",
      reactions: "none",
      reactionDetails: null,
      notes: "Elbows feel smooth for the first time in months. Applying post-shower helps.",
      isDemo: true,
      createdAt: daysAgo(7),
    },
    {
      id: "c_5",
      journeyId: "journey_shampoo",
      date: daysAgo(35),
      overallRating: 3,
      change: "same",
      consistency: "most-days",
      reactions: "none",
      reactionDetails: null,
      notes: "Scalp feels clean and comfortable.",
      isDemo: true,
      createdAt: daysAgo(35),
    },
    {
      id: "c_6",
      journeyId: "journey_shampoo",
      date: daysAgo(14),
      overallRating: 4,
      change: "improved",
      consistency: "most-days",
      reactions: "none",
      reactionDetails: null,
      notes: "Wash-day shedding looks lower. Staying consistent.",
      isDemo: true,
      createdAt: daysAgo(14),
    },
  ];

  const notifications = [
    {
      id: "n_1",
      type: "replenishment-1",
      category: "replenishment",
      title: "Hydra Calm Daily Moisturiser is low",
      body: "Estimated runout in ~7 days based on twice-daily usage. Consider reordering.",
      productId: "prod_moisturiser",
      journeyId: null,
      scheduledFor: hoursAgo(12),
      read: false,
      isDemo: true,
      createdAt: hoursAgo(12),
    },
    {
      id: "n_2",
      type: "checkin",
      category: "checkin",
      title: "Weekly check-in reflection ready",
      body: "Reflect on how your skin responded to your Be Bodywise routine this week.",
      productId: null,
      journeyId: "journey_butter",
      scheduledFor: hoursAgo(24),
      read: false,
      isDemo: true,
      createdAt: hoursAgo(24),
    },
    {
      id: "n_3",
      type: "community",
      category: "community",
      title: "New reply in The ProofPath Circle",
      body: "Meera S. replied to a discussion about routine consistency.",
      productId: null,
      journeyId: null,
      scheduledFor: hoursAgo(44),
      read: true,
      isDemo: true,
      createdAt: hoursAgo(44),
    },
  ];

  const posts = [
    {
      id: "p_1",
      authorName: "Meera S.",
      authorColor: "#314C3C",
      title: "My four-week skincare journal",
      content:
        "What I noticed, what stayed the same, and what I learned. I tracked my routine four weeks with weekly check-ins. Writing a short note each week helped me separate 'bad skin day' from an actual pattern. Routine consistency was the part I kept missing before.",
      category: "skincare",
      productName: "Hydra Calm Daily Moisturiser",
      concern: "Dryness",
      stage: "one-month",
      durationWeeks: 4,
      observations: "Calmer dryness around the nose by week 4.",
      isSample: true,
      saved: false,
      reported: false,
      reportReason: null,
      createdAt: hoursAgo(50),
      comments: [
        {
          id: "cm_1",
          postId: "p_1",
          authorName: "Devika P.",
          content: "The 'bad skin day vs pattern' distinction is so real. Saving this.",
          isSample: true,
          createdAt: hoursAgo(44),
        },
      ],
      reactions: [
        { kind: "supportive", count: 2 },
        { kind: "insightful", count: 1 },
      ],
    },
    {
      id: "p_2",
      authorName: "Ananya R.",
      authorColor: "#5B4A6E",
      title: "I started tracking to understand how consistent I was",
      content:
        "Turns out I was 'consistent' about 60% of the time, not 95% like I assumed. Seeing it in a chart made me stop guessing. No dramatic claims — just a better sense of my actual habits.",
      category: "skincare",
      productName: null,
      concern: "Texture & pores",
      stage: "three-months",
      durationWeeks: 12,
      observations: "Actual consistency ~60%; improved with reminders.",
      isSample: true,
      saved: false,
      reported: false,
      reportReason: null,
      createdAt: hoursAgo(96),
      comments: [],
      reactions: [
        { kind: "supportive", count: 1 },
        { kind: "been-there", count: 1 },
      ],
    },
    {
      id: "p_3",
      authorName: "Rohini K.",
      authorColor: "#7A5C43",
      title: "Six weeks into a gentler hair routine",
      content:
        "I switched to washing twice a week with a mild shampoo and noted how my scalp felt. Week 2: less itchiness. Week 6: wash-day shedding seems lower for me. Everyone's hair is different, sharing only my personal experience.",
      category: "haircare",
      productName: "Anti-Hairfall Ritual Shampoo",
      concern: "Hair fall",
      stage: "one-month",
      durationWeeks: 6,
      observations: "Less scalp itchiness from week 2.",
      isSample: true,
      saved: false,
      reported: false,
      reportReason: null,
      createdAt: hoursAgo(140),
      comments: [
        {
          id: "cm_2",
          postId: "p_3",
          authorName: "Meera S.",
          content: "Thank you for being so clear that this is just your experience!",
          isSample: true,
          createdAt: hoursAgo(120),
        },
      ],
      reactions: [
        { kind: "supportive", count: 3 },
        { kind: "insightful", count: 2 },
      ],
    },
  ];

  const guides = [
    {
      id: "guide_moisturiser",
      name: "Gentle Hydra Moisturiser",
      brand: "Be Bodywise",
      category: "Skincare",
      tagline: "A lightweight daily moisturiser for normal to dry skin",
      description:
        "A fragrance-free daily moisturiser formulated with humectants and skin-barrier lipids. Designed to be worn alone or under sunscreen.",
      ingredients: [
        { name: "Glycerin", fn: "Humectant that draws water into outer skin layers" },
        { name: "Niacinamide", fn: "Vitamin B3 supporting skin barrier and evening tone" },
        { name: "Ceramide NP", fn: "Essential lipid that reinforces moisture barrier" },
        { name: "Squalane", fn: "Lightweight emollient that softens skin" },
        { name: "Panthenol", fn: "Pro-vitamin B5 soothing hydration" },
      ],
      directions: "Apply a pea-sized amount to cleansed face and neck, morning and evening.",
      precautions: "For external use only. Patch-test first. Discontinue if irritation occurs.",
      sizeInfo: "100 mL airless jar",
      faqs: [
        { q: "Can I use it under makeup?", a: "Yes — allow it to absorb for 1-2 minutes first." },
        { q: "Is it suitable for sensitive skin?", a: "Formulated without fragrance, but always patch-test first." },
      ],
      purchaseLink: null,
      lastVerified: "2026-09-28",
      isSample: true,
    },
    {
      id: "guide_cleanser",
      name: "Mild Foaming Cleanser",
      brand: "Be Bodywise",
      category: "Skincare",
      tagline: "A pH-balanced gel cleanser for daily use",
      description: "A gentle, low-foam cleanser that removes dirt and sunscreen without stripping moisture.",
      ingredients: [
        { name: "Coco-glucoside", fn: "Gentle surfactant from coconut & fruit sugar" },
        { name: "Glycerin", fn: "Moisture-preserving humectant" },
        { name: "Panthenol", fn: "Soothing conditioning agent" },
      ],
      directions: "Massage onto damp skin, rinse thoroughly with lukewarm water. Use AM and PM.",
      precautions: "Avoid contact with eyes. Rinse with water if contact occurs.",
      sizeInfo: "150 mL tube",
      faqs: [{ q: "Will it remove sunscreen?", a: "Removes standard daily sunscreen effectively." }],
      purchaseLink: null,
      lastVerified: "2026-09-28",
      isSample: true,
    },
    {
      id: "guide_shampoo",
      name: "Anti-Hairfall Ritual Shampoo",
      brand: "Be Bodywise",
      category: "Hair Care",
      tagline: "A gentle scalp-first shampoo for weekly use",
      description: "A sulphate-free style formula designed for gentle scalp cleansing and healthy follicle environment.",
      ingredients: [
        { name: "Rosemary Leaf Extract", fn: "Botanical extract known for scalp stimulation" },
        { name: "Caffeine", fn: "Active ingredient studied for hair follicle support" },
        { name: "Panthenol", fn: "Conditions strands and improves slip" },
      ],
      directions: "Massage into wet scalp, lather gently, rinse thoroughly. Use 2-3 times weekly.",
      precautions: "Avoid eye contact. Discontinue if scalp irritation develops.",
      sizeInfo: "200 mL pump bottle",
      faqs: [{ q: "How long until I see changes?", a: "Hair cycles are slow; track your experience consistently for 6-8 weeks." }],
      purchaseLink: null,
      lastVerified: "2026-09-28",
      isSample: true,
    },
  ];

  const profile = {
    id: "default",
    displayName: "Ananya",
    avatarColor: "#314C3C",
    interests: ["Skincare", "Hair care", "Product replenishment"],
    goal: "Track changes over time",
    onboarded: true,
    demoMode: true,
    reminderPrefs: {
      checkin: true,
      replenishment: true,
      community: true,
      routine: true,
      secondReminder: true,
      finalReminder: false,
    },
    notifCats: {
      replenishment: true,
      checkin: true,
      community: true,
      system: true,
    },
    recentlyViewed: [],
    aiConfigured: true,
    aiKeySource: "env",
    aiKeyHint: "AIza…demo",
    aiModel: "gemini-2.5-flash",
  };

  return { products, journeys, checkins, notifications, posts, guides, profile, usageLogs: [] };
}

let state = createInitialState();

function computeProductEstimate(p: any) {
  const current = p.currentQuantity ?? 0;
  const starting = p.startingQuantity ?? 100;
  const appPerWeek = p.applicationsPerWeek ?? 7;
  const amountPerUse = p.amountPerUse ?? 2;
  const dailyUsage = (appPerWeek * amountPerUse) / 7;
  const daysRemaining = dailyUsage > 0 ? Math.max(0, Math.round(current / dailyUsage)) : 30;
  const percentUsed = starting > 0 ? Math.min(100, Math.max(0, Math.round(((starting - current) / starting) * 100))) : 0;
  const runOutDate = new Date(Date.now() + daysRemaining * DAY).toISOString();

  return {
    known: true,
    percentUsed,
    dailyConsumption: Number(dailyUsage.toFixed(1)),
    weeklyConsumption: Number((dailyUsage * 7).toFixed(1)),
    daysRemaining,
    runOutDate,
    basis: "configured",
    basisLabel: "Calculated from your logged routine frequency and application amount.",
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // ---------------- API ROUTES ----------------

    // Profile
    if (url.pathname === "/api/profile") {
      if (request.method === "GET") {
        const aiConfigured = Boolean(env.GEMINI_API_KEY);
        return jsonResponse({
          ...state.profile,
          aiConfigured,
          aiKeySource: aiConfigured ? "env" : null,
          aiKeyHint: aiConfigured ? `${env.GEMINI_API_KEY!.slice(0, 4)}…${env.GEMINI_API_KEY!.slice(-4)}` : null,
          aiModel: env.GEMINI_MODEL || "gemini-2.5-flash",
        });
      }
      if (request.method === "PUT") {
        const body = (await request.json().catch(() => ({}))) as any;
        state.profile = { ...state.profile, ...body };
        return jsonResponse(state.profile);
      }
    }

    // Dashboard
    if (url.pathname === "/api/dashboard" && request.method === "GET") {
      const activeProducts = state.products.map((p) => ({
        ...p,
        estimate: computeProductEstimate(p),
      }));

      const supplyOverview = activeProducts.map((p) => {
        const est = p.estimate;
        let tone: "low" | "soon" | "ok" = "ok";
        let message = `~${est.daysRemaining} days remaining`;
        if (est.daysRemaining <= 7) {
          tone = "low";
          message = `Low supply: estimated runout in ${est.daysRemaining} days`;
        } else if (est.daysRemaining <= 14) {
          tone = "soon";
          message = `Estimated runout in ${est.daysRemaining} days`;
        }
        return { product: p, estimate: est, message, tone };
      });

      const journeyData = state.journeys.map((j) => {
        const jCheckins = state.checkins.filter((c) => c.journeyId === j.id);
        const last = jCheckins[jCheckins.length - 1] || null;
        return {
          ...j,
          product: state.products.find((p) => p.id === j.productId) || null,
          lastCheckIn: last,
          checkInCount: jCheckins.length,
          nextDue: new Date(Date.now() + 2 * DAY).toISOString(),
        };
      });

      return jsonResponse({
        profile: state.profile,
        activeProducts,
        journeys: journeyData,
        supplyOverview,
        upcomingReminders: state.notifications.filter((n) => !n.read),
        recentCheckIns: state.checkins.slice(0, 4).map((c) => ({
          ...c,
          journeyTitle: state.journeys.find((j) => j.id === c.journeyId)?.title || "Wellness Journey",
        })),
        recentNotifications: state.notifications.slice(0, 5),
        weeklyReflection: {
          monthCount: 4,
          positiveCount: 3,
          changeCounts: { improved: 3, same: 2, unsure: 1 },
          avgRating: 3.8,
          lastCheckInDate: daysAgo(7),
          message: "Consistent routines produce visible clarity over time. Keep logging your reflections.",
          hasData: true,
        },
        totalProducts: state.products.length,
      });
    }

    // Products
    if (url.pathname === "/api/products") {
      if (request.method === "GET") {
        const enriched = state.products.map((p) => ({
          ...p,
          estimate: computeProductEstimate(p),
        }));
        return jsonResponse(enriched);
      }
      if (request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as any;
        const newProd = {
          id: `prod_${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.products.push(newProd);
        return jsonResponse(newProd, 201);
      }
    }

    const prodMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (prodMatch) {
      const id = prodMatch[1];
      const prod = state.products.find((p) => p.id === id);
      if (!prod && request.method !== "OPTIONS") return jsonResponse({ error: "Product not found" }, 404);

      if (request.method === "GET") {
        const estimate = computeProductEstimate(prod);
        return jsonResponse({
          ...prod,
          estimate,
          usageLogs: [],
          reminderPlan: [
            {
              type: "replenishment-1",
              title: `${prod!.name} refill alert`,
              body: `Estimated refill needed in ~${estimate.daysRemaining} days`,
              scheduledFor: estimate.runOutDate,
              dedupeKey: `remind_${prod!.id}`,
            },
          ],
        });
      }
      if (request.method === "PUT") {
        const body = (await request.json().catch(() => ({}))) as any;
        Object.assign(prod!, body, { updatedAt: new Date().toISOString() });
        return jsonResponse(prod);
      }
      if (request.method === "DELETE") {
        state.products = state.products.filter((p) => p.id !== id);
        return jsonResponse({ ok: true });
      }
    }

    // Product usage logging
    const usageMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/usage$/);
    if (usageMatch && request.method === "POST") {
      const id = usageMatch[1];
      const prod = state.products.find((p) => p.id === id);
      if (!prod) return jsonResponse({ error: "Product not found" }, 404);
      const body = (await request.json().catch(() => ({}))) as any;
      if (body.currentQuantity !== undefined) {
        prod.currentQuantity = body.currentQuantity;
      } else if (body.amountUsed !== undefined) {
        prod.currentQuantity = Math.max(0, (prod.currentQuantity || 0) - body.amountUsed);
      }
      prod.updatedAt = new Date().toISOString();
      return jsonResponse({ ok: true, product: prod, estimate: computeProductEstimate(prod) });
    }

    // Journeys
    if (url.pathname === "/api/journeys") {
      if (request.method === "GET") {
        const enriched = state.journeys.map((j) => ({
          ...j,
          product: state.products.find((p) => p.id === j.productId) || null,
        }));
        return jsonResponse(enriched);
      }
      if (request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as any;
        const newJ = {
          id: `journey_${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.journeys.push(newJ);
        return jsonResponse(newJ, 201);
      }
    }

    const journeyMatch = url.pathname.match(/^\/api\/journeys\/([^/]+)$/);
    if (journeyMatch) {
      const id = journeyMatch[1];
      const j = state.journeys.find((item) => item.id === id);
      if (!j) return jsonResponse({ error: "Journey not found" }, 404);

      if (request.method === "GET") {
        const checkins = state.checkins.filter((c) => c.journeyId === id);
        return jsonResponse({
          ...j,
          product: state.products.find((p) => p.id === j.productId) || null,
          checkins,
        });
      }
      if (request.method === "PUT") {
        const body = (await request.json().catch(() => ({}))) as any;
        Object.assign(j, body, { updatedAt: new Date().toISOString() });
        return jsonResponse(j);
      }
      if (request.method === "DELETE") {
        state.journeys = state.journeys.filter((item) => item.id !== id);
        return jsonResponse({ ok: true });
      }
    }

    // Check-ins
    if (url.pathname === "/api/checkins") {
      if (request.method === "GET") {
        return jsonResponse(state.checkins);
      }
      if (request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as any;
        const newCheckin = {
          id: `checkin_${Date.now()}`,
          ...body,
          date: body.date || new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        state.checkins.unshift(newCheckin);
        return jsonResponse(newCheckin, 201);
      }
    }

    // Notifications
    if (url.pathname === "/api/notifications") {
      if (request.method === "GET") {
        return jsonResponse(state.notifications);
      }
      if (request.method === "PUT") {
        const body = (await request.json().catch(() => ({}))) as any;
        if (body.id) {
          const notif = state.notifications.find((n) => n.id === body.id);
          if (notif) notif.read = true;
        } else {
          state.notifications.forEach((n) => (n.read = true));
        }
        return jsonResponse({ ok: true });
      }
    }

    // Community
    if (url.pathname === "/api/community") {
      if (request.method === "GET") {
        const category = url.searchParams.get("category");
        let filtered = state.posts;
        if (category && category !== "all") {
          filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
        }
        return jsonResponse(filtered);
      }
      if (request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as any;
        const newPost = {
          id: `post_${Date.now()}`,
          authorName: state.profile.displayName || "You",
          authorColor: state.profile.avatarColor || "#314C3C",
          title: body.title,
          content: body.content,
          category: body.category || "skincare",
          productName: body.productName || null,
          concern: body.concern || null,
          stage: body.stage || "just-started",
          durationWeeks: body.durationWeeks || 1,
          observations: body.observations || null,
          isSample: false,
          saved: false,
          reported: false,
          reportReason: null,
          createdAt: new Date().toISOString(),
          comments: [],
          reactions: [{ kind: "supportive", count: 1 }],
        };
        state.posts.unshift(newPost);
        return jsonResponse(newPost, 201);
      }
    }

    const postCommentMatch = url.pathname.match(/^\/api\/community\/([^/]+)\/comments$/);
    if (postCommentMatch && request.method === "POST") {
      const postId = postCommentMatch[1];
      const post = state.posts.find((p) => p.id === postId);
      if (!post) return jsonResponse({ error: "Post not found" }, 404);
      const body = (await request.json().catch(() => ({}))) as any;
      const newComment = {
        id: `c_${Date.now()}`,
        postId,
        authorName: state.profile.displayName || "You",
        content: body.content,
        isSample: false,
        createdAt: new Date().toISOString(),
      };
      post.comments.push(newComment);
      return jsonResponse(newComment, 201);
    }

    const postReactionMatch = url.pathname.match(/^\/api\/community\/([^/]+)\/reactions$/);
    if (postReactionMatch && request.method === "POST") {
      const postId = postReactionMatch[1];
      const post = state.posts.find((p) => p.id === postId);
      if (!post) return jsonResponse({ error: "Post not found" }, 404);
      const body = (await request.json().catch(() => ({}))) as any;
      const kind = body.kind || "supportive";
      const existing = post.reactions.find((r) => r.kind === kind);
      if (existing) existing.count += 1;
      else post.reactions.push({ kind, count: 1 });
      return jsonResponse({ ok: true, reactions: post.reactions });
    }

    // Product Guide
    if (url.pathname === "/api/guide" && request.method === "GET") {
      const q = url.searchParams.get("q")?.toLowerCase();
      let res = state.guides;
      if (q) {
        res = res.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.tagline.toLowerCase().includes(q) ||
            g.ingredients.some((i) => i.name.toLowerCase().includes(q))
        );
      }
      return jsonResponse(res);
    }

    // Demo reset
    if (url.pathname === "/api/demo" && request.method === "POST") {
      state = createInitialState();
      return jsonResponse({ ok: true });
    }

    // AI Settings
    if (url.pathname === "/api/settings/ai") {
      const aiConfigured = Boolean(env.GEMINI_API_KEY);
      if (request.method === "GET") {
        return jsonResponse({
          saved: false,
          envConfigured: aiConfigured,
          source: aiConfigured ? "env" : null,
          keyHint: aiConfigured ? `${env.GEMINI_API_KEY!.slice(0, 4)}…${env.GEMINI_API_KEY!.slice(-4)}` : null,
          model: env.GEMINI_MODEL || "gemini-2.5-flash",
        });
      }
      if (request.method === "PUT") {
        return jsonResponse({ ok: true, message: "AI settings updated successfully." });
      }
    }

    // AI Chat - Google Gemini Live Integration
    if (url.pathname === "/api/chat" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as any;
      const userMessage = body.message || "";
      const productId = body.productId;
      const product = productId ? state.products.find((p) => p.id === productId) : null;

      let productContext = "";
      if (product) {
        productContext = `\n\nCURRENT USER PRODUCT CONTEXT:\n- Name: ${product.name}\n- Category: ${product.category}\n- Ingredients: ${product.ingredients || "Not specified"}\n- Instructions: ${product.instructions || "Not specified"}\n- Usage frequency: ${product.frequency || "Not specified"}`;
      }

      const rawKey = env.GEMINI_API_KEY || "";
      const apiKey = rawKey.replace(/^[^a-zA-Z0-9_\-]+/, "").trim();
      const model = env.GEMINI_MODEL || "gemini-2.0-flash";

      if (apiKey && apiKey.length > 5) {
        try {
          const contents = [
            {
              role: "user",
              parts: [{ text: userMessage + productContext }],
            },
          ];

          let geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: SKIN_GUIDE_SYSTEM }] },
                contents,
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 1200,
                },
              }),
            }
          );

          if (!geminiRes.ok && model !== "gemini-1.5-flash") {
            geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: SKIN_GUIDE_SYSTEM }] },
                  contents,
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1200,
                  },
                }),
              }
            );
          }

          if (geminiRes.ok) {
            const data = (await geminiRes.json()) as any;
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return jsonResponse({
                role: "model",
                content: text,
                demo: false,
                createdAt: new Date().toISOString(),
              });
            }
          } else {
            const errBody = await geminiRes.text();
            if (url.searchParams.get("debug")) {
              return jsonResponse({ error: "Gemini API non-200", status: geminiRes.status, body: errBody });
            }
          }
        } catch (e: any) {
          if (url.searchParams.get("debug")) {
            return jsonResponse({ error: "Gemini API exception", message: e?.message });
          }
        }
      }

      // Safe Demo Fallback (Be Bodywise Ask Skin Guide)
      return jsonResponse({
        role: "model",
        content:
          "I understand your question about your skincare experience — let's review it carefully.\n\nA few helpful questions:\n• When did you first notice this reaction after starting your product?\n• Is the area itchy, red, or stinging?\n• Have you paused applying the product?\n\nGeneral guidance:\n• Timing alone doesn't prove an individual product caused a reaction, but stopping the suspected product temporarily is a sensible first step.\n• Avoid introducing harsh scrubs or home remedies while your skin recovers.\n• If discomfort, swelling, or redness persists or worsens, please consult a qualified healthcare professional or dermatologist.",
        demo: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Delegate static assets and HTML pages to Cloudflare Assets
    return env.ASSETS.fetch(request);
  },
};
