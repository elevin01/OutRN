import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, examplePlaces, formatClock, formatDuration, recommend } from "../app/feasibility.ts";

const place = id => examplePlaces.find(p => p.id === id);
const at = (hour, minute = 0) => hour * 60 + minute;
const SAT = 6, MON = 1, TUE = 2;

test("a pick needs the walk, the opening hours and the free time to line up", () => {
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

test("arriving before the doors open is a wait, not a miss", () => {
  const jazz = evaluate(place("jazz"), SAT, at(17, 20), 120);
  assert.equal(jazz.fits, true);
  assert.equal(jazz.arrive, at(17, 28));
  assert.equal(jazz.start, at(18));
  assert.equal(jazz.useful, 80);
});

test("an evening that runs past midnight still counts", () => {
  const late = evaluate(place("jazz"), 0, at(0, 10), 60); // Sunday 12:10 AM, Saturday's doors until 2 AM
  assert.equal(late.fits, true);
  assert.equal(late.closes, at(2));
  assert.equal(evaluate(place("jazz"), TUE, at(0, 30), 60).fits, false); // Monday is dark
});

test("three picks at most, spread across kinds of outing, and never padded", () => {
  const evening = recommend(examplePlaces, SAT, at(20), 120);
  assert.deepEqual(evening.picks.map(p => p.place.id), ["noodles", "jazz", "waterfront"]);
  assert.equal(new Set(evening.picks.map(p => p.place.group)).size, 3);
  assert.equal(evening.picks.length + evening.leftOver + evening.misses.length, examplePlaces.length);

  const night = recommend(examplePlaces, TUE, at(3, 10), 120);
  assert.equal(night.picks.length, 0);
  assert.equal(night.misses.length, examplePlaces.length);

  const lateSunday = recommend(examplePlaces, 0, at(22, 30), 60); // only the jazz bar is still going
  assert.deepEqual(lateSunday.picks.map(p => p.place.id), ["jazz"]);
});

test("a place with something unconfirmed never outranks a confirmed one", () => {
  const afternoon = recommend(examplePlaces, SAT, at(14), 180);
  assert.ok(afternoon.picks.every(p => p.place.status === "go"));
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

function pick(verdict) { return { fits: verdict.fits, reason: verdict.reason }; }
