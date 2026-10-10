// Demo data seeding — spec Part 15.
// All records are entirely fictional and labelled with isDemo/isSample = true.

import { db } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000);

export async function ensureProfile() {
  const existing = await db.userProfile.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return db.userProfile.create({
    data: {
      id: "default",
      displayName: "Ananya",
      interests: JSON.stringify(["Skincare", "Hair care", "Product replenishment"]),
      goal: "Track changes over time",
      demoMode: true,
      recentlyViewed: JSON.stringify([]),
    },
  });
}

export async function isSeeded(): Promise<boolean> {
  const count = await db.product.count();
  return count > 0;
}

export async function seedDemoData() {
  await ensureProfile();
  if (await isSeeded()) return;

  // ---------- 3 sample products ----------
  const moisturiser = await db.product.create({
    data: {
      name: "Hydra Calm Daily Moisturiser",
      brand: "Be Bodywise (sample)",
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
      expiryDate: new Date(Date.now() + 300 * DAY),
      batchNumber: "HC-240115",
      notes: "Use after cleansing, morning and night.",
      instructions: "Apply a pea-sized amount to cleansed face and neck. Avoid the immediate eye area.",
      ingredients: "Aqua, Glycerin, Niacinamide, Ceramide NP, Squalane, Cetearyl Alcohol, Panthenol, Allantoin",
      status: "active",
      isDemo: true,
    },
  });

  const shampoo = await db.product.create({
    data: {
      name: "Anti-Hairfall Ritual Shampoo",
      brand: "Be Bodywise (sample)",
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
      expiryDate: new Date(Date.now() + 150 * DAY),
      notes: "Alternate with the gentle cleanser shampoo.",
      instructions: "Massage into wet scalp, lather, rinse thoroughly. Use twice a week.",
      ingredients: "Aqua, Coco-glucoside, Rosemary Leaf Extract, Caffeine, Panthenol, Citric Acid",
      status: "active",
      isDemo: true,
    },
  });

  const bodyButter = await db.product.create({
    data: {
      name: "Deep Comfort Body Butter",
      brand: "Be Bodywise (sample)",
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
      isDemo: true,
    },
  });

  // ---------- 2 journeys + check-ins ----------
  const j1 = await db.journey.create({
    data: {
      title: "Body moisturiser journey",
      productId: bodyButter.id,
      concern: "Body moisturising",
      startDate: daysAgo(30),
      baselineCurrent: "My shins and elbows feel tight and flaky by the end of the day, especially after showers.",
      baselineConcern: "Dry, flaky patches on shins and arms",
      baselineSatisfaction: 2,
      baselineNotes: "Want to see if a daily butter keeps my skin comfortable through the season.",
      goal: "Keep my skin comfortable and hydrated all day",
      checkinFrequency: "weekly",
      privateNotes: "Private: remember to check how knees feel after morning walks.",
      isDemo: true,
    },
  });

  const j2 = await db.journey.create({
    data: {
      title: "Hair-care routine",
      productId: shampoo.id,
      concern: "Hair fall",
      startDate: daysAgo(56),
      baselineCurrent: "I notice more hair on the pillow and in the shower drain than a few months ago.",
      baselineConcern: "Increased hair fall while washing",
      baselineSatisfaction: 3,
      baselineNotes: "Starting a gentler routine and tracking weekly.",
      goal: "Understand my shedding pattern and keep a consistent gentle routine",
      checkinFrequency: "weekly",
      isDemo: true,
    },
  });

  const j1Checkins = [
    { d: 28, r: 3, c: "same", cons: "most-days", n: "Skin feels softer right after applying. No change in flakiness yet." },
    { d: 21, r: 3, c: "same", cons: "every-day", n: "Kept the routine daily. Shins still a little dry by evening." },
    { d: 14, r: 4, c: "improved", cons: "every-day", n: "Flakiness on the shins looks much better this week." },
    { d: 7, r: 4, c: "improved", cons: "every-day", n: "Elbows feel smooth for the first time in months. Applying after showering seems to help." },
  ];
  for (const c of j1Checkins) {
    await db.checkIn.create({
      data: {
        journeyId: j1.id,
        date: daysAgo(c.d),
        overallRating: c.r,
        change: c.c,
        consistency: c.cons,
        reactions: "none",
        notes: c.n,
        isDemo: true,
      },
    });
  }

  const j2Checkins = [
    { d: 49, r: 3, c: "unsure", cons: "most-days", n: "First week. Hard to tell if shedding changed." },
    { d: 42, r: 3, c: "same", cons: "most-days", n: "About the same amount in the shower drain." },
    { d: 35, r: 4, c: "improved", cons: "every-day", n: "Slightly less hair fall on wash day this week." },
    { d: 28, r: 3, c: "unsure", cons: "some-days", n: "Travelling made the routine irregular." },
    { d: 21, r: 4, c: "improved", cons: "most-days", n: "Scalp feels less itchy. Baby hairs near the hairline." },
    { d: 14, r: 4, c: "improved", cons: "most-days", n: "Wash-day shedding looks lower. Staying consistent." },
  ];
  for (const c of j2Checkins) {
    await db.checkIn.create({
      data: {
        journeyId: j2.id,
        date: daysAgo(c.d),
        overallRating: c.r,
        change: c.c,
        consistency: c.cons,
        reactions: "none",
        notes: c.n,
        isDemo: true,
      },
    });
  }

  // ---------- community posts (sample) ----------
  const posts: {
    author: string;
    color: string;
    title: string;
    content: string;
    category: string;
    product?: string;
    concern?: string;
    stage?: string;
    weeks?: number;
    observations?: string;
    hAgo: number;
    comments?: { author: string; content: string; hAgo: number }[];
    reactions?: string[];
  }[] = [
    {
      author: "Meera S.",
      color: "#314C3C",
      title: "My four-week skincare journal",
      content:
        "What I noticed, what stayed the same, and what I learned. I tracked my routine four weeks with weekly check-ins. Honestly, writing a short note each week helped me separate 'bad skin day' from an actual pattern. Weeks 1-2 felt unchanged; by week 4 the dryness around my nose looked calmer. Not claiming the product is magic — but the routine consistency was the part I kept missing before.",
      category: "skincare",
      product: "A gentle moisturiser",
      concern: "Dryness",
      stage: "one-month",
      weeks: 4,
      observations: "Calmer dryness around the nose by week 4; no change elsewhere.",
      hAgo: 50,
      comments: [
        { author: "Devika P.", content: "The 'bad skin day vs pattern' distinction is so real. Saving this.", hAgo: 44 },
      ],
      reactions: ["supportive", "supportive", "insightful"],
    },
    {
      author: "Ananya R.",
      color: "#5B4A6E",
      title: "I started tracking my routine to understand how consistent I was",
      content:
        "Here is what my personal timeline looks like. Turns out I was 'consistent' about 60% of the time, not 95% like I assumed. Seeing it in a chart made me stop guessing. No dramatic results to report — just a better sense of what I actually do versus what I think I do.",
      category: "skincare",
      concern: "Texture & pores",
      stage: "three-months",
      weeks: 12,
      observations: "Actual consistency ~60%; improved once reminders were on.",
      hAgo: 96,
      reactions: ["supportive", "been-there"],
    },
    {
      author: "Rohini K.",
      color: "#7A5C43",
      title: "Six weeks into a gentler hair routine",
      content:
        "I switched to washing twice a week with a mild shampoo and noted how my scalp felt each week. Week 2: less itchiness. Week 6: wash-day shedding seems lower for me personally. Everyone's hair is different, so I'm only sharing my own notes — not suggesting it will work the same for anyone else.",
      category: "haircare",
      product: "A mild shampoo",
      concern: "Hair fall",
      stage: "one-month",
      weeks: 6,
      observations: "Less scalp itchiness from week 2; wash-day shedding felt lower by week 6.",
      hAgo: 140,
      comments: [
        { author: "Meera S.", content: "Thank you for being so clear that this is just your experience!", hAgo: 120 },
        { author: "Sana T.", content: "Gentle routines changed things for me too. Patience is hard though.", hAgo: 100 },
      ],
      reactions: ["supportive", "supportive", "insightful", "been-there"],
    },
    {
      author: "Sana T.",
      color: "#4A6159",
      title: "What helped me when a product irritated my skin",
      content:
        "I got redness after trying a new exfoliant. What helped: I stopped using it, kept my routine minimal, and asked a pharmacist when it didn't settle in a few days. The AI guide in this app also gave me good questions to ask. Sharing because I used to panic-Google at 2am. (Not medical advice — just my experience.)",
      category: "skincare",
      concern: "Sensitive skin",
      stage: "just-started",
      weeks: 2,
      observations: "Redness settled after stopping the product; sought a pharmacist when it persisted.",
      hAgo: 200,
      reactions: ["supportive", "been-there", "been-there"],
    },
    {
      author: "Devika P.",
      color: "#6B4E4E",
      title: "Body butter through winter — week 3 notes",
      content:
        "Applying right after the shower (instead of before bed) made a bigger difference than the amount I used. My shins stopped feeling tight by evening. Still testing, still noting each week — will update at week 6.",
      category: "bodycare",
      product: "A body butter",
      concern: "Body moisturising",
      stage: "one-month",
      weeks: 3,
      observations: "Timing of application (post-shower) mattered more than quantity.",
      hAgo: 260,
      comments: [{ author: "Rohini K.", content: "Post-shower timing is everything. Nice notes!", hAgo: 240 }],
      reactions: ["insightful", "supportive"],
    },
  ];

  for (const p of posts) {
    const created = await db.communityPost.create({
      data: {
        authorName: p.author,
        authorColor: p.color,
        title: p.title,
        content: p.content,
        category: p.category,
        productName: p.product ?? null,
        concern: p.concern ?? null,
        stage: p.stage ?? null,
        durationWeeks: p.weeks ?? null,
        observations: p.observations ?? null,
        isSample: true,
        createdAt: hoursAgo(p.hAgo),
      },
    });
    for (const c of p.comments || []) {
      await db.comment.create({
        data: {
          postId: created.id,
          authorName: c.author,
          content: c.content,
          isSample: true,
          createdAt: hoursAgo(c.hAgo),
        },
      });
    }
    for (const kind of p.reactions || []) {
      await db.reaction.create({ data: { postId: created.id, kind } });
    }
  }

  // ---------- sample AI conversation ----------
  await db.chatMessage.createMany({
    data: [
      {
        role: "user",
        content: "I noticed small bumps after starting a new moisturiser. Should I keep using it to see if it settles?",
        demo: true,
        createdAt: hoursAgo(30),
      },
      {
        role: "model",
        content:
          "I understand how worrying that can feel — let's work through it calmly.\n\nA few short questions first:\n• When did the bumps first appear after you began the new moisturiser?\n• Are they itchy or painful, and are they spreading?\n• Have you already paused the product?\n\nA few general points while you think about that:\n• Timing alone can't prove the moisturiser caused the bumps — but a new product is one possible factor worth reviewing.\n• A cautious, widely suggested step is to stop applying the suspected product until you can get appropriate advice, rather than continuing to test it on irritated skin.\n• It's best not to add new active products or home remedies to treat it in the meantime.\n\nIf the bumps become painful, blistered, widespread, or keep worsening, please have a healthcare professional take a look soon. I can also help you prepare a short symptom summary to show them.",
        demo: true,
        productId: moisturiser.id,
        createdAt: hoursAgo(30),
      },
    ],
  });

  // ---------- sample notification (community reply) ----------
  await db.notification.create({
    data: {
      type: "community",
      category: "community",
      title: "You have a new reply to your community post",
      body: "Meera S. replied to a discussion in The ProofPath Circle.",
      isDemo: true,
      scheduledFor: hoursAgo(44),
      dedupeKey: `community:sample-reply:${Date.now()}`,
    },
  });

  // ---------- product guide library ----------
  const guides: {
    name: string;
    brand: string;
    category: string;
    tagline: string;
    description: string;
    ingredients: string;
    directions: string;
    precautions: string;
    sizeInfo: string;
    faqs: { q: string; a: string }[];
    verified: string;
  }[] = [
    {
      name: "Gentle Hydra Moisturiser",
      brand: "Be Bodywise (sample)",
      category: "Skincare",
      tagline: "A lightweight daily moisturiser for normal to dry skin",
      description:
        "A fragrance-free daily moisturiser formulated with humectants and skin-barrier lipids. Designed to be worn alone or under sunscreen. This is a sample educational entry — always check your actual product label for its verified ingredient list.",
      ingredients:
        "Glycerin|A humectant that draws water into the outer layers of skin, helping it feel supple.\nNiacinamide|A form of vitamin B3 studied for supporting the skin barrier and evening the look of tone.\nCeramide NP|A lipid naturally found in skin; helps support the moisture barrier.\nSqualane|An emollient that softens and smooths without a heavy feel.\nPanthenol|Pro-vitamin B5, known for its soothing, hydrating properties.\nAllantoin|Commonly used to soothe and condition the skin.",
      directions:
        "Apply a pea-sized amount to cleansed face and neck, morning and evening. Avoid the immediate eye area. For daytime, follow with sunscreen as the final step.",
      precautions:
        "For external use only. Patch-test new products on a small area first. Discontinue use and seek advice if irritation occurs. Keep out of reach of children.",
      sizeInfo: "100 mL airless jar",
      faqs: [
        { q: "Can I use it under makeup?", a: "Yes — allow it to absorb for a minute before applying makeup or sunscreen." },
        { q: "Is it suitable for sensitive skin?", a: "It is formulated without added fragrance, but every skin is different. Patch-test first and check the full label." },
      ],
      verified: "2026-09-28 (sample entry)",
    },
    {
      name: "Mild Foaming Cleanser",
      brand: "Be Bodywise (sample)",
      category: "Skincare",
      tagline: "A pH-balanced gel cleanser for daily use",
      description:
        "A gentle, low-foam cleanser that removes dirt and sunscreen without stripping. Suitable for most skin types as part of a simple routine. Sample entry for education.",
      ingredients:
        "Coco-glucoside|A mild cleansing agent derived from coconut and fruit sugar.\nGlycerin|Humectant that helps skin retain moisture while cleansing.\nCitric Acid|Used to balance the pH of the formula.\nPanthenol|Soothing humectant.",
      directions:
        "Massage a small amount onto damp skin, rinse thoroughly with lukewarm water. Use morning and evening or as needed.",
      precautions: "Avoid contact with eyes. If contact occurs, rinse with water. Discontinue if irritation occurs.",
      sizeInfo: "150 mL tube",
      faqs: [
        { q: "Will it remove sunscreen?", a: "A gentle cleanser removes most daily sunscreen; a double cleanse may help with heavy or water-resistant formulas." },
      ],
      verified: "2026-09-28 (sample entry)",
    },
    {
      name: "Anti-Hairfall Ritual Shampoo",
      brand: "Be Bodywise (sample)",
      category: "Hair Care",
      tagline: "A gentle scalp-first shampoo for weekly use",
      description:
        "A sulphate-free style shampoo designed for gentle, infrequent washing. Sample educational entry — ingredient lists vary between batches and regions, so always confirm on your bottle.",
      ingredients:
        "Coco-glucoside|A mild surfactant that cleanses without harsh stripping.\nRosemary Leaf Extract|Botanical extract commonly used in scalp-care formulas.\nCaffeine|An ingredient often included in hair-care products; cosmetic effects are still being studied.\nPanthenol|Conditions hair and adds slip.\nCitric Acid|pH adjuster.",
      directions: "Massage into wet scalp, lather gently, rinse thoroughly. Use twice a week or as directed on your label.",
      precautions: "Avoid eye contact. If any scalp irritation occurs, discontinue use. Hair fall can have many causes — a professional can help identify yours.",
      sizeInfo: "200 mL pump bottle",
      faqs: [
        { q: "How long until I see results?", a: "Hair cycles are slow; give any routine several weeks and track your experience. Persistent or sudden shedding deserves professional advice." },
      ],
      verified: "2026-09-28 (sample entry)",
    },
    {
      name: "Deep Comfort Body Butter",
      brand: "Be Bodywise (sample)",
      category: "Body Care",
      tagline: "A rich butter for very dry body areas",
      description:
        "A thick, occlusive-leaning body butter for elbows, knees, and shins. Best applied to damp skin after bathing to seal in moisture. Sample entry.",
      ingredients:
        "Shea Butter|A rich plant butter that softens and supports the skin barrier.\nUrea|A humectant and keratolytic studied for very dry, rough skin.\nGlycerin|Draws moisture into the outer skin layers.\nTocopherol|Vitamin E, an antioxidant used to condition skin.",
      directions: "Massage into clean, dry skin until absorbed, focusing on dry areas. Use daily after bathing.",
      precautions: "For external use only. Do not apply to broken or infected skin. Discontinue if irritation occurs.",
      sizeInfo: "150 g jar",
      faqs: [
        { q: "Is it greasy?", a: "It is richer than a lotion; a small amount massaged in well absorbs within a few minutes." },
      ],
      verified: "2026-09-28 (sample entry)",
    },
    {
      name: "Calm & Clear Face Serum",
      brand: "Be Bodywise (sample)",
      category: "Skincare",
      tagline: "A hydrating serum with niacinamide and zinc",
      description:
        "A lightweight serum intended to support hydration and the look of balanced skin. Introduce one new product at a time so you can notice how your skin responds. Sample entry.",
      ingredients:
        "Niacinamide|Vitamin B3, studied for barrier support and visible tone.\nZinc PCA|Often used in formulas aimed at oilier skin.\nHyaluronic Acid|A humectant that holds water in the outer skin layers.\nGlycerin|Additional hydration support.",
      directions: "Apply 2-3 drops to damp skin before moisturiser, once daily. Introduce gradually if your skin is sensitive.",
      precautions: "Patch-test first. Avoid layering with strong exfoliants on the same evening if your skin is reactive. Discontinue if irritation occurs.",
      sizeInfo: "30 mL dropper bottle",
      faqs: [
        { q: "Can I use it with retinoids?", a: "Many people do, but introduce one active at a time and watch how your skin responds. When unsure, ask a professional." },
      ],
      verified: "2026-09-28 (sample entry)",
    },
  ];

  for (const g of guides) {
    await db.guideProduct.create({
      data: {
        name: g.name,
        brand: g.brand,
        category: g.category,
        tagline: g.tagline,
        description: g.description,
        ingredients: g.ingredients,
        directions: g.directions,
        precautions: g.precautions,
        sizeInfo: g.sizeInfo,
        faqs: JSON.stringify(g.faqs),
        lastVerified: g.verified,
        isSample: true,
      },
    });
  }
}

export async function clearDemoData() {
  await db.chatMessage.deleteMany({ where: { demo: true } });
  await db.notification.deleteMany({ where: { isDemo: true } });
  await db.checkIn.deleteMany({ where: { isDemo: true } });
  await db.journey.deleteMany({ where: { isDemo: true } });
  await db.product.deleteMany({ where: { isDemo: true } });
  // sample posts and their comments/reactions cascade
  const posts = await db.communityPost.findMany({ where: { isSample: true }, select: { id: true } });
  for (const p of posts) {
    await db.comment.deleteMany({ where: { postId: p.id } });
    await db.reaction.deleteMany({ where: { postId: p.id } });
    await db.communityPost.delete({ where: { id: p.id } });
  }
}
