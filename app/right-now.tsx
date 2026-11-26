"use client";

import { useState, useSyncExternalStore } from "react";
import { examplePlaces, formatClock, formatDuration, recommend, travelLabel, type Fit, type Miss, type Plan } from "./feasibility";

const windows = [
  { minutes: 60, label: "1 hour", words: "an hour" }, { minutes: 120, label: "2 hours", words: "two hours" },
  { minutes: 180, label: "3 hours", words: "three hours" }, { minutes: 300, label: "5 hours", words: "five hours" },
];
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

const opening = (stop: Fit) => stop.endsBy === "show" ? `Starts at ${formatClock(stop.start)}` : stop.wait > 0 ? `Opens at ${formatClock(stop.start)}` : `Open until ${formatClock(stop.closes)}`;

function Worked({ plan, nowMin, windowMin }: { plan: Plan; nowMin: number; windowMin: number }) {
  const { stops, spare } = plan;
  const single = stops.length === 1 ? stops[0] : null;
  const deadline = nowMin + windowMin;
  const last = stops[stops.length - 1];
  const closedOut = last.endsBy === "closing" && spare > 0;

  let summary: string;
  if (single) {
    const journey = single.travelBy === "walk" ? `Leave now and walk ${single.travelMin} minutes.` : `Leave now and take the subway for ${single.travelMin} minutes.`;
    summary = single.endsBy === "show"
      ? `${journey} It starts at ${formatClock(single.start)} and runs ${formatDuration(single.useful)}, so you’d be out by ${formatClock(single.end)}.`
      : `${journey} ${single.wait > 0 ? `It opens at ${formatClock(single.start)}, and then you` : "You"}’d have ${formatDuration(single.useful)} there before ${single.endsBy === "closing" ? "it closes" : "your time is up"}.`;
  } else {
    summary = `Leave now. ${plan.why}${spare <= 0 ? `, which uses all of your ${formatDuration(windowMin)}.` : closedOut ? `, when the last stop closes.` : `, with ${formatDuration(spare)} in hand.`}`;
  }

  return (
    <div className="timeline-block">
      <h3>{single ? single.place.name : plan.title}, worked out</h3>
      <p className="timeline-summary">{summary}</p>
      <div className={single ? "timeline" : "timeline timeline-multi"} aria-hidden="true">
        {stops.map((stop, i) => {
          const isLast = i === stops.length - 1;
          const endLabel = !single ? "Done" : stop.endsBy === "show" ? "Ends" : stop.endsBy === "closing" && spare <= 0 ? "Closes" : spare <= 0 ? "Time’s up" : "Done";
          return [
            <div key={`${stop.place.id}-go`} className="seg seg-walk" style={{ flexGrow: stop.travelMin }}>
              <span className="seg-bar"><span>{single ? (stop.travelBy === "walk" ? "Walk" : "Subway") : `${stop.travelMin} min`}</span></span>
              {i === 0 && <span className="seg-tick"><b>{formatClock(nowMin)}</b>Leave</span>}
            </div>,
            stop.wait > 0 && <div key={`${stop.place.id}-wait`} className="seg seg-wait" style={{ flexGrow: stop.wait }}>
              <span className="seg-bar"><span>Wait</span></span>
              {single && <span className="seg-tick"><b>{formatClock(stop.arrive)}</b>Arrive</span>}
            </div>,
            <div key={stop.place.id} className={`seg seg-there ticket-${stop.place.group}`} style={{ flexGrow: stop.stay }}>
              <span className="seg-bar">{single
                ? <span>{stop.stay < stop.useful ? "About " : ""}{formatDuration(stop.stay)} there</span>
                : <><b>{i + 1}</b><span>{stop.place.kind}</span></>}</span>
              {(single || i > 0) && <span className={single || !isLast ? "seg-tick" : "seg-tick seg-tick-start"}><b>{formatClock(stop.start)}</b>{single ? (stop.endsBy === "show" ? "Starts" : stop.wait > 0 ? "Opens" : "Arrive") : ""}</span>}
              {isLast && <span className="seg-tick seg-tick-end"><b>{formatClock(stop.start + stop.stay)}</b>{endLabel}</span>}
            </div>,
          ];
        })}
        {spare > 0 && <div className="seg seg-after" style={{ flexGrow: spare }}>
          <span className="seg-bar"><span>{closedOut ? "Closed by then" : `${formatDuration(spare)} in hand`}</span></span>
          {spare >= windowMin / 6 && <span className="seg-tick seg-tick-end"><b>{formatClock(deadline)}</b>Time’s up</span>}
        </div>}
      </div>

      {single ? <dl className="checks">
        <div><dt>Can you get there?</dt><dd>{single.travelMin} minutes {single.travelBy === "walk" ? "on foot" : "by subway"}</dd></div>
        <div><dt>{single.endsBy === "show" ? "Does it start after you arrive?" : "Is it open when you arrive?"}</dt><dd>{opening(single)}<small>{single.place.hoursSource}</small></dd></div>
        <div><dt>Can you get in?</dt><dd>{single.place.admission}<small>{single.place.price}</small></dd></div>
        <div><dt>Is there enough time?</dt>
          <dd>{single.endsBy === "show" ? `Over by ${formatClock(single.end)}` : `${single.stay < single.useful ? "Up to " : ""}${formatDuration(single.useful)} there`}
            <small>{single.endsBy === "show" ? `It runs ${formatDuration(single.useful)}, and you’re free until ${formatClock(deadline)}` : `People usually spend about ${formatDuration(single.place.typical)}`}</small></dd></div>
      </dl> : <ol className="plan-stops">
        {stops.map((stop, i) => (
          <li key={stop.place.id}>
            <span className={`stop-num ticket-${stop.place.group}`}>{i + 1}</span>
            <div className="stop-when"><strong>{formatClock(stop.start)}</strong><small>{formatDuration(stop.stay)}</small></div>
            <div><strong>{stop.place.name}</strong><small>{stop.place.price}</small></div>
            <div>{travelLabel(stop)}<small>{i === 0 ? "from where you are" : `from stop ${i}`}{stop.wait > 0 ? `, then a ${stop.wait} min wait` : ""}</small></div>
            <div>{opening(stop)}<small>{stop.place.hoursSource}</small></div>
            <div>{stop.place.admission}</div>
          </li>
        ))}
      </ol>}
      {stops.filter(stop => stop.place.status === "check").map(stop => (
        <p className="check-note" key={stop.place.id}><strong>Check first:</strong> {stops.length > 1 ? `at ${stop.place.name.charAt(0).toLowerCase() + stop.place.name.slice(1)}, ` : ""}{stop.place.checkNote}</p>
      ))}
    </div>
  );
}

function Ticket({ plan, selected, onSelect }: { plan: Plan; selected: boolean; onSelect: () => void }) {
  const { stops } = plan;
  const first = stops[0];
  const single = stops.length === 1;
  return (
    <button type="button" className={`ticket ticket-${plan.lead.place.group}`} aria-pressed={selected} onClick={onSelect}>
      <span className="ticket-body">
        <span className="ticket-top">
          <span>{single ? first.place.kind : `${stops.length} stops`}</span>
          <span className={plan.status === "go" ? "stamp" : "stamp stamp-check"}>{plan.status === "go" ? "Go now" : "Check first"}</span>
        </span>
        <strong className="ticket-title">{single ? first.place.name : plan.title}</strong>
        {single ? <span className="ticket-why">{plan.why}.</span> : <span className="ticket-stops">
          {stops.map(stop => <span key={stop.place.id}><b>{formatClock(stop.start)}</b><span>{stop.place.name}</span></span>)}
        </span>}
        <span className="ticket-price">{single ? first.place.price : `${plan.why}.`}</span>
      </span>
      <span className="ticket-stub">
        <span><small>{first.travelBy === "walk" ? "Walk" : "Subway"}</small>{first.travelMin} min</span>
        <span><small>Arrive</small>{formatClock(first.arrive)}</span>
        {single ? <span><small>You’d have</small>{formatDuration(first.useful)}</span> : <span><small>Done by</small>{formatClock(plan.end)}</span>}
      </span>
    </button>
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
  const span = windows.find(option => option.minutes === windowMin)!;

  const result = recommend(examplePlaces, weekday, nowMin, windowMin, page);
  const { picks, misses, fitCount, planCount } = result;
  const selected = picks.find(pick => pick.id === chosen) ?? picks[0];
  const shownBefore = result.page * 3;
  const remaining = planCount - shownBefore - picks.length;
  const heading = `${["", "One", "Two", "Three"][picks.length]}${shownBefore > 0 ? " more" : ""} ${picks.length === 1 ? "way" : "ways"} to spend it`;
  const moreLabel = remaining >= 3 ? "Show three others" : remaining === 2 ? "Show the other two" : remaining === 1 ? "Show the other one" : "Back to the first three";
  const missSummary = missReasons.map(([reason, label]) => [misses.filter(miss => miss.reason === reason).length, label] as const)
    .filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}`).join(", ");

  const restart = () => { setPage(0); setChosen(null); };

  return (
    <section className="try" id="try" aria-labelledby="try-title">
      <div className="wrap">
        <h2 id="try-title" className="try-headline">
          It’s <span className="try-time">{formatClock(nowMin)}</span> on {weekdays[weekday]} and I’ve got{" "}
          <mark key={windowMin}>{span.words}</mark>.
        </h2>

        <div className="try-top">
          <div className="try-panel">
            <div className="segmented" role="group" aria-label="How long you are free">
              {windows.map(option => (
                <button key={option.minutes} type="button" aria-pressed={windowMin === option.minutes} onClick={() => { setWindowMin(option.minutes); restart(); }}>{option.label}</button>
              ))}
            </div>
            <div className="try-times" role="group" aria-label="The time to try">
              <span>Or see another time:</span>
              <button type="button" className="text-button" aria-pressed={when === "now"} onClick={() => { setWhen("now"); restart(); }}>Right now</button>
              {otherTimes.map(time => (
                <button key={time.id} type="button" className="text-button" aria-pressed={when === time.id} onClick={() => { setWhen(time.id); restart(); }}>{time.label}</button>
              ))}
            </div>
          </div>
          <p className="lead">OutRN starts with the time you have. An hour gets you one good stop nearby. Give it longer and it goes farther and strings stops together, so the time is used instead of left over.</p>
        </div>

        <div className="board">
          {picks.length > 0 && <div className="board-bar">
            <h3>{heading}</h3>
            <span className="stamp">Examples</span>
            <p>{fitCount} of {examplePlaces.length} places are in reach from {formatClock(nowMin)}.</p>
            {planCount > 3 && <button type="button" className="button button-small button-outline" onClick={() => { setPage(result.page + 1); setChosen(null); }}>{moreLabel}</button>}
          </div>}
          <ol className="tickets" aria-label={heading}>
            {picks.map(pick => <li key={pick.id}><Ticket plan={pick} selected={pick === selected} onSelect={() => setChosen(pick.id)} /></li>)}
          </ol>

          {picks.length === 0 && <div className="board-empty">
            {fitCount === 0
              ? <span>None of the {examplePlaces.length} example places fits at {formatClock(nowMin)}. OutRN would tell you that too, instead of sending you to a locked door.</span>
              : <span>Nothing open now would fill {span.words} from {formatClock(nowMin)}. A shorter stretch has more to offer.</span>}
            {fitCount === 0 && <button type="button" className="button" onClick={() => { setWhen("fri-night"); restart(); }}>Try Friday at 9 PM</button>}
          </div>}
          {planCount > 0 && planCount < 3 && <p className="board-note">
            <span>Only {planCount === 1 ? "one plan makes" : "two plans make"} good use of {span.words} from here, so that’s what you see. OutRN doesn’t pad the list.</span>
          </p>}

          <div className="board-foot">
            {misses.length > 0 && <details>
              <summary>{misses.length} places are out{missSummary ? `: ${missSummary}` : ""}</summary>
              <ul>{misses.map(miss => <li key={miss.place.id}><span>{miss.place.name}</span><span>{miss.detail}</span></li>)}</ul>
            </details>}
            <p>{date ? "These are invented example places, not live listings. The times are worked out from your clock." : `These are invented example places, not live listings, shown for ${moment!.label}.`}</p>
          </div>
        </div>

        {selected && <Worked plan={selected} nowMin={nowMin} windowMin={windowMin} />}
      </div>
    </section>
  );
}
