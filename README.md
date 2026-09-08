# OutRN

Public landing page hosted on **GitHub Pages**: https://elevin01.github.io/OutRN/

## Hosting

GitHub Pages serves `main` → `/ (root)`. The root `index.html`, `.nojekyll`, `site-assets/`, and `public/` contain the deployable static website. No ChatGPT sign-in or ChatGPT Sites backend is used by this build.

## Develop and publish changes

Use Node 22.13 or later. Run `npm ci`, then `npm run dev`.

After editing the page, run `npm run build:pages` and commit the changed source **and** generated `index.html` / `site-assets/`. Push to `main`; the existing GitHub Pages deployment publishes these files. The build prerenders the landing page, so its content is present before JavaScript loads. Assets use the `/OutRN/` base path.

`app/page.tsx` and `app/globals.css` contain the page; `app/waitlist-form.tsx` contains the Formspree form. `web/` contains the browser entry, prerender entry, and configuration. Older server prototype files remain in the repository but are not imported by the Pages build.

OutRN is always free to use. Opening the app will surface at least three worthwhile nearby options immediately; time and budget filters are optional. Outing prices on the example cards refer to venue or activity costs, not an OutRN fee.

The three-section page uses fluid headings, a rotating outing-card stack, pointer tilt, and scroll reveals. Motion pauses on request and respects the device's reduced-motion setting. Card rotation also pauses while a visitor interacts with the examples.

## Waitlist

The live form uses the React integration (`@formspree/react`, `useForm`, and `ValidationError`) with `https://formspree.io/f/myeybdge`. Its endpoint is in `web/site-config.json`. It collects `email` and `neighborhood`, with `_gotcha` for Formspree's honeypot, a signup subject, and a source label. The form also has an HTML `action` and `method` for use without JavaScript.

Submission disables the submit button, prevents rapid duplicate clicks, keeps entered values on errors, shows field and general errors, and displays success only after Formspree accepts the request. Formspree handles the receiving side; no server or secrets are hosted on GitHub Pages. Manage notifications, domain restrictions, spam settings, quotas, and launch-email delivery in Formspree. The integration does not automatically send launch emails or deduplicate repeat signups.

## Verification

`npm test` builds and validates the deployable entry, subpath-safe local assets, and absence of the former Sites endpoint.

## Assets

`public/images/city-night.jpg` appears only in the hero. `public/images/city-afternoon.webp` provides a separate daytime scene for the lower section. Both are original AI-generated editorial illustrations, not verified venue photographs. The music card uses a CSS gig poster. Outing cards are examples, not live listings.

Barlow Condensed and DM Sans are bundled in `public/fonts/` with their SIL Open Font Licenses, so typography does not depend on a visitor's installed fonts or a third-party font request.

### Daytime image generation

Asset: `public/images/city-afternoon.webp`. Generated with the built-in image generator, then compressed to WebP for the page.

Prompt: Use case: photorealistic-natural. Create a landscape editorial image for OutRN, an app about getting outside spontaneously. New standalone website background asset, 1536x1024 landscape. A candid sunlit city corner in late afternoon, a few casually dressed adults mid-stride crossing a broad zebra crossing toward a small neighborhood café and an open art space, shot from a slightly elevated diagonal street angle. Focus on movement, long angled shadows, worn street paint and warm brick, with soft blue sky reflections. Natural documentary street photography feeling, subtle 35mm grain, lived-in details, unposed people not looking at camera. A clearly daytime outdoor scene, different from a group of friends outside a music bar at night. Keep the left third mostly open textured asphalt and crossing geometry, suitable for large white and lime website type added later in code. People and interesting shopfront details in the right half, small enough to be environmental rather than portrait subjects. No readable text, no logos, no watermarks, no embedded headings, no collage or interface.
