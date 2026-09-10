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
  navy: '#081a33', orange: '#ff5b08', orange2: '#ff9d1f', blue: '#2563eb',
  body: '#34445f', cream: '#fffaf4', line: '#dfe5ee'
};

function log(message) { console.log(`[aaj-se-better] ${message}`); }

function dateIST(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const o = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${o.year}-${o.month}-${o.day}`;
}

function esc(value = '') {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
}

function wrap(text, maxChars, maxLines) {
  const words = String(text || '').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
  const lines = []; let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) line = next;
    else { if (line) lines.push(line); line = word; if (lines.length >= maxLines - 1) break; }
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
      caption: 'Perfect time ka wait mat karo. Chhota start bhi start hota hai.\n\nAaj ek small action lo. Save this for the days you overthink.',
      slides: [
        ['SMALL STEPS.','BIGGER LIFE.','5 simple life lessons jo tumhari direction badal sakte hain.','Progress starts today ↗'],
        ['JALDI','SHURU KARO','Perfect time kabhi nahi aata. Start small. Start today.','Start beats waiting ↗'],
        ['CONSISTENCY >','MOTIVATION','Mood nahi. Routine kaam karti hai. Chhote actions repeat karo.','Repeat • Improve • Grow ↗'],
        ['FAILURE =','FEEDBACK','Har setback ek lesson hai. Note karo, seekho, fir se chalo.','Try again, smarter ↗'],
        ['COMPARE','MAT KARO','Apni race run karo. Slow progress bhi progress hota hai.','Run your own race ↗'],
        ['AAJ SE','BETTER','Roz 1% better bano. Save • Share • Follow for relatable life lessons.','Same you. Stronger tomorrow ↗']
      ]
    },
    {
      topic: 'Protect your focus',
      caption: 'Har cheez tumhare liye nahi hoti. Focus bachana bhi growth hai.\n\nAaj ek distraction remove karo aur ek priority protect karo.',
      slides: [
        ['FOCUS IS','A SUPERPOWER','Jitni distractions kam, utni direction clear.','Less noise. More progress ↗'],
        ['SABKO','YES MAT BOLO','Har yes tumhare time aur energy ka ek piece le jaata hai.','Protect your energy ↗'],
        ['ONE GOAL.','ONE SEASON.','Ek waqt par ek important cheez ko enough time do.','Depth beats scattered effort ↗'],
        ['DISTRACTION','COSTS MORE','Phone ka 5 minute kabhi-kabhi 50 minute ka focus tod deta hai.','Guard your attention ↗'],
        ['PRIORITY','CLEAR RAKHO','Agar sab important hai, to actually kuch bhi important nahi.','Choose what matters ↗'],
        ['AAJ SE','BETTER','Ek distraction remove karo. Ek priority protect karo.','Fewer distractions. Bigger you ↗']
      ]
    },
    {
      topic: 'Slow progress is still progress',
      caption: 'Slow progress ko underestimate mat karo.\n\nAaj tum kal se thode better ho — wahi enough direction hai.',
      slides: [
        ['SLOW ≠','STUCK','Slow progress bhi progress hota hai — bas direction sahi honi chahiye.','Keep moving ↗'],
        ['HIGHLIGHT REEL','REAL LIFE NAHI','Dusron ka best moment dekhkar apna normal day judge mat karo.','Reality > comparison ↗'],
        ['APNI PACE','RESPECT KARO','Fast hona zaroori nahi. Consistent rehna zaroori hai.','Your pace still counts ↗'],
        ['SMALL WINS','NOTICE KARO','Jo improve hua hai use count karo, sirf gap ko nahi.','Progress leaves clues ↗'],
        ['RACE APNI','RAKHO','Tumhara timeline kisi aur ke timeline se compare nahi hota.','Run your own race ↗'],
        ['AAJ SE','BETTER','Kal se compare karo. Kisi aur se nahi.','Small steps. Bigger life. ↗']
      ]
    },
    {
      topic: 'Failure is information',
      caption: 'Failure ka matlab khatam nahi. Failure ka matlab data.\n\nAnalyze → improve → try again.',
      slides: [
        ['FAILURE =','FEEDBACK','Har galti tumhe batati hai ki next attempt me kya badalna hai.','Learn fast ↗'],
        ['LOSE NAHI','LEARN KARO','Result expected nahi mila? Emotion ke baad analysis karo.','Facts first ↗'],
        ['NOTE','WHAT FAILED','Guess mat karo. Exact reason likho — timing, skill, plan ya execution.','Clarity creates options ↗'],
        ['ONE FIX','AT A TIME','Sab kuch ek saath change karoge to pata nahi chalega kya work kiya.','Improve deliberately ↗'],
        ['TRY AGAIN','SMARTER','Same mistake repeat karna failure hai. Better attempt growth hai.','Adjust and move ↗'],
        ['AAJ SE','BETTER','Setback ko lesson me convert karo.','Progress never stops ↗']
      ]
    }
  ];
  const idx = [...date].reduce((s,c)=>s+c.charCodeAt(0),0) % topics.length;
  const t = topics[idx];
  return {
    date, topic: t.topic,
    slides: t.slides.map(([primary,accent,body,note])=>({primary,accent,body,note})),
    caption: t.caption,
    hashtags: ['#aajsebetter','#lifelessons','#mindset','#selfgrowth','#discipline','#consistency','#personalgrowth','#hinglish','#motivationindia']
  };
}

async function withGroq(date) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return fallback(date);
  const prompt = `Create exactly 6 slides for ${BRAND_NAME}. Audience: Indian students and young professionals. Niche: practical life lessons, mindset, discipline, focus, confidence, self-growth. Tone: simple Hinglish, warm, relatable, never preachy. Return JSON only: {"topic":"...","slides":[{"primary":"max 18 chars","accent":"max 18 chars","body":"max 95 chars","note":"max 35 chars"}],"caption":"...","hashtags":["#aajsebetter"]}. Slide 1 = hook, slides 2-5 = lessons, slide 6 = action/CTA. Avoid fake facts, toxic positivity, medical/legal/financial advice.`;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.75,
        response_format: { type: 'json_object' },
        messages: [{role:'system',content:'Return valid JSON only.'},{role:'user',content:prompt}]
      })
    });
    if (!r.ok) throw new Error(`Groq ${r.status}`);
    const raw = JSON.parse((await r.json()).choices?.[0]?.message?.content || '{}');
    const fb = fallback(date);
    const slides = Array.isArray(raw.slides) ? raw.slides.slice(0,6) : fb.slides;
    while (slides.length < 6) slides.push(fb.slides[slides.length]);
    return {
      date,
      topic: String(raw.topic || fb.topic),
      slides: slides.map((s,i)=>({
        primary: String(s.primary || fb.slides[i].primary).toUpperCase(),
        accent: String(s.accent || fb.slides[i].accent).toUpperCase(),
        body: String(s.body || fb.slides[i].body),
        note: String(s.note || fb.slides[i].note)
      })),
      caption: String(raw.caption || fb.caption),
      hashtags: Array.isArray(raw.hashtags) && raw.hashtags.length ? raw.hashtags : fb.hashtags
    };
  } catch (e) { log(`Groq failed, using fallback: ${e.message}`); return fallback(date); }
}

function defs() {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffaf4"/><stop offset=".48" stop-color="#fff"/><stop offset="1" stop-color="#f3f7ff"/></linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffb21f"/><stop offset="1" stop-color="#ff5b08"/></linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#e9edf4"/></linearGradient>
    <radialGradient id="sun"><stop stop-color="#ffe39b"/><stop offset="1" stop-color="#ffb21f" stop-opacity="0"/></radialGradient>
    <radialGradient id="blueGlow"><stop stop-color="#5e9dff" stop-opacity=".75"/><stop offset="1" stop-color="#5e9dff" stop-opacity="0"/></radialGradient>
    <radialGradient id="orangeGlow"><stop stop-color="#ffb35c" stop-opacity=".75"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0b1830" flood-opacity=".15"/></filter>
    <filter id="smallShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#0b1830" flood-opacity=".11"/></filter>
    <style>.brand{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:800;fill:${C.navy}}.meta{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:600;fill:#50627d;letter-spacing:4px}.title{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:900;fill:${C.navy};letter-spacing:-3px}.accent{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:900;fill:${C.orange};letter-spacing:-3px}.body{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:500;fill:${C.body}}.note{font-family:'DejaVu Sans',Arial,sans-serif;font-style:italic;font-weight:700;fill:${C.navy}}.label{font-family:'DejaVu Sans',Arial,sans-serif;font-weight:800;fill:#53627a}</style>
  </defs>`;
}

function header(i) {
  return `<g><circle cx="83" cy="76" r="34" fill="url(#orange)"/><path d="M62 88 L76 70 L88 83 L105 58" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><text x="137" y="72" class="brand" font-size="31">${esc(BRAND_NAME.toUpperCase())}</text><text x="139" y="102" class="meta" font-size="12">LIFE  •  MINDSET  •  ACTION  •  GROWTH</text><g filter="url(#smallShadow)"><rect x="908" y="45" width="112" height="64" rx="32" fill="#fff" stroke="#e7e9ee" stroke-width="2"/><circle cx="940" cy="77" r="24" fill="${C.orange}"/><text x="940" y="86" text-anchor="middle" font-family="DejaVu Sans" font-weight="800" font-size="25" fill="#fff">${i+1}</text><text x="978" y="87" class="brand" font-size="24">/6</text></g></g>`;
}

function footer(i) {
  return `<g><line x1="60" y1="979" x2="820" y2="979" stroke="#b8c0cc" stroke-width="2"/><text x="60" y="1014" class="brand" font-size="24">Aaj Se Better</text><text x="60" y="1041" class="meta" font-size="13">SMALL STEPS. BIGGER LIFE.</text>${i<5?`<g filter="url(#smallShadow)"><rect x="844" y="993" width="176" height="55" rx="28" fill="#fff" stroke="#eceef2"/><text x="865" y="1027" class="brand" font-size="17">Swipe Next</text><circle cx="989" cy="1020" r="20" fill="${C.orange}"/><path d="M982 1020h13m-6-6 6 6-6 6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`:''}</g>`;
}

function scene(i) {
  if (i===0) return `<g filter="url(#shadow)"><circle cx="900" cy="395" r="145" fill="url(#sun)"/><path d="M735 590 L895 400 L1040 590 Z" fill="#cdd8eb"/><path d="M895 400 L932 455 L860 455 Z" fill="#fff"/><line x1="900" y1="405" x2="900" y2="334" stroke="#8b5a2b" stroke-width="6"/><path d="M900 334 L956 351 L900 371 Z" fill="${C.orange}"/>${['LEARN','APPLY','IMPROVE','GROW'].map((t,n)=>{const x=650+n*75,y=805-n*72;return `<rect x="${x}" y="${y}" width="225" height="92" rx="20" fill="url(#stone)" stroke="#dde3ec"/><text x="${x+30}" y="${y+57}" class="label" font-size="22">${t}</text>`;}).join('')}</g>`;
  if (i===1) return `<g><circle cx="880" cy="430" r="165" fill="url(#sun)"/><path d="M645 825 L860 485 L1045 825 Z" fill="#d5dfef"/><path d="M860 485 L906 550 L818 550 Z" fill="#fff"/><path d="M645 825 C720 775 770 715 812 655 C858 588 919 555 1015 540" fill="none" stroke="url(#orange)" stroke-width="62" stroke-linecap="round"/><g filter="url(#smallShadow)"><rect x="700" y="745" width="170" height="58" rx="29" fill="#fff"/><text x="785" y="782" text-anchor="middle" class="label" font-size="21">START TODAY</text></g></g>`;
  if (i===2) return `<g filter="url(#shadow)"><circle cx="860" cy="390" r="145" fill="url(#orangeGlow)"/><rect x="675" y="430" width="320" height="300" rx="34" fill="#fff" stroke="#e0e5ed" stroke-width="3"/><rect x="675" y="430" width="320" height="72" rx="34" fill="url(#orange)"/><text x="835" y="475" text-anchor="middle" font-family="DejaVu Sans" font-weight="800" font-size="24" fill="#fff">DAILY PROGRESS</text>${Array.from({length:12},(_,n)=>{const c=n%4,r=Math.floor(n/4),x=720+c*62,y=545+r*62;return `<rect x="${x}" y="${y}" width="36" height="36" rx="9" fill="${n<9?'#fff0e4':'#f0f2f6'}" stroke="#ffb078"/>${n<9?`<path d="M${x+8} ${y+20} l8 8 l14 -18" fill="none" stroke="${C.orange}" stroke-width="5" stroke-linecap="round"/>`:''}`;}).join('')}<rect x="720" y="777" width="235" height="55" rx="27" fill="#eef4ff"/><text x="837" y="812" text-anchor="middle" class="label" font-size="21">SMALL STEPS EVERYDAY</text></g>`;
  if (i===3) return `<g filter="url(#shadow)"><circle cx="870" cy="380" r="145" fill="url(#blueGlow)" opacity=".5"/><rect x="665" y="405" width="335" height="355" rx="28" fill="#fff" stroke="#dfe4ec" stroke-width="3"/><text x="718" y="465" class="brand" font-size="30">LESSONS</text>${['ANALYZE','IMPROVE','TRY AGAIN'].map((t,n)=>{const y=520+n*66;return `<rect x="715" y="${y}" width="38" height="38" rx="8" fill="${C.orange}"/><path d="M724 ${y+20} l8 8 l14 -18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="777" y="${y+29}" class="label" font-size="25">${t}</text>`;}).join('')}<path d="M735 726 C800 700 844 665 904 598 C933 565 949 545 969 510" fill="none" stroke="${C.blue}" stroke-width="12" stroke-linecap="round"/><path d="M969 510 l-5 35 l-29-19 z" fill="${C.blue}"/><g transform="translate(646 782) rotate(-8)"><rect width="154" height="86" rx="18" fill="#f7f8fa" stroke="#e1e4e9"/><text x="77" y="54" text-anchor="middle" class="label" font-size="23">MISTAKE</text></g></g>`;
  if (i===4) return `<g><circle cx="895" cy="372" r="150" fill="url(#sun)"/><path d="M640 890 C738 750 760 670 812 560 C856 466 915 420 1005 395" fill="none" stroke="#e6e9ee" stroke-width="190" stroke-linecap="round"/><path d="M640 890 C738 750 760 670 812 560 C856 466 915 420 1005 395" fill="none" stroke="url(#orange)" stroke-width="72" stroke-linecap="round"/><path d="M681 813 C733 738 758 669 802 579" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="18 22"/><g filter="url(#smallShadow)"><rect x="842" y="693" width="156" height="64" rx="18" fill="#fff" stroke="#dfe4eb"/><text x="920" y="734" text-anchor="middle" class="label" font-size="20">MY JOURNEY</text></g><line x1="1001" y1="398" x2="1001" y2="321" stroke="#8a5a2d" stroke-width="6"/><path d="M1001 321 l58 18 l-58 21 z" fill="${C.orange}"/></g>`;
  return `<g><circle cx="893" cy="380" r="175" fill="url(#sun)"/><path d="M608 850 L820 520 L1045 850 Z" fill="#ccd8eb"/><path d="M820 520 L877 610 L765 610 Z" fill="#fff"/><line x1="823" y1="524" x2="823" y2="442" stroke="#895c2d" stroke-width="6"/><path d="M823 442 l63 20 l-63 23 z" fill="${C.orange}"/><g filter="url(#smallShadow)"><rect x="650" y="655" width="176" height="58" rx="18" fill="#fff"/><text x="738" y="692" text-anchor="middle" class="label" font-size="20">BETTER MINDSET</text><rect x="690" y="722" width="190" height="58" rx="18" fill="#fff"/><text x="785" y="759" text-anchor="middle" class="label" font-size="20">BIGGER ACTIONS</text></g></g>`;
}

function textLines(lines, cls, x, y, size, lh) {
  return lines.map((line,n)=>`<text x="${x}" y="${y+n*lh}" class="${cls}" font-size="${size}">${esc(line)}</text>`).join('');
}

function slideSvg(content, i) {
  const s = content.slides[i];
  const p = wrap(s.primary,15,2), a = wrap(s.accent,15,2), b = wrap(s.body,30,4);
  const ps = p.length>1?62:78, as = a.length>1?62:78;
  const py=230, ay=py+p.length*76+7, by=ay+a.length*76+48;
  return `<?xml version="1.0" encoding="UTF-8"?><svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">${defs()}<rect width="1080" height="1080" fill="url(#bg)"/><circle cx="-48" cy="180" r="150" fill="url(#blueGlow)" opacity=".65"/><circle cx="1090" cy="185" r="145" fill="url(#orangeGlow)" opacity=".7"/><circle cx="1050" cy="975" r="130" fill="url(#blueGlow)" opacity=".45"/><circle cx="20" cy="970" r="130" fill="url(#orangeGlow)" opacity=".42"/>${header(i)}<g>${textLines(p,'title',58,py,ps,76)}${textLines(a,'accent',58,ay,as,76)}<path d="M58 ${ay+a.length*76+9} C120 ${ay+a.length*76-3},190 ${ay+a.length*76-5},255 ${ay+a.length*76+1}" fill="none" stroke="${C.orange}" stroke-width="9" stroke-linecap="round"/>${textLines(b,'body',62,by,32,46)}<text x="68" y="835" class="note" font-size="25">${esc(s.note)}</text></g>${scene(i)}${footer(i)}</svg>`;
}

async function render(content) {
  const out = path.join(ROOT,'assets','daily',content.date);
  await fs.mkdir(out,{recursive:true});
  for (let i=0;i<6;i++) {
    const file=path.join(out,`slide-${i+1}.jpg`);
    await sharp(Buffer.from(slideSvg(content,i))).jpeg({quality:94,mozjpeg:true}).toFile(file);
    const st=await fs.stat(file); if(st.size<30000) throw new Error(`Generated image too small: ${file}`);
    log(`Rendered ${path.relative(ROOT,file)} (${st.size} bytes)`);
  }
}

async function queue(content) {
  const posts=await readJson(POSTS_FILE,[]), id=`daily-${content.date}`;
  if(posts.find(p=>p.id===id)?.published_at) return;
  const raw=`https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
  const image_urls=Array.from({length:6},(_,i)=>`${raw}/assets/daily/${content.date}/slide-${i+1}.jpg`);
  const tags=content.hashtags.map(t=>String(t).startsWith('#')?t:`#${t}`).join(' ');
  const post={id,publish_at:`${content.date}T09:00:00+05:30`,image_urls,caption:`${content.caption.trim()}\n\n${tags}`,source:'aaj-se-better-free-no-human-template',topic:content.topic,created_at:new Date().toISOString(),published_at:null,instagram_media_id:null,instagram_permalink:null,instagram_username:null,verified_at:null,media_type:null,media_product_type:null,facebook_status:null,facebook_post_id:null,facebook_permalink:null};
  const next=posts.filter(p=>p.id!==id); next.push(post); next.sort((a,b)=>String(a.publish_at).localeCompare(String(b.publish_at))); await writeJson(POSTS_FILE,next);
}

const date=process.env.POST_DATE || dateIST();
const content=await withGroq(date);
await writeJson(`content/${date}.json`,content);
await render(content);
await queue(content);
log(`Generation complete: ${content.topic}`);
