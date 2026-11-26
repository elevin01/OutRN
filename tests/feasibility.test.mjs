import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, examplePlaces, formatClock, formatDuration, maxStops, maxTravel, recommend, travelBetween } from "../app/feasibility.ts";

const place = id => examplePlaces.find(p => p.id === id);
const at = (hour, minute = 0) => hour * 60 + minute;
const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;
const windows = [60, 120, 180, 300];
const moments = [[SAT, at(19, 10)], [SUN, at(10)], [WED, at(22, 57)], [SAT, at(14)], [FRI, at(21)], [MON, at(7, 10)], [THU, at(16, 30)], [TUE, at(12, 5)]];
const routes = result => result.picks.map(plan => plan.stops.map(s => s.place.id));
const pick = verdict => ({ fits: verdict.fits, reason: verdict.reason });
const everyPlan = (weekday, now, window) => {
  const first = recommend(examplePlaces, weekday, now, window);
  return Array.from({ length: first.pages }, (_, page) => recommend(examplePlaces, weekday, now, window, page).picks).flat();
};

test("a stop needs the trip, the opening hours and the free time to line up", () => {
  const noodles = evaluate(place("noodles"), SAT, at(20), 120);
  assert.equal(noodles.fits, true);
  assert.equal(noodles.arrive, at(20, 5));
  assert.equal(noodles.useful, 115);
  assert.equal(noodles.stay, 60); // the usual visit, not every minute available
  assert.equal(noodles.endsBy, "deadline");

  const gallery = evaluate(place("gallery"), SAT, at(20), 180); // closes at 10 PM
  assert.equal(gallery.end, at(22));
  assert.equal(gallery.endsBy, "closing");
});

test("closed places, short visits and missed last entries are left out with the reason", () => {
  assert.deepEqual(pick(evaluate(place("cafe"), SAT, at(20), 120)), { fits: false, reason: "closed" });
  assert.deepEqual(pick(evaluate(place("jazz"), MON, at(20), 120)), { fits: false, reason: "closed" });
  // Arrives 5:28 PM, doors at 6, free until 6:20: twenty minutes is not a visit.
  const jazz = evaluate(place("jazz"), SAT, at(17, 20), 60);
  assert.deepEqual(pick(jazz), { fits: false, reason: "short" });
  assert.match(jazz.detail, /Only 20 min before your time is up/);
  const museum = evaluate(place("museum"), SAT, at(16, 50), 120); // last entry 5 PM, arrives 5:06
  assert.deepEqual(pick(museum), { fits: false, reason: "last-entry" });
});

test("trips are walks when close and the subway when not", () => {
  assert.deepEqual(travelBetween(null, place("noodles").at), { travelMin: 5, travelBy: "walk" });
  assert.deepEqual(travelBetween(null, place("beach").at), { travelMin: 34, travelBy: "subway" });
  assert.deepEqual(travelBetween(place("beach").at, place("clams").at), { travelMin: 4, travelBy: "walk" });
  for (const p of examplePlaces) assert.deepEqual({ travelMin: p.travelMin, travelBy: p.travelBy }, travelBetween(null, p.at), p.id);
});

test("how far and how many stops both grow with the time you have", () => {
  assert.deepEqual(windows.map(maxTravel), [12, 20, 30, 40]);
  assert.deepEqual(windows.map(maxStops), [1, 2, 2, 3]);
  const quick = evaluate(place("beach"), SAT, at(10), 120);
  assert.deepEqual(pick(quick), { fits: false, reason: "far" });
  assert.match(quick.detail, /34 min by subway is too far for 2 hours/);
  assert.equal(evaluate(place("beach"), SAT, at(10), 300).fits, true);
});

test("arriving before the doors open is a wait, up to a point", () => {
  const jazz = evaluate(place("jazz"), SAT, at(17, 20), 120);
  assert.equal(jazz.fits, true);
  assert.equal(jazz.start, at(18));
  assert.equal(jazz.wait, 32);
  assert.match(jazz.why, /Opens at 6:00 PM, 32 min after you get there/);
  assert.deepEqual(pick(evaluate(place("jazz"), SAT, at(16), 180)), { fits: false, reason: "closed" });
});

test("something with a start time fits only if you arrive before it and it ends in time", () => {
  const film = evaluate(place("cinema"), SAT, at(19, 10), 180); // the 7:30 showing
  assert.equal(film.fits, true);
  assert.equal(film.start, at(19, 30));
  assert.equal(film.end, at(21, 25));
  assert.equal(film.endsBy, "show");
  assert.match(film.why, /Starts at 7:30 PM, just after you get there/);

  const tooShort = evaluate(place("cinema"), SAT, at(19, 10), 120);
  assert.match(tooShort.detail, /7:30 PM showing ends after your time is up/);
  const missed = evaluate(place("cinema"), SAT, at(19, 25), 180); // walks in at 7:36; next is 9:45
  assert.match(missed.detail, /next showing isn’t until 9:45 PM/);
  assert.deepEqual(pick(evaluate(place("comedy"), MON, at(19), 180)), { fits: false, reason: "closed" });
});

test("an evening that runs past midnight still counts", () => {
  const late = evaluate(place("jazz"), SUN, at(0, 10), 60); // Saturday's doors until 2 AM
  assert.equal(late.fits, true);
  assert.equal(late.closes, at(2));
  assert.equal(evaluate(place("jazz"), TUE, at(0, 30), 60).fits, false); // Monday is dark
});

test("an hour is one stop; longer stretches become plans with more stops", () => {
  assert.deepEqual(routes(recommend(examplePlaces, SAT, at(19, 10), 60)), [["noodles"], ["gallery"], ["winebar"]]);
  assert.deepEqual(routes(recommend(examplePlaces, SAT, at(19, 10), 180))[0], ["noodles", "jazz"]);
  assert.deepEqual(routes(recommend(examplePlaces, SAT, at(19, 10), 300)), [["trattoria", "karaoke"], ["noodles", "boardgames", "jazz"], ["cinema", "winebar", "arcade"]]);
  // Only a long stretch reaches the beach, and it brings lunch with it.
  assert.ok(!everyPlan(SUN, at(10), 180).some(plan => plan.stops.some(s => s.place.id === "beach")));
  assert.deepEqual(routes(recommend(examplePlaces, SUN, at(10), 300))[0], ["clams", "beach"]);
  for (const [weekday, now] of moments) {
    const stops = windows.map(window => { const picks = recommend(examplePlaces, weekday, now, window).picks; return picks.length ? Math.max(...picks.map(p => p.stops.length)) : 0; });
    assert.equal(stops[0] <= 1, true);
    assert.ok(stops[3] >= stops[0], `${weekday} ${now}`);
  }
});

test("plans use the time instead of leaving it over", () => {
  for (const [weekday, now] of moments) for (const window of windows) {
    for (const plan of everyPlan(weekday, now, window)) {
      const last = plan.stops[plan.stops.length - 1];
      const limit = last.endsBy === "closing" ? 0.5 : 0.2;
      assert.ok(plan.spare >= 0 && plan.spare <= limit * window, `${plan.id} leaves ${plan.spare} of ${window}`);
    }
  }
  // Saturday evening has enough going on that nothing is left over at any length.
  for (const window of windows) for (const plan of recommend(examplePlaces, SAT, at(19, 10), window).picks) assert.ok(plan.spare <= 0.1 * window, plan.id);
});

test("every plan is something you could walk through in order", () => {
  for (const [weekday, now] of moments) for (const window of windows) {
    for (const plan of everyPlan(weekday, now, window)) {
      assert.ok(plan.stops.length >= 1 && plan.stops.length <= maxStops(window), plan.id);
      assert.equal(new Set(plan.stops.map(s => s.place.group)).size, plan.stops.length, plan.id);
      let clock = now;
      plan.stops.forEach((stop, i) => {
        assert.equal(stop.arrive, clock + stop.travelMin, plan.id);
        assert.ok(stop.start >= stop.arrive && stop.stay >= stop.place.minStay && stop.stay <= stop.useful, plan.id);
        assert.ok(stop.start + stop.stay <= Math.min(stop.closes, now + window), plan.id);
        if (i === 0) assert.ok(stop.travelMin <= maxTravel(window), plan.id);
        else assert.ok(stop.travelBy === "walk" && stop.travelMin <= 16, plan.id);
        clock = stop.start + stop.stay;
      });
      assert.equal(plan.end, clock);
      const groups = plan.stops.map(s => s.place.group);
      if (groups.includes("sweet") && groups.includes("food")) assert.ok(groups.indexOf("food") < groups.indexOf("sweet"), plan.id);
      assert.ok(plan.title.length > 0 && plan.why.length > 0);
    }
  }
});

test("three at a time, different from each other, and never padded", () => {
  for (const [weekday, now] of moments) for (const window of windows) {
    const all = everyPlan(weekday, now, window);
    assert.equal(new Set(all.map(p => p.id)).size, all.length);
    const first = recommend(examplePlaces, weekday, now, window);
    assert.ok(first.picks.length <= 3);
    assert.equal(new Set(first.picks.map(p => p.lead.place.id)).size, first.picks.length);
    assert.equal(first.fitCount + first.misses.length, examplePlaces.length);
    assert.deepEqual(routes(recommend(examplePlaces, weekday, now, window, first.pages)), routes(first));
  }
  const evening = recommend(examplePlaces, SAT, at(19, 10), 300).picks.flatMap(p => p.stops.map(s => s.place.id));
  assert.equal(new Set(evening).size, evening.length); // the first three share no place

  const night = recommend(examplePlaces, TUE, at(3, 10), 120);
  assert.equal(night.picks.length, 0);
  assert.equal(night.misses.length, examplePlaces.length);
});

test("a plan with something unconfirmed never outranks a confirmed one", () => {
  const statuses = everyPlan(SAT, at(14), 60).map(plan => plan.status);
  if (statuses.includes("check")) assert.ok(statuses.lastIndexOf("go") < statuses.indexOf("check"));
  for (const plan of everyPlan(SAT, at(14), 180)) assert.equal(plan.status, plan.stops.some(s => s.place.status === "check") ? "check" : "go");
});

test("example data is well formed", () => {
  assert.equal(new Set(examplePlaces.map(p => p.id)).size, examplePlaces.length);
  for (const p of examplePlaces) {
    assert.ok(p.hours || p.shows, p.id);
    assert.ok(p.typical >= p.minStay, p.id);
    if (p.status === "check") assert.ok(p.checkNote, p.id);
    if (p.bestAt) assert.ok(p.bestNote, p.id);
  }
});

test("clock and duration labels", () => {
  assert.equal(formatClock(at(0, 5)), "12:05 AM");
  assert.equal(formatClock(at(12)), "12:00 PM");
  assert.equal(formatClock(at(25, 30)), "1:30 AM");
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(60), "1 hour");
  assert.equal(formatDuration(120), "2 hours");
  assert.equal(formatDuration(115), "1h 55m");
});
