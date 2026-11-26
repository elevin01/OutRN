// The clock arithmetic behind the "Try it with your own clock" demo.
// A simplified version of what OutRN checks before it suggests a place: can you
// reach it, will it be open (or starting) when you arrive, and is there enough
// time left to make the trip worth it. With more time it reaches farther and
// strings two or three stops together, so the plan fills the time you have
// instead of leaving most of it over.
// Pure functions, no I/O, erasable TypeScript only so the tests can import it.

export type Status = "go" | "check";
export type Group = "food" | "sweet" | "drink" | "culture" | "outdoors" | "browse" | "active" | "show";
type Span = [number, number] | null;
type Point = [number, number];

export type Place = {
  id: string;
  name: string;
  kind: string;
  /** Plans are spread across groups so the three differ, and a plan never repeats one. */
  group: Group;
  /** Position east and north of where you are, in minutes of walking. */
  at: Point;
  /** The trip from where you are now, worked out from the position. */
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
  /** How long people usually spend. */
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

/** One stop: a place, the leg that gets you there, and the time you spend. */
export type Fit = {
  place: Place;
  fits: true;
  travelMin: number;
  travelBy: "walk" | "subway";
  /** Minutes from midnight today; may pass 1440 when the evening runs late. */
  arrive: number;
  /** When the visit can start: arrival, opening time, or the show's start. */
  start: number;
  /** The latest you could stay: closing time, the end of the show, or your deadline. */
  end: number;
  closes: number;
  wait: number;
  /** All the time available there. */
  useful: number;
  /** The time the plan spends there: the usual visit, or all of it if that is less. */
  stay: number;
  endsBy: "closing" | "deadline" | "show";
  inSeason: boolean;
  /** One sentence on why this stop suits this moment. */
  why: string;
};

export type Miss = {
  place: Place;
  fits: false;
  reason: "closed" | "short" | "last-entry" | "far";
  detail: string;
};

export type Verdict = Fit | Miss;

/** One, two or three stops in order, sized to the time you have. */
export type Plan = {
  id: string;
  stops: Fit[];
  status: Status;
  /** The stop the plan is built around: the one you spend longest at. */
  lead: Fit;
  title: string;
  why: string;
  travelMin: number;
  /** When the last stop ends. */
  end: number;
  /** Time left over before your deadline. */
  spare: number;
  score: number;
};

const DAY = 1440;
/** The longest wait at the door that is still a plan rather than a queue: longer when you have longer. */
const maxWait = (windowMin: number) => Math.max(45, windowMin / 4);
/** Between stops you stay on foot and nearby. */
const MAX_HOP = 16;

/** How far the first trip may be: farther when you have longer. */
export function maxTravel(windowMin: number): number {
  if (windowMin <= 60) return 12;
  if (windowMin <= 120) return 20;
  if (windowMin <= 180) return 30;
  return 40;
}

/** How many stops a plan may have. */
export function maxStops(windowMin: number): number {
  if (windowMin <= 60) return 1;
  if (windowMin <= 180) return 2;
  return 3;
}

/** A walk if it is close, otherwise the subway. From null means from where you are. */
export function travelBetween(from: Point | null, to: Point): { travelMin: number; travelBy: "walk" | "subway" } {
  const distance = Math.hypot(to[0] - (from?.[0] ?? 0), to[1] - (from?.[1] ?? 0));
  return distance <= 22 ? { travelMin: Math.max(2, Math.round(distance)), travelBy: "walk" } : { travelMin: Math.round(8 + 0.18 * distance), travelBy: "subway" };
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

export function travelLabel(leg: { travelMin: number; travelBy: "walk" | "subway" }): string {
  return leg.travelBy === "walk" ? `${leg.travelMin} min walk` : `${leg.travelMin} min by subway`;
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

type Leg = { travelMin: number; travelBy: "walk" | "subway" };

function stop(place: Place, leg: Leg, windowMin: number, parts: Pick<Fit, "arrive" | "start" | "end" | "closes" | "useful" | "endsBy">): Fit {
  const clock = ((parts.start % DAY) + DAY) % DAY;
  const inSeason = (place.bestAt ?? []).some(([from, to]) => clock >= from && clock < to || clock + DAY >= from && clock + DAY < to);
  const result: Fit = { place, fits: true, ...leg, ...parts, wait: parts.start - parts.arrive, stay: Math.min(parts.useful, place.typical), inSeason, why: "" };
  result.why = explain(result, windowMin);
  return result;
}

function explain(pick: Fit, windowMin: number): string {
  const { place, wait, useful } = pick;
  if (pick.endsBy === "show") {
    return wait <= 10 ? `Starts at ${formatClock(pick.start)}, just after you get there` : `Starts at ${formatClock(pick.start)}, ${wait} min after you get there`;
  }
  if (wait > 0) return `Opens at ${formatClock(pick.start)}, ${wait} min after you get there`;
  if (useful < 0.85 * place.typical) return `You’d have ${formatDuration(useful)}, a little short of the usual ${formatDuration(place.typical)}`;
  if (pick.endsBy === "closing" && useful < 1.5 * place.typical) return `Closes at ${formatClock(pick.closes)}, which still leaves ${formatDuration(useful)}`;
  if (pick.inSeason && place.bestNote) return place.bestNote;
  if (place.typical >= 0.5 * windowMin) return `Takes about ${formatDuration(place.typical)}, a good use of ${windowMin === 60 ? "an hour" : formatDuration(windowMin)}`;
  if (pick.travelBy === "walk" && pick.travelMin <= 6) return `${pick.travelMin} minutes away, with time to spare`;
  if (place.price.startsWith("Free")) return `Free, and open until ${formatClock(pick.closes)}`;
  return `Open until ${formatClock(pick.closes)}`;
}

function visitShow(place: Place, weekday: number, leg: Leg, arrive: number, deadline: number, windowMin: number): Verdict {
  const noun = place.eventNoun ?? "show";
  const runtime = place.runtime ?? place.typical;
  const starts = [0, 1].flatMap(offset => (place.shows![(weekday + offset) % 7] ?? []).map(start => start + offset * DAY));
  const next = starts.find(start => start >= arrive);
  if (next === undefined || next >= DAY && next >= deadline) return { place, fits: false, reason: "closed", detail: `No more ${noun}s today` };
  if (next - arrive > maxWait(windowMin)) return { place, fits: false, reason: "short", detail: `The next ${noun} isn’t until ${formatClock(next)}` };
  if (next + runtime > deadline) return { place, fits: false, reason: "short", detail: `The ${formatClock(next)} ${noun} ends after your time is up` };
  return stop(place, leg, windowMin, { arrive, start: next, end: next + runtime, closes: next + runtime, useful: runtime, endsBy: "show" });
}

/** Can you make something of this place if you set off at `departMin` with this leg ahead of you? */
function visit(place: Place, weekday: number, leg: Leg, departMin: number, deadline: number, windowMin: number): Verdict {
  const arrive = departMin + leg.travelMin;
  if (place.shows) return visitShow(place, weekday, leg, arrive, deadline, windowMin);

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
    return stop(place, leg, windowMin, { arrive, start, end, closes: close, useful, endsBy: close <= deadline ? "closing" : "deadline" });
  }

  if (best) return best;
  const next = spans.find(([open]) => open >= deadline);
  return { place, fits: false, reason: "closed", detail: next && next[0] < DAY ? `Closed until ${formatClock(next[0])}` : "Closed for the day" };
}

/** Whether a place works as the only stop, setting off now. */
export function evaluate(place: Place, weekday: number, nowMin: number, windowMin: number): Verdict {
  const leg = { travelMin: place.travelMin, travelBy: place.travelBy };
  if (leg.travelMin > maxTravel(windowMin)) {
    return { place, fits: false, reason: "far", detail: `${travelLabel(leg)} is too far for ${formatDuration(windowMin)}` };
  }
  return visit(place, weekday, leg, nowMin, nowMin + windowMin, windowMin);
}

const numberWords = ["", "One", "Two", "Three"];

function makePlan(visits: Fit[], deadline: number, windowMin: number): Plan {
  const stops = visits.map(v => ({ ...v }));
  // If there is time left at the end, the last stop is where you linger, within reason.
  const last = stops[stops.length - 1];
  if (last.endsBy !== "show") last.stay = Math.min(last.useful, Math.max(last.stay, Math.round(last.place.typical * 1.4)));
  const end = last.start + last.stay;
  const spare = deadline - end;
  const travelMin = stops.reduce((sum, s) => sum + s.travelMin, 0);
  const waited = stops.reduce((sum, s) => sum + s.wait, 0);
  const stayed = stops.reduce((sum, s) => sum + s.stay, 0);
  const inSeason = stops.reduce((sum, s) => sum + (s.inSeason ? s.stay : 0), 0) / stayed;
  const rushed = stops.reduce((sum, s) => sum + (s.stay < s.place.typical ? 0.25 * (1 - s.stay / s.place.typical) : 0), 0);
  // Time well spent, less the time getting around, waiting, cutting a visit short, or left unused.
  const score = stayed / windowMin - 0.5 * travelMin / windowMin - 0.7 * waited / windowMin - 1.2 * Math.max(0, spare - 0.1 * windowMin) / windowMin
    + 0.2 * inSeason + 0.05 * stops.filter(s => s.place.shows).length - rushed - 0.05 * (stops.length - 1);

  const lead = stops.reduce((longest, s) => s.stay > longest.stay ? s : longest);
  const walked = stops.every(s => s.travelBy === "walk");
  return {
    id: stops.map(s => s.place.id).join("+"),
    stops, lead, travelMin, end, spare, score,
    status: stops.some(s => s.place.status === "check") ? "check" : "go",
    title: stops.map((s, i) => i === 0 ? s.place.kind : s.place.kind.charAt(0).toLowerCase() + s.place.kind.slice(1)).join(", then "),
    why: stops.length === 1 ? stops[0].why
      : `${numberWords[stops.length]} stops, ${travelMin} minutes ${walked ? "of walking" : "of travel"} in all, done by ${formatClock(end)}`,
  };
}

/** Dessert follows dinner, never the other way round. */
const outOfOrder = (earlier: Fit[], next: Place) => next.group === "food" && earlier.some(s => s.place.group === "sweet");

/** Every sensible plan for this moment: single stops, and chains of nearby stops when there is time for them. */
function allPlans(places: Place[], weekday: number, nowMin: number, windowMin: number): Plan[] {
  const deadline = nowMin + windowMin;
  const limit = maxStops(windowMin);
  const best = new Map<string, Plan>();

  const extend = (stops: Fit[], departMin: number, from: Point | null) => {
    for (const place of places) {
      if (stops.some(s => s.place === place || s.place.group === place.group) || outOfOrder(stops, place)) continue;
      const leg = travelBetween(from, place.at);
      if (stops.length === 0 ? leg.travelMin > maxTravel(windowMin) : leg.travelBy !== "walk" || leg.travelMin > MAX_HOP) continue;
      const verdict = visit(place, weekday, leg, departMin, deadline, windowMin);
      if (!verdict.fits) continue;
      const chain = [...stops, verdict];
      const plan = makePlan(chain, deadline, windowMin);
      const key = chain.map(s => s.place.id).sort().join("+");
      const known = best.get(key);
      if (!known || plan.score > known.score) best.set(key, plan);
      const leave = verdict.start + verdict.stay;
      if (chain.length < limit && deadline - leave >= 30) extend(chain, leave, place.at);
    }
  };
  extend([], nowMin, null);
  // A plan has to use the time. Time left over is accepted only when the last stop closes on you,
  // and then only up to half of what you have.
  return [...best.values()].filter(plan => {
    const closedOut = plan.stops[plan.stops.length - 1].endsBy === "closing";
    return plan.spare <= (closedOut ? 0.5 : 0.2) * windowMin;
  });
}

/** What to do with the time you have, three plans at a time.
 *  Confirmed plans come before any with something unconfirmed, the best use of the time comes first,
 *  and the three on a page share no place and lead with different kinds of outing.
 *  Never padded: fewer than three is an answer. */
export function recommend(places: Place[], weekday: number, nowMin: number, windowMin: number, page = 0) {
  const verdicts = places.map(place => evaluate(place, weekday, nowMin, windowMin));
  const misses = verdicts.filter((v): v is Miss => !v.fits);
  const fitCount = verdicts.length - misses.length;
  const plans = allPlans(places, weekday, nowMin, windowMin).sort((a, b) => b.score - a.score);

  const ordered: Plan[] = [];
  for (const status of ["go", "check"] as const) {
    const pool = plans.filter(plan => plan.status === status).slice(0, 60);
    while (pool.length > 0 && ordered.length < 12) {
      const round: Plan[] = [];
      const shared = (plan: Plan) => round.reduce((n, other) => n + other.stops.filter(a => plan.stops.some(b => a.place === b.place)).length, 0);
      const sameLeadGroup = (plan: Plan) => round.some(other => other.lead.place.group === plan.lead.place.group);
      const sameLead = (plan: Plan) => round.some(other => other.lead.place === plan.lead.place);
      // First three plans with nothing in common, then, only if needed, plans that share a side stop.
      const passes = [
        (plan: Plan) => shared(plan) === 0 && !sameLeadGroup(plan),
        (plan: Plan) => shared(plan) === 0,
        (plan: Plan) => shared(plan) <= 1 && !sameLead(plan),
      ];
      for (const allowed of passes) {
        for (const plan of pool) {
          if (round.length === 3) break;
          if (!round.includes(plan) && allowed(plan)) round.push(plan);
        }
      }
      if (round.length === 0) break;
      for (const chosen of round) pool.splice(pool.indexOf(chosen), 1);
      // A plan already offered is not offered again with one stop swapped for a neighbour.
      for (let i = pool.length - 1; i >= 0; i--) if (round.some(chosen => chosen.lead.place === pool[i].lead.place)) pool.splice(i, 1);
      ordered.push(...round);
    }
  }

  const pages = Math.max(1, Math.ceil(ordered.length / 3));
  const current = ((page % pages) + pages) % pages;
  return { picks: ordered.slice(current * 3, current * 3 + 3), misses, fitCount, planCount: ordered.length, pages, page: current };
}

const at = (hour: number, minute = 0) => hour * 60 + minute;
const daily = (open: number, close: number): Span[] => Array.from({ length: 7 }, () => [open, close]);
/** Days listed Sunday first: 0 is Sunday, 6 is Saturday. */
const on = (days: number[], open: number, close: number): Span[] => Array.from({ length: 7 }, (_, day) => days.includes(day) ? [open, close] : null);
const showsOn = (days: number[], starts: number[]): (number[] | null)[] => Array.from({ length: 7 }, (_, day) => days.includes(day) ? starts : null);
const everyDay = [0, 1, 2, 3, 4, 5, 6];
/** Placed by how long the trip is and which way it lies, in degrees from east. */
const polar = (distance: number, bearing: number): Point => [distance * Math.cos(bearing * Math.PI / 180), distance * Math.sin(bearing * Math.PI / 180)];
const walk = (minutes: number, bearing: number) => ({ at: polar(minutes, bearing) });
const subway = (minutes: number, bearing: number) => ({ at: polar((minutes - 8) / 0.18, bearing) });
const go = { status: "go" as const };

/** Invented examples, the same on every visit. Not live listings. */
const places: Omit<Place, "travelMin" | "travelBy">[] = [
  // Food
  { id: "noodles", name: "Chilli noodles at the counter", kind: "Noodles", group: "food", ...walk(5, 20), hours: daily(at(12), at(23)),
    bestAt: [[at(12), at(14)], [at(18), at(22)]], bestNote: "The kitchen is at full tilt at this hour", minStay: 45, typical: 60, admission: "Walk in, counter seats", price: "Plates from $12", ...go, hoursSource: "Kitchen hours from the venue’s website" },
  { id: "cafe", name: "Coffee on the corner", kind: "Café", group: "food", ...walk(4, 100), hours: daily(at(7), at(18)),
    bestAt: [[at(7), at(11)], [at(14), at(16)]], bestNote: "A good hour for coffee", minStay: 20, typical: 35, admission: "Walk in", price: "Coffee from $4", ...go, hoursSource: "Hours from the café’s website" },
  { id: "bakery", name: "Pastries at the bakery window", kind: "Bakery", group: "food", ...walk(6, 120), hours: daily(at(7), at(15)),
    bestAt: [[at(7), at(10)]], bestNote: "The morning bake is still warm", minStay: 15, typical: 25, admission: "Walk up", price: "Pastries from $4", ...go, hoursSource: "Hours from the bakery’s website" },
  { id: "diner", name: "Breakfast at the diner", kind: "Diner", group: "food", ...walk(8, 80), hours: daily(at(6), at(15)),
    bestAt: [[at(6), at(11)]], bestNote: "Breakfast is what it does best", minStay: 35, typical: 50, admission: "Walk in", price: "Plates from $9", ...go, hoursSource: "Hours from the diner’s website" },
  { id: "tacos", name: "Tacos from the truck", kind: "Street food", group: "food", ...walk(7, 10), hours: on([0, 4, 5, 6], at(17), at(0)),
    bestAt: [[at(20), at(24)]], bestNote: "The truck is at its best late", minStay: 20, typical: 30, admission: "Walk up", price: "$4 a taco", ...go, hoursSource: "Hours the truck posts each week" },
  { id: "icecream", name: "Scoops at the ice cream counter", kind: "Ice cream", group: "sweet", ...walk(6, 40), hours: daily(at(12), at(22)),
    bestAt: [[at(14), at(17)], [at(19), at(22)]], bestNote: "A good hour for something sweet", minStay: 15, typical: 25, admission: "Walk in", price: "Scoops from $5", ...go, hoursSource: "Hours from the shop’s website" },
  { id: "trattoria", name: "A long dinner at the trattoria", kind: "Dinner", group: "food", ...walk(14, 50), hours: daily(at(17), at(23)),
    bestAt: [[at(18), at(21)]], bestNote: "Dinner hour, when it’s at its best", minStay: 75, typical: 110, admission: "Walk in, or call ahead for a table", price: "Mains from $24", ...go, hoursSource: "Hours from the restaurant’s website" },
  // Drinks and music
  { id: "jazz", name: "Jazz in the basement", kind: "Live music", group: "drink", ...walk(8, 30),
    hours: [[at(18), at(1)], null, [at(18), at(1)], [at(18), at(1)], [at(18), at(1)], [at(18), at(2)], [at(18), at(2)]],
    bestAt: [[at(20), at(25)]], bestNote: "The band is on by this hour", minStay: 45, typical: 90, admission: "Walk in", price: "$15 at the door", ...go, hoursSource: "Hours from the venue’s website" },
  { id: "winebar", name: "A glass at the wine bar", kind: "Wine bar", group: "drink", ...walk(9, 15), hours: on([0, 2, 3, 4, 5, 6], at(17), at(0)),
    bestAt: [[at(17), at(20)]], bestNote: "Early evening is the easiest time to get a seat", minStay: 40, typical: 75, admission: "Walk in", price: "Glasses from $11", ...go, hoursSource: "Hours from the bar’s website" },
  { id: "brewery", name: "The brewery taproom", kind: "Brewery", group: "drink", ...subway(22, 38),
    hours: [[at(12), at(22)], null, null, [at(15), at(23)], [at(15), at(23)], [at(15), at(0)], [at(12), at(0)]],
    bestAt: [[at(15), at(19)]], bestNote: "Afternoon is the time for a taproom", minStay: 60, typical: 100, admission: "Walk in", price: "Pints from $8", ...go, hoursSource: "Hours from the brewery’s website" },
  // Culture
  { id: "gallery", name: "Prints at the corner gallery", kind: "Gallery", group: "culture", ...walk(12, 130), hours: on([0, 3, 4, 5, 6], at(12), at(22)),
    bestAt: [[at(17), at(20)]], bestNote: "Early evening is the calm hour here", minStay: 30, typical: 45, admission: "Walk in", price: "Free", ...go, hoursSource: "Hours from the gallery’s website" },
  { id: "museum", name: "The neighborhood history museum", kind: "Museum", group: "culture", ...walk(16, 125),
    hours: [[at(11), at(18)], null, null, [at(11), at(18)], [at(11), at(18)], [at(11), at(20)], [at(11), at(18)]],
    lastEntryBefore: 60, minStay: 60, typical: 100, admission: "Tickets at the desk", price: "Price not listed",
    status: "check", checkNote: "the ticket price isn’t published, so confirm it before you walk over.", hoursSource: "Hours from a map listing, last edited in April" },
  // Things with a start time
  { id: "cinema", name: "A film at the two-screen cinema", kind: "Film", group: "show", ...walk(11, 45),
    shows: showsOn(everyDay, [at(14, 15), at(16, 45), at(19, 30), at(21, 45)]), runtime: 115, eventNoun: "showing",
    minStay: 115, typical: 115, admission: "Tickets at the box office", price: "Tickets $14", ...go, hoursSource: "Showtimes from the cinema’s website" },
  { id: "comedy", name: "Stand-up in the back room", kind: "Comedy", group: "show", ...walk(13, 35),
    shows: [[at(19)], null, null, null, [at(20)], [at(20), at(22)], [at(20), at(22)]], runtime: 80, eventNoun: "show",
    minStay: 80, typical: 80, admission: "Tickets at the door", price: "$20 and one drink", ...go, hoursSource: "Show times from the venue’s website" },
  { id: "yoga", name: "The drop-in yoga class", kind: "Yoga", group: "active", ...walk(9, 150),
    shows: [[at(9), at(11)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(7, 30), at(12, 15), at(18)], [at(9), at(11)]],
    runtime: 60, eventNoun: "class", minStay: 60, typical: 60, admission: "Drop in, mats provided", price: "$22 a class", ...go, hoursSource: "Schedule from the studio’s website" },
  { id: "reading", name: "The evening reading at the library", kind: "Reading", group: "show", ...walk(10, 140),
    shows: showsOn([2, 4], [at(18, 30)]), runtime: 60, eventNoun: "reading",
    minStay: 60, typical: 60, admission: "Open to everyone", price: "Free", ...go, hoursSource: "From the library’s events calendar" },
  // Outdoors
  { id: "pocketpark", name: "A bench in the pocket park", kind: "Park bench", group: "outdoors", ...walk(3, 200), hours: daily(at(6), at(20)),
    bestAt: [[at(12), at(14)]], bestNote: "A good lunch-hour bench", minStay: 15, typical: 25, admission: "Open to everyone", price: "Free", ...go, hoursSource: "Park hours from the city" },
  { id: "waterfront", name: "The waterfront path", kind: "Waterfront walk", group: "outdoors", ...walk(10, 230), hours: daily(at(6), at(20)),
    bestAt: [[at(16), at(20)]], bestNote: "The light on the water is best around now", minStay: 40, typical: 55, admission: "Open to everyone", price: "Free", ...go, hoursSource: "Park hours from the city" },
  { id: "garden", name: "The botanical garden", kind: "Garden", group: "outdoors", ...subway(28, 300), hours: on([0, 2, 3, 4, 5, 6], at(10), at(18)),
    lastEntryBefore: 60, bestAt: [[at(10), at(14)]], bestNote: "Morning is the best time to walk it", minStay: 75, typical: 120, admission: "Tickets at the gate", price: "$15 entry", ...go, hoursSource: "Hours from the garden’s website" },
  { id: "beach", name: "The boardwalk and the beach", kind: "Beach", group: "outdoors", ...subway(34, 250), hours: daily(at(6), at(20)),
    bestAt: [[at(9), at(15)]], bestNote: "Go while the sun is high", minStay: 90, typical: 150, admission: "Open to everyone", price: "Free", ...go, hoursSource: "Beach hours from the city" },
  { id: "clams", name: "Fried clams on the boardwalk", kind: "Clam shack", group: "food", ...subway(34.3, 251.5), hours: daily(at(11), at(20)),
    bestAt: [[at(12), at(15)]], bestNote: "Lunch with sand still on your feet", minStay: 25, typical: 40, admission: "Walk up", price: "Baskets from $14", ...go, hoursSource: "Hours from the shack’s website" },
  // Browsing
  { id: "bookshop", name: "The secondhand bookshop", kind: "Bookshop", group: "browse", ...walk(9, 110), hours: daily(at(10), at(20)),
    bestAt: [[at(11), at(15)]], bestNote: "A good midday browse", minStay: 25, typical: 40, admission: "Walk in", price: "Free to browse", ...go, hoursSource: "Hours from the shop’s website" },
  { id: "records", name: "Crate-digging at the record shop", kind: "Record shop", group: "browse", ...walk(10, 95), hours: daily(at(11), at(20)),
    minStay: 25, typical: 40, admission: "Walk in", price: "Free to browse", ...go, hoursSource: "Hours from the shop’s website" },
  { id: "market", name: "The weekend market", kind: "Market", group: "browse", ...walk(14, 105), hours: on([0, 6], at(9), at(16)),
    bestAt: [[at(9), at(13)]], bestNote: "Go before the best stalls sell out", minStay: 40, typical: 60, admission: "Open to everyone", price: "Free entry", ...go, hoursSource: "Market days from the organizer" },
  { id: "nightmarket", name: "The night market under the tracks", kind: "Night market", group: "browse", ...subway(20, 30), hours: on([5, 6], at(18), at(0)),
    bestAt: [[at(19), at(23)]], bestNote: "The stalls are all open by now", minStay: 45, typical: 80, admission: "Open to everyone", price: "Free entry", ...go, hoursSource: "Market nights from the organizer" },
  // Something to do
  { id: "karaoke", name: "A karaoke room by the hour", kind: "Karaoke", group: "active", ...walk(16, 20), hours: daily(at(18), at(2)),
    bestAt: [[at(21), at(26)]], bestNote: "It fills up, and gets fun, late", minStay: 60, typical: 120, admission: "Walk in, rooms by the hour", price: "$12 a person per hour", ...go, hoursSource: "Hours from the venue’s website" },
  { id: "boardgames", name: "A table at the board game café", kind: "Board games", group: "active", ...walk(13, 5), hours: daily(at(12), at(23)),
    minStay: 45, typical: 100, admission: "Walk in", price: "$8 table fee", ...go, hoursSource: "Hours from the café’s website" },
  { id: "arcade", name: "Pinball at the arcade bar", kind: "Arcade", group: "active", ...walk(11, 25),
    hours: [[at(12), at(2)], [at(16), at(2)], [at(16), at(2)], [at(16), at(2)], [at(16), at(2)], [at(16), at(2)], [at(12), at(2)]],
    bestAt: [[at(21), at(26)]], bestNote: "It’s liveliest late at night", minStay: 30, typical: 60, admission: "Walk in, 21 and over after 8 PM", price: "Games from 50¢", ...go, hoursSource: "Hours from the venue’s website" },
  { id: "climbing", name: "Bouldering at the climbing gym", kind: "Climbing", group: "active", ...walk(15, 160), hours: daily(at(9), at(22)),
    minStay: 60, typical: 90, admission: "Day pass, shoes to rent", price: "Day pass $28", ...go, hoursSource: "Hours from the gym’s website" },
  { id: "bowling", name: "A lane at the bowling alley", kind: "Bowling", group: "active", ...walk(18, 60),
    hours: [[at(12), at(22)], [at(16), at(23)], [at(16), at(23)], [at(16), at(23)], [at(16), at(23)], [at(12), at(1)], [at(12), at(1)]],
    bestAt: [[at(19), at(23)]], bestNote: "Evenings are when it’s liveliest", minStay: 60, typical: 90, admission: "Walk in, lanes first come first served", price: "$7 a game, shoes $5", ...go, hoursSource: "Hours from the alley’s website" },
  { id: "escape", name: "The escape room", kind: "Escape room", group: "active", ...walk(12, 85), hours: daily(at(12), at(22)),
    minStay: 70, typical: 70, admission: "Booked in slots", price: "From $32 a person",
    status: "check", checkNote: "rooms are booked in slots, so see whether one is open before you go.", hoursSource: "Hours from the venue’s website" },
];

export const examplePlaces: Place[] = places.map(place => ({ ...place, ...travelBetween(null, place.at) }));
