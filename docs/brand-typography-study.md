# OutRN: typography and page hierarchy study

Reviewed September 26, 2026. Scope: eight consumer brands, their message sequence, heading roles, supporting copy, imagery, calls to action, and the transition from a hero into product explanation.

## The diagnosis

OutRN had three competing display moments. At a 1363px desktop viewport, the hero used roughly 146px condensed type, the second section's invitation used 168px, and the waitlist used 143px. The second section's explanation was only 25px and some of the product context appeared in a separate strip above the image. The eye landed on the repeated slogan before finding out why the app mattered.

This was an information hierarchy problem as much as a font-size problem. A second giant invitation repeated the hero's job instead of answering the next question: what happens when I open OutRN?

## Reference comparison

These are observations, not evidence that a particular design causes higher conversion. Public pages vary by location, experiments, viewport, and date. Five brands received visual browser inspection; three received a content and structure review. No proprietary analytics or user tests were available.

| Brand and page | Inspection | What it does | Application to OutRN |
| --- | --- | --- | --- |
| [AllTrails](https://www.alltrails.com/welcome) | Live visual, rendered headings, page text | A clear hiking-app category headline, a brief explanation of trail discovery and offline use, a single prominent trial action, and an adjacent outdoors photograph. Later headings introduce specific capabilities. | Keep a lifestyle photograph, but put the actual app explanation beside it. Use a smaller repeatable section scale below the hero. |
| [Headspace](https://www.headspace.com/app) | Live visual, rendered headings, page text | A warm promise is immediately grounded in stress and sleep benefits. Product imagery supports the message. Later sections explain benefits, operation, and available content. | Personality can live in color and imagery while the supporting sentence does practical work. Do not replace an explanation with another slogan. |
| [Spotify Premium](https://www.spotify.com/us/premium/) | Live visual, rendered headings, page text | An expressive oversized hero transitions into smaller feature headings and meaningful supporting descriptions. Named functions and benefits make the brand language concrete. | Preserve OutRN's condensed hero as the expressive opening. Use a distinct, calmer type treatment for explanation and signup. |
| [Meetup](https://www.meetup.com/) | Live visual and rendered headings, page text | A social outcome is paired with examples of interests and a direct signup action. Nearby event listings follow, making the offer tangible. | Pair the emotional payoff with examples and useful plan details. A visitor should understand the offer without decoding the brand phrase. |
| [Fever, New York](https://feverup.com/en/new-york) | Live visual and rendered headings, page text | A location-led image introduces a page whose categories, event photography, and practical listing information do much of the explaining. | Keep the distinct outing cards and matching imagery. Their cost, timing, and walking-distance details explain what OutRN will provide. |
| [Airbnb Experiences](https://www.airbnb.com/s/experiences) | Public page content and structure | Search and nearby experiences appear early. Listing names sit with duration, price, ratings, and categories. The product is demonstrated through concrete options. | Give users a glimpse of the decision they can make, rather than making every section a brand statement. Retain the sample-card disclaimer. |
| [Strava](https://www.strava.com/) | Public page content and structure | An emotional community promise is followed by tracking, sharing, analysis, and activity examples. The page explains the mechanics behind the outcome. | State the outcome, then show the steps that produce it. OutRN's three steps should be visible and readable, not buried in a sentence. |
| [ClassPass](https://classpass.com/) | Public page text only; visual browser blocked by security verification | The opening identifies an app and names the categories it covers, then describes access to studios and other venues before the signup action. | Explicit category language helps a new brand. Keep identifying OutRN as an app for nearby things to do. No claims about ClassPass's exact layout or type sizes are made here. |

## Measured desktop reference points

Computed CSS values observed at 1363px viewport width. These are samples of the inspected pages, not universal brand tokens. Different typefaces have different apparent sizes.

| Reference | Sample heading size | Supporting hierarchy |
| --- | --- | --- |
| AllTrails | Hero 56px / 61.6px line height | Major sections 45px / 51.75px; feature headings 28px / 33.6px |
| Spotify | Hero 96px | Explanatory heading 48px; feature sections 64px; supporting subheads 24px |
| Meetup | Hero 40px / 48px | Nearby-events section 32px / 40px |
| Headspace | Feature headings 40px / 48px | Explainer heading 32px / 42px; benefits heading 24px / 28.8px. Hero was visually inspected but is not included in this measurement sample. |
| Fever | Section headings 24px / 28px | Its semantic h1 computes to 16px, showing why heading tags alone cannot describe perceived visual hierarchy. The larger location treatment was visually inspected. |

The common lesson is not that every website should use a 56px headline. It is that size, wording, placement, weight, and imagery work together to establish a clear reading order. Spotify can be much louder than AllTrails while still differentiating the hero from the explanation.

## Principles used for the revision

1. **Give each section a different job.** Hero: introduce the idea and demonstrate picks. Second section: explain the problem and product. Journey: show how it works. Waitlist: tell people what happens after signup.
2. **Keep explanation adjacent to the promise.** The second heading and its supporting paragraph now share a single column. The reader no longer has to connect a small strip above an image to an oversized slogan below it.
3. **Use sentence case for the reading sections.** The existing DM Sans family makes complete sentences easier to distinguish from the condensed display treatment. Barlow Condensed remains in the hero and graphic outing cards, where it contributes personality.
4. **Keep the invitation as an invitation.** “Try going out (rn)” remains lime and recognizable, but becomes a 22–28px closing line after the product explanation, instead of a 168px competing headline.
5. **Demonstrate the action.** Three numbered steps explain opening the app, choosing a plan, and getting directions. Small numbers establish sequence without competing with the headings.
6. **Put optional details in a subordinate position.** Budget and time limits appear as an optional note beside the journey, not as requirements or a form visitors must complete.
7. **Make the image a place to imagine being.** The afternoon scene sits alongside the story with a short caption. The headline no longer covers the photograph. The existing subtle parallax remains, with motion controls and reduced-motion support.
8. **Repeat the action consistently.** Buttons continue to say “Join the waitlist.” The signup section explains launch notification and reiterates that using OutRN is free.

This approach also follows Nielsen Norman Group's [homepage principles](https://www.nngroup.com/articles/homepage-design-principles/): communicate the offer, use language visitors understand, and make the next action clear. That guidance supports clarity; it does not validate a specific OutRN conversion lift.

## Implemented type system

| Role | Desktop | Small screens | Purpose |
| --- | --- | --- | --- |
| Hero display | Existing fluid condensed scale, maximum 170px | Existing 23vw treatment | The one large brand moment |
| Story heading | 36–64px, 1.08 line height, DM Sans 600 | 36–52px, fluid and wrapping | Read the problem in one coherent thought |
| Story body | 16–18px, 1.65 line height | 16px minimum | Explain personalized, nearby, ready-now picks |
| Invitation | 22–28px | 24px | Keep the recurring phrase without overpowering context |
| Journey title | 22px | 22px | Introduce the three actions |
| Step title | 18px | 18px | Make the sequence scannable |
| Detail text | 14px, 1.6 line height | 14px | Optional filters and step explanations |
| Signup heading | 40–64px | 44px | Maintain hierarchy through the final action |

Spacing now follows a consistent rhythm: 20–26px between related text elements, a larger gap between the story and journey, and 64–112px between major sections. The content and photo use two columns on desktop and stack below 760px. Steps become a vertical sequence on small screens. Main story text does not use forced no-wrap lines or viewport-fixed heights.

## What this study does not establish

This is a comparative design study and implementation, not an experiment demonstrating higher waitlist conversion. The three-click sequence and ready-now personalized options describe the intended app experience supplied by the product brief. The landing page remains a waitlist and illustrative preview. A useful next measurement after launch would compare completed signups per visit and comprehension of the offer, rather than judging success solely by headline size.
