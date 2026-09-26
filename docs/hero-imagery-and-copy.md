# OutRN imagery and message update

Built-in image generation was used for all four replacement hero assets. Outputs were compressed to 1440px WebP. These are illustrative scenes, not verified venue photographs.

## public/images/jazz-film.webp

Use case: photorealistic-natural. Asset: full-width website background for a spontaneous outings app. Landscape 1536x1024. Aesthetic Instagram photo-dump photograph, unposed, intimate, slightly imperfect snapshot with subtle 35mm grain, authentic texture and rich shadows. No stock-photo smiling group, no advertising staging, no heavy artificial bokeh. The left third stays relatively dark and quiet for website text; the middle shows interesting details because a card overlays the right third. No text, logo, watermark, collage or UI. A late-night basement jazz bar seen from a seated guest's table: a small candle, two half-full glasses, scratched dark walnut foreground, saxophonist and upright bassist mid-performance on tiny stage in middle background, oxblood velvet, tungsten light and a trace of blue. Oblique candid framing, atmospheric and a little blurry from movement, true late-night film snapshot. Avoid readable labels.

## public/images/dinner-film.webp

Use case: photorealistic-natural. Asset: full-width website background for a spontaneous outings app. Landscape 1536x1024. Aesthetic Instagram photo-dump photograph, unposed, intimate, slightly imperfect snapshot with subtle 35mm grain, authentic texture and rich shadows. No stock-photo smiling group, no advertising staging, no heavy artificial bokeh. The left third stays relatively dark and quiet for website text; the middle shows interesting details because a card overlays the right third. No text, logo, watermark, collage or UI. Overhead-diagonal close photograph of a narrow late-night restaurant counter: two ceramic bowls of glossy chilli noodles, chopsticks resting on a bowl, a small plate of cucumber and condensation on glasses. One cropped hand reaching in from the edge, no faces. Deep walnut, stainless steel and tomato red details, intimate pool of warm light, slightly direct-flash texture. Center composition food, darker empty counter at left, casually messy not styled for an advertisement.

## public/images/gallery-film.webp

Use case: photorealistic-natural. Asset: full-width website background for a spontaneous outings app. Landscape 1536x1024. Aesthetic Instagram photo-dump photograph, unposed, intimate, slightly imperfect snapshot with subtle 35mm grain, authentic texture and rich shadows. No stock-photo smiling group, no advertising staging, no heavy artificial bokeh. The left third stays relatively dark and quiet for website text; the middle shows interesting details because a card overlays the right third. No text, logo, watermark, collage or UI. Inside an intimate independent gallery at dusk: a large abstract cobalt-blue print and a tiny red sculpture on a plinth near center, a single casually dressed visitor viewed from behind at the edge, slightly crooked handheld framing. Warm spotlight circles, textured pale plaster, concrete floor, lavender reflected light and strong shadows. The left third is a deep shadowed doorway, middle well-lit artwork. Looks like a friend's artsy camera-roll discovery, not a luxury showroom.

## public/images/waterfront-film.webp

Use case: photorealistic-natural. Asset: full-width website background for a spontaneous outings app. Landscape 1536x1024. Aesthetic Instagram photo-dump photograph, unposed, intimate, slightly imperfect snapshot with subtle 35mm grain, authentic texture and rich shadows. No stock-photo smiling group, no advertising staging, no heavy artificial bokeh. The left third stays relatively dark and quiet for website text; the middle shows interesting details because a card overlays the right third. No text, logo, watermark, collage or UI. Quiet city waterfront at blue hour, peach-pink sunset remaining above muted lavender water. Two takeaway cups on a weathered bench in foreground center, cropped sneakers at lower edge suggesting a friend's point of view, metal railing receding diagonally, a tiny unposed pair walking far in the distance. Shadowed greenery at left. Cinematic but imperfect casual film shot, calm spontaneous evening, no iconic landmark, no close faces.

## Copy rationale

Chosen headline: Don’t spend your free time finding plans.

This names the cost of searching rather than offering another vague instruction to go out. The following line gives the concrete benefit: at least three nearby ideas picked for you. The button states Join the waitlist so people know exactly what happens next. This is a research-informed hypothesis, not a measured conversion winner. Judge it by completed signups per landing-page visitor when traffic measurement is available; no new analytics or tracking was added.

Sources reviewed:
- https://www.nngroup.com/articles/homepage-design-principles/ (clear value, user language, specific examples and descriptive calls to action)
- https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/ (concise, scannable copy; usability research, not OutRN conversion evidence)
- https://dicefm.zendesk.com/hc/en-gb/articles/22365422759313-Getting-started-with-DICE (personalized event recommendations)

## Interaction

A single active index drives four cards and their matching hero photos. Category selection, tapping the top card or exposed card edges, arrow keys, and horizontal swipes all use the same selection handler. Manual selection stops automatic rotation without disabling the crossfade. The motion control resumes rotation; reduced motion still takes precedence. Inactive cards are excluded from keyboard navigation and the accessibility tree. Focus follows the active card when using its full-card button.
