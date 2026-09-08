"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, ValidationError } from "@formspree/react";
import { ArrowUpRight, ArrowDown, Navigation, Check, Pause, Play } from "lucide-react";
import siteConfig from "../web/site-config.json";

const cityImage = `${import.meta.env.BASE_URL}public/images/city-night.jpg`;
const formId = new URL(siteConfig.waitlistEndpoint).pathname.split("/").pop()!;
const picks = [
  { title: "There’s jazz downstairs.", label: "Something loud", category: "LIVE MUSIC", time: "8 min walk", cost: "$15 at the door", note: "Small room. Live band. You can just walk in.", aside: "Stay for one song. Or five." },
  { title: "The gallery’s still open.", label: "Something different", category: "ART & OTHER THINGS", time: "12 min walk", cost: "Free", note: "A pop-up show, a few new faces, no ticket needed.", aside: "You don’t have to know about art." },
  { title: "Two seats at the counter.", label: "Something to eat", category: "FOOD & DRINK", time: "5 min walk", cost: "Around $20", note: "Dinner without the group chat or the reservation.", aside: "Going alone counts, by the way." },
];

function WaitlistForm() {
  const [state, handleSubmit] = useForm(formId);
  const [networkError, setNetworkError] = useState("");
  const [sending, setSending] = useState(false);
  const submitLock = useRef(false);
  const successTitle = useRef<HTMLHeadingElement>(null);
  const busy = state.submitting || sending;
  useEffect(() => { if (state.succeeded) successTitle.current?.focus(); }, [state.succeeded]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setSending(true);
    setNetworkError("");
    try { await handleSubmit(event); }
    catch { setNetworkError("That didn’t go through. Your details are still here — give it another try."); }
    finally { submitLock.current = false; setSending(false); }
  }
  if (state.succeeded) return <div className="success" role="status"><span className="success-check"><Check size={30}/></span><h3 ref={successTitle} tabIndex={-1}>You’re on the list.</h3><p>We’ll email you when we’re ready in your neighborhood.</p><p className="handwritten">Now go do something with the rest of your day.</p></div>;
  return <form action={siteConfig.waitlistEndpoint} method="POST" onSubmit={submit} aria-busy={busy}>
    <h3>Where should we start?</h3>
    <p className="form-intro">Your neighborhood helps us figure that out.</p>
    <label htmlFor="email">Your email</label>
    <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required readOnly={busy} aria-invalid={!!state.errors?.getFieldErrors("email").length} aria-describedby="email-error"/>
    <ValidationError id="email-error" field="email" prefix="Email" errors={state.errors} className="form-error"/>
    <label htmlFor="neighborhood">Your neighborhood or city</label>
    <input id="neighborhood" name="neighborhood" autoComplete="address-level2" placeholder="e.g. Lower East Side, NYC" maxLength={120} minLength={2} required pattern=".*\S.*" readOnly={busy} aria-invalid={!!state.errors?.getFieldErrors("neighborhood").length} aria-describedby="neighborhood-error"/>
    <ValidationError id="neighborhood-error" field="neighborhood" prefix="Neighborhood" errors={state.errors} className="form-error"/>
    <input type="hidden" name="_subject" value="OutRN — early access signup"/>
    <input type="hidden" name="source" value="OutRN GitHub Pages waitlist"/>
    <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="_gotcha" tabIndex={-1} autoComplete="off"/></div>
    <button className="button" disabled={busy} type="submit">{busy ? "Putting you on the list…" : "Give me a shout."}<ArrowUpRight size={22}/></button>
    <div aria-live="polite"><ValidationError errors={state.errors} className="form-error"/>{networkError && <p className="form-error" role="alert">{networkError}</p>}</div>
    <p className="privacy-note">By joining, you agree to get OutRN launch updates by email. Your email and neighborhood are stored through Formspree. Reply to an update to leave the list.</p>
  </form>;
}

export default function Home() {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  const pick = picks[active];
  return (
    <main className={paused ? "motion-paused" : ""}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="nav">
        <a className="wordmark" href="#" aria-label="OutRN home">OUT<span>RN</span></a>
        <nav aria-label="Main navigation"><a className="nav-story" href="#how-it-works">What is this?</a><a className="nav-cta" href="#waitlist">Put me on the list <ArrowUpRight size={17}/></a></nav>
      </header>
      <section className="hero" id="main-content">
        <div className="hero-copy">
          <p className="eyebrow"><span className="signal-dot"/> PLANS FELL THROUGH? GOOD.</p>
          <h1>GO LIVE<br/>A <span>LITTLE.</span></h1>
          <p className="hero-description">You finished early. Your friend bailed. You’ve got a few hours and no idea what to do with them.</p>
          <p className="hero-description product-description">OutRN gives you a few good things nearby, checked by locals, that you can go do <em>now.</em></p>
          <a className="button" href="#waitlist">Okay, I’m in. <ArrowUpRight size={24}/></a>
          <p className="hero-note">We’re building it. Get a heads-up when we’re in your neighborhood.</p>
        </div>
        <div className="radar-scene" aria-label="Animated preview of nearby picks. These are examples, not live listings.">
          <div className="radar-top micro">A FEW BLOCKS FROM YOU</div>
          <div className="radar-grid" aria-hidden="true"><div className="radar-disc"><div className="sweep"/><div className="ring ring-one"/><div className="ring ring-two"/><div className="ring ring-three"/><div className="axis horizontal"/><div className="axis vertical"/><div className="orbit"><span/></div><div className="you"><Navigation size={22} fill="currentColor"/></div><span className="you-label">YOU, STILL ON THE COUCH</span><span className="radar-point p1"/><span className="radar-point p2"/></div></div>
          <div className="float-card card-one"><div className="card-thumb"><img src={cityImage} alt="An illustration of friends outside a neighborhood music venue"/></div><div className="card-body"><div className="micro lime">LIVE MUSIC · 8 MIN WALK</div><strong>There’s jazz downstairs.</strong><div className="card-meta"><span>$15 at the door. Walk right in.</span></div></div></div>
          <div className="float-card card-two"><div><div className="micro">12 MIN WALK · FREE</div><strong>The gallery’s still open.</strong><p>No, you don’t need a ticket.</p></div></div>
          <div className="radar-stamp"><span>TONIGHT’S PLAN</span><strong>WHY<br/>NOT?</strong></div>
          <span className="radar-note handwritten">could be a good night.</span>
          <div className="radar-bottom"><span className="micro">A PEEK AT THE IDEA. EXAMPLE PICKS.</span><button className="motion-toggle" onClick={()=>setPaused(!paused)} aria-label={paused ? "Play animations" : "Pause animations"}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button></div>
        </div>
        <div className="hero-baseline"><span className="micro">FOR THE HOURS YOU DIDN’T PLAN.</span><a href="#how-it-works" className="micro">A LITTLE MORE ABOUT IT <ArrowDown size={15}/></a></div>
      </section>
      <div className="ticker" aria-hidden="true"><div>{Array.from({length:4},(_,i)=><span key={i}>“ONE MORE EPISODE” CAN WAIT <span className="ticker-divider"/> SHOES ON <span className="ticker-divider"/> WE’LL FIGURE IT OUT ON THE WAY <span className="ticker-divider"/></span>)}</div></div>
      <section className="section how" id="how-it-works">
        <div className="section-heading"><p className="eyebrow">YOU KNOW HOW THIS USUALLY GOES.</p><h2>“What do you<br/>want to do?”<br/><span>“I don’t know. You?”</span></h2><p className="handwritten margin-note">And there goes the evening.</p></div>
        <div className="how-story"><p>You open Maps. Someone sends a reel. The place in the reel closed six months ago. Eventually, you order in.</p><p>We’re making an app for the bit before that happens.</p><div className="steps"><article><span className="step-number">01</span><div><h3>Tell us how long you’ve got.</h3><p>An hour before dinner. A whole afternoon. We’ll work with it.</p></div></article><article><span className="step-number">02</span><div><h3>We’ll narrow it down.</h3><p>At least three things nearby. What it costs, how far it is, and whether you can walk in. All checked by people who are actually there.</p></div></article><article><span className="step-number">03</span><div><h3>Pick one. We’ll get out of your way.</h3><p>Tap for directions. Put your phone in your pocket. That’s it.</p></div></article></div></div>
      </section>
      <section className="section possibilities">
        <div className="night-photo"><img src={cityImage} alt="Illustration of friends talking outside a warmly lit music venue" loading="lazy"/><span className="photo-caption handwritten">The night you almost stayed in.</span></div>
        <div className="possibilities-copy"><p className="eyebrow">DOESN’T HAVE TO BE A BIG THING.</p><h2>A band you’ve<br/>never heard of.<br/><span>A place you’ve<br/>walked past.</span></h2><p>Something to do before the day gets away from you.</p><div className="pick-tabs" role="group" aria-label="Explore example outings">{picks.map((item,i)=><button key={item.category} onClick={()=>setActive(i)} aria-pressed={active===i} className={active===i ? "selected" : ""}>{item.label}</button>)}</div>
        <div className="outing-ticket" aria-live="polite"><span className="micro ticket-label">COULD LOOK SOMETHING LIKE THIS</span><div className="ticket-heading"><span className="micro">{pick.category}</span></div><h3>{pick.title}</h3><p>{pick.note}</p><div className="outing-chips"><span>{pick.time}</span><span>{pick.cost}</span></div><span className="ticket-example micro">EXAMPLE PICK</span></div><p className="handwritten pick-aside">{pick.aside}</p></div>
      </section>
      <section className="trust section"><div><p className="eyebrow">ONE THING WE’RE PARTICULAR ABOUT.</p><h2>“Open” doesn’t<br/>mean <span>worth going.</span></h2></div><div className="trust-copy"><p>Is there a line around the block? Did the band cancel? Is the kitchen still taking orders?</p><p>Local scouts will check the things a listing can’t tell you. And when a pick’s out of date, it comes off the list.</p><p className="trust-last">Because putting your shoes on for nothing is the worst.</p></div></section>
      <section className="waitlist section" id="waitlist"><div className="waitlist-copy"><p className="eyebrow">ALRIGHT. WANT IN?</p><h2>WE’LL<br/>GIVE YOU<br/>A <span>NUDGE.</span></h2><p>We’re starting one neighborhood at a time.<br/>Leave your email. We’ll tell you when yours is up.</p><p className="handwritten waitlist-note">Then we can all stop saying “we should go sometime.”</p></div><div className="signup-panel"><span className="micro signup-label">OUT RN / THE EARLY LIST</span><WaitlistForm/></div></section>
      <footer><a className="wordmark" href="#" aria-label="Back to top">OUT<span>RN</span></a><p>See you out there.</p><span className="micro">© {new Date().getFullYear()} OUT RN</span></footer>
    </main>
  );
}
