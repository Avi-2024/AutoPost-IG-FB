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


/* =========================================================
   DESIGN COLORS
========================================================= */

const C = {
  ink: '#211b18',
  orange: '#ed6a32',
  body: '#4b433e',
  muted: '#756b64',
  cream: '#fffaf5',
  peach: '#f9e3d2',
  line: '#d8c9bd'
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
          'Jitni distractions kam, utni direction clear. Har cheez ko attention dena zaroori nahi.',
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


    <!-- TYPOGRAPHY -->

    <style>

      .brand {
            font-family:
              'DejaVu Serif',
              Georgia,
              serif;

        font-weight: 700;

        fill: ${C.ink};
      }


      .brandOrange {
        font-family:
          'DejaVu Serif',
          Georgia,
          serif;

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
          'DejaVu Serif',
          Georgia,
          serif;

        font-weight: 700;

        fill: ${C.ink};

          letter-spacing: -1.5px;
      }


      .accent {
        font-family:
          'DejaVu Serif',
          Georgia,
          serif;

        font-weight: 700;

        fill: ${C.orange};

          letter-spacing: -1.5px;
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
              'DejaVu Serif',
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

    <text
      x="68"
      y="76"
      class="brand"
      font-size="36"
    >
      Aaj Se <tspan class="brandOrange">Better</tspan>
    </text>


    <text
      x="68"
      y="108"
      class="meta"
      font-size="10"
    >
      SMALL STEPS. BIGGER LIFE.
    </text>


    <text
      x="1012"
      y="78"
      text-anchor="end"
      class="brand"
      font-size="27"
    >
      ${index + 1}/6
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

    <line
      x1="68"
      y1="946"
      x2="738"
      y2="946"
      stroke="${C.line}"
      stroke-width="1.5"
    />


    <text
      x="68"
      y="991"
      class="meta"
      font-size="10"
    >
      MINDSET  |  BETTER HABITS  |  A BRIGHTER YOU
    </text>


      <rect
        x="792"
        y="963"
        width="220"
        height="58"
        rx="29"
        fill="${fill}"
        stroke="${C.orange}"
        stroke-width="1.8"
      />


      <text
        x="902"
        y="1000"
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
  index
) {

  const s =
    content.slides[index];


  /* -------------------------
     MAIN TITLE
  ------------------------- */

  const primaryLines =
    wrap(
      s.primary,
      24,
      2
    );


  const accentLines =
    wrap(
      s.accent,
      24,
      2
    );


  const titleSize =
    index === 0
      ? 72
      : 70;


  let y =
    232;


  const p =
    primaryLines
      .map(
        (line, i) =>
          `
          <text
            x="72"
            y="${y + i * 78}"
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
    78;


  const a =
    accentLines
      .map(
        (line, i) =>
          `
          <text
            x="72"
            y="${y + i * 78}"
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
    78;


  /* -------------------------
     BODY
  ------------------------- */

  const bodyY =
    Math.max(
      y + 42,
      470
    );


  const bodyLines =
    wrap(
      s.body,
      50,
      3
    );


  const b =
    bodyLines
      .map(
        (line, i) =>
          `
          <text
            x="72"
            y="${
              bodyY +
                  i * 43
            }"
            class="body"
            font-size="29"
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
          43 +
        82,
      824
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
            x="72"
            y="${
              noteY +
                  i * 36
            }"
            class="note"
            font-size="28"
          >
            ${esc(line)}
          </text>
          `
      )
      .join('');


  const underlineY =
    Math.min(
      y + 12,
      452
    );


  /* =======================================================
     FINAL SVG
  ======================================================= */

  return `<?xml version="1.0" encoding="UTF-8"?>

  <svg
    xmlns="http://www.w3.org/2000/svg"
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


    <!-- SUBTLE PEACH ACCENTS -->

    <circle
      cx="1100"
      cy="225"
      r="285"
      fill="url(#peach)"
    />


    <circle
      cx="1070"
      cy="955"
      r="315"
      fill="url(#peach)"
      opacity=".65"
    />


    <!-- HEADER -->

    ${header(index)}


    <!-- SECTION LABEL -->

    <text
      x="72"
      y="164"
      class="eyebrow"
      font-size="14"
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
      x2="155"
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
          i
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
