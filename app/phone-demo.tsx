"use client";

import { useState } from "react";

const image = (name: string) => `${import.meta.env.BASE_URL}public/images/${name}.webp`;

// Example screens laid out the way the OutRN app shows a pick: the photo, what
// it is and what it costs, then the three facts that decide whether to go.
const screens = [
  { id: "jazz", photo: image("phone-jazz"), kind: "Live music", price: "$15 at the door", title: "Jazz in the basement", closes: "Closes 1:00 AM", walk: "~8 min walk" },
  { id: "dinner", photo: image("phone-dinner"), kind: "Late dinner", price: "Plates from $12", title: "Chilli noodles at the counter", closes: "Kitchen until 11:00 PM", walk: "~5 min walk" },
  { id: "waterfront", photo: image("phone-waterfront"), kind: "Outdoors", price: "Free", title: "The waterfront path", closes: "Open until 10:00 PM", walk: "~10 min walk" },
  { id: "gallery", photo: image("phone-gallery"), kind: "Gallery", price: "Free", title: "Prints at the corner gallery", closes: "Open until 10:00 PM", walk: "~12 min walk" },
];

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function PhoneDemo() {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [mapsNote, setMapsNote] = useState(false);
  const current = screens[index];
  const isSaved = saved.includes(current.id);

  return (
    <figure className="phone-figure">
      <div className="phone" role="group" aria-label="Example of a pick in the OutRN app">
        <div className="phone-screen">
          {screens.map((screen, i) => (
            <img key={screen.id} className={i === index ? "phone-photo is-current" : "phone-photo"} src={screen.photo} alt="" width={480} height={960}
              loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "low"} decoding="async" />
          ))}
          <div className="phone-shade" aria-hidden="true" />
          <div className="phone-top" aria-hidden="true">
            <span className="phone-brand">OutRN</span>
            <span>Near you</span>
          </div>
          <div className="phone-body" aria-live="polite">
            <div className="phone-progress" aria-hidden="true">
              {screens.map((screen, i) => <i key={screen.id} className={i === index ? "is-current" : ""} />)}
            </div>
            <div className="phone-pick" key={current.id}>
              <p className="phone-kind"><span>{current.kind}</span><span>{current.price}</span></p>
              <p className="phone-title">{current.title}</p>
              <ul className="phone-facts">
                <li className="is-go">Go now</li>
                <li>{current.closes}</li>
                <li>{current.walk}</li>
              </ul>
            </div>
          </div>
          <div className="phone-rail">
            <button type="button" aria-pressed={isSaved} onClick={() => setSaved(list => isSaved ? list.filter(id => id !== current.id) : [...list, current.id])}>
              <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} fill={isSaved ? "currentColor" : "none"}><path d="M6 4h12v17l-6-4.5L6 21Z" /></svg>
              {isSaved ? "Saved" : "Save"}
            </button>
            <button type="button" aria-expanded={mapsNote} onClick={() => setMapsNote(open => !open)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}><path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5Z" /></svg>
              Maps
            </button>
            <button type="button" onClick={() => { setIndex(n => (n + 1) % screens.length); setMapsNote(false); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              Next
            </button>
          </div>
          {mapsNote && <p className="phone-note" role="status">In the app, this opens directions in your maps app.</p>}
          <div className="phone-tabs" aria-hidden="true">
            <span className="is-current"><svg viewBox="0 0 24 24" {...stroke}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>Now</span>
            <span><svg viewBox="0 0 24 24" {...stroke}><path d="M6 4h12v17l-6-4.5L6 21Z" /></svg>Saved</span>
            <span><svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" /></svg>You</span>
          </div>
        </div>
      </div>
      <figcaption>Example picks with illustrative photos. Tap Next to see another.</figcaption>
    </figure>
  );
}
