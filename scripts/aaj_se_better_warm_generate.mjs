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
  ink: '#182435',
  orange: '#ff5b08',
  orange2: '#ff9d1f',
  body: '#263445',
  muted: '#6b7280',
  cream: '#fff9f2',
  peach: '#fff0df',
  line: '#d9d3cb'
};

function log(message) { console.log(`[aaj-se-better-warm] ${message}`); }

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
        ['JALDI SHURU KARO,','PERFECT MAT BANO.','Perfect plan ka wait karte karte bahut saare sapne sirf sapne hi reh jaate hain.','Action > Perfection'],
        ['HUM SOCHTE','REHTE HAIN...','Thoda aur soch leta hoon. Thoda aur time dekh leta hoon. Pehle sab plan kar leta hoon.','Overthinking kills progress.'],
        ['PERFECT TIME','KABHI NAHI AATA.','Life kabhi 100% ready nahi hoti. Jo wait karte rehte hain, wo aksar shuru hi nahi kar pate.','Progress needs a starting point.'],
        ['ACTION SE HI','CLARITY AATI HAI.','Sochne se cheeze clear nahi hoti, karne se hoti hain. Shuru karoge to raste khud bante jayenge.','Start. Learn. Improve.'],
        ['AAJ HI EK','CHHOTA STEP LO.','Ek chhota goal likho. Sirf 10 minute se shuru karo. Progress ko track karo.','Small steps create big results.'],
        ['KAL NAHI.','AAJ SE BETTER.','Shuru karo. Consistency rakho. Apna best dete raho. Wahi kaafi hai.','A better you is a brighter tomorrow.']
      ]
    },
    {
      topic: 'Protect your focus',
      caption: 'Har cheez tumhare liye nahi hoti. Focus bachana bhi growth hai.\n\nAaj ek distraction remove karo aur ek priority protect karo.',
      slides: [
        ['FOCUS KO','PROTECT KARO.','Jitni distractions kam, utni direction clear. Har cheez ko attention dena zaroori nahi.','Less noise. More progress.'],
        ['HAR BAAT PAR','YES MAT BOLO.','Har yes tumhare time aur energy ka ek hissa le jaata hai.','Protect your energy.'],
        ['EK GOAL.','EK SEASON.','Ek waqt par ek important cheez ko enough time dena growth ko fast karta hai.','Depth beats scattered effort.'],
        ['DISTRACTION','COSTS MORE.','Phone ke 5 minute kabhi-kabhi 50 minute ka focus tod dete hain.','Guard your attention.'],
        ['PRIORITY','CLEAR RAKHO.','Agar sab important hai, to actually kuch bhi important nahi.','Choose what matters.'],
        ['AAJ SE','BETTER.','Ek distraction remove karo. Ek priority protect karo.','Fewer distractions. Bigger you.']
      ]
    },
    {
      topic: 'Slow progress is still progress',
      caption: 'Slow progress ko underestimate mat karo.\n\nAaj tum kal se thode better ho — wahi enough direction hai.',
      slides: [
        ['SLOW HONA','STUCK NAHI.','Slow progress bhi progress hota hai — bas direction sahi honi chahiye.','Keep moving.'],
        ['HIGHLIGHT REEL','REAL LIFE NAHI.','Dusron ka best moment dekhkar apna normal day judge mat karo.','Reality over comparison.'],
        ['APNI PACE','RESPECT KARO.','Fast hona zaroori nahi. Consistent rehna zaroori hai.','Your pace still counts.'],
        ['SMALL WINS','NOTICE KARO.','Jo improve hua hai use count karo, sirf gap ko nahi.','Progress leaves clues.'],
        ['RACE APNI','RAKHO.','Tumhara timeline kisi aur ke timeline se compare nahi hota.','Run your own race.'],
        ['KAL SE','BETTER.','Khud ko kal wale version se compare karo. Kisi aur se nahi.','Small steps. Bigger life.']
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
  const prompt = `Create exactly 6 slides for ${BRAND_NAME}. Audience: Indian students and young professionals. Niche: practical life lessons, mindset, discipline, focus, confidence and self-growth. Tone: simple Hinglish, warm, relatable, never preachy. Return JSON only: {"topic":"...","slides":[{"primary":"max 20 chars","accent":"max 20 chars","body":"max 115 chars","note":"max 38 chars"}],"caption":"...","hashtags":["#aajsebetter"]}. Slide 1 is a strong hook, slides 2-5 are useful lessons, slide 6 is an action CTA. Avoid fake facts, toxic positivity, medical/legal/financial advice.`;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.72,
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
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffaf5"/>
      <stop offset=".56" stop-color="#fffdf9"/>
      <stop offset="1" stop-color="#fff0df"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffae18"/><stop offset="1" stop-color="#ff5b08"/></linearGradient>
    <radialGradient id="peachGlow"><stop stop-color="#ffb45f" stop-opacity=".22"/><stop offset="1" stop-color="#ffb45f" stop-opacity="0"/></radialGradient>
    <radialGradient id="softCream"><stop stop-color="#fff2dd" stop-opacity=".65"/><stop offset="1" stop-color="#fff2dd" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#4a2a12" flood-opacity=".08"/></filter>
    <style>
      .brand{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:800;fill:${C.ink}}
      .meta{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:600;fill:#6f645a;letter-spacing:4px}
      .title{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:900;fill:${C.ink};letter-spacing:-4px}
      .accent{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:900;fill:${C.orange};letter-spacing:-4px}
      .body{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:500;fill:${C.body}}
      .note{font-family:'DejaVu Sans',Arial,sans-serif;font-style:italic;font-weight:700;fill:${C.ink}}
    </style>
  </defs>`;
}

function header(index) {
  return `<g>
    <circle cx="82" cy="75" r="34" fill="url(#orange)"/>
    <path d="M61 87 L76 69 L88 82 L106 57" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="137" y="71" class="brand" font-size="31">${esc(BRAND_NAME)}</text>
    <text x="139" y="102" class="meta" font-size="12">SMALL STEPS. BIGGER LIFE.</text>
    <text x="1015" y="78" text-anchor="end" class="brand" font-size="25">${index + 1}/6</text>
  </g>`;
}

function footer(index) {
  const action = index < 5 ? 'Swipe Next  →' : 'Follow for more  →';
  return `<g>
    <line x1="60" y1="978" x2="1018" y2="978" stroke="#cfc6bb" stroke-width="2"/>
    <text x="60" y="1015" class="meta" font-size="12">MINDSET   |   BETTER HABITS   |   A BRIGHTER YOU</text>
    <g filter="url(#shadow)">
      <rect x="842" y="997" width="176" height="50" rx="25" fill="#fffaf5" stroke="${C.orange}" stroke-width="2"/>
      <text x="930" y="1028" text-anchor="middle" class="brand" font-size="16">${action}</text>
    </g>
  </g>`;
}

function slideSvg(content, index) {
  const slide = content.slides[index];
  const primaryLines = wrap(slide.primary, 19, 2);
  const accentLines = wrap(slide.accent, 19, 2);
  const titleSize = index === 0 ? 92 : 88;
  let y = 210;
  const p = primaryLines.map((line, i) => `<text x="72" y="${y + i * 96}" class="title" font-size="${titleSize}">${esc(line)}</text>`).join('');
  y += primaryLines.length * 96;
  const a = accentLines.map((line, i) => `<text x="72" y="${y + i * 96}" class="accent" font-size="${titleSize}">${esc(line)}</text>`).join('');
  y += accentLines.length * 96;

  const bodyY = Math.max(y + 62, 500);
  const bodyLines = wrap(slide.body, 43, 4);
  const b = bodyLines.map((line, i) => `<text x="76" y="${bodyY + i * 52}" class="body" font-size="36">${esc(line)}</text>`).join('');
  const noteY = Math.min(bodyY + bodyLines.length * 52 + 92, 840);
  const noteLines = wrap(slide.note, 42, 2);
  const n = noteLines.map((line, i) => `<text x="76" y="${noteY + i * 40}" class="note" font-size="28">${esc(line)}</text>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  ${defs()}
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="1085" cy="245" r="260" fill="url(#peachGlow)"/>
  <circle cx="1035" cy="930" r="275" fill="url(#softCream)"/>
  <path d="M930 0 C970 160 1060 235 1080 270 L1080 0 Z" fill="#fff3e5" opacity=".65"/>
  <path d="M880 1080 C950 920 1028 872 1080 850 L1080 1080 Z" fill="#ffe5c8" opacity=".48"/>
  ${header(index)}
  <text x="74" y="145" class="meta" font-size="13">${index === 0 ? 'LIFE LESSONS FOR A BETTER YOU' : index === 5 ? 'FINAL TAKEAWAY' : 'THE LESSON'}</text>
  <g>${p}${a}</g>
  <line x1="72" y1="${Math.min(y + 12, 488)}" x2="160" y2="${Math.min(y + 12, 488)}" stroke="${C.orange}" stroke-width="8" stroke-linecap="round"/>
  ${b}
  <line x1="74" y1="${noteY - 46}" x2="126" y2="${noteY - 46}" stroke="${C.orange}" stroke-width="7" stroke-linecap="round"/>
  ${n}
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
    if (stat.size < 25_000) throw new Error(`Generated image too small: ${file}`);
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
    source: 'aaj-se-better-warm-minimal-locked-v1',
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
  log(`Warm minimal theme locked and generated for ${date}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
