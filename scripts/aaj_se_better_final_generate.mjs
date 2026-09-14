import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const POSTS_FILE = process.env.POSTS_FILE || 'posts.json';
const TZ = 'Asia/Kolkata';

const BRAND_HANDLE = (
  process.env.BRAND_HANDLE || 'aajsebetter'
).replace(/^@/, '');

const REPO =
  process.env.TARGET_REPO ||
  process.env.GITHUB_REPOSITORY ||
  'Avi-2024/AutoPost-IG-FB';

const BRANCH =
  process.env.TARGET_BRANCH || 'main';

const VISUALS_DIR = path.join(
  ROOT,
  'assets',
  'reference-carousel'
);


/* =========================================================
   DESIGN COLORS
========================================================= */

const C = {
  ink: '#0b1422',
  orange: '#ff5a08',
  body: '#1e2b40',
  muted: '#6b7280',
  cream: '#fffaf5',
  peach: '#ffe9d1',
  line: '#d7dce4'
};


/* =========================================================
   HELPERS
========================================================= */

function log(m) {
  console.log(`[aaj-se-better-final] ${m}`);
}


function esc(v = '') {
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}


function dateIST(date = new Date()) {

  const p = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(date);

  const o = Object.fromEntries(
    p.map(x => [x.type, x.value])
  );

  return `${o.year}-${o.month}-${o.day}`;
}


function wrap(
  text,
  maxChars,
  maxLines
) {

  const words = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  const lines = [];

  let line = '';

  for (const word of words) {

    const next =
      line
        ? `${line} ${word}`
        : word;

    if (next.length <= maxChars) {

      line = next;

    } else {

      if (line) {
        lines.push(line);
      }

      line = word;

      if (
        lines.length >=
        maxLines - 1
      ) {
        break;
      }

    }
  }

  if (
    line &&
    lines.length < maxLines
  ) {
    lines.push(line);
  }

  return lines;
}


/* =========================================================
   JSON FILE HELPERS
========================================================= */

async function readJson(
  file,
  fallback
) {

  try {

    return JSON.parse(
      await fs.readFile(
        path.join(ROOT, file),
        'utf8'
      )
    );

  } catch (e) {

    if (e.code === 'ENOENT') {
      return fallback;
    }

    throw e;
  }
}


async function writeJson(
  file,
  data
) {

  const target =
    path.join(
      ROOT,
      file
    );

  await fs.mkdir(
    path.dirname(target),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    target,
    `${JSON.stringify(
      data,
      null,
      2
    )}\n`,
    'utf8'
  );
}


/* =========================================================
   FALLBACK CONTENT
   Used when GROQ_API_KEY is unavailable
========================================================= */

function fallback(date) {

  const topics = [

    /* -----------------------------------------------------
       TOPIC 1
    ----------------------------------------------------- */

    {
      topic:
        'Start before you feel ready',

      caption:
        'Perfect time ka wait mat karo. Chhota start bhi start hota hai.\n\nAaj ek small action lo. Kal ke confidence ka base aaj ka action hota hai.',

      slides: [

        [
          'LIFE LESSONS FOR A BETTER YOU',
          'Jaldi Shuru Karo,',
          'Perfect Mat Bano.',
          'Perfect plan ka wait karte karte bahut saare sapne sirf sapne hi reh jaate hain.',
          'Action > Perfection'
        ],

        [
          'THE PROBLEM',
          'Hum Sochte',
          'Rehte Hain...',
          'Thoda aur soch leta hoon. Thoda aur time dekh leta hoon. Pehle sab plan kar leta hoon. Abhi sahi time nahi hai.',
          'Overthinking kills progress.'
        ],

        [
          'THE REALITY',
          'Perfect Time',
          'Kabhi Nahi Aata.',
          'Life kabhi 100% ready nahi hoti. Conditions kabhi perfect nahi hote. Jo wait karte rehte hain, wo aksar shuru hi nahi kar pate.',
          'Progress needs a starting point.'
        ],

        [
          'THE LESSON',
          'Action Se Hi',
          'Clarity Aati Hai.',
          'Sochne se cheeze clear nahi hoti, karne se hoti hain. Shuru karoge to raste khud bante jaayenge.',
          'Start. Learn. Improve.'
        ],

        [
          'ACTION STEPS',
          'Aaj Hi Ek',
          'Chhota Step Lo.',
          'Ek chhota goal likho. Sirf 10 minute se shuru karo. Progress ko track karo. Behtar banate jao.',
          'Small steps create big results.'
        ],

        [
          'FINAL TAKEAWAY',
          'Kal Nahi. Perfect Nahi.',
          'Aaj Se Better.',
          'Shuru karo. Consistency rakho. Apna best dete raho. Wahi kaafi hai.',
          'A better you is a brighter tomorrow.'
        ]

      ]
    },


    /* -----------------------------------------------------
       TOPIC 2
    ----------------------------------------------------- */

    {
      topic:
        'Protect your focus',

      caption:
        'Har cheez tumhare liye nahi hoti. Focus bachana bhi growth hai.\n\nAaj ek distraction remove karo aur ek priority protect karo.',

      slides: [

        [
          'LIFE LESSONS FOR A BETTER YOU',
          'Focus Ko',
          'Protect Karo.',
          'Distractions kam honge, to direction clear rahegi. Har cheez ko attention dena zaroori nahi.',
          'Less noise. More progress.'
        ],

        [
          'THE PROBLEM',
          'Har Baat Par',
          'Yes Mat Bolo.',
          'Har yes tumhare time aur energy ka ek hissa le jaata hai.',
          'Protect your energy.'
        ],

        [
          'THE REALITY',
          'Ek Goal.',
          'Ek Season.',
          'Ek waqt par ek important cheez ko enough time dena growth ko fast karta hai.',
          'Depth beats scattered effort.'
        ],

        [
          'THE LESSON',
          'Distraction',
          'Costs More.',
          'Phone ke 5 minute kabhi-kabhi 50 minute ka focus tod dete hain.',
          'Guard your attention.'
        ],

        [
          'ACTION STEPS',
          'Priority',
          'Clear Rakho.',
          'Agar sab important hai, to actually kuch bhi important nahi.',
          'Choose what matters.'
        ],

        [
          'FINAL TAKEAWAY',
          'Kal Se Nahi.',
          'Aaj Se Better.',
          'Ek distraction remove karo. Ek priority protect karo.',
          'Fewer distractions. Bigger you.'
        ]

      ]
    },


    /* -----------------------------------------------------
       TOPIC 3
    ----------------------------------------------------- */

    {
      topic:
        'Slow progress is still progress',

      caption:
        'Slow progress ko underestimate mat karo.\n\nAaj tum kal se thode better ho — wahi enough direction hai.',

      slides: [

        [
          'LIFE LESSONS FOR A BETTER YOU',
          'Slow Hona',
          'Stuck Nahi.',
          'Slow progress bhi progress hota hai — bas direction sahi honi chahiye.',
          'Keep moving.'
        ],

        [
          'THE PROBLEM',
          'Highlight Reel',
          'Real Life Nahi.',
          'Dusron ka best moment dekhkar apna normal day judge mat karo.',
          'Reality over comparison.'
        ],

        [
          'THE REALITY',
          'Apni Pace',
          'Respect Karo.',
          'Fast hona zaroori nahi. Consistent rehna zaroori hai.',
          'Your pace still counts.'
        ],

        [
          'THE LESSON',
          'Small Wins',
          'Notice Karo.',
          'Jo improve hua hai use count karo, sirf gap ko nahi.',
          'Progress leaves clues.'
        ],

        [
          'ACTION STEPS',
          'Race Apni',
          'Rakho.',
          'Tumhara timeline kisi aur ke timeline se compare nahi hota.',
          'Run your own race.'
        ],

        [
          'FINAL TAKEAWAY',
          'Sabse Better Nahi.',
          'Aaj Se Better.',
          'Khud ko kal wale version se compare karo. Kisi aur se nahi.',
          'Small steps. Bigger life.'
        ]

      ]
    }

  ];


  /* -------------------------------------------------------
     Curated date override
     Keep upcoming posts distinct when the fallback pool rotates.
  ------------------------------------------------------- */

  if (date === '2026-09-14') {
    return {
      date,
      topic: 'Discipline beats motivation',
      slides: [
        {
          eyebrow: 'LIFE LESSONS FOR A BETTER YOU',
          primary: 'Motivation Ka',
          accent: 'Wait Mat Karo.',
          body: 'Motivation har din nahi aati. Discipline low days me bhi tumhe aage badhati hai.',
          note: 'Start even when you do not feel like it.'
        },
        {
          eyebrow: 'THE PROBLEM',
          primary: 'Mood Ke Saath',
          accent: 'Goals Mat Badlo.',
          body: 'Aaj mood nahi hai, isliye goal postpone karna easy lagta hai.',
          note: 'Feelings change. Commitments matter.'
        },
        {
          eyebrow: 'THE REALITY',
          primary: 'Small Habits',
          accent: 'Big Identity Banati Hain.',
          body: 'Jo kaam tum repeat karte ho, wahi dheere-dheere tumhari identity ban jaata hai.',
          note: 'Repetition creates reliability.'
        },
        {
          eyebrow: 'THE LESSON',
          primary: 'Minimum Version',
          accent: 'Complete Karo.',
          body: 'Full workout nahi? 10 minutes. Full chapter nahi? 2 pages. Chain mat todo.',
          note: 'Make the habit easy to continue.'
        },
        {
          eyebrow: 'ACTION STEPS',
          primary: 'Daily Non-Negotiable',
          accent: 'Ek Rakho.',
          body: 'Aaj ka ek important kaam decide karo aur use distractions se pehle complete karo.',
          note: 'One promise. Every day.'
        },
        {
          eyebrow: 'FINAL TAKEAWAY',
          primary: 'Motivation Aaye',
          accent: 'Ya Na Aaye.',
          body: 'Aaj bas apna minimum version complete karo. Kal ka confidence wahi banayega.',
          note: 'Discipline makes progress predictable.'
        }
      ],
      caption: 'Motivation ka wait karoge to progress ruk jayegi.\n\nAaj apna minimum version complete karo—small action, but no zero day.',
      hashtags: [
        '#aajsebetter',
        '#lifelessons',
        '#mindset',
        '#discipline',
        '#selfgrowth',
        '#consistency',
        '#betterhabits',
        '#hinglish'
      ]
    };
  }


  /* -------------------------------------------------------
     Rotate topic according to date
  ------------------------------------------------------- */

  const idx =
    [...date].reduce(
      (s, c) =>
        s + c.charCodeAt(0),
      0
    ) % topics.length;


  const t =
    topics[idx];


  return {

    date,

    topic:
      t.topic,

    slides:
      t.slides.map(
        (
          [
            eyebrow,
            primary,
            accent,
            body,
            note
          ]
        ) => ({
          eyebrow,
          primary,
          accent,
          body,
          note
        })
      ),

    caption:
      t.caption,

    hashtags: [
      '#aajsebetter',
      '#lifelessons',
      '#mindset',
      '#selfgrowth',
      '#discipline',
      '#consistency',
      '#personalgrowth',
      '#hinglish'
    ]

  };
}


/* =========================================================
   GROQ CONTENT GENERATION
========================================================= */

async function withGroq(date) {

  const key =
    process.env.GROQ_API_KEY;


  if (!key) {
    return fallback(date);
  }


  const prompt = `
Create exactly 6 carousel slides for Aaj Se Better.

Audience:
Indian students and young professionals.

Niche:
practical life lessons,
mindset,
discipline,
focus,
confidence,
self-growth.

Tone:
simple Hinglish,
warm,
relatable,
never preachy.

Return JSON only:

{
  "topic":"...",
  "slides":[
    {
      "eyebrow":"max 34 chars",
      "primary":"max 24 chars",
      "accent":"max 24 chars",
      "body":"max 150 chars",
      "note":"max 42 chars"
    }
  ],
  "caption":"...",
  "hashtags":["#aajsebetter"]
}

Rules:

Slide 1:
strong hook

Slides 2-5:
useful lessons

Slide 6:
memorable action CTA

Avoid:
fake facts,
toxic positivity,
medical advice,
legal advice,
financial advice.
`;


  try {

    const r =
      await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {

          method:
            'POST',

          headers: {

            Authorization:
              `Bearer ${key}`,

            'Content-Type':
              'application/json'

          },

          body:
            JSON.stringify({

              model:
                process.env.GROQ_MODEL ||
                'llama-3.3-70b-versatile',

              temperature:
                0.72,

              response_format: {
                type:
                  'json_object'
              },

              messages: [

                {
                  role:
                    'system',

                  content:
                    'Return valid JSON only.'
                },

                {
                  role:
                    'user',

                  content:
                    prompt
                }

              ]

            })

        }
      );


    if (!r.ok) {

      throw new Error(
        `Groq ${r.status}`
      );

    }


    const raw =
      JSON.parse(
        (
          await r.json()
        ).choices?.[0]
          ?.message
          ?.content ||
        '{}'
      );


    const fb =
      fallback(date);


    const slides =
      Array.isArray(
        raw.slides
      )
        ? raw.slides.slice(
            0,
            6
          )
        : fb.slides;


    while (
      slides.length < 6
    ) {

      slides.push(
        fb.slides[
          slides.length
        ]
      );

    }


    return {

      date,

      topic:
        String(
          raw.topic ||
          fb.topic
        ),

      slides:
        slides.map(
          (s, i) => ({

            eyebrow:
              String(
                s.eyebrow ||
                fb.slides[i]
                  .eyebrow
              )
                .toUpperCase(),

            primary:
              String(
                s.primary ||
                fb.slides[i]
                  .primary
              ),

            accent:
              String(
                s.accent ||
                fb.slides[i]
                  .accent
              ),

            body:
              String(
                s.body ||
                fb.slides[i]
                  .body
              ),

            note:
              String(
                s.note ||
                fb.slides[i]
                  .note
              )

          })
        ),

      caption:
        String(
          raw.caption ||
          fb.caption
        ),

      hashtags:
        Array.isArray(
          raw.hashtags
        ) &&
        raw.hashtags.length
          ? raw.hashtags
          : fb.hashtags

    };


  } catch (e) {

    log(
      `Groq failed, using fallback: ${e.message}`
    );

    return fallback(date);

  }
}


/* =========================================================
   SVG DESIGN DEFINITION
========================================================= */

function defs() {

  return `
  <defs>

    <!-- BACKGROUND -->

    <linearGradient
      id="bg"
      x1="0"
      y1="0"
      x2="1"
      y2="1"
    >

          <stop
            stop-color="${C.cream}"
          />

      <stop
        offset=".58"
            stop-color="#fffdfb"
      />

      <stop
        offset="1"
            stop-color="${C.peach}"
      />

    </linearGradient>


    <!-- PEACH GLOW -->

    <radialGradient
      id="peach"
    >

      <stop
            stop-color="${C.orange}"
            stop-opacity=".14"
      />

      <stop
        offset="1"
            stop-color="${C.orange}"
        stop-opacity="0"
      />

    </radialGradient>

    <linearGradient id="textWash" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".94"/>
      <stop offset=".72" stop-color="#ffffff" stop-opacity=".58"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <clipPath id="visualClip">
      <rect x="0" y="0" width="1080" height="1080" rx="68"/>
    </clipPath>


    <!-- TYPOGRAPHY -->

    <style>

      .brand {
        font-family:
          'DejaVu Sans',
          Arial,
          sans-serif;

        font-weight: 700;

        fill: ${C.ink};
      }


      .brandOrange {
        font-family:
          'DejaVu Sans',
          Arial,
          sans-serif;

        font-weight: 700;

        fill: ${C.orange};
      }


      .eyebrow {
        font-family:
          'DejaVu Sans',
          Arial,
          sans-serif;

        font-weight: 700;

        fill: ${C.ink};

          letter-spacing: 5px;
      }


      .title {
        font-family:
          'DejaVu Sans',
          Arial,
          sans-serif;

        font-weight: 900;

        fill: ${C.ink};

          letter-spacing: -2px;
      }


      .accent {
        font-family:
          'DejaVu Sans',
          Arial,
          sans-serif;

        font-weight: 900;

        fill: ${C.orange};

          letter-spacing: -2px;
      }


      .body {
        font-family:
          'DejaVu Sans',
          Arial,
          sans-serif;

        font-weight: 400;

        fill: ${C.body};
      }


      .note {
        font-family:
          'Comic Sans MS',
          'URW Chancery L',
          'DejaVu Sans',
          cursive;

          font-style: italic;

          font-weight: 400;

          fill: ${C.ink};
      }


      .meta {
        font-family:
          'DejaVu Sans',
          Arial,
          sans-serif;

        font-weight:
          600;

        fill:
          ${C.ink};

          letter-spacing: 2.5px;
      }

    </style>

  </defs>
  `;
}


/* =========================================================
   HEADER
========================================================= */

function header(index) {

  return `
  <g>

    <circle
      cx="82"
      cy="78"
      r="27"
      fill="${C.orange}"
    />

    <path
      d="M70 83 L80 72 L87 79 L98 66"
      fill="none"
      stroke="#ffffff"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <text
      x="124"
      y="76"
      class="brand"
      font-size="28"
    >
      AAJ SE <tspan class="brandOrange">BETTER</tspan>
    </text>


    <text
      x="125"
      y="100"
      class="meta"
      font-size="9"
    >
      LIFE  •  MINDSET  •  ACTION  •  GROWTH
    </text>


    <rect
      x="904"
      y="46"
      width="112"
      height="61"
      rx="30"
      fill="#ffffff"
      fill-opacity=".88"
      stroke="#e5e7eb"
      stroke-width="2"
    />

    <circle
      cx="936"
      cy="76"
      r="22"
      fill="${C.orange}"
    />

    <text
      x="936"
      y="84"
      text-anchor="middle"
      font-family="DejaVu Sans,Arial,sans-serif"
      font-weight="900"
      font-size="22"
      fill="#ffffff"
    >
      ${index + 1}
    </text>

    <text
      x="974"
      y="84"
      class="brand"
      font-size="22"
    >
      /6
    </text>

  </g>
  `;
}


/* =========================================================
   FOOTER
========================================================= */

function footer(index) {

  const action =
    index < 5
      ? 'Swipe Next →'
      : 'Follow for more →';


  const fill =
    index < 5
      ? '#fffaf5'
      : C.orange;


  const txt =
    index < 5
      ? C.ink
      : '#ffffff';


  return `
  <g>

    <rect
      x="54"
      y="874"
      width="972"
      height="150"
      rx="32"
      fill="#ffffff"
      fill-opacity=".58"
    />

    <line
      x1="72"
      y1="932"
      x2="738"
      y2="932"
      stroke="${C.line}"
      stroke-width="1.5"
    />


    <text
      x="72"
      y="978"
      class="meta"
      font-size="10"
    >
      MINDSET  |  BETTER HABITS  |  A BRIGHTER YOU
    </text>


      <rect
        x="792"
        y="948"
        width="220"
        height="58"
        rx="29"
        fill="${fill}"
        stroke="${C.orange}"
        stroke-width="1.8"
      />


      <text
        x="902"
        y="985"
        text-anchor="middle"
        font-family="DejaVu Sans,Arial,sans-serif"
        font-weight="700"
        font-size="17"
        fill="${txt}"
      >
        ${action}
      </text>

  </g>
  `;
}


/* =========================================================
   MAIN SLIDE TEMPLATE
========================================================= */

function slideSvg(
  content,
  index,
  visuals = []
) {

  const s =
    content.slides[index];


  /* -------------------------
     MAIN TITLE
  ------------------------- */

  const primaryLines =
    wrap(
      s.primary,
      19,
      2
    );


  const accentLines =
    wrap(
      s.accent,
      19,
      2
    );


  const titleSize =
    index === 0
      ? 70
      : 64;


  let y =
    228;


  const p =
    primaryLines
      .map(
        (line, i) =>
          `
          <text
            x="72"
            y="${y + i * 72}"
            class="title"
            font-size="${titleSize}"
          >
            ${esc(line)}
          </text>
          `
      )
      .join('');


  y +=
    primaryLines.length *
    72;


  const a =
    accentLines
      .map(
        (line, i) =>
          `
          <text
            x="72"
            y="${y + i * 72}"
            class="accent"
            font-size="${titleSize}"
          >
            ${esc(line)}
          </text>
          `
      )
      .join('');


  y +=
    accentLines.length *
    72;


  /* -------------------------
     BODY
  ------------------------- */

  const bodyY =
    Math.max(
      y + 35,
      468
    );


  const bodyLines =
    wrap(
      s.body,
      37,
      3
    );


  const b =
    bodyLines
      .map(
        (line, i) =>
          `
          <text
            x="70"
            y="${
              bodyY +
                  i * 40
            }"
            class="body"
            font-size="28"
          >
            ${esc(line)}
          </text>
          `
      )
      .join('');


  /* -------------------------
     NOTE / HIGHLIGHT
  ------------------------- */

  const noteY =
    Math.min(
      bodyY +
        bodyLines.length *
          40 +
        75,
      816
    );


  const noteLines =
    wrap(
      s.note,
      44,
      2
    );


  const n =
    noteLines
      .map(
        (line, i) =>
          `
          <text
            x="70"
            y="${
              noteY +
                  i * 32
            }"
            class="note"
            font-size="25"
          >
            ${esc(line)}
          </text>
          `
      )
      .join('');


  const underlineY =
    Math.min(
      y + 10,
      454
    );

  const visualMarkup = visuals[index]
    ? `<image
         x="0"
         y="0"
         width="1080"
         height="1080"
         preserveAspectRatio="none"
         clip-path="url(#visualClip)"
         href="${visuals[index]}"
         xlink:href="${visuals[index]}"
       />`
    : '';


  /* =======================================================
     FINAL SVG
  ======================================================= */

  return `<?xml version="1.0" encoding="UTF-8"?>

  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="1080"
    height="1080"
    viewBox="0 0 1080 1080"
  >

    ${defs()}


    <!-- BACKGROUND -->

    <rect
      width="1080"
      height="1080"
      fill="url(#bg)"
    />

    ${visualMarkup}

    <rect
      x="0"
      y="0"
      width="660"
      height="880"
      fill="url(#textWash)"
      opacity=".76"
    />


    <!-- HEADER -->

    ${header(index)}


    <!-- SECTION LABEL -->

    <text
      x="70"
      y="158"
      class="eyebrow"
      font-size="13"
    >
      ${esc(s.eyebrow)}
    </text>


    <!-- TITLES -->

    ${p}

    ${a}


    <!-- ORANGE UNDERLINE -->

    <line
      x1="70"
      y1="${underlineY}"
      x2="165"
      y2="${underlineY}"
      stroke="${C.orange}"
      stroke-width="7"
      stroke-linecap="round"
    />


    <!-- BODY TEXT -->

    ${b}


    <!-- NOTE DIVIDER -->

    <line
      x1="70"
      y1="${noteY - 48}"
      x2="155"
      y2="${noteY - 48}"
      stroke="${C.orange}"
      stroke-width="6"
      stroke-linecap="round"
    />


    <!-- NOTE -->

    ${n}


    <!-- FOOTER -->

    ${footer(index)}

  </svg>
  `;
}


/* =========================================================
   RENDER JPG CAROUSEL
========================================================= */

async function loadVisuals() {

  const visuals = [];

  for (let i = 1; i <= 6; i += 1) {

    try {
      const image = await fs.readFile(
        path.join(VISUALS_DIR, `slide-${i}.jpg`)
      );

      visuals.push(
        `data:image/jpeg;base64,${image.toString('base64')}`
      );

    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      visuals.push('');
    }
  }

  return visuals;
}


async function render(content) {

  const dir =
    path.join(
      ROOT,
      'assets',
      'daily',
      content.date
    );


  await fs.mkdir(
    dir,
    {
      recursive: true
    }
  );

  const visuals = await loadVisuals();


  for (
    let i = 0;
    i < 6;
    i++
  ) {

    const file =
      path.join(
        dir,
        `slide-${i + 1}.jpg`
      );


    await sharp(
      Buffer.from(
            slideSvg(
              content,
              i,
              visuals
            )
      )
    )
      .jpeg({
        quality: 95,
        mozjpeg: true
      })
      .toFile(file);


    const stat =
      await fs.stat(
        file
      );


    if (
      stat.size <
      30000
    ) {

      throw new Error(
        `Generated image too small: ${file}`
      );

    }


    log(
      `Rendered ${path.relative(
        ROOT,
        file
      )} (${stat.size} bytes)`
    );

  }

}


/* =========================================================
   QUEUE POST
========================================================= */

async function queue(content) {

  const posts =
    await readJson(
      POSTS_FILE,
      []
    );


  const id =
    `daily-${content.date}`;


  const existing =
    posts.find(
      p =>
        p.id === id
    );


  if (
    existing?.published_at
  ) {
    return;
  }


  const rawBase =
    `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;


  const image_urls =
    Array.from(
      {
        length: 6
      },
      (_, i) =>
        `${rawBase}/assets/daily/${content.date}/slide-${i + 1}.jpg`
    );


  const post = {

    id,

    publish_at:
      `${content.date}T09:00:00+05:30`,

    image_urls,

    caption:
      `${content.caption.trim()}\n\n${content.hashtags.join(' ')}`,

    source:
      'aaj-se-better-final-editorial',

    topic:
      content.topic,

    created_at:
      new Date()
        .toISOString(),

    published_at:
      null,

    instagram_media_id:
      null,

    instagram_permalink:
      null,

    instagram_username:
      null,

    verified_at:
      null,

    media_type:
      null,

    media_product_type:
      null,

    facebook_status:
      null,

    facebook_post_id:
      null,

    facebook_permalink:
      null

  };


  const next =
    posts.filter(
      p =>
        p.id !== id
    );


  next.push(post);


  next.sort(
    (a, b) =>
      String(
        a.publish_at
      ).localeCompare(
        String(
          b.publish_at
        )
      )
  );


  await writeJson(
    POSTS_FILE,
    next
  );

}


/* =========================================================
   MAIN
========================================================= */

async function main() {

  const date =
    process.env.POST_DATE ||
    dateIST();


  const content =
    await withGroq(
      date
    );


  await writeJson(
    `content/${date}.json`,
    content
  );


  await render(
    content
  );


  await queue(
    content
  );


  log(
    `Final editorial carousel ready for ${date}`
  );

}


/* =========================================================
   START
========================================================= */

main().catch(
  e => {

    console.error(e);

    process.exit(1);

  }
);
