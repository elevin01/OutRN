# OutRN

Marketing landing page and neighborhood early-access waitlist for OutRN.

## Features

- Full-screen radar hero, floating example picks, and motion pause / reduced-motion support.
- Responsive product story and interactive example outings.
- Persistent email and neighborhood waitlist, with validation and duplicate-safe submission.
- Outing cards are illustrative, not live recommendations.

## Development

Node 22.13+ is required. Install with `npm ci`; run `npm run dev`. Build with `npm run build`.

The application uses React with Vinext and a Cloudflare Worker. The logical D1 binding is `DB`. Database schema is in `db/schema.ts`; generate migrations with `npm run db:generate` and apply them before running the waitlist. Sites applies production migrations on deployment.

## Waitlist

`POST /api/waitlist` accepts `email` and `neighborhood`. Records are stored in the D1 `waitlist` table. Email is normalized and unique; repeated signups leave the original record unchanged. There is no public endpoint exposing signups. This version stores signups; it does not send confirmation or launch emails. Export through authorized database access when preparing launch updates.

## Assets

`public/images/city-night.jpg` is an original AI-generated editorial illustration. It is not a photograph of a real verified venue.
