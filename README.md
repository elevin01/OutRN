# OutRN

Public landing page hosted on **GitHub Pages**: https://elevin01.github.io/OutRN/

## Hosting

GitHub Pages serves `main` → `/ (root)`. The root `index.html`, `.nojekyll`, `site-assets/`, and `public/` contain the deployable static website. No ChatGPT sign-in or ChatGPT Sites backend is used by this build.

## Develop and publish changes

Use Node 22.13 or later. Run `npm ci`, then `npm run dev`.

After editing the page, run `npm run build:pages` and commit the changed source **and** generated `index.html` / `site-assets/`. Push to `main`; the existing GitHub Pages deployment publishes these files. The build prerenders the landing page, so its content is present before JavaScript loads. Assets use the `/OutRN/` base path.

`app/page.tsx` and `app/globals.css` contain the page. `web/` contains the browser entry, prerender entry, and configuration. Older server prototype files remain in the repository but are not imported by the Pages build.

## Waitlist status

**Email collection is not connected on GitHub Pages yet.** The page clearly says signups are not open and disables submission. No email is sent to ChatGPT Sites and no signup success is fabricated.

To enable the form, configure `waitlistEndpoint` in `web/site-config.json` with an HTTPS form-service endpoint that accepts browser-origin JSON POST requests (`email`, `neighborhood`, `website`) and returns a JSON response with a successful HTTP status only after storing the signup. The service must handle validation, spam prevention, data privacy, and launch-email unsubscribes. Rebuild and commit the generated assets after configuration. Never put private service keys in browser code.

## Verification

`npm test` builds and validates the deployable entry, subpath-safe local assets, and absence of the former Sites endpoint.

## Assets

`public/images/city-night.jpg` is an original AI-generated editorial illustration, not a verified venue photograph. Outing cards are examples, not live listings.
