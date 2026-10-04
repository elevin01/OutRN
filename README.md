# OutRN

Public landing page. GitHub Pages URL: https://elevin01.github.io/OutRN/

## Hosting

GitHub Pages serves `main` → `/ (root)`. The root `index.html`, `.nojekyll`, `site-assets/`, and `public/` contain the deployable static website. No ChatGPT sign-in or ChatGPT Sites backend is used by this build.

### Netlify

The root `netlify.toml` sets `npm run build:netlify`, publishes `.pages-build`, and skips the Next.js runtime. This is a Vite static site; the older Next.js prototype is not used for deployment. The config overrides the previous `.next` publish directory in Netlify's UI. You can remove `@netlify/plugin-nextjs` from Netlify's Build plugins settings; the skip flag also handles it while still installed.

Netlify builds use `/` asset paths and include prerendered HTML, JavaScript, CSS, fonts, images, and the theme initializer in the publish folder. The canonical URL uses Netlify's production `URL` environment variable, or `SITE_URL` if explicitly set. A local Netlify build without either omits the canonical tag.

After the deployment fix PR is merged, redeploy the latest `main` commit in Netlify. Run `npm run test:netlify` locally to check the publish folder. This build does not overwrite the checked-in GitHub Pages output.

## Develop and publish changes

Use Node 22.13 or later. Run `npm ci`, then `npm run dev`.

After editing the page, run `npm run build:pages` and commit the changed source **and** generated `index.html` / `site-assets/`. Open a PR with the changes; after merging to `main`, the existing GitHub Pages deployment publishes these files. The build prerenders the landing page, so its content is present before JavaScript loads. Assets use the `/OutRN/` base path.

`app/page.tsx` and `app/globals.css` contain the page; `app/waitlist-form.tsx` contains the Formspree form. `web/` contains the browser entry, prerender entry, and configuration. Older server prototype files remain in the repository but are not imported by the Pages build.

OutRN is always free to use. Opening the app will surface at least three worthwhile nearby options immediately; time and budget filters are optional. Outing prices on the example cards refer to venue or activity costs, not an OutRN fee.

The three-section page uses fluid headings, four interactive outing cards synchronized with four hero photographs, pointer tilt, and scroll reveals. Tap a card, select a category, use arrow keys, or swipe horizontally to change both the card and photograph. Manual selection stops autoplay until resumed. Motion pauses on request and respects reduced-motion preferences.

## Waitlist

The live form uses the React integration (`@formspree/react`, `useForm`, and `ValidationError`) with `https://formspree.io/f/myeybdge`. Its endpoint is in `web/site-config.json`. It collects `email` and `neighborhood`, with `_gotcha` for Formspree's honeypot, a signup subject, and a source label. The form also has an HTML `action` and `method` for use without JavaScript.

Submission disables the submit button, prevents rapid duplicate clicks, keeps entered values on errors, shows field and general errors, and displays success only after Formspree accepts the request. Formspree handles the receiving side; no server or secrets are hosted on GitHub Pages. Manage notifications, domain restrictions, spam settings, quotas, and launch-email delivery in Formspree. The integration does not automatically send launch emails or deduplicate repeat signups.

## Verification

`npm test` builds and validates the deployable entry, subpath-safe local assets, and absence of the former Sites endpoint.

## Assets

`public/images/jazz-film.webp`, `gallery-film.webp`, `dinner-film.webp`, and `waterfront-film.webp` are the active hero photos. `public/images/city-afternoon.webp` is the separate lower-section image. All are original AI-generated illustrations, not verified venue photographs. Older photo assets remain available but are not rendered. Cards are examples, not live listings. See [imagery prompts, copy research, and interaction details](docs/hero-imagery-and-copy.md).

Barlow Condensed and DM Sans are bundled in `public/fonts/` with their SIL Open Font Licenses, so typography does not depend on a visitor's installed fonts or a third-party font request.

### Daytime image generation

Asset: `public/images/city-afternoon.webp`. Generated with the built-in image generator, then compressed to WebP for the page.

Prompt: Use case: photorealistic-natural. Create a landscape editorial image for OutRN, an app about getting outside spontaneously. New standalone website background asset, 1536x1024 landscape. A candid sunlit city corner in late afternoon, a few casually dressed adults mid-stride crossing a broad zebra crossing toward a small neighborhood café and an open art space, shot from a slightly elevated diagonal street angle. Focus on movement, long angled shadows, worn street paint and warm brick, with soft blue sky reflections. Natural documentary street photography feeling, subtle 35mm grain, lived-in details, unposed people not looking at camera. A clearly daytime outdoor scene, different from a group of friends outside a music bar at night. Keep the left third mostly open textured asphalt and crossing geometry, suitable for large white and lime website type added later in code. People and interesting shopfront details in the right half, small enough to be environmental rather than portrait subjects. No readable text, no logos, no watermarks, no embedded headings, no collage or interface.

### Earlier hero iteration (superseded by the interactive cards)

The hero now leads with “Got free time? Go out.” and explicitly describes OutRN as an app for finding things to do. Four different scenes crossfade every 7.5 seconds. Selecting a scene pauses motion; “Play motion” resumes it. Focus on the scene controls, interaction with the example cards, hidden tabs, and reduced-motion preferences suspend automatic rotation. The lower daytime street image is separate, giving the page five distinct images.

Visual references reviewed: Fever New York (https://feverup.com/en/new-york) and Meetup (https://www.meetup.com/). Their explicit activity context and varied experience imagery informed the direction; the slow background rotation is our own application of that idea.

Three additional assets were made with the built-in image generator and compressed to 1440px WebP. Like the existing images, these are illustrative scenes, not verified venues:

- `public/images/noodle-counter.webp`: Candid editorial wide photograph of friends eating at a warm neighborhood noodle counter, chef behind, amber lamps, dark teal wall on the left for website type. Natural documentary film feeling, no logos or embedded text.
- `public/images/gallery-afternoon.webp`: Candid editorial wide photograph of two friends browsing an independent gallery in daylight, colorful abstract prints and industrial windows, charcoal partition on the left for website type. No logos or embedded text.
- `public/images/waterfront-walk.webp`: Candid editorial wide photograph of friends walking an urban waterfront at golden hour, a bicycle, river reflections, olive trees and peach sunlight. Shaded foliage on the left for website type, no landmarks, logos or text.
