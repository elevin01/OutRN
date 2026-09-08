# OutRN

Public landing page hosted on **GitHub Pages**: https://elevin01.github.io/OutRN/

## Hosting

GitHub Pages serves `main` → `/ (root)`. The root `index.html`, `.nojekyll`, `site-assets/`, and `public/` contain the deployable static website. No ChatGPT sign-in or ChatGPT Sites backend is used by this build.

## Develop and publish changes

Use Node 22.13 or later. Run `npm ci`, then `npm run dev`.

After editing the page, run `npm run build:pages` and commit the changed source **and** generated `index.html` / `site-assets/`. Push to `main`; the existing GitHub Pages deployment publishes these files. The build prerenders the landing page, so its content is present before JavaScript loads. Assets use the `/OutRN/` base path.

`app/page.tsx` and `app/globals.css` contain the page. `web/` contains the browser entry, prerender entry, and configuration. Older server prototype files remain in the repository but are not imported by the Pages build.

## Waitlist

The live form uses the React integration (`@formspree/react`, `useForm`, and `ValidationError`) with `https://formspree.io/f/myeybdge`. Its endpoint is in `web/site-config.json`. It collects `email` and `neighborhood`, with `_gotcha` for Formspree's honeypot, a signup subject, and a source label. The form also has an HTML `action` and `method` for use without JavaScript.

Submission disables the submit button, prevents rapid duplicate clicks, keeps entered values on errors, shows field and general errors, and displays success only after Formspree accepts the request. Formspree handles the receiving side; no server or secrets are hosted on GitHub Pages. Manage notifications, domain restrictions, spam settings, quotas, and launch-email delivery in Formspree. The integration does not automatically send launch emails or deduplicate repeat signups.

## Verification

`npm test` builds and validates the deployable entry, subpath-safe local assets, and absence of the former Sites endpoint.

## Assets

`public/images/city-night.jpg` is an original AI-generated editorial illustration, not a verified venue photograph. Outing cards are examples, not live listings.
