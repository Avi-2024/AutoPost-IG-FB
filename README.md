# Aaj Se Better — Instagram + Facebook

Small steps. Bigger life.

Original six-slide Hinglish carousels about life lessons, mindset and self-growth. The current original AI batch covers October 5–11, 2026, scheduled daily at 09:00 IST.

## Design and original images

For this batch the user explicitly chose Aaj Se Better branding with the uploaded orange-hoodie character/blue-accent reference style. The full copy and generation prompts are in `content/approved-oct-05-11.json`. The 42 individual AI images are in `assets/approved/YYYY-MM-DD/slide-N.jpg`; provenance, dimensions and SHA-256 hashes are in `content/approved-oct-05-11-assets.json`.

Every image was generated with the built-in image tool, reviewed, then converted to a complete JPEG. No placeholder or old reference image is substituted. See `PROJECT_CONTEXT.md` for the approved style override and account rules.

## Daily workflow

- 07:30 IST: verify that today's original images and reviewed queue entry are ready. This check preserves committed assets.
- 09:00 IST: publish the due approved carousel to Instagram and Facebook, with morning retry triggers.
- Verify both accounts before creating any media; verify both published results before marking the post complete.
- Persist media containers and publish attempts. Recover ambiguous responses by reading the account/Page feed; block duplicate attempts when the result remains uncertain.

GitHub scheduled runs can start late. The cron target is 09:00 IST, not a guarantee of exact platform delivery time. When this batch ends, prepare another original batch; the readiness check fails rather than creating fallback images.

## Required repository secrets

Set these only for Aaj Se Better in this repository:

- `META_ACCESS_TOKEN`: its Instagram access token.
- `IG_USER_ID`: its Instagram account ID.
- `FACEBOOK_PAGE_ACCESS_TOKEN`: its Facebook Page token.
- `FACEBOOK_PAGE_ID`: its Facebook Page ID.

Repository variables:

- `BRAND_HANDLE`: actual Instagram username, default `aajsebetter`.
- `FACEBOOK_PAGE_NAME`: actual Facebook Page name, default `Aaj Se Better`.

The publisher rejects Build Kar Bro's known account IDs, any Instagram username mismatch and any Facebook Page identity mismatch. Legacy unapproved queued entries are excluded from the active publisher.

On October 4 the previous publishing workflow failed because `META_ACCESS_TOKEN` was missing. Adding images does not resolve missing credentials. Once the correct secrets and account variables are configured, the scheduled publisher can use this batch.

## Checks

```sh
npm test
npm run verify:batch
POST_DATE=2026-10-05 npm run generate
npm run publish
```

No image-generation API key is needed for the committed batch. GitHub Actions checks ready originals; it cannot call ChatGPT's built-in image generator.
