"use client";

import { useState, useSyncExternalStore } from "react";
import { examplePlaces, formatClock, formatDuration, recommend, travelLabel, type Fit, type Miss } from "./feasibility";

const windows = [{ minutes: 60, label: "1 hour" }, { minutes: 120, label: "2 hours" }, { minutes: 180, label: "3 hours" }, { minutes: 300, label: "5 hours" }];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const otherTimes = [
  { id: "sun-morning", label: "Sunday 10 AM", weekday: 0, nowMin: 10 * 60 },
  { id: "sat-afternoon", label: "Saturday 2 PM", weekday: 6, nowMin: 14 * 60 },
  { id: "fri-night", label: "Friday 9 PM", weekday: 5, nowMin: 21 * 60 },
];
// What the prerendered page shows until the visitor's clock is known.
const saturdayEvening = { label: "Saturday 8 PM", weekday: 6, nowMin: 20 * 60 };
const missReasons: [Miss["reason"], string][] = [["closed", "closed"], ["far", "too far"], ["short", "without enough time"], ["last-entry", "past last entry"]];

// The visitor's own clock, to the minute. The server has no clock to offer, so
// the prerendered page starts on the Saturday example and switches on load.
const subscribe = (onChange: () => void) => { const timer = window.setInterval(onChange, 15_000); return () => window.clearInterval(timer); };
const currentMinute = () => Math.floor(Date.now() / 60_000);
const noClock = () => null;

function Timeline({ fit, nowMin, windowMin }: { fit: Fit; nowMin: number; windowMin: number }) {
  const { place, wait } = fit;
  const deadline = nowMin + windowMin;
  const isShow = fit.endsBy === "show";
  // The bar shows the usual length of a visit, and whatever is left after it as time to spare.
  const stay = isShow ? fit.useful : Math.min(fit.useful, place.typical);
  const spare = deadline - (fit.start + stay);
  const roomy = stay < fit.useful;
  const byWalk = place.travelBy === "walk";
  const endLabel = isShow ? "Ends" : fit.endsBy === "closing" ? "Closes" : "Time’s up";
  const journey = byWalk ? `Leave now and walk ${place.travelMin} minutes.` : `Leave now and take the subway for ${place.travelMin} minutes.`;
  const visit = isShow
    ? `It starts at ${formatClock(fit.start)} and runs ${formatDuration(fit.useful)}, so you’d be out by ${formatClock(fit.end)}.`
    : `${wait > 0 ? `It opens at ${formatClock(fit.start)}, and then you` : "You"}’d have ${formatDuration(fit.useful)} there before ${fit.endsBy === "closing" ? "it closes" : "your time is up"}.`;
  return (
    <div className="timeline-block">
      <h3>{place.name}, worked out</h3>
      <p className="timeline-summary">{journey} {visit}</p>
      <div className="timeline" aria-hidden="true">
        <div className="seg seg-walk" style={{ flexGrow: place.travelMin }}>
          <span className="seg-bar"><span>{byWalk ? "Walk" : "Subway"}</span></span>
          <span className="seg-tick"><b>{formatClock(nowMin)}</b>Leave</span>
        </div>
        {wait > 0 && <div className="seg seg-wait" style={{ flexGrow: wait }}>
          <span className="seg-bar"><span>Wait</span></span>
          <span className="seg-tick"><b>{formatClock(fit.arrive)}</b>Arrive</span>
        </div>}
        <div className="seg seg-there" style={{ flexGrow: stay }}>
          <span className="seg-bar"><span>{roomy ? "About " : ""}{formatDuration(stay)} there</span></span>
          <span className="seg-tick"><b>{formatClock(fit.start)}</b>{isShow ? "Starts" : wait > 0 ? "Opens" : "Arrive"}</span>
          {(isShow || spare <= 0) && <span className="seg-tick seg-tick-end"><b>{formatClock(fit.start + stay)}</b>{endLabel}</span>}
        </div>
        {spare > 0 && <div className="seg seg-after" style={{ flexGrow: spare }}>
          <span className="seg-bar"><span>{spare >= windowMin / 5 ? `${formatDuration(spare)} to spare` : ""}</span></span>
          {spare >= windowMin / 6 && <span className="seg-tick seg-tick-end"><b>{formatClock(deadline)}</b>Time’s up</span>}
        </div>}
      </div>
      <dl className="checks">
        <div><dt>Can you get there?</dt><dd>{place.travelMin} minutes {byWalk ? "on foot" : "by subway"}</dd></div>
        <div><dt>{isShow ? "Does it start after you arrive?" : "Is it open when you arrive?"}</dt>
          <dd>{isShow ? `Starts at ${formatClock(fit.start)}` : wait > 0 ? `Opens at ${formatClock(fit.start)}` : `Open until ${formatClock(fit.closes)}`}<small>{place.hoursSource}</small></dd></div>
        <div><dt>Can you get in?</dt><dd>{place.admission}<small>{place.price}</small></dd></div>
        <div><dt>Is there enough time?</dt>
          <dd>{isShow ? `Over by ${formatClock(fit.end)}` : `${roomy ? "Up to " : ""}${formatDuration(fit.useful)} there`}
            <small>{isShow ? `It runs ${formatDuration(fit.useful)}, and you’re free until ${formatClock(deadline)}` : `People usually spend about ${formatDuration(place.typical)}`}</small></dd></div>
      </dl>
      {place.status === "check" && <p className="check-note"><strong>Check first:</strong> {place.checkNote}</p>}
    </div>
  );
}

export default function RightNow() {
  const minute = useSyncExternalStore<number | null>(subscribe, currentMinute, noClock);
  const [windowMin, setWindowMin] = useState(120);
  const [when, setWhen] = useState("now");
  const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  const preset = otherTimes.find(time => time.id === when);
  const date = !preset && minute !== null ? new Date(minute * 60_000) : null;
  const moment = preset ?? (date ? null : saturdayEvening);
  const weekday = date ? date.getDay() : moment!.weekday;
  const nowMin = date ? date.getHours() * 60 + date.getMinutes() : moment!.nowMin;

  const result = recommend(examplePlaces, weekday, nowMin, windowMin, page);
  const { picks, misses, fitCount } = result;
  const selected = picks.find(pick => pick.place.id === chosen) ?? picks[0];
  const shownBefore = result.page * 3;
  const remaining = fitCount - shownBefore - picks.length;
  const count = ["", "One", "Two", "Three"][picks.length];
  const heading = `${count}${shownBefore > 0 ? " more" : ""} that ${picks.length === 1 ? "fits" : "fit"}`;
  const moreLabel = remaining >= 3 ? "Show three others" : remaining === 2 ? "Show the other two" : remaining === 1 ? "Show the other one" : "Back to the first three";
  const missSummary = missReasons.map(([reason, label]) => [misses.filter(miss => miss.reason === reason).length, label] as const)
    .filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}`).join(", ");

  const restart = () => { setPage(0); setChosen(null); };

  return (
    <section className="try" id="try" aria-labelledby="try-title">
      <div className="wrap">
        <div className="try-intro">
          <h2 id="try-title">It starts with the time you have.</h2>
          <p className="lead">Most apps tell you what’s open. OutRN works out what you can get to, get into and enjoy before your time runs out. Try it with your own clock.</p>
        </div>

        <div className="try-controls">
          <p className="try-clock" aria-live="polite">
            It’s <strong>{formatClock(nowMin)}</strong> on {weekdays[weekday]}, and I’m free for
          </p>
          <div className="segmented" role="group" aria-label="How long you are free">
            {windows.map(option => (
              <button key={option.minutes} type="button" aria-pressed={windowMin === option.minutes} onClick={() => { setWindowMin(option.minutes); restart(); }}>{option.label}</button>
            ))}
          </div>
        </div>
        <div className="try-times" role="group" aria-label="The time to try">
          <span>Or see another time:</span>
          <button type="button" className="text-button" aria-pressed={when === "now"} onClick={() => { setWhen("now"); restart(); }}>Right now</button>
          {otherTimes.map(time => (
            <button key={time.id} type="button" className="text-button" aria-pressed={when === time.id} onClick={() => { setWhen(time.id); restart(); }}>{time.label}</button>
          ))}
        </div>

        <div className="board">
          {picks.length > 0 && <div className="board-head" aria-hidden="true">
            <span>{heading}</span><span>Getting there</span><span>Arrive</span><span>You’d have</span><span />
          </div>}
          <ol className="board-rows" aria-label={heading}>
            {picks.map(pick => (
              <li key={pick.place.id}>
                <button type="button" className="board-row" aria-pressed={pick === selected} onClick={() => setChosen(pick.place.id)}>
                  <span className="row-name">
                    <strong>{pick.place.name}</strong>
                    <span className="row-why">{pick.why}</span>
                    <span className="row-kind">{pick.place.kind}, {pick.place.price.charAt(0).toLowerCase() + pick.place.price.slice(1)}</span>
                  </span>
                  <span className="row-fact"><span className="row-label">Travel</span>{travelLabel(pick.place)}</span>
                  <span className="row-fact"><span className="row-label">Arrive</span>{formatClock(pick.arrive)}</span>
                  <span className="row-fact"><span className="row-label">You’d have</span>{formatDuration(pick.useful)}</span>
                  <span className={pick.place.status === "go" ? "row-status is-go" : "row-status"}>{pick.place.status === "go" ? "Go now" : "Check first"}</span>
                </button>
              </li>
            ))}
          </ol>

          {picks.length === 0 && <div className="board-empty">
            <span>None of the {examplePlaces.length} example places fits at {formatClock(nowMin)}. OutRN would tell you that too, instead of sending you to a locked door.</span>
            <button type="button" className="button button-small" onClick={() => { setWhen("fri-night"); restart(); }}>Try Friday at 9 PM</button>
          </div>}
          {fitCount > 0 && fitCount < 3 && <p className="board-note">
            <span>Only {fitCount === 1 ? "one place fits" : "two places fit"} right now, so that’s what you see. OutRN doesn’t pad the list.</span>
          </p>}

          <div className="board-foot">
            {fitCount > 3 && <p className="board-more">
              <button type="button" className="button button-small button-outline" onClick={() => { setPage(result.page + 1); setChosen(null); }}>{moreLabel}</button>
              <span>{fitCount} of the {examplePlaces.length} example places fit {formatDuration(windowMin)} from {formatClock(nowMin)}.</span>
            </p>}
            {misses.length > 0 && <details>
              <summary>{misses.length} didn’t make it{missSummary ? `: ${missSummary}` : ""}</summary>
              <ul>{misses.map(miss => <li key={miss.place.id}><span>{miss.place.name}</span><span>{miss.detail}</span></li>)}</ul>
            </details>}
            <p>{date ? "Example places, not live listings. The times are worked out from your clock." : `Example places, not live listings, shown for ${moment!.label}.`}</p>
          </div>
        </div>

        {selected && <Timeline fit={selected} nowMin={nowMin} windowMin={windowMin} />}
      </div>
    </section>
  );
}
