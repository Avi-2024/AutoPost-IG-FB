# AutoPost IG + FB

Mostly-free daily Instagram + Facebook automation for a faceless creator brand.

This repo creates a branded 6-slide carousel automatically, queues it in `posts.json`, then publishes it to Instagram and Facebook Page.

## Daily flow

```txt
07:30 AM IST  Generate carousel JPGs + queue post
09:00 AM IST  Publish queued post to Instagram + Facebook
```

## Free-first design

This repo does not require a paid image generation API. It uses:

- Groq API for better topic/caption generation when `GROQ_API_KEY` is available.
- Built-in fallback content when `GROQ_API_KEY` is not available.
- `sharp` + SVG templates to create 1080x1080 JPG carousel slides.

The generator uses six screenshot-style 3D reference visuals stored in `assets/reference-carousel/` and overlays fresh daily content on them. No image-generation API key is required for this workflow. A paid/credit-based image API can be added later if you want new artwork every day.

## Required GitHub Secrets

For publishing:

```txt
META_ACCESS_TOKEN
FACEBOOK_PAGE_ACCESS_TOKEN
FACEBOOK_PAGE_ID
```

Recommended optional secret:

```txt
IG_USER_ID
```

For content generation:

```txt
GROQ_API_KEY
```

`GROQ_API_KEY` is optional. Without it, the repo still generates posts from the built-in content pool.

## Optional GitHub Variables

```txt
BRAND_NAME=Aaj Se Better
BRAND_HANDLE=aajsebetter
GROQ_MODEL=llama-3.3-70b-versatile
```

## Manual test

Go to GitHub Actions:

1. Run `Generate Daily Social Carousel` manually.
2. Confirm `assets/daily/YYYY-MM-DD/slide-1.jpg` to `slide-6.jpg` are created.
3. Confirm `posts.json` has a new queued entry.
4. Run `Publish Social Queue` manually.

## Important notes

- Instagram requires publicly reachable JPG/JPEG image URLs.
- The workflow uses raw GitHub URLs for generated carousel images.
- Facebook Page publishing requires `pages_manage_posts`, `pages_read_engagement`, and `pages_show_list` through a valid Page/System User token.
- The publisher saves Instagram and Facebook permalinks back into `posts.json`.

## Aaj Se Better visual template

The daily generator keeps the same 3D creator visual language, orange/blue glow accents, 6-slide carousel structure, and dynamic Groq-generated text. Add `GROQ_API_KEY` for fresh content; without it, the built-in fallback pool is used.
