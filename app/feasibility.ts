// The clock arithmetic behind the "Try it with your own clock" demo.
// A simplified version of what OutRN checks before it suggests a place: can you
// reach it, will it be open when you arrive, and is there enough time left to
// make the trip worth it. Pure functions, no I/O, erasable TypeScript only so
// the tests can import this file directly.

export type Status = "go" | "check";

export type Place = {
  id: string;
  name: string;
  kind: string;
  /** Places of the same group are spread out so the three picks differ. */
  group: "food" | "drink" | "culture" | "outdoors" | "browse";
  walkMin: number;
  /** Opening interval per weekday, Sunday first, in minutes from midnight.
   *  A close at or before the open means it runs past midnight. */
  hours: ([number, number] | null)[];
  /** Minutes before closing after which nobody is let in. */
  lastEntryBefore?: number;
  /** The shortest visit that is still worth the walk. */
  minStay: number;
  admission: string;
  price: string;
  status: Status;
  /** What is unconfirmed, for a place marked "check". */
  checkNote?: string;
  hoursSource: string;
};

export type Fit = {
  place: Place;
  fits: true;
  /** Minutes from midnight today; may pass 1440 when the evening runs late. */
  arrive: number;
  /** When the visit can start: arrival, or opening time if that is later. */
  start: number;
  end: number;
  closes: number;
  useful: number;
  endsBy: "closing" | "deadline";
};

export type Miss = {
  place: Place;
  fits: false;
  reason: "closed" | "short" | "last-entry";
  detail: string;
};

export type Verdict = Fit | Miss;

const DAY = 1440;

/** Opening intervals around today, in minutes from today's midnight. */
function intervals(place: Place, weekday: number): [number, number][] {
  const list: [number, number][] = [];
  for (const offset of [-1, 0, 1]) {
    const span = place.hours[(weekday + offset + 7) % 7];
    if (!span) continue;
    const open = span[0] + offset * DAY;
    const close = (span[1] <= span[0] ? span[1] + DAY : span[1]) + offset * DAY;
    list.push([open, close]);
  }
  return list;
}

export function formatClock(minutes: number): string {
  const m = ((Math.round(minutes) % DAY) + DAY) % DAY;
  const hour = Math.floor(m / 60);
  const minute = m % 60;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h}h ${m}m`;
}

export function evaluate(place: Place, weekday: number, nowMin: number, windowMin: number): Verdict {
  const arrive = nowMin + place.walkMin;
  const deadline = nowMin + windowMin;
  let best: Miss | null = null;

  for (const [open, close] of intervals(place, weekday)) {
    if (close <= arrive || open >= deadline) continue; // no overlap with the trip
    const start = Math.max(arrive, open);
    const lastEntry = close - (place.lastEntryBefore ?? 0);
    if (start > lastEntry) {
      best = { place, fits: false, reason: "last-entry", detail: `Last entry is at ${formatClock(lastEntry)}` };
      continue;
    }
    const end = Math.min(close, deadline);
    const useful = end - start;
    if (useful < place.minStay) {
      const cause = close <= deadline ? `before it closes at ${formatClock(close)}` : "before your time is up";
      best = { place, fits: false, reason: "short", detail: `Only ${formatDuration(useful)} ${cause}` };
      continue;
    }
    return { place, fits: true, arrive, start, end, closes: close, useful, endsBy: close <= deadline ? "closing" : "deadline" };
  }

  if (best) return best;
  const next = intervals(place, weekday).find(([open]) => open >= deadline);
  return {
    place,
    fits: false,
    reason: "closed",
    detail: next && next[0] < DAY ? `Closed until ${formatClock(next[0])}` : "Closed for the day",
  };
}

/** Up to three picks: confirmed places first, then spread across kinds of
 *  outing, then the shortest walk. Never padded: fewer than three is an answer. */
export function recommend(places: Place[], weekday: number, nowMin: number, windowMin: number) {
  const verdicts = places.map(place => evaluate(place, weekday, nowMin, windowMin));
  const fits = verdicts.filter((v): v is Fit => v.fits);
  const misses = verdicts.filter((v): v is Miss => !v.fits);
  const ranked = [...fits].sort((a, b) =>
    Number(a.place.status === "check") - Number(b.place.status === "check") || a.place.walkMin - b.place.walkMin);

  const picks: Fit[] = [];
  const seen = new Set<string>();
  for (const fit of ranked) {
    if (picks.length === 3) break;
    if (seen.has(fit.place.group)) continue;
    seen.add(fit.place.group);
    picks.push(fit);
  }
  for (const fit of ranked) {
    if (picks.length === 3) break;
    if (!picks.includes(fit)) picks.push(fit);
  }
  const leftOver = fits.length - picks.length;
  return { picks, misses, leftOver };
}

const daily = (open: number, close: number): [number, number][] => Array.from({ length: 7 }, () => [open, close]);
const at = (hour: number, minute = 0) => hour * 60 + minute;

/** Invented examples, the same on every visit. Not live listings. */
export const examplePlaces: Place[] = [
  {
    id: "noodles", name: "Chilli noodles at the counter", kind: "Late dinner", group: "food", walkMin: 5,
    hours: daily(at(12), at(23)), minStay: 45, admission: "Walk in, counter seats", price: "Plates from $12",
    status: "go", hoursSource: "Kitchen hours from the venue’s website",
  },
  {
    id: "jazz", name: "Jazz in the basement", kind: "Live music", group: "drink", walkMin: 8,
    hours: [[at(18), at(1)], null, [at(18), at(1)], [at(18), at(1)], [at(18), at(1)], [at(18), at(2)], [at(18), at(2)]],
    minStay: 45, admission: "Walk in", price: "$15 at the door",
    status: "go", hoursSource: "Hours from the venue’s website",
  },
  {
    id: "gallery", name: "Prints at the corner gallery", kind: "Gallery", group: "culture", walkMin: 12,
    hours: [[at(12), at(22)], null, null, [at(12), at(22)], [at(12), at(22)], [at(12), at(22)], [at(12), at(22)]],
    minStay: 30, admission: "Walk in", price: "Free",
    status: "go", hoursSource: "Hours from the gallery’s website",
  },
  {
    id: "waterfront", name: "The waterfront path", kind: "Outdoors", group: "outdoors", walkMin: 10,
    hours: daily(at(6), at(22)), minStay: 40, admission: "Open to everyone", price: "Free",
    status: "go", hoursSource: "Park hours from the city",
  },
  {
    id: "cafe", name: "Coffee on the corner", kind: "Café", group: "food", walkMin: 4,
    hours: daily(at(7), at(18)), minStay: 30, admission: "Walk in", price: "Coffee from $4",
    status: "go", hoursSource: "Hours from the café’s website",
  },
  {
    id: "bookshop", name: "The secondhand bookshop", kind: "Bookshop", group: "browse", walkMin: 9,
    hours: daily(at(10), at(20)), minStay: 30, admission: "Walk in", price: "Free to browse",
    status: "go", hoursSource: "Hours from the shop’s website",
  },
  {
    id: "market", name: "The weekend market", kind: "Market", group: "browse", walkMin: 14,
    hours: [[at(9), at(16)], null, null, null, null, null, [at(9), at(16)]],
    minStay: 45, admission: "Open to everyone", price: "Free entry",
    status: "go", hoursSource: "Market days from the organizer",
  },
  {
    id: "museum", name: "The neighborhood history museum", kind: "Museum", group: "culture", walkMin: 16,
    hours: [[at(11), at(18)], null, null, [at(11), at(18)], [at(11), at(18)], [at(11), at(20)], [at(11), at(18)]],
    lastEntryBefore: 60, minStay: 60, admission: "Tickets at the desk", price: "Price not listed",
    status: "check", checkNote: "the ticket price isn’t published, so confirm it before you walk over.",
    hoursSource: "Hours from a map listing, last edited in April",
  },
];
