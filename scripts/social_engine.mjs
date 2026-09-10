import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const POSTS_FILE = process.env.POSTS_FILE || "posts.json";
const TZ = "Asia/Kolkata";
const BRAND_NAME = process.env.BRAND_NAME || "Build Kar Bro";
const BRAND_HANDLE = (process.env.BRAND_HANDLE || "buildkarbro").replace(/^@/, "");
const REPO = process.env.TARGET_REPO || process.env.GITHUB_REPOSITORY || "Avi-2024/AutoPost-IG-FB";
const BRANCH = process.env.TARGET_BRANCH || "main";
const PAGE_ID = process.env.FACEBOOK_PAGE_ID || "1392360773951187";
const IG_USER_ID = process.env.IG_USER_ID || "17841424749134562";
const EXPECTED_IG_USERNAME = process.env.EXPECTED_INSTAGRAM_USERNAME || BRAND_HANDLE;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const IG_GRAPH_HOST = "https://graph.instagram.com";
const FB_GRAPH_HOST = `https://graph.facebook.com/${GRAPH_VERSION}`;
const MODE = process.argv[2];

function log(message) {
  console.log(`[social-engine] ${message}`);
}

function isoDateInIndia(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function humanDate(dateString) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T00:00:00+05:30`));
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function safeId(value) {
  return String(value || "post")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(path.join(ROOT, file), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(path.join(ROOT, file)), { recursive: true });
  await fs.writeFile(path.join(ROOT, file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function wrapText(text, maxChars, maxLines) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function normalizeContent(content, dateString) {
  const fallback = fallbackContent(dateString);
  const merged = { ...fallback, ...content };
  merged.date = dateString;
  merged.id = safeId(merged.id || `daily-${dateString}`);
  merged.topic = String(merged.topic || fallback.topic).trim();
  merged.caption = String(merged.caption || fallback.caption).trim();
  merged.hashtags = Array.isArray(merged.hashtags) && merged.hashtags.length
    ? merged.hashtags.map((tag) => String(tag).startsWith("#") ? String(tag) : `#${String(tag).replace(/^#/, "")}`)
    : fallback.hashtags;
  merged.slides = Array.isArray(merged.slides) ? merged.slides.slice(0, 6) : fallback.slides;
  while (merged.slides.length < 6) merged.slides.push(fallback.slides[merged.slides.length]);
  merged.slides = merged.slides.map((slide, index) => ({
    eyebrow: String(slide.eyebrow || (index === 0 ? "BUILD KAR BRO" : `SLIDE ${index + 1}`)).trim(),
    title: String(slide.title || fallback.slides[index].title).trim().toUpperCase(),
    body: String(slide.body || fallback.slides[index].body).trim(),
    footer: String(slide.footer || `@${BRAND_HANDLE}`).trim()
  }));
  return merged;
}

function fallbackContent(dateString) {
  const ideas = [
    {
      topic: "Shiny object syndrome",
      hook: "17 ideas. 0 finished.",
      slides: [
        ["17 IDEAS. 0 FINISHED.", "Idea aana easy hai. Finish karna hi real skill hai."],
        ["IDEA BAHUT HAIN", "AI tool, freelancing, coding, content — sab start karna easy lagta hai."],
        ["PROBLEM IDEAS NAHI", "Problem focus ki hai. Daily naye ideas old progress ko kill kar dete hain."],
        ["EK TIME PAR EK PROJECT", "7 din ke liye ek hi goal rakho. No new idea switch."],
        ["FINISH > PERFECT", "First version ugly ho sakta hai. Lekin complete version hi result deta hai."],
        ["AB TUMHARI BAARI", "Aaj ek idea choose karo. 7 din do. Finish karo."]
      ],
      caption: "17 ideas. 0 finished. 😭\n\nAI tool, freelancing, business, coding, content… sab start karna easy lagta hai. Finish karna hi real game hai.\n\nEk idea choose karo. 7 din do. Complete karo.\n\nFollow @buildkarbro for relatable AI, business and creator-life content."
    },
    {
      topic: "AI prompt mistake",
      hook: "AI se weak answer aa raha hai?",
      slides: [
        ["AI SE WEAK ANSWER AA RAHA HAI?", "Problem AI nahi. Problem prompt ka context hai."],
        ["GOOGLE KI TARAH MAT PUCHO", "One-line prompt se one-line quality milegi."],
        ["CONTEXT DO", "Goal, audience, example, tone aur limit clear karo."],
        ["OUTPUT FORMAT BOLO", "Table, checklist, script, caption ya action plan — exact bolo."],
        ["REVISION MANGO", "First answer ke baad bolo: make it sharper, simpler, more practical."],
        ["PROMPT SYSTEM BANAO", "AI se random answer nahi, repeatable workflow banao."]
      ],
      caption: "AI kharab nahi hai. Prompt weak hai.\n\nBetter output ke liye context + format + example + constraint do.\n\nFollow @buildkarbro for practical AI and creator-growth content."
    },
    {
      topic: "Creator consistency",
      hook: "Posting daily hard nahi hai.",
      slides: [
        ["POSTING DAILY HARD NAHI HAI.", "Hard part hai har din zero se sochna."],
        ["SYSTEM BANAO", "Topic bank, hooks, captions aur templates pehle se ready rakho."],
        ["ONE FORMAT LOCK KARO", "Carousel, reel ya text post — ek format 30 din repeat karo."],
        ["BATCH THINKING", "Sunday ko 10 ideas. Daily bas publish."],
        ["REUSE SMARTLY", "Ek idea se carousel, reel script, tweet aur newsletter banao."],
        ["CONSISTENCY = SYSTEM", "Motivation nahi. Process tumhe grow karata hai."]
      ],
      caption: "Daily posting ka secret motivation nahi, system hai.\n\nEk format choose karo. 30 din repeat karo. Improve karo.\n\nFollow @buildkarbro for creator systems."
    },
    {
      topic: "Freelancer client acquisition",
      hook: "Clients follow-up se close hote hain.",
      slides: [
        ["CLIENTS DM SE NAHI, FOLLOW-UP SE CLOSE HOTE HAIN.", "Most people first message ke baad disappear ho jaate hain."],
        ["FIRST MESSAGE = DOOR OPEN", "Close usually second, third, fourth touch me hota hai."],
        ["VALUE FOLLOW-UP DO", "Sirf ‘any update?’ nahi. Audit, idea ya example bhejo."],
        ["PAIN POINT CLEAR KARO", "Client ko dikhao ki issue ka business impact kya hai."],
        ["CTA SIMPLE RAKHO", "‘Can I share 3 quick fixes?’ works better than long pitch."],
        ["SYSTEMIZE OUTREACH", "Daily 20 reach-outs + 20 follow-ups = pipeline."]
      ],
      caption: "Client close karna sirf pitch nahi hai. Follow-up system hai.\n\nFirst message se trust start hota hai. Consistent value se deal close hoti hai.\n\nFollow @buildkarbro for freelancing and business systems."
    }
  ];
  const index = [...dateString].reduce((sum, char) => sum + char.charCodeAt(0), 0) % ideas.length;
  const selected = ideas[index];
  return {
    id: `daily-${dateString}-${safeId(selected.topic)}`,
    date: dateString,
    topic: selected.topic,
    angle: selected.hook,
    slides: selected.slides.map(([title, body], idx) => ({
      eyebrow: idx === 0 ? "BUILD KAR BRO" : `LESSON ${idx}`,
      title,
      body,
      footer: `@${BRAND_HANDLE}`
    })),
    caption: `${selected.caption}\n\n#buildkarbro #aitools #creatorlife #freelancerlife #businessideas #digitalgrowth #productivity #buildinpublic #hindicontent`,
    hashtags: ["#buildkarbro", "#aitools", "#creatorlife", "#freelancerlife", "#businessideas", "#digitalgrowth", "#productivity", "#buildinpublic", "#hindicontent"]
  };
}

async function generateWithGroq(dateString) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    log("GROQ_API_KEY not found. Using free built-in content pool.");
    return fallbackContent(dateString);
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const prompt = `You are the daily content strategist for @${BRAND_HANDLE}.\n\nCreate one 6-slide Instagram carousel for Indian creators, freelancers, students, builders and AI learners.\nTone: Hinglish, practical, relatable, punchy, no cringe.\nBrand: ${BRAND_NAME}.\nDate: ${dateString}.\n\nReturn strict JSON only with this schema:\n{\n  "id": "daily-${dateString}-short-slug",\n  "topic": "...",\n  "angle": "...",\n  "slides": [\n    {"eyebrow":"...", "title":"SHORT UPPERCASE TITLE", "body":"short body", "footer":"@${BRAND_HANDLE}"}\n  ],\n  "caption": "caption with line breaks",\n  "hashtags": ["#tag"]\n}\n\nRules:\n- Exactly 6 slides.\n- Slide 1 must be a scroll-stopping hook.\n- Keep title under 55 characters.\n- Keep body under 110 characters.\n- No medical, legal, financial claims.\n- No copyrighted character references.\n- No guarantee of income.\n- Caption should be useful, not spammy.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only valid JSON. No markdown." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    log(`Groq failed (${response.status}). Falling back. ${body.slice(0, 240)}`);
    return fallbackContent(dateString);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : fallbackContent(dateString);
  }
}

function visualSvg(slideNumber) {
  const seed = slideNumber * 37;
  const cx = 810 + ((seed % 3) - 1) * 20;
  const cy = 565 + ((seed % 5) - 2) * 8;
  const prop = slideNumber % 3;

  const extra = prop === 0
    ? `<g filter="url(#softShadow)"><rect x="704" y="676" width="230" height="135" rx="24" fill="url(#deviceGrad)"/><rect x="732" y="702" width="174" height="58" rx="12" fill="#ffffff" opacity="0.86"/><circle cx="762" cy="733" r="12" fill="#2563eb"/><rect x="788" y="724" width="92" height="10" rx="5" fill="#f97316" opacity="0.75"/><rect x="788" y="744" width="66" height="8" rx="4" fill="#334155" opacity="0.25"/></g>`
    : prop === 1
      ? `<g filter="url(#softShadow)"><circle cx="820" cy="716" r="70" fill="url(#orangeGrad)"/><path d="M789 712c12-36 54-39 68-8 10 22-4 43-20 54h-36c-18-12-22-28-12-46z" fill="#fff7ed" opacity="0.95"/><rect x="798" y="765" width="44" height="15" rx="7" fill="#1e293b" opacity="0.22"/></g>`
      : `<g filter="url(#softShadow)"><rect x="712" y="684" width="226" height="118" rx="28" fill="#ffffff"/><path d="M742 730h52l26-34 34 66 25-37h40" fill="none" stroke="#2563eb" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><circle cx="742" cy="730" r="13" fill="#f97316"/><circle cx="820" cy="762" r="13" fill="#f97316"/><circle cx="919" cy="725" r="13" fill="#f97316"/></g>`;

  return `
    <g opacity="0.95">
      <circle cx="${cx}" cy="${cy}" r="250" fill="url(#blueGlow)" opacity="0.30"/>
      <circle cx="910" cy="365" r="120" fill="url(#orangeGlow)" opacity="0.55"/>
      <circle cx="700" cy="288" r="42" fill="#2563eb" opacity="0.12"/>
      <circle cx="963" cy="740" r="56" fill="#f97316" opacity="0.12"/>
    </g>
    <g filter="url(#softShadow)">
      <ellipse cx="820" cy="835" rx="190" ry="34" fill="#0f172a" opacity="0.13"/>
      <path d="M680 820c20-152 80-256 162-256s142 104 162 256z" fill="url(#hoodieGrad)"/>
      <path d="M760 602c26 44 60 67 90 67 31 0 59-23 83-67" fill="none" stroke="#ea580c" stroke-width="28" stroke-linecap="round" opacity="0.55"/>
      <circle cx="842" cy="442" r="116" fill="url(#faceGrad)"/>
      <path d="M742 438c25-81 88-136 161-111 64 22 91 85 73 147-45-44-123-48-234-36z" fill="#111827" opacity="0.92"/>
      <path d="M758 488c31 64 121 93 176 36" fill="none" stroke="#fde68a" stroke-width="12" stroke-linecap="round" opacity="0.45"/>
      <path d="M696 702c-58-14-93 20-116 84" fill="none" stroke="#fb923c" stroke-width="42" stroke-linecap="round"/>
      <path d="M987 702c58-14 94 20 118 84" fill="none" stroke="#fb923c" stroke-width="42" stroke-linecap="round"/>
      ${extra}
    </g>`;
}

function slideSvg(content, index) {
  const slide = content.slides[index];
  const titleLines = wrapText(slide.title, index === 0 ? 15 : 18, 4);
  const bodyLines = wrapText(slide.body, 38, 4);
  const titleSize = index === 0 ? 78 : 68;
  const titleY = index === 0 ? 244 : 260;
  const bodyY = titleY + titleLines.length * (titleSize * 0.96) + 38;
  const showNumber = String(index + 1).padStart(2, "0");

  const titleText = titleLines.map((line, lineIndex) => (
    `<text x="86" y="${titleY + lineIndex * (titleSize * 0.97)}" class="title" font-size="${titleSize}">${escapeXml(line)}</text>`
  )).join("\n");

  const bodyText = bodyLines.map((line, lineIndex) => (
    `<text x="92" y="${bodyY + lineIndex * 44}" class="body" font-size="34">${escapeXml(line)}</text>`
  )).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="42%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eff6ff"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffb703"/><stop offset="1" stop-color="#f97316"/></linearGradient>
    <linearGradient id="hoodieGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffb703"/><stop offset="0.46" stop-color="#f97316"/><stop offset="1" stop-color="#c2410c"/></linearGradient>
    <linearGradient id="faceGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fde68a"/><stop offset="1" stop-color="#fdba74"/></linearGradient>
    <linearGradient id="deviceGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1e293b"/><stop offset="1" stop-color="#0f172a"/></linearGradient>
    <radialGradient id="blueGlow"><stop stop-color="#60a5fa"/><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/></radialGradient>
    <radialGradient id="orangeGlow"><stop stop-color="#fb923c"/><stop offset="1" stop-color="#fb923c" stop-opacity="0"/></radialGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.18"/></filter>
    <style>
      .brand { font-family: Arial, Helvetica, sans-serif; font-weight: 800; letter-spacing: 4px; fill: #0f172a; }
      .title { font-family: Arial Black, Arial, Helvetica, sans-serif; font-weight: 900; letter-spacing: -3px; fill: #0f172a; }
      .body { font-family: Arial, Helvetica, sans-serif; font-weight: 700; fill: #334155; }
      .small { font-family: Arial, Helvetica, sans-serif; font-weight: 800; fill: #475569; }
    </style>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="-70" cy="-70" r="310" fill="#f97316" opacity="0.12"/>
  <circle cx="1140" cy="1120" r="360" fill="#2563eb" opacity="0.12"/>
  <path d="M73 132 C250 65 378 88 490 142" fill="none" stroke="#f97316" stroke-width="18" stroke-linecap="round" opacity="0.22"/>
  <path d="M632 122 C796 54 926 77 1036 147" fill="none" stroke="#2563eb" stroke-width="18" stroke-linecap="round" opacity="0.18"/>

  <rect x="72" y="68" width="290" height="56" rx="28" fill="#0f172a" opacity="0.94"/>
  <text x="106" y="105" class="brand" font-size="20" fill="#ffffff">${escapeXml(BRAND_NAME.toUpperCase())}</text>
  <text x="928" y="105" text-anchor="middle" class="small" font-size="30">${showNumber}</text>

  ${visualSvg(index + 1)}

  <rect x="70" y="164" width="560" height="650" rx="44" fill="#ffffff" opacity="0.72"/>
  <rect x="70" y="164" width="560" height="650" rx="44" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.92"/>
  <text x="92" y="214" class="brand" font-size="20" fill="#f97316">${escapeXml(slide.eyebrow.toUpperCase())}</text>
  ${titleText}
  ${bodyText}

  <rect x="78" y="934" width="924" height="72" rx="36" fill="#0f172a" opacity="0.94"/>
  <circle cx="128" cy="970" r="20" fill="url(#orangeGrad)"/>
  <text x="166" y="982" class="small" font-size="28" fill="#ffffff">Follow @${escapeXml(BRAND_HANDLE)} for AI, business & creator systems</text>
</svg>`;
}

async function renderCarousel(content) {
  const outDir = path.join(ROOT, "assets", "daily", content.date);
  await fs.mkdir(outDir, { recursive: true });
  const files = [];
  for (let i = 0; i < 6; i += 1) {
    const svg = slideSvg(content, i);
    const filePath = path.join(outDir, `slide-${i + 1}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 94, mozjpeg: true }).toFile(filePath);
    const stat = await fs.stat(filePath);
    if (stat.size < 30_000) throw new Error(`Generated image too small: ${filePath}`);
    files.push(filePath);
    log(`Rendered ${path.relative(ROOT, filePath)} (${stat.size} bytes)`);
  }
  return files;
}

async function generate() {
  const dateString = process.env.POST_DATE || isoDateInIndia();
  log(`Generating daily carousel for ${dateString}`);
  const rawContent = await generateWithGroq(dateString);
  const content = normalizeContent(rawContent, dateString);

  const contentPath = `content/${dateString}.json`;
  await writeJson(contentPath, content);
  await renderCarousel(content);
  await queuePost(content);
  log(`Generation complete for ${content.id}`);
}

async function queuePost(content) {
  const posts = await readJson(POSTS_FILE, []);
  const id = `daily-${content.date}`;
  const existing = posts.find((post) => post.id === id);
  if (existing?.published_at) {
    log(`${id} is already published. Keeping existing published record.`);
    return;
  }

  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
  const imageUrls = Array.from({ length: 6 }, (_, index) => `${rawBase}/assets/daily/${content.date}/slide-${index + 1}.jpg`);
  const caption = `${content.caption.trim()}\n\n${content.hashtags.join(" ")}`.replace(/(#[\w]+)(\s+\1)+/gi, "$1").trim();
  const post = {
    id,
    publish_at: `${content.date}T09:00:00+05:30`,
    image_urls: imageUrls,
    caption,
    source: "auto-generated-free-template",
    topic: content.topic,
    created_at: new Date().toISOString(),
    published_at: null,
    instagram_media_id: null,
    instagram_permalink: null,
    instagram_username: null,
    verified_at: null,
    media_type: null,
    media_product_type: null,
    facebook_status: null,
    facebook_post_id: null,
    facebook_permalink: null
  };

  const nextPosts = posts.filter((item) => item.id !== id);
  nextPosts.push(post);
  nextPosts.sort((a, b) => String(a.publish_at).localeCompare(String(b.publish_at)));
  await writeJson(POSTS_FILE, nextPosts);
  log(`Queued ${id} for ${post.publish_at}.`);
}

async function preflightPost(post) {
  if (!Array.isArray(post.image_urls) || post.image_urls.length === 0) throw new Error(`Post ${post.id} has no image_urls.`);
  if (post.image_urls.length > 10) throw new Error(`Post ${post.id} has more than 10 images.`);
  for (const [index, url] of post.image_urls.entries()) {
    const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Image ${index + 1} is not reachable: ${response.status} ${url}`);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("image/jpeg") && !url.toLowerCase().endsWith(".jpg") && !url.toLowerCase().endsWith(".jpeg")) {
      log(`Warning: Image ${index + 1} content-type is ${type}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 30_000) throw new Error(`Image ${index + 1} is too small (${buffer.length} bytes): ${url}`);
  }
  log(`Preflight OK for ${post.id}: ${post.image_urls.length} image(s).`);
}

async function igGraph(pathname, params = {}, method = "GET") {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN secret is missing.");
  const url = new URL(`${IG_GRAPH_HOST}${pathname}`);
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) body.set(key, String(value));
  }
  body.set("access_token", token.trim());

  const response = await fetch(method === "GET" ? `${url}?${body}` : url, {
    method,
    headers: method === "GET" ? undefined : { "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : body
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok || data.error) {
    const err = data.error;
    throw new Error(err ? `${err.message} (type=${err.type}, code=${err.code}, subcode=${err.error_subcode || "-"})` : text);
  }
  return data;
}

async function waitForIgContainer(containerId) {
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    const status = await igGraph(`/${containerId}`, { fields: "status_code,status" });
    const code = status.status_code;
    log(`IG container ${containerId} status: ${code || status.status || "unknown"}`);
    if (code === "FINISHED") return status;
    if (code === "ERROR" || code === "EXPIRED") throw new Error(`Instagram container failed: ${JSON.stringify(status)}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Timed out waiting for Instagram container ${containerId}`);
}

async function publishInstagram(post) {
  const account = await igGraph("/me", { fields: "id,username" });
  if (EXPECTED_IG_USERNAME && account.username && account.username.toLowerCase() !== EXPECTED_IG_USERNAME.toLowerCase()) {
    throw new Error(`Instagram token belongs to @${account.username}, expected @${EXPECTED_IG_USERNAME}.`);
  }
  log(`Instagram account verified: @${account.username || "unknown"} (${account.id || "unknown"}).`);

  if (post.image_urls.length === 1) {
    const container = await igGraph(`/${IG_USER_ID}/media`, {
      image_url: post.image_urls[0],
      caption: post.caption
    }, "POST");
    await waitForIgContainer(container.id);
    const published = await igGraph(`/${IG_USER_ID}/media_publish`, { creation_id: container.id }, "POST");
    post.instagram_media_id = published.id;
  } else {
    const childIds = [];
    for (const [index, url] of post.image_urls.entries()) {
      const child = await igGraph(`/${IG_USER_ID}/media`, {
        image_url: url,
        is_carousel_item: "true"
      }, "POST");
      await waitForIgContainer(child.id);
      childIds.push(child.id);
      log(`Prepared carousel item ${index + 1}/${post.image_urls.length}.`);
    }
    const carousel = await igGraph(`/${IG_USER_ID}/media`, {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: post.caption
    }, "POST");
    await waitForIgContainer(carousel.id);
    const published = await igGraph(`/${IG_USER_ID}/media_publish`, { creation_id: carousel.id }, "POST");
    post.instagram_media_id = published.id;
  }
  post.published_at = new Date().toISOString();
  log(`Published Instagram post ${post.id} as ${post.instagram_media_id}.`);
}

async function verifyInstagram(post) {
  if (!post.instagram_media_id) return;
  const media = await igGraph(`/${post.instagram_media_id}`, {
    fields: "id,permalink,username,media_type,media_product_type"
  });
  post.instagram_permalink = media.permalink || post.instagram_permalink || null;
  post.instagram_username = media.username || BRAND_HANDLE;
  post.media_type = media.media_type || null;
  post.media_product_type = media.media_product_type || null;
  post.verified_at = new Date().toISOString();
  log(`Verified Instagram media ${post.instagram_media_id}: ${post.instagram_permalink || "no permalink"}`);
}

async function fbGraph(pathname, params = {}, method = "GET", tokenOverride = null) {
  const token = tokenOverride || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN secret is missing.");
  const url = new URL(`${FB_GRAPH_HOST}${pathname}`);
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) body.set(key, String(value));
  }
  body.set("access_token", token.trim());

  const response = await fetch(method === "GET" ? `${url}?${body}` : url, {
    method,
    headers: method === "GET" ? undefined : { "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : body
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok || data.error) {
    const err = data.error;
    throw new Error(err ? `${err.message} (type=${err.type}, code=${err.code}, subcode=${err.error_subcode || "-"})` : text);
  }
  return data;
}

async function resolvePageToken() {
  const page = await fbGraph(`/${PAGE_ID}`, { fields: "id,name,link,access_token" }, "GET");
  return {
    pageId: page.id || PAGE_ID,
    pageName: page.name || "Facebook Page",
    pageLink: page.link || null,
    pageToken: page.access_token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    tokenSource: page.access_token ? "page_lookup" : "provided_token"
  };
}

async function publishFacebook(post) {
  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    post.facebook_status = "skipped";
    post.facebook_error = "FACEBOOK_PAGE_ACCESS_TOKEN missing";
    log("Facebook token missing. Skipping Facebook publish.");
    return;
  }

  const page = await resolvePageToken();
  post.facebook_page_id = page.pageId;
  post.facebook_page_name = page.pageName;
  post.facebook_token_source = page.tokenSource;
  log(`Facebook Page verified: ${page.pageName} (${page.pageId}), token source: ${page.tokenSource}.`);

  const photoIds = [];
  for (const [index, url] of post.image_urls.entries()) {
    const photo = await fbGraph(`/${page.pageId}/photos`, {
      url,
      published: "false"
    }, "POST", page.pageToken);
    photoIds.push(photo.id);
    log(`Uploaded Facebook attached photo ${index + 1}/${post.image_urls.length}: ${photo.id}`);
  }

  const params = { message: post.caption };
  photoIds.forEach((id, index) => {
    params[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
  });
  const feed = await fbGraph(`/${page.pageId}/feed`, params, "POST", page.pageToken);
  post.facebook_status = "published";
  post.facebook_post_id = feed.id;
  post.facebook_photo_ids = photoIds;
  post.facebook_posted_at = new Date().toISOString();
  const postObjectId = String(feed.id || "").split("_").pop();
  post.facebook_permalink = postObjectId ? `https://www.facebook.com/${page.pageId}/posts/${postObjectId}` : page.pageLink;
  delete post.facebook_error;
  delete post.facebook_failed_at;
  log(`Published Facebook Page post: ${post.facebook_post_id}`);
}

async function publish() {
  const posts = await readJson(POSTS_FILE, []);
  const now = new Date();
  const post = posts.find((item) => !item.published_at && new Date(item.publish_at) <= now);
  if (!post) {
    log("No due unpublished post found.");
    return;
  }

  try {
    await preflightPost(post);
    await publishInstagram(post);
    await verifyInstagram(post);
    await publishFacebook(post);
  } catch (error) {
    log(`Publish failed: ${error.message}`);
    if (post.instagram_media_id && !post.verified_at) {
      try { await verifyInstagram(post); } catch (verifyError) { log(`Verify after failure also failed: ${verifyError.message}`); }
    }
    if (post.published_at && !post.facebook_post_id && post.facebook_status !== "published") {
      post.facebook_status = "failed";
      post.facebook_error = error.message;
      post.facebook_failed_at = new Date().toISOString();
    }
    await writeJson(POSTS_FILE, posts);
    throw error;
  }

  await writeJson(POSTS_FILE, posts);
  log(`Publish complete for ${post.id}.`);
}

if (!MODE || !["generate", "publish"].includes(MODE)) {
  console.error("Usage: node scripts/social_engine.mjs <generate|publish>");
  process.exit(1);
}

try {
  if (MODE === "generate") await generate();
  if (MODE === "publish") await publish();
} catch (error) {
  console.error(error);
  process.exit(1);
}
