# OutRN website design

Written November 2026 for the landing page redesign. It records what the page is for and why it looks the way it does, so later changes can be judged against the same reasons.

## What the page has to do

One job: get a visitor to join the waitlist with their email and neighborhood. To do that it has to answer, in order, what OutRN is, why it is different from a map search, and what happens after signing up.

The difference is feasibility. Plenty of products list what exists nearby. OutRN works out whether you can arrive, get in and have enough time, and it says so when it is unsure. The page demonstrates that instead of describing it: the demo under the hero does the arithmetic on the visitor's own clock.

## Decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Signature element | A live demo that reads the visitor's clock and how long they are free, and shows which of 30 example places fit, three at a time, with a reason for each | "Right now" is the product's name and its promise, so the page should know what time it is |
| Hero | One band of brand color, the headline at poster size, and the app on a phone | The app exists now; showing its own layout says more than an illustration of a card |
| Color | White page, ink text, and the app's coral as a full band at the top and bottom | The coral was a small accent on an off-white page. Used at full strength it is recognizably OutRN from across a room |
| Dark theme | Ink page with forest green bands and coral buttons | Keeps a committed color in the dark theme instead of black with one accent |
| Display type | Archivo, width 74–76, weight 800, sentence case | Narrow heavy grotesques are the letterforms of gig posters and venue marquees, which is the world the app sends people into |
| Text type | DM Sans | It is the app's typeface, so the site and the app read as one product |
| Numbers | Tabular figures in aligned columns | Walk, arrival and time on site are meant to be compared down the column |
| Motion | One settle-in on load; everything else answers a tap | Motion shows what changed; nothing fades in on scroll |
| Buttons | Ink on light bands, coral on dark bands, one primary action per view | The primary action is always the highest-contrast element on its band |

## Tokens

All tokens live at the top of `app/globals.css`.

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#ffffff` | `#1a1f1a` |
| Text | `#20251f` | `#f4f5f0` |
| Secondary text | `#5b6359` | `#b5bdb1` |
| Band (hero, waitlist) | `#f36b3f` coral | `#1f3b2c` forest |
| Text on band | `#20251f` | `#ffffff` |
| Primary button | `#20251f` with white text | `#f36b3f` with ink text |
| Tone (section and row tint) | `#eef2ea`, `#dbe5d4` | `#242b24`, `#384839` |
| Status and link accent | `#ad361a` | `#ff9a78` |

Type scale: hero headline sized to its column (up to 164px), section headings 38–72px, row titles 20–26px, body 17px at 1.6, small print 13–15px. Radii: 14px on controls, 22px on panels, 48px on the phone.

Coral never carries white text and is never used for small text on white: both fail contrast. Ink on coral is about 5:1.

## Rules the page keeps

- Every place, price and time on the page is an example and is labeled as one. No testimonials, counts or ratings appear until there are true ones to show.
- Content is present when the page loads. The prerendered HTML includes the demo in a fixed Saturday-evening state.
- The phone shows the app's own layout and keeps the app's colors in both themes.
- Grouping comes from spacing and rules. The only boxed elements are the phone and the "Before you go" sheet, because both depict app surfaces.
- No section labels above headings, no decorative numbering (the three steps are numbered because they are a sequence), no icons standing in for explanations.

## Not decided here

The wordmark is unchanged from `main`. If the bird identity in PR #3 is adopted, it replaces the `Wordmark` component in `app/page.tsx` and the favicon; the page's tokens do not depend on it.
