// The clock arithmetic behind the "Try it with your own clock" demo.
// A simplified version of what OutRN checks before it suggests a place: can you
// reach it, will it be open (or starting) when you arrive, and is there enough
// time left to make the trip worth it. Then it ranks what fits by how well it
// uses the time you have, so one hour and five hours give different answers.
// Pure functions, no I/O, erasable TypeScript only so the tests can import it.

export type Status = "go" | "check";
export type Group = "food" | "drink" | "culture" | "outdoors" | "browse" | "active" | "show";
type Span = [number, number] | null;

export type Place = {
  id: string;
  name: string;
  kind: string;
  /** Picks are spread across groups so the three differ. */
  group: Group;
  travelMin: number;
  travelBy: "walk" | "subway";
  /** Opening interval per weekday, Sunday first, in minutes from midnight.
   *  A close at or before the open means it runs past midnight. */
  hours?: Span[];
  /** Start times per weekday for something with a fixed start. */
  shows?: (number[] | null)[];
  runtime?: number;
  /** What one of its start times is called: showing, show, class. */
  eventNoun?: string;
  /** Minutes before closing after which nobody is let in. */
  lastEntryBefore?: number;
  /** The shortest visit that is still worth the trip. */
  minStay: number;
  /** How long people usually spend. Ranking prefers a pick that fills the time you have. */
  typical: number;
  /** Hours of the day it is at its best, as [from, to] in minutes from midnight. */
  bestAt?: [number, number][];
  /** Said about it when it is picked during those hours. */
  bestNote?: string;
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
  /** When the visit can start: arrival, opening time, or the show's start. */
  start: number;
  end: number;
  closes: number;
  wait: number;
  useful: number;
  endsBy: "closing" | "deadline" | "show";
  score: number;
  /** One sentence on why this pick suits this moment. */
  why: string;
};

export type Miss = {
  place: Place;
  fits: false;
  reason: "closed" | "short" | "last-entry" | "far";
  detail: string;
};

export type Verdict = Fit | Miss;

const DAY = 1440;
/** The longest wait at the door that is still a plan rather than a queue: longer when you have longer. */
const maxWait = (windowMin: number) => Math.max(45, windowMin / 4);

/** How far is reasonable depends on how long you have. */
export function maxTravel(windowMin: number): number {
  if (windowMin <= 60) return 12;
  if (windowMin <= 120) return 20;
  if (windowMin <= 180) return 30;
  return 35;
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

export function travelLabel(place: Place): string {
  return place.travelBy === "walk" ? `${place.travelMin} min walk` : `${place.travelMin} min by subway`;
}

/** Opening intervals around today, in minutes from today's midnight. */
function intervals(hours: Span[], weekday: number): [number, number][] {
  const list: [number, number][] = [];
  for (const offset of [-1, 0, 1]) {
    const span = hours[(weekday + offset + 7) % 7];
    if (!span) continue;
    const open = span[0] + offset * DAY;
    const close = (span[1] <= span[0] ? span[1] + DAY : span[1]) + offset * DAY;
    list.push([open, close]);
  }
  return list;
}

function fit(place: Place, windowMin: number, parts: Omit<Fit, "place" | "fits" | "score" | "why" | "wait">): Fit {
  const wait = parts.start - parts.arrive;
  // How much of the time it fills, judged against a target of about two thirds of what you have,
  // less the time spent getting there, waiting, or cutting the visit short.
  const target = 0.7 * windowMin;
  const filled = Math.min(parts.useful, place.typical, target) / target;
  const rushed = parts.useful < place.typical ? 0.25 * (1 - parts.useful / place.typical) : 0;
  const clock = ((parts.start % DAY) + DAY) % DAY;
  const inSeason = (place.bestAt ?? []).some(([from, to]) => clock >= from && clock < to || clock + DAY >= from && clock + DAY < to);
  const score = filled - 0.5 * place.travelMin / windowMin - 0.7 * wait / windowMin - rushed + (place.shows ? 0.1 : 0) + (inSeason ? 0.2 : 0);
  const result: Fit = { place, fits: true, ...parts, wait, score, why: "" };
  result.why = explain(result, windowMin, inSeason);
  return result;
}

function explain(pick: Fit, windowMin: number, inSeason: boolean): string {
  const { place, wait, useful } = pick;
  if (pick.endsBy === "show") {
    return wait <= 10 ? `Starts at ${formatClock(pick.start)}, just after you get there` : `Starts at ${formatClock(pick.start)}, ${wait} min after you get there`;
  }
  if (wait > 0) return `Opens at ${formatClock(pick.start)}, ${wait} min after you get there`;
  if (useful < 0.85 * place.typical) return `You’d have ${formatDuration(useful)}, a little short of the usual ${formatDuration(place.typical)}`;
  if (pick.endsBy === "closing" && useful < 1.5 * place.typical) return `Closes at ${formatClock(pick.closes)}, which still leaves ${formatDuration(useful)}`;
  if (inSeason && place.bestNote) return place.bestNote;
  if (place.typical >= 0.5 * windowMin) return `Takes about ${formatDuration(place.typical)}, a good use of ${windowMin === 60 ? "an hour" : formatDuration(windowMin)}`;
  if (place.travelBy === "walk" && place.travelMin <= 6) return `${place.travelMin} minutes away, with time to spare`;
  if (place.price.startsWith("Free")) return `Free, and open until ${formatClock(pick.closes)}`;
  return `Open until ${formatClock(pick.closes)}`;
}

function evaluateShow(place: Place, weekday: number, arrive: number, deadline: number, windowMin: number): Verdict {
  const noun = place.eventNoun ?? "show";
  const runtime = place.runtime ?? place.typical;
  const starts = [0, 1].flatMap(offset => (place.shows![(weekday + offset) % 7] ?? []).map(start => start + offset * DAY));
  const next = starts.find(start => start >= arrive);
  if (next === undefined || next >= DAY && next >= deadline) return { place, fits: false, reason: "closed", detail: `No more ${noun}s today` };
  if (next - arrive > maxWait(windowMin)) return { place, fits: false, reason: "short", detail: `The next ${noun} isn’t until ${formatClock(next)}` };
  if (next + runtime > deadline) return { place, fits: false, reason: "short", detail: `The ${formatClock(next)} ${noun} ends after your time is up` };
  return fit(place, windowMin, { arrive, start: next, end: next + runtime, closes: next + runtime, useful: runtime, endsBy: "show" });
}

export function evaluate(place: Place, weekday: number, nowMin: number, windowMin: number): Verdict {
  if (place.travelMin > maxTravel(windowMin)) {
    return { place, fits: false, reason: "far", detail: `${travelLabel(place)} is too far for ${formatDuration(windowMin)}` };
  }
  const arrive = nowMin + place.travelMin;
  const deadline = nowMin + windowMin;
  if (place.shows) return evaluateShow(place, weekday, arrive, deadline, windowMin);

  let best: Miss | null = null;
  const spans = intervals(place.hours ?? [], weekday);
  for (const [open, close] of spans) {
    if (close <= arrive || open >= deadline) continue; // no overlap with the trip
    if (open - arrive > maxWait(windowMin)) { best = { place, fits: false, reason: "closed", detail: `Closed until ${formatClock(open)}` }; continue; }
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
    return fit(place, windowMin, { arrive, start, end, closes: close, useful, endsBy: close <= deadline ? "closing" : "deadline" });
  }

  if (best) return best;
  const next = spans.find(([open]) => open >= deadline);
  return { place, fits: false, reason: "closed", detail: next && next[0] < DAY ? `Closed until ${formatClock(next[0])}` : "Closed for the day" };
}

/** Everything that fits, in the order it would be offered three at a time:
 *  confirmed places before unconfirmed ones, the best use of the time first,
 *  and each set of three spread across different kinds of outing.
 *  Never padded: fewer than three is an answer. */
export function recommend(places: Place[], weekday: number, nowMin: number, windowMin: number, page = 0) {
  const verdicts = places.map(place => evaluate(place, weekday, nowMin, windowMin));
  const misses = verdicts.filter((v): v is Miss => !v.fits);
  const fits = verdicts.filter((v): v is Fit => v.fits).sort((a, b) => b.score - a.score);

  // Confirmed places are all offered before any unconfirmed one: variety never outranks certainty.
  const ordered: Fit[] = [];
  for (const status of ["go", "check"] as const) {
    const pool = fits.filter(candidate => candidate.place.status === status);
    while (pool.length > 0) {
      const round: Fit[] = [];
      const seen = new Set<Group>();
      for (const candidate of pool) {
        if (round.length === 3) break;
        if (seen.has(candidate.place.group)) continue;
        seen.add(candidate.place.group);
        round.push(candidate);
      }
      for (const candidate of pool) {
        if (round.length === 3) break;
        if (!round.includes(candidate)) round.push(candidate);
      }
      for (const chosen of round) pool.splice(pool.indexOf(chosen), 1);
      ordered.push(...round);
    }
  }

  const pages = Math.max(1, Math.ceil(ordered.length / 3));
  const current = ((page % pages) + pages) % pages;
  return { picks: ordered.slice(current * 3, current * 3 + 3), misses, fitCount: ordered.length, pages, page: current };
}

const at = (hour: number, minute = 0) => hour * 60 + minute;
const daily = (open: number, close: number): Span[] => Array.from({ length: 7 }, () => [open, close]);
/** Days listed Sunday first: 0 is Sunday, 6 is Saturday. */
const on = (days: number[], open: number, close: number): Span[] => Array.from({ length: 7 }, (_, day) => days.includes(day) ? [open, close] : null);
const showsOn = (days: number[], starts: number[]): (number[] | null)[] => Array.from({ length: 7 }, (_, day) => days.includes(day) ? starts : null);
const everyDay = [0, 1, 2, 3, 4, 5, 6];
const walk = (travelMin: number) => ({ travelMin, travelBy: "walk" as const });
const subway = (travelMin: number) => ({ travelMin, travelBy: "subway" as const });
const go = { status: "go" as const };

/** Invented examples, the same on every visit. Not live listings. */
export const examplePlaces: Place[] = [
  // Food
  { id: "noodles", name: "Chilli noodles at the counter", kind: "Late dinner", group: "food", ...walk(5), hours: daily(at(12), at(23)),
    bestAt: [[at(12), at(14)], [at(18), at(22)]], bestNote: "The kitchen is at full tilt at this hour", minStay: 45, typical: 60, admission: "Walk in, counter seats", price: "Plates from $12", ...go, hoursSource: "Kitchen hours from the venue’s website" },
  { id: "cafe", name: "Coffee on the corner", kind: "Café", group: "food", ...walk(4), hours: daily(at(7), at(18)),
    bestAt: [[at(7), at(11)], [at(14), at(16)]], bestNote: "A good hour for coffee", minStay: 20, typical: 35, admission: "Walk in", price: "Coffee from $4", ...go, hoursSource: "Hours from the café’s website" },
  { id: "bakery", name: "Pastries at the bakery window", kind: "Bakery", group: "food", ...walk(6), hours: daily(at(7), at(15)),
    bestAt: [[at(7), at(10)]], bestNote: "The morning bake is still warm", minStay: 15, typical: 25, admission: "Walk up", price: "Pastries from $4", ...go, hoursSource: "Hours from the bakery’s website" },
  { id: "diner", name: "Breakfast at the diner", kind: "Diner", group: "food", ...walk(8), hours: daily(at(6), at(15)),
    bestAt: [[at(6), at(11)]], bestNote: "Breakfast is what it does best", minStay: 35, typical: 50, admission: "Walk in", price: "Plates from $9", ...go, hoursSource: "Hours from the diner’s website" },
  { id: "tacos", name: "Tacos from the truck", kind: "Street food", group: "food", ...walk(7), hours: on([0, 4, 5, 6], at(17), at(0)),
    bestAt: [[at(20), at(24)]], bestNote: "The truck is at its best late", minStay: 20, typical: 30, admission: "Walk up", price: "$4 a taco", ...go, hoursSource: "Hours the truck posts each week" },
  { id: "icecream", name: "Scoops at the ice cream counter", kind: "Dessert", group: "food", ...walk(6), hours: daily(at(12), at(22)),
    bestAt: [[at(14), at(17)], [at(19), at(22)]], bestNote: "A good hour for something sweet", minStay: 15, typical: 25, admission: "Walk in", price: "Scoops from $5", ...go, hoursSource: "Hours from the shop’s website" },
  { id: "trattoria", name: "A long dinner at the trattoria", kind: "Dinner", group: "food", ...walk(14), hours: daily(at(17), at(23)),
    bestAt: [[at(18), at(21)]], bestNote: "Dinner hour, when it’s at its best", minStay: 75, typical: 110, admission: "Walk in, or call ahead for a table", price: "Mains from $24", ...go, hoursSource: "Hours from the restaurant’s website" },
  // Drinks and music
  { id: "jazz", name: "Jazz in the basement", kind: "Live music", group: "drink", ...walk(8),
    hours: [[at(18), at(1)], null, [at(18), at(1)], [at(18), at(1)], [at(18), at(1)], [at(18), at(2)], [at(18), at(2)]],
    bestAt: [[at(20), at(25)]], bestNote: "The band is on by this hour", minStay: 45, typical: 90, admission: "Walk in", price: "$15 at the door", ...go, hoursSource: "Hours from the venue’s website" },
  { id: "winebar", name: "A glass at the wine bar", kind: "Wine bar", group: "drink", ...walk(9), hours: on([0, 2, 3, 4, 5, 6], at(17), at(0)),
    bestAt: [[at(17), at(20)]], bestNote: "Early evening is the easiest time to get a seat", minStay: 40, typical: 75, admission: "Walk in", price: "Glasses from $11", ...go, hoursSource: "Hours from the bar’s website" },
  { id: "brewery", name: "The brewery taproom", kind: "Brewery", group: "drink", ...subway(22),
    hours: [[at(12), at(22)], null, null, [at(15), at(23)], [at(15), at(23)], [at(15), at(0)], [at(12), at(0)]],
    bestAt: [[at(15), at(19)]], bestNote: "Afternoon is the time for a taproom", minStay: 60, typical: 100, admission: "Walk in", price: "Pints from $8", ...go, hoursSource: "Hours from the brewery’s website" },
  // Culture
  { id: "gallery", name: "Prints at the corner gallery", kind: "Gallery", group: "culture", ...walk(12), hours: on([0, 3, 4, 5, 6], at(12), at(22)),
    bestAt: [[at(17), at(20)]], bestNote: "Early evening is the calm hour here", minStay: 30, typical: 45, admission: "Walk in", price: "Free", ...go, hoursSource: "Hours from the gallery’s website" },
  { id: "museum", name: "The neighborhood history museum", kind: "Museum", group: "culture", ...walk(16),
    hours: [[at(11), at(18)], null, null, [at(11), at(18)], [at(11), at(18)], [at(11), at(20)], [at(11), at(18)]],
    lastEntryBefore: 60, minStay: 60, typical: 100, admission: "Tickets at the desk", price: "Price not listed",
    status: "check", checkNote: "the ticket price isn’t published, so confirm it before you walk over.", hoursSource: "Hours from a map listing, last edited in April" },
  // Things with a start time
  { id: "cinema", name: "A film at the two-screen cinema", kind: "Film", group: "show", ...walk(11),
    shows: showsOn(everyDay, [at(14, 15), at(16, 45), at(19, 30), at(21, 45)]), runtime: 115, eventNoun: "showing",
    minStay: 115, typical: 115, admission: "Tickets at the box office", price: "Tickets $14", ...go, hoursSource: "Showtimes from the cinema’s website" },
  { id: "comedy", name: "Stand-up in the back room", kind: "Comedy", group: "show", ...walk(13),
    shows: [[at(19)], null, null, null, [at(20)], [at(20), at(22)], [at(20), at(22)]], runtime: 80, eventNoun: "show",
    minStay: 80, typical: 80, admission: "Tickets at the door", price: "$20 and one drink", ...go, hoursSource: "Show times from the venue’s website" },
  { id: "yoga", name: "The drop-in yoga class", kind: "Class", group: "active", ...walk(9),
    shows: [[at(9), at(11)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(9), at(11)]],
    runtime: 60, eventNoun: "class", minStay: 60, typical: 60, admission: "Drop in, mats provided", price: "$22 a class", ...go, hoursSource: "Schedule from the studio’s website" },
  { id: "reading", name: "The evening reading at the library", kind: "Talk", group: "show", ...walk(10),
    shows: showsOn([2, 4], [at(18, 30)]), runtime: 60, eventNoun: "reading",
    minStay: 60, typical: 60, admission: "Open to everyone", price: "Free", ...go, hoursSource: "From the library’s events calendar" },
  // Outdoors
  { id: "pocketpark", name: "A bench in the pocket park", kind: "Park", group: "outdoors", ...walk(3), hours: daily(at(6), at(20)),
    bestAt: [[at(12), at(14)]], bestNote: "A good lunch-hour bench", minStay: 15, typical: 25, admission: "Open to everyone", price: "Free", ...go, hoursSource: "Park hours from the city" },
  { id: "waterfront", name: "The waterfront path", kind: "Outdoors", group: "outdoors", ...walk(10), hours: daily(at(6), at(20)),
    bestAt: [[at(16), at(20)]], bestNote: "The light on the water is best around now", minStay: 40, typical: 55, admission: "Open to everyone", price: "Free", ...go, hoursSource: "Park hours from the city" },
  { id: "garden", name: "The botanical garden", kind: "Garden", group: "outdoors", ...subway(28), hours: on([0, 2, 3, 4, 5, 6], at(10), at(18)),
    lastEntryBefore: 60, bestAt: [[at(10), at(14)]], bestNote: "Morning is the best time to walk it", minStay: 75, typical: 120, admission: "Tickets at the gate", price: "$15 entry", ...go, hoursSource: "Hours from the garden’s website" },
  { id: "beach", name: "The boardwalk and the beach", kind: "Beach", group: "outdoors", ...subway(34), hours: daily(at(6), at(20)),
    bestAt: [[at(9), at(15)]], bestNote: "Go while the sun is high", minStay: 90, typical: 150, admission: "Open to everyone", price: "Free", ...go, hoursSource: "Beach hours from the city" },
  // Browsing
  { id: "bookshop", name: "The secondhand bookshop", kind: "Bookshop", group: "browse", ...walk(9), hours: daily(at(10), at(20)),
    bestAt: [[at(11), at(15)]], bestNote: "A good midday browse", minStay: 25, typical: 40, admission: "Walk in", price: "Free to browse", ...go, hoursSource: "Hours from the shop’s website" },
  { id: "records", name: "Crate-digging at the record shop", kind: "Record shop", group: "browse", ...walk(10), hours: daily(at(11), at(20)),
    minStay: 25, typical: 40, admission: "Walk in", price: "Free to browse", ...go, hoursSource: "Hours from the shop’s website" },
  { id: "market", name: "The weekend market", kind: "Market", group: "browse", ...walk(14), hours: on([0, 6], at(9), at(16)),
    bestAt: [[at(9), at(13)]], bestNote: "Go before the best stalls sell out", minStay: 40, typical: 60, admission: "Open to everyone", price: "Free entry", ...go, hoursSource: "Market days from the organizer" },
  { id: "nightmarket", name: "The night market under the tracks", kind: "Night market", group: "browse", ...subway(20), hours: on([5, 6], at(18), at(0)),
    bestAt: [[at(19), at(23)]], bestNote: "The stalls are all open by now", minStay: 45, typical: 80, admission: "Open to everyone", price: "Free entry", ...go, hoursSource: "Market nights from the organizer" },
  // Something to do
  { id: "karaoke", name: "A karaoke room by the hour", kind: "Karaoke", group: "active", ...walk(16), hours: daily(at(18), at(2)),
    bestAt: [[at(21), at(26)]], bestNote: "It fills up, and gets fun, late", minStay: 60, typical: 120, admission: "Walk in, rooms by the hour", price: "$12 a person per hour", ...go, hoursSource: "Hours from the venue’s website" },
  { id: "boardgames", name: "A table at the board game café", kind: "Board games", group: "active", ...walk(13), hours: daily(at(12), at(23)),
    minStay: 45, typical: 100, admission: "Walk in", price: "$8 table fee", ...go, hoursSource: "Hours from the café’s website" },
  { id: "arcade", name: "Pinball at the arcade bar", kind: "Arcade", group: "active", ...walk(11),
    hours: [[at(12), at(2)], [at(16), at(2)], [at(16), at(2)], [at(16), at(2)], [at(16), at(2)], [at(16), at(2)], [at(12), at(2)]],
    bestAt: [[at(21), at(26)]], bestNote: "It’s liveliest late at night", minStay: 30, typical: 60, admission: "Walk in, 21 and over after 8 PM", price: "Games from 50¢", ...go, hoursSource: "Hours from the venue’s website" },
  { id: "climbing", name: "Bouldering at the climbing gym", kind: "Climbing", group: "active", ...walk(15), hours: daily(at(9), at(22)),
    minStay: 60, typical: 90, admission: "Day pass, shoes to rent", price: "Day pass $28", ...go, hoursSource: "Hours from the gym’s website" },
  { id: "bowling", name: "A lane at the bowling alley", kind: "Bowling", group: "active", ...walk(18),
    hours: [[at(12), at(22)], [at(16), at(23)], [at(16), at(23)], [at(16), at(23)], [at(16), at(23)], [at(12), at(1)], [at(12), at(1)]],
    bestAt: [[at(19), at(23)]], bestNote: "Evenings are when it’s liveliest", minStay: 60, typical: 90, admission: "Walk in, lanes first come first served", price: "$7 a game, shoes $5", ...go, hoursSource: "Hours from the alley’s website" },
  { id: "escape", name: "The escape room", kind: "Escape room", group: "active", ...walk(12), hours: daily(at(12), at(22)),
    minStay: 70, typical: 70, admission: "Booked in slots", price: "From $32 a person",
    status: "check", checkNote: "rooms are booked in slots, so see whether one is open before you go.", hoursSource: "Hours from the venue’s website" },
];
