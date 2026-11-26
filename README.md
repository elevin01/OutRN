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

`app/page.tsx` composes the page and `app/globals.css` styles it; every color, size and radius is a token at the top of that file. `app/phone-demo.tsx` is the phone in the hero, `app/right-now.tsx` is the live demo, `app/feasibility.ts` holds its example places and clock arithmetic, and `app/waitlist-form.tsx` is the Formspree form. `web/` contains the browser entry, prerender entry, and configuration. Older server prototype files remain in the repository but are not imported by the Pages build. [docs/DESIGN.md](docs/DESIGN.md) records the design decisions.

OutRN is always free to use. Opening the app will surface at least three worthwhile nearby options immediately; time and budget filters are optional. Prices on the example picks refer to venue or activity costs, not an OutRN fee.

## The page

Five sections: the hero with a phone showing example picks the way the app lays them out, a live demo, the three steps, how OutRN labels what it knows, and the waitlist.

The live demo reads the visitor's clock, takes how long they are free (one, two, three or five hours), and plans that time from 31 invented example places. Each place has a position, so the demo knows how long it takes to get from one to the next. The places range from a five-minute coffee to a beach half an hour away by subway, and some have fixed start times (a film, a comedy show, a yoga class).

- **The plan grows with the time.** An hour is one stop within a 12-minute walk. Longer stretches reach farther (up to 40 minutes for five hours) and chain two or three stops that are a short walk apart, so the time is used. A plan that would leave more than a fifth of the time unused is dropped, unless its last stop closes first.
- **The hour matters too.** Opening hours and start times decide what is possible, and each place has hours when it is at its best (breakfast at the diner, the waterfront before dusk).

The section's heading is the visitor's own situation ("It's 9:42 PM on Wednesday and I've got two hours") and rewrites itself as they change it. The plans are shown as tickets, colored by kind of outing, on a dark band that stays dark in both themes. A multi-stop ticket lists its stops with their times. It shows three plans at a time that share no place, and "Show three others" pages through the rest. Plans with something marked Check first always come after confirmed ones. Places that are out are listed with the reason, and the selected plan is drawn on a timeline with each stop's details. Nothing is padded: at 3 AM it says nothing fits. Visitors can also switch to three preset times. The prerendered HTML has no clock, so it ships on a Saturday 8:00 PM example and switches to the visitor's time on load.

To change the examples, edit the `places` list in `app/feasibility.ts`. Plans are built in `allPlans`, scored in `makePlan` and ordered in `recommend`, all in that file.

The only motion that plays by itself is the headline and phone settling in on load. Everything else answers a tap, and all of it is off under `prefers-reduced-motion`.

## Waitlist

The live form uses the React integration (`@formspree/react`, `useForm`, and `ValidationError`) with `https://formspree.io/f/myeybdge`. Its endpoint is in `web/site-config.json`. It collects `email` and `neighborhood`, with `_gotcha` for Formspree's honeypot, a signup subject, and a source label. The form also has an HTML `action` and `method` for use without JavaScript.

Submission disables the submit button, prevents rapid duplicate clicks, keeps entered values on errors, shows field and general errors, and displays success only after Formspree accepts the request. Formspree handles the receiving side; no server or secrets are hosted on GitHub Pages. Manage notifications, domain restrictions, spam settings, quotas, and launch-email delivery in Formspree. The integration does not automatically send launch emails or deduplicate repeat signups.

## Verification

`npm test` builds the Pages output and checks the deployable entry, subpath-safe local assets, the prerendered sections, the theme script, and the demo's clock arithmetic (`tests/feasibility.test.mjs`). `npm run test:netlify` does the same for the Netlify output.

## Assets

The phone uses portrait crops of the four film photos (`public/images/phone-jazz.webp`, `phone-dinner.webp`, `phone-waterfront.webp`, `phone-gallery.webp`), and the steps section uses `street-afternoon.webp`, a smaller copy of `city-afternoon.webp`. All are original AI-generated illustrations, not verified venue photographs, and the page says so beside them. The uncropped originals and older photo assets remain available but are not rendered. Every pick on the page is an example, not a live listing. See [imagery prompts and earlier copy research](docs/hero-imagery-and-copy.md).

`public/og.png` is the 1200×630 sharing image. The GitHub Pages build points at it with an absolute URL; the Netlify build rewrites that URL to the Netlify origin, or drops the tag when no site URL is known.

Archivo (headings, narrow and heavy) and DM Sans (everything else, the app's typeface) are bundled in `public/fonts/` with their SIL Open Font Licenses, so typography does not depend on a visitor's installed fonts or a third-party font request. Both files are variable fonts trimmed to the ranges the page uses: Archivo at width 72–100 and weight 600–900, DM Sans at weight 400–700.

### Daytime image generation

Asset: `public/images/city-afternoon.webp`. Generated with the built-in image generator, then compressed to WebP for the page.

Prompt: Use case: photorealistic-natural. Create a landscape editorial image for OutRN, an app about getting outside spontaneously. New standalone website background asset, 1536x1024 landscape. A candid sunlit city corner in late afternoon, a few casually dressed adults mid-stride crossing a broad zebra crossing toward a small neighborhood café and an open art space, shot from a slightly elevated diagonal street angle. Focus on movement, long angled shadows, worn street paint and warm brick, with soft blue sky reflections. Natural documentary street photography feeling, subtle 35mm grain, lived-in details, unposed people not looking at camera. A clearly daytime outdoor scene, different from a group of friends outside a music bar at night. Keep the left third mostly open textured asphalt and crossing geometry, suitable for large white and lime website type added later in code. People and interesting shopfront details in the right half, small enough to be environmental rather than portrait subjects. No readable text, no logos, no watermarks, no embedded headings, no collage or interface.

### Earlier hero iteration (superseded)

An earlier hero led with “Got free time? Go out.” and explicitly describes OutRN as an app for finding things to do. Four different scenes crossfade every 7.5 seconds. Selecting a scene pauses motion; “Play motion” resumes it. Focus on the scene controls, interaction with the example cards, hidden tabs, and reduced-motion preferences suspend automatic rotation. The lower daytime street image is separate, giving the page five distinct images.

Visual references reviewed: Fever New York (https://feverup.com/en/new-york) and Meetup (https://www.meetup.com/). Their explicit activity context and varied experience imagery informed the direction; the slow background rotation is our own application of that idea.

Three additional assets were made with the built-in image generator and compressed to 1440px WebP. Like the existing images, these are illustrative scenes, not verified venues:

- `public/images/noodle-counter.webp`: Candid editorial wide photograph of friends eating at a warm neighborhood noodle counter, chef behind, amber lamps, dark teal wall on the left for website type. Natural documentary film feeling, no logos or embedded text.
- `public/images/gallery-afternoon.webp`: Candid editorial wide photograph of two friends browsing an independent gallery in daylight, colorful abstract prints and industrial windows, charcoal partition on the left for website type. No logos or embedded text.
- `public/images/waterfront-walk.webp`: Candid editorial wide photograph of friends walking an urban waterfront at golden hour, a bicycle, river reflections, olive trees and peach sunlight. Shaded foliage on the left for website type, no landmarks, logos or text.
