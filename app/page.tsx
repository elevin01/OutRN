"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, ArrowDown, Navigation, Radio, Check, Music2, MapPin, Pause, Play, Sparkles } from "lucide-react";

import siteConfig from "../web/site-config.json";

const cityImage = `${import.meta.env.BASE_URL}public/images/city-night.jpg`;
const waitlistEndpoint = siteConfig.waitlistEndpoint;

const picks = [
  { title: "A little jazz. A late night.", category: "LIVE MUSIC", time: "8 MIN WALK", cost: "$15", icon: Music2, note: "Walk in. Stay for one more song.", className: "music" },
  { title: "Your next favorite corner.", category: "SOMETHING DIFFERENT", time: "12 MIN WALK", cost: "FREE", icon: Sparkles, note: "A small gallery with a big surprise.", className: "gallery" },
  { title: "Good food. Zero planning.", category: "FOOD & DRINK", time: "5 MIN WALK", cost: "$$", icon: MapPin, note: "The kind of place you tell a friend about.", className: "food" },
];

export default function Home() {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!waitlistEndpoint) return;
    const data = new FormData(event.currentTarget);
    setStatus("loading");
    try {
      const res = await fetch(waitlistEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Something went wrong. Please try again.");
      setStatus("success");
    } catch (e) { setStatus("error"); setMessage(e instanceof Error ? e.message : "Couldn’t save your spot. Please try again."); }
  }
  return (
    <main className={paused ? "motion-paused" : ""}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="nav">
        <a className="wordmark" href="#" aria-label="OutRN home">OUT<span>RN</span><i>↗</i></a>
        <nav aria-label="Main navigation"><a className="nav-story" href="#how-it-works">How it works</a><a className="nav-cta" href="#waitlist">Get early access <ArrowUpRight size={17}/></a></nav>
      </header>
      <section className="hero" id="main-content">
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot"/> YOUR FREE TIME HAS PLANS.</p>
          <h1>GO LIVE<br/>A <span>LITTLE.</span><sup>↗</sup></h1>
          <p className="hero-description">Free for a few hours? Get a short list of what’s actually worth doing nearby. Live, locally verified, and ready when you are.</p>
          <a className="button" href="#waitlist">I’m in. Let me out. <ArrowUpRight size={24}/></a>
          <p className="micro hero-note">Coming neighborhood by neighborhood. Be first in yours.</p>
        </div>
        <div className="radar-scene" aria-label="Animated illustration of nearby picks, for demonstration">
          <div className="radar-top micro"><Radio size={15}/> YOUR NEIGHBORHOOD, TUNED IN.</div>
          <div className="radar-grid" aria-hidden="true"><div className="radar-disc"><div className="sweep"/><div className="ring ring-one"/><div className="ring ring-two"/><div className="ring ring-three"/><div className="axis horizontal"/><div className="axis vertical"/><div className="orbit"><span/></div><div className="you"><Navigation size={22} fill="currentColor"/></div><span className="you-label">YOU ARE HERE</span><span className="radar-point p1"/><span className="radar-point p2"/></div></div>
          <div className="float-card card-one"><div className="card-thumb"><img src={cityImage} alt="Friends outside a warmly lit neighborhood music venue"/></div><div className="card-body"><div className="micro lime">LIVE MUSIC · 8 MIN</div><strong>Tonight has a soundtrack.</strong><div className="card-meta"><span>Walk-ins welcome</span><span className="go-icon"><ArrowUpRight size={18}/></span></div></div></div>
          <div className="float-card card-two"><span className="small-icon"><Sparkles size={22}/></span><div><div className="micro">AROUND THE CORNER</div><strong>A good kind of unexpected.</strong><p>Gallery pop-up · Free entry</p></div></div>
          <div className="radar-stamp"><span>LESS SCROLL.</span><strong>MORE<br/>STORIES.</strong><ArrowUpRight size={27}/></div>
          <div className="radar-bottom"><span className="micro">ILLUSTRATIVE PICKS / NOT LIVE LISTINGS</span><button className="motion-toggle" onClick={()=>setPaused(!paused)} aria-label={paused ? "Play animations" : "Pause animations"}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button></div>
        </div>
        <div className="hero-baseline"><span className="micro">SPONTANEITY, WITH A LITTLE HELP.</span><a href="#how-it-works" className="micro">STEP OUTSIDE <ArrowDown size={15}/></a></div>
      </section>
      <div className="ticker" aria-hidden="true"><div>{Array.from({length:4},(_,i)=><span key={i}>REAL PLACES <i>✳</i> RIGHT NOW <i>✳</i> NO ENDLESS FEED <i>✳</i> JUST GO <i>✳</i></span>)}</div></div>
      <section className="section how" id="how-it-works">
        <div className="section-heading"><p className="eyebrow">01 / FROM “WHAT NOW?” TO OUT RN.</p><h2>Good plans.<br/><span>Almost no planning.</span></h2><p>You don’t need another app to get lost in.<br/>You need a reason to put your phone away.</p></div>
        <div className="steps">{[{n:"01",title:"Find a little time.",text:"An early finish. A canceled plan. A Saturday with nothing on it. Tell us how much time you have."},{n:"02",title:"Get your short list.",text:"At least three nearby picks, checked by people on the ground. What’s on, what it costs, and whether you can walk in."},{n:"03",title:"Pick one. Get out.",text:"One tap for directions. Less comparing, more actually being there. Closing the app is the whole point."}].map(s=><article key={s.n}><span className="step-number">{s.n}</span><h3>{s.title}</h3><p>{s.text}</p></article>)}</div>
      </section>
      <section className="section possibilities">
        <div className="possibilities-copy"><p className="eyebrow">02 / THERE’S SOMETHING OUT THERE.</p><h2>Same city.<br/><span>Different night.</span></h2><p>Skip the “we should go sometime” collection. Find the little things that make right now worth leaving for.</p><div className="pick-tabs" role="group" aria-label="Explore example outings">{picks.map((pick,i)=><button key={pick.category} onClick={()=>setActive(i)} aria-pressed={active===i} className={active===i ? "selected" : ""}><pick.icon size={19}/>{pick.category}<ArrowUpRight size={19}/></button>)}</div><p className="micro demo-note">A TASTE OF OUT RN. EXAMPLE OUTINGS ONLY.</p></div>
        <div className={`outing-preview ${picks[active].className}`} aria-live="polite"><img src={cityImage} alt="Friends catching up on a city sidewalk outside a music venue"/><div className="photo-shade"/><div className="photo-top"><span className="photo-label">THE CITY IS BETTER IN PERSON.</span><span>↗</span></div><div className="outing-info"><div className="outing-chips"><span>{picks[active].time}</span><span>{picks[active].cost}</span></div><h3>{picks[active].title}</h3><p>{picks[active].note}</p></div></div>
      </section>
      <section className="trust section"><p className="eyebrow">03 / REAL PEOPLE. REAL-TIME PULSE.</p><h2>The city is the algorithm.</h2><div className="trust-row"><p>Local scouts keep their ears to the ground, so your picks don’t come from a list someone wrote three summers ago.</p><div><span><Check size={19}/> Checked by locals</span><span><Check size={19}/> Fresh, or off the list</span><span><Check size={19}/> Walk-in first</span></div></div></section>
      <section className="waitlist section" id="waitlist"><div><p className="eyebrow">YOUR NEXT “GLAD I WENT” STARTS HERE.</p><h2>BE FIRST.<br/>BE <span>OUT.</span></h2><p>We’re starting small, one neighborhood at a time.<br/>Tell us where you are. We’ll let you know when it’s your turn.</p></div><div className="signup-panel">{status === "success" ? <div className="success" role="status"><span className="success-check"><Check size={35}/></span><h3>You’re on the list.</h3><p>We’ll email you when OutRN is ready for your neighborhood. Until then, go live a little.</p></div> : <form onSubmit={join}><h3>{waitlistEndpoint ? "Get on the list." : "Early access is opening soon."}</h3>{!waitlistEndpoint && <p className="signup-availability" role="status">We’re getting the first neighborhoods ready. Email signups aren’t open yet — check back soon.</p>}<label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required disabled={!waitlistEndpoint || status==="loading"}/><label htmlFor="neighborhood">Your neighborhood / city</label><input id="neighborhood" name="neighborhood" autoComplete="address-level2" placeholder="e.g. Lower East Side, NYC" maxLength={120} minLength={2} required disabled={!waitlistEndpoint || status==="loading"}/><div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div><button className="button" disabled={!waitlistEndpoint || status==="loading"} type="submit">{!waitlistEndpoint ? "Signups opening soon" : status==="loading" ? "Saving your spot…" : "Let me know when it’s on."}<ArrowUpRight size={22}/></button>{status==="error" && <p role="alert" className="form-error">{message}</p>}{waitlistEndpoint && <p className="privacy-note">By joining, you agree to receive OutRN launch updates. We’ll store your email and neighborhood for that purpose. Unsubscribe anytime by replying to an update.</p>}</form>}</div></section>
      <footer><a className="wordmark" href="#">OUT<span>RN</span><i>↗</i></a><p>Less time deciding. More time living.</p><span className="micro">© {new Date().getFullYear()} OUT RN</span></footer>
    </main>
  );
}
