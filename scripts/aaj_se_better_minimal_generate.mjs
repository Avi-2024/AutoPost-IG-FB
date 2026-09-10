import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const POSTS_FILE = process.env.POSTS_FILE || 'posts.json';
const TZ = 'Asia/Kolkata';
const BRAND_NAME = process.env.BRAND_NAME || 'Aaj Se Better';
const BRAND_HANDLE = (process.env.BRAND_HANDLE || 'aajsebetter').replace(/^@/, '');
const REPO = process.env.TARGET_REPO || process.env.GITHUB_REPOSITORY || 'Avi-2024/AutoPost-IG-FB';
const BRANCH = process.env.TARGET_BRANCH || 'main';

const C = {
  navy: '#07182f',
  orange: '#ff5b08',
  orange2: '#ff9d1f',
  body: '#334155',
  muted: '#667085',
  cream: '#fffaf5',
  line: '#d8dee8'
};

function log(message) { console.log(`[aaj-se-better-minimal] ${message}`); }

function dateIST(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const o = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${o.year}-${o.month}-${o.day}`;
}

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrap(text, maxChars, maxLines) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) line = next;
    else {
      if (line) lines.push(line);
      line = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}

async function writeJson(file, data) {
  const target = path.join(ROOT, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function fallback(date) {
  const topics = [
    {
      topic: 'Start before you feel ready',
      caption: 'Perfect time ka wait mat karo. Chhota start bhi start hota hai.\n\nAaj ek small action lo. Kal ke confidence ka base aaj ka action hota hai.',
      slides: [
        ['SMALL STEPS.','BIGGER LIFE.','5 simple life lessons jo tumhari direction badal sakte hain.','Progress starts today.'],
        ['JALDI','SHURU KARO','Perfect time kabhi nahi aata. Start small. Start today.','Start beats waiting.'],
        ['CONSISTENCY >','MOTIVATION','Mood nahi. Routine kaam karti hai. Chhote actions repeat karo.','Repeat. Improve. Grow.'],
        ['FAILURE =','FEEDBACK','Har setback ek lesson hai. Note karo, seekho, fir se chalo.','Try again, smarter.'],
        ['COMPARE','MAT KARO','Apni race run karo. Slow progress bhi progress hota hai.','Run your own race.'],
        ['AAJ SE','BETTER','Roz 1% better bano. Save, share aur action lo.','Small steps. Bigger life.']
      ]
    },
    {
      topic: 'Protect your focus',
      caption: 'Har cheez tumhare liye nahi hoti. Focus bachana bhi growth hai.\n\nAaj ek distraction remove karo aur ek priority protect karo.',
      slides: [
        ['FOCUS IS','A SUPERPOWER','Jitni distractions kam, utni direction clear.','Less noise. More progress.'],
        ['SABKO','YES MAT BOLO','Har yes tumhare time aur energy ka ek piece le jaata hai.','Protect your energy.'],
        ['ONE GOAL.','ONE SEASON.','Ek waqt par ek important cheez ko enough time do.','Depth beats scattered effort.'],
        ['DISTRACTION','COSTS MORE','Phone ka 5 minute kabhi-kabhi 50 minute ka focus tod deta hai.','Guard your attention.'],
        ['PRIORITY','CLEAR RAKHO','Agar sab important hai, to actually kuch bhi important nahi.','Choose what matters.'],
        ['AAJ SE','BETTER','Ek distraction remove karo. Ek priority protect karo.','Fewer distractions. Bigger you.']
      ]
    },
    {
      topic: 'Slow progress is still progress',
      caption: 'Slow progress ko underestimate mat karo.\n\nAaj tum kal se thode better ho — wahi enough direction hai.',
      slides: [
        ['SLOW ≠','STUCK','Slow progress bhi progress hota hai — bas direction sahi honi chahiye.','Keep moving.'],
        ['HIGHLIGHT REEL','REAL LIFE NAHI','Dusron ka best moment dekhkar apna normal day judge mat karo.','Reality over comparison.'],
        ['APNI PACE','RESPECT KARO','Fast hona zaroori nahi. Consistent rehna zaroori hai.','Your pace still counts.'],
        ['SMALL WINS','NOTICE KARO','Jo improve hua hai use count karo, sirf gap ko nahi.','Progress leaves clues.'],
        ['RACE APNI','RAKHO','Tumhara timeline kisi aur ke timeline se compare nahi hota.','Run your own race.'],
        ['AAJ SE','BETTER','Kal se compare karo. Kisi aur se nahi.','Small steps. Bigger life.']
      ]
    }
  ];
  const idx = [...date].reduce((s, c) => s + c.charCodeAt(0), 0) % topics.length;
  const t = topics[idx];
  return {
    date,
    topic: t.topic,
    slides: t.slides.map(([primary, accent, body, note]) => ({ primary, accent, body, note })),
    caption: t.caption,
    hashtags: ['#aajsebetter','#lifelessons','#mindset','#selfgrowth','#discipline','#consistency','#personalgrowth','#hinglish']
  };
}

async function withGroq(date) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return fallback(date);
  const prompt = `Create exactly 6 slides for ${BRAND_NAME}. Audience: Indian students and young professionals. Niche: practical life lessons, mindset, discipline, focus, confidence and self-growth. Tone: simple Hinglish, warm, relatable, never preachy. Return JSON only: {"topic":"...","slides":[{"primary":"max 18 chars","accent":"max 18 chars","body":"max 95 chars","note":"max 35 chars"}],"caption":"...","hashtags":["#aajsebetter"]}. Slide 1 is a strong hook, slides 2-5 are useful lessons, slide 6 is an action CTA. No fake facts, toxic positivity, medical/legal/financial advice.`;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.75,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: 'Return valid JSON only.' }, { role: 'user', content: prompt }]
      })
    });
    if (!response.ok) throw new Error(`Groq ${response.status}`);
    const raw = JSON.parse((await response.json()).choices?.[0]?.message?.content || '{}');
    const fb = fallback(date);
    const slides = Array.isArray(raw.slides) ? raw.slides.slice(0, 6) : fb.slides;
    while (slides.length < 6) slides.push(fb.slides[slides.length]);
    return {
      date,
      topic: String(raw.topic || fb.topic),
      slides: slides.map((s, i) => ({
        primary: String(s.primary || fb.slides[i].primary).toUpperCase(),
        accent: String(s.accent || fb.slides[i].accent).toUpperCase(),
        body: String(s.body || fb.slides[i].body),
        note: String(s.note || fb.slides[i].note)
      })),
      caption: String(raw.caption || fb.caption),
      hashtags: Array.isArray(raw.hashtags) && raw.hashtags.length ? raw.hashtags : fb.hashtags
    };
  } catch (e) {
    log(`Groq failed, using fallback: ${e.message}`);
    return fallback(date);
  }
}

function defs() {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffaf5"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#f8fbff"/></linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffae18"/><stop offset="1" stop-color="#ff5b08"/></linearGradient>
    <radialGradient id="warmGlow"><stop stop-color="#ffbd66" stop-opacity=".20"/><stop offset="1" stop-color="#ffbd66" stop-opacity="0"/></radialGradient>
    <radialGradient id="coolGlow"><stop stop-color="#6ea7ff" stop-opacity=".17"/><stop offset="1" stop-color="#6ea7ff" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#07182f" flood-opacity=".10"/></filter>
    <style>
      .brand{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:800;fill:${C.navy}}
      .meta{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:600;fill:#52627b;letter-spacing:4px}
      .title{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:900;fill:${C.navy};letter-spacing:-4px}
      .accent{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:900;fill:${C.orange};letter-spacing:-4px}
      .body{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:500;fill:${C.body}}
      .note{font-family:'DejaVu Sans',Arial,sans-serif;font-style:italic;font-weight:700;fill:${C.navy}}
    </style>
  </defs>`;
}

function header(index) {
  return `<g>
    <circle cx="82" cy="75" r="34" fill="url(#orange)"/>
    <path d="M61 87 L76 69 L88 82 L106 57" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="137" y="71" class="brand" font-size="31">${esc(BRAND_NAME.toUpperCase())}</text>
    <text x="139" y="102" class="meta" font-size="12">LIFE  •  MINDSET  •  ACTION  •  GROWTH</text>
    <text x="952" y="82" text-anchor="end" class="brand" font-size="24">${index + 1}/6</text>
  </g>`;
}

function footer(index) {
  return `<g>
    <line x1="60" y1="979" x2="1018" y2="979" stroke="#c7ced8" stroke-width="2"/>
    <text x="60" y="1014" class="brand" font-size="24">Aaj Se Better</text>
    <text x="60" y="1041" class="meta" font-size="13">SMALL STEPS. BIGGER LIFE.</text>
    ${index < 5 ? `<text x="1018" y="1025" text-anchor="end" class="brand" font-size="17">SWIPE NEXT  →</text>` : `<text x="1018" y="1025" text-anchor="end" class="brand" font-size="17">SAVE  •  SHARE  •  FOLLOW</text>`}
  </g>`;
}

function slideSvg(content, index) {
  const slide = content.slides[index];
  const primaryLines = wrap(slide.primary, 17, 2);
  const accentLines = wrap(slide.accent, 17, 2);
  const titleSize = index === 0 ? 112 : 104;
  let y = 220;
  const p = primaryLines.map((line, i) => `<text x="62" y="${y + i * 110}" class="title" font-size="${titleSize}">${esc(line)}</text>`).join('');
  y += primaryLines.length * 110;
  const a = accentLines.map((line, i) => `<text x="62" y="${y + i * 110}" class="accent" font-size="${titleSize}">${esc(line)}</text>`).join('');
  y += accentLines.length * 110;
  const bodyY = Math.max(y + 55, 500);
  const bodyLines = wrap(slide.body, 42, 4);
  const b = bodyLines.map((line, i) => `<text x="66" y="${bodyY + i * 55}" class="body" font-size="39">${esc(line)}</text>`).join('');
  const noteY = Math.min(bodyY + bodyLines.length * 55 + 88, 815);
  const noteLines = wrap(slide.note, 34, 2);
  const n = noteLines.map((line, i) => `<text x="67" y="${noteY + i * 42}" class="note" font-size="29">${esc(line)}</text>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  ${defs()}
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="-40" cy="290" r="220" fill="url(#coolGlow)"/>
  <circle cx="1090" cy="150" r="210" fill="url(#warmGlow)"/>
  <circle cx="1080" cy="860" r="240" fill="url(#coolGlow)"/>
  ${header(index)}
  <g>${p}${a}</g>
  <line x1="62" y1="${Math.min(y + 12, 485)}" x2="270" y2="${Math.min(y - 2, 471)}" stroke="${C.orange}" stroke-width="10" stroke-linecap="round"/>
  ${b}
  <g filter="url(#shadow)">
    <rect x="62" y="${noteY - 42}" width="610" height="${noteLines.length > 1 ? 120 : 82}" rx="28" fill="#fff" stroke="#e9edf3" stroke-width="2"/>
  </g>
  <circle cx="99" cy="${noteY - 2}" r="17" fill="${C.orange}"/>
  <path d="M91 ${noteY - 2} h16 M99 ${noteY - 10} v16" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <g transform="translate(130 0)">${n}</g>
  ${footer(index)}
</svg>`;
}

async function render(content) {
  const outDir = path.join(ROOT, 'assets', 'daily', content.date);
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < 6; i += 1) {
    const file = path.join(outDir, `slide-${i + 1}.jpg`);
    await sharp(Buffer.from(slideSvg(content, i))).jpeg({ quality: 95, mozjpeg: true }).toFile(file);
    const stat = await fs.stat(file);
    if (stat.size < 30_000) throw new Error(`Generated image too small: ${file}`);
    log(`Rendered ${path.relative(ROOT, file)} (${stat.size} bytes)`);
  }
}

async function queue(content) {
  const posts = await readJson(POSTS_FILE, []);
  const id = `daily-${content.date}`;
  const existing = posts.find((p) => p.id === id);
  if (existing?.published_at) return;
  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
  const image_urls = Array.from({ length: 6 }, (_, i) => `${rawBase}/assets/daily/${content.date}/slide-${i + 1}.jpg`);
  const post = {
    id,
    publish_at: `${content.date}T09:00:00+05:30`,
    image_urls,
    caption: `${content.caption.trim()}\n\n${content.hashtags.join(' ')}`,
    source: 'aaj-se-better-minimal-no-graphics',
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
  const next = posts.filter((p) => p.id !== id);
  next.push(post);
  next.sort((a, b) => String(a.publish_at).localeCompare(String(b.publish_at)));
  await writeJson(POSTS_FILE, next);
}

async function main() {
  const date = process.env.POST_DATE || dateIST();
  const content = await withGroq(date);
  await writeJson(`content/${date}.json`, content);
  await render(content);
  await queue(content);
  log(`Minimal no-graphics carousel ready for ${date}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
