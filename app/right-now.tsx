"use client";

import { useState, useSyncExternalStore } from "react";
import { examplePlaces, formatClock, formatDuration, recommend, type Fit } from "./feasibility";

const windows = [{ minutes: 60, label: "1 hour" }, { minutes: 120, label: "2 hours" }, { minutes: 180, label: "3 hours" }];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// What the prerendered page shows, and what "Try Saturday at 8 PM" switches to.
const saturdayEvening = { weekday: 6, nowMin: 20 * 60 };

// The visitor's own clock, to the minute. The server has no clock to offer, so
// the prerendered page starts on the Saturday example and switches on load.
const subscribe = (onChange: () => void) => { const timer = window.setInterval(onChange, 15_000); return () => window.clearInterval(timer); };
const currentMinute = () => Math.floor(Date.now() / 60_000);
const noClock = () => null;

function Timeline({ fit, nowMin, windowMin }: { fit: Fit; nowMin: number; windowMin: number }) {
  const { place } = fit;
  const wait = fit.start - fit.arrive;
  const after = nowMin + windowMin - fit.end;
  const endLabel = fit.endsBy === "closing" ? "Closes" : "Time’s up";
  return (
    <div className="timeline-block">
      <h3>{place.name}, worked out</h3>
      <p className="timeline-summary">
        Leave now and walk {place.walkMin} minutes. {wait > 0 ? `It opens at ${formatClock(fit.start)}, and then ` : ""}
        {wait > 0 ? "you" : "You"}’d have {formatDuration(fit.useful)} there before {fit.endsBy === "closing" ? "it closes" : "your time is up"}.
      </p>
      <div className="timeline" aria-hidden="true">
        <div className="seg seg-walk" style={{ flexGrow: place.walkMin }}>
          <span className="seg-bar"><span>Walk</span></span>
          <span className="seg-tick"><b>{formatClock(nowMin)}</b>Leave</span>
        </div>
        {wait > 0 && <div className="seg seg-wait" style={{ flexGrow: wait }}>
          <span className="seg-bar"><span>Wait</span></span>
          <span className="seg-tick"><b>{formatClock(fit.arrive)}</b>Arrive</span>
        </div>}
        <div className="seg seg-there" style={{ flexGrow: fit.useful }}>
          <span className="seg-bar"><span>{formatDuration(fit.useful)} there</span></span>
          <span className="seg-tick"><b>{formatClock(fit.start)}</b>{wait > 0 ? "Opens" : "Arrive"}</span>
          <span className="seg-tick seg-tick-end"><b>{formatClock(fit.end)}</b>{endLabel}</span>
        </div>
        {after > 0 && <div className="seg seg-after" style={{ flexGrow: after }}>
          <span className="seg-bar" />
        </div>}
      </div>
      <dl className="checks">
        <div><dt>Can you get there?</dt><dd>{place.walkMin} minutes on foot</dd></div>
        <div><dt>Is it open when you arrive?</dt><dd>{wait > 0 ? `Opens at ${formatClock(fit.start)}` : `Open until ${formatClock(fit.closes)}`}<small>{place.hoursSource}</small></dd></div>
        <div><dt>Can you get in?</dt><dd>{place.admission}<small>{place.price}</small></dd></div>
        <div><dt>Is there enough time?</dt><dd>{formatDuration(fit.useful)} there<small>A visit here needs about {formatDuration(place.minStay)}</small></dd></div>
      </dl>
      {place.status === "check" && <p className="check-note"><strong>Check first:</strong> {place.checkNote}</p>}
    </div>
  );
}

export default function RightNow() {
  const minute = useSyncExternalStore<number | null>(subscribe, currentMinute, noClock);
  const [windowMin, setWindowMin] = useState(120);
  const [useExample, setUseExample] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  const live = minute !== null && !useExample;
  const date = live ? new Date(minute * 60_000) : null;
  const weekday = date ? date.getDay() : saturdayEvening.weekday;
  const nowMin = date ? date.getHours() * 60 + date.getMinutes() : saturdayEvening.nowMin;

  const { picks, misses, leftOver } = recommend(examplePlaces, weekday, nowMin, windowMin);
  const selected = picks.find(pick => pick.place.id === chosen) ?? picks[0];
  const closed = misses.filter(miss => miss.reason === "closed").length;
  const tooShort = misses.length - closed;

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
              <button key={option.minutes} type="button" aria-pressed={windowMin === option.minutes} onClick={() => setWindowMin(option.minutes)}>{option.label}</button>
            ))}
          </div>
        </div>

        <div className="board">
          {picks.length > 0 && <div className="board-head" aria-hidden="true">
            <span>{picks.length === 3 ? "Three that fit" : picks.length === 2 ? "Two that fit" : "One that fits"}</span><span>Walk</span><span>Arrive</span><span>Time there</span><span />
          </div>}
          <ol className="board-rows">
            {picks.map(pick => (
              <li key={pick.place.id}>
                <button type="button" className="board-row" aria-pressed={pick === selected} onClick={() => setChosen(pick.place.id)}>
                  <span className="row-name"><strong>{pick.place.name}</strong><span>{pick.place.kind}</span></span>
                  <span className="row-fact"><span className="row-label">Walk</span>{pick.place.walkMin} min</span>
                  <span className="row-fact"><span className="row-label">Arrive</span>{formatClock(pick.arrive)}</span>
                  <span className="row-fact"><span className="row-label">Time there</span>{formatDuration(pick.useful)}</span>
                  <span className={pick.place.status === "go" ? "row-status is-go" : "row-status"}>{pick.place.status === "go" ? "Go now" : "Check first"}</span>
                </button>
              </li>
            ))}
          </ol>

          {picks.length === 0 && <div className="board-empty">
            <span>Nothing in this example neighborhood fits at {formatClock(nowMin)}. OutRN would tell you that too, instead of sending you to a locked door.</span>
            {live && <button type="button" className="button button-small" onClick={() => setUseExample(true)}>Try Saturday at 8 PM</button>}
          </div>}
          {picks.length > 0 && picks.length < 3 && <p className="board-note">
            <span>Only {picks.length === 1 ? "one place fits" : "two places fit"} right now, so that’s what you see. OutRN doesn’t pad the list.</span>
          </p>}

          <div className="board-foot">
            {misses.length > 0 && <details>
              <summary>
                {misses.length} {misses.length === 1 ? "place" : "places"} nearby didn’t make it
                {closed > 0 && tooShort > 0 ? `: ${closed} closed, ${tooShort} without enough time` : ""}
              </summary>
              <ul>{misses.map(miss => <li key={miss.place.id}><span>{miss.place.name}</span><span>{miss.detail}</span></li>)}</ul>
            </details>}
            {leftOver > 0 && <p>{leftOver} more would fit as well. This demo stops at three.</p>}
            <p>
              {live ? "Example places, not live listings. The times are worked out from your clock." : "Example places, not live listings, shown for a Saturday at 8:00 PM."}{" "}
              {live && picks.length > 0 && picks.length < 3 && <button type="button" className="text-button" onClick={() => setUseExample(true)}>Try Saturday at 8 PM</button>}
              {useExample && <button type="button" className="text-button" onClick={() => setUseExample(false)}>Back to my time</button>}
            </p>
          </div>
        </div>

        {selected && <Timeline fit={selected} nowMin={nowMin} windowMin={windowMin} />}
      </div>
    </section>
  );
}
