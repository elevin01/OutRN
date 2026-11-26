import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, examplePlaces, formatClock, formatDuration, maxTravel, recommend } from "../app/feasibility.ts";

const place = id => examplePlaces.find(p => p.id === id);
const at = (hour, minute = 0) => hour * 60 + minute;
const SUN = 0, MON = 1, TUE = 2, THU = 4, FRI = 5, SAT = 6;
const ids = result => result.picks.map(p => p.place.id);
const pick = verdict => ({ fits: verdict.fits, reason: verdict.reason });

test("a pick needs the trip, the opening hours and the free time to line up", () => {
  const noodles = evaluate(place("noodles"), SAT, at(20), 120);
  assert.equal(noodles.fits, true);
  assert.equal(noodles.arrive, at(20, 5));
  assert.equal(noodles.useful, 115);
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

test("how far is reasonable grows with the time you have", () => {
  assert.deepEqual([60, 120, 180, 300].map(maxTravel), [12, 20, 30, 35]);
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
  assert.equal(jazz.useful, 80);
  assert.match(jazz.why, /Opens at 6:00 PM, 32 min after you get there/);
  // Two hours early is not a wait worth suggesting.
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
  assert.deepEqual(pick(tooShort), { fits: false, reason: "short" });
  assert.match(tooShort.detail, /7:30 PM showing ends after your time is up/);

  const missed = evaluate(place("cinema"), SAT, at(19, 25), 300); // walks in at 7:36; next is 9:45
  assert.deepEqual(pick(missed), { fits: false, reason: "short" });
  assert.match(missed.detail, /next showing isn’t until 9:45 PM/);
  assert.deepEqual(pick(evaluate(place("comedy"), MON, at(19), 180)), { fits: false, reason: "closed" });
});

test("an evening that runs past midnight still counts", () => {
  const late = evaluate(place("jazz"), SUN, at(0, 10), 60); // Saturday's doors until 2 AM
  assert.equal(late.fits, true);
  assert.equal(late.closes, at(2));
  assert.equal(evaluate(place("jazz"), TUE, at(0, 30), 60).fits, false); // Monday is dark
});

test("the time you have changes what is suggested", () => {
  const evening = [60, 120, 180].map(window => ids(recommend(examplePlaces, SAT, at(19, 10), window)));
  assert.deepEqual(evening[0], ["noodles", "gallery", "winebar"]);
  assert.deepEqual(evening[1], ["trattoria", "bowling", "nightmarket"]);
  assert.deepEqual(evening[2], ["trattoria", "cinema", "karaoke"]);
  // Only a long window reaches the beach.
  assert.ok(!ids(recommend(examplePlaces, SUN, at(10), 180)).includes("beach"));
  assert.equal(ids(recommend(examplePlaces, SUN, at(10), 300))[0], "beach");
});

test("the time of day changes it too", () => {
  assert.equal(ids(recommend(examplePlaces, MON, at(7, 10), 60))[0], "diner");
  assert.equal(ids(recommend(examplePlaces, FRI, at(21), 120))[0], "jazz");
  assert.ok(ids(recommend(examplePlaces, THU, at(16, 30), 180)).includes("cinema"));
});

test("three at a time, spread across kinds of outing, and never padded", () => {
  const first = recommend(examplePlaces, SAT, at(19, 10), 180);
  assert.equal(new Set(first.picks.map(p => p.place.group)).size, 3);
  assert.equal(first.fitCount + first.misses.length, examplePlaces.length);
  assert.ok(first.picks.every(p => p.why.length > 0));

  // Paging walks through everything that fits exactly once, then wraps.
  const seen = [];
  for (let page = 0; page < first.pages; page++) seen.push(...ids(recommend(examplePlaces, SAT, at(19, 10), 180, page)));
  assert.equal(seen.length, first.fitCount);
  assert.equal(new Set(seen).size, first.fitCount);
  assert.deepEqual(ids(recommend(examplePlaces, SAT, at(19, 10), 180, first.pages)), ids(first));

  const night = recommend(examplePlaces, TUE, at(3, 10), 120);
  assert.equal(night.picks.length, 0);
  assert.equal(night.misses.length, examplePlaces.length);

  const late = recommend(examplePlaces, MON, at(23, 40), 60); // Monday near midnight
  assert.ok(late.fitCount > 0 && late.fitCount < 3);
  assert.equal(late.picks.length, late.fitCount);
});

test("a place with something unconfirmed never outranks a confirmed one", () => {
  const ordered = [];
  const first = recommend(examplePlaces, SAT, at(14), 180);
  for (let page = 0; page < first.pages; page++) ordered.push(...recommend(examplePlaces, SAT, at(14), 180, page).picks);
  const statuses = ordered.map(p => p.place.status);
  assert.ok(statuses.includes("check"));
  assert.equal(statuses.lastIndexOf("go") < statuses.indexOf("check"), true);
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
