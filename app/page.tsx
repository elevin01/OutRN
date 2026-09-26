"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import WaitlistForm from "./waitlist-form";
import CardArtwork from "./card-artwork";

const daytimeImage = `${import.meta.env.BASE_URL}public/images/city-afternoon.webp`;
const picks = [
  {
    image: `${import.meta.env.BASE_URL}public/images/jazz-film.webp`, name: "Jazz", title: "JAZZ DOWNSTAIRS.", walk: "8 min walk", category: "LIVE MUSIC", type: "music",
    facts: [{ label: "Next set", value: "8:30 pm" }, { label: "At the door", value: "Walk right in" }, { label: "Crowd", value: "Lively, room to sit" }, { label: "Parking", value: "Garage 2 blocks away" }],
    note: "You can sit close to the band. Gets loud, in a good way.", priceLabel: "Entry", price: "$15 at the door",
  },
  {
    image: `${import.meta.env.BASE_URL}public/images/gallery-film.webp`, name: "Art", title: "THE GALLERY’S STILL OPEN.", walk: "12 min walk", category: "POP-UP SHOW", type: "art",
    facts: [{ label: "Open until", value: "10 pm" }, { label: "On the walls", value: "Prints + photography" }, { label: "Crowd", value: "Easy to wander" }, { label: "Parking", value: "Metered street parking" }],
    note: "Tiny place, lots to look at. Don’t miss the prints at the back.", priceLabel: "Entry", price: "Free",
  },
  {
    image: `${import.meta.env.BASE_URL}public/images/dinner-film.webp`, name: "Food", title: "TWO SEATS AT THE BAR.", walk: "5 min walk", category: "LATE DINNER", type: "food",
    facts: [{ label: "Kitchen until", value: "11 pm" }, { label: "Seats", value: "Two at the counter" }, { label: "Crowd", value: "Busy, short wait" }, { label: "Parking", value: "Street parking is limited" }],
    note: "The chilli noodles are the reason to come. Grab a counter seat.", priceLabel: "Food", price: "Plates from $12",
  },
  {
    image: `${import.meta.env.BASE_URL}public/images/waterfront-film.webp`, name: "Outside", title: "CATCH THE LAST LIGHT.", walk: "10 min walk", category: "BY THE WATER", type: "outside",
    facts: [{ label: "The plan", value: "A walk by the water" }, { label: "Bring", value: "A layer for the breeze" }, { label: "Crowd", value: "Plenty of space" }, { label: "Parking", value: "Public lot nearby" }],
    note: "Keep walking past the first benches. The view opens up around the bend.", priceLabel: "Entry", price: "Free",
  },
];

function RightNow() {
  return <span className="right-now"><span className="rn-initial">R</span>ight <span className="rn-initial">N</span>ow</span>;
}

export default function Home() {
  const [active, setActive] = useState(0);
  const [autoplayStopped, setAutoplayStopped] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const motionOff = paused || reduced;
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  function selectPick(index: number) {
    setActive((index + picks.length) % picks.length);
    setAutoplayStopped(true);
    if (document.activeElement?.classList.contains("card-hit-area")) {
      requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('.outing-card[data-position="0"] .card-hit-area')?.focus({preventScroll:true}));
    }
  }
  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true;
      selectPick(active + (dx < 0 ? 1 : -1));
    }
  }

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (motionOff || interacting || autoplayStopped) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActive(n => (n + 1) % picks.length);
      }
    }, 7500);
    return () => window.clearInterval(timer);
  }, [motionOff, interacting, autoplayStopped]);
  useEffect(() => {
    const element = root.current;
    if (!element || motionOff) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      element.style.setProperty("--scroll", String(Math.min(1, Math.max(0, window.scrollY / window.innerHeight))));
      const photo = element.querySelector(".street");
      if (photo) {
        const rect = photo.getBoundingClientRect();
        const amount = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight));
        element.style.setProperty("--photo-shift", `${amount * -45}px`);
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const reveals = element.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in-view"); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    reveals.forEach(node => observer.observe(node));
    element.classList.add("motion-ready");
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); observer.disconnect(); element.classList.remove("motion-ready"); };
  }, [motionOff]);
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (motionOff || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--rx", `${((event.clientY - rect.top) / rect.height - .5) * -8}deg`);
    event.currentTarget.style.setProperty("--ry", `${((event.clientX - rect.left) / rect.width - .5) * 10}deg`);
  }
  function resetTilt() { stage.current?.style.setProperty("--rx", "0deg"); stage.current?.style.setProperty("--ry", "0deg"); setInteracting(false); }

  return <main ref={root} className={motionOff ? "motion-off" : ""}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="nav"><a className="wordmark" href="#" aria-label="OutRN home">OUT<span>RN</span></a><span className="nav-note">TRY GOING OUT <RightNow/>.</span><a className="nav-link" href="#waitlist">Join the waitlist</a></header>
    <section className="hero" id="main-content">
      <div className="hero-backdrop" aria-hidden="true">
        {picks.map((item, index) => <img key={item.name} src={item.image} alt="" className={active === index ? "scene-visible" : ""} fetchPriority={index === 0 ? "high" : "low"} loading={index === 0 ? "eager" : "lazy"} decoding="async"/>)}
        <div className="hero-shade"/>
      </div>
      <div className="hero-copy">
        <p className="eyebrow intro-enter">THE APP FOR FINDING THINGS TO DO.</p>
        <h1 aria-label="Got free time? Try going out Right Now."><span className="hero-question">GOT FREE TIME?</span><span className="hero-answer"><span>TRY GOING</span><span>OUT <RightNow/></span></span></h1>
        <div className="hero-bottom intro-enter">
          <p>At least three things worth going out for.<br/>Curated for you. Nearby. Ready right now.</p>
          <div className="cta-row"><a className="button" href="#waitlist">Join the waitlist</a><span className="free-note">OutRN is free. Always.</span></div>
          <span className="launch-note">Coming soon. One neighborhood at a time.</span>

        </div>
      </div>
      <div className="discovery intro-enter" ref={stage} onKeyDown={event=>{if(event.key === "ArrowRight" || event.key === "ArrowLeft"){event.preventDefault();selectPick(active + (event.key === "ArrowRight" ? 1 : -1));}}} onPointerMove={tilt} onPointerEnter={()=>setInteracting(true)} onPointerLeave={resetTilt} onFocusCapture={()=>setInteracting(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setInteracting(false);}}>
        <div className="orbit-field" aria-hidden="true"><div className="orbit-ring ring-a"/><div className="orbit-ring ring-b"/><div className="orbit-line"/><div className="orbit-sweep"/><div className="orbit-track"><i/></div><div className="orbit-track track-two"><i/></div></div>
        <div className="discovery-top"><span className="micro">TAP A CARD. FIND YOUR THING.</span><span className="micro">0{active+1} / 0{picks.length}</span></div>
        <div className="card-deck" aria-label="Example nearby outings" onPointerDown={event=>{pointerStart.current={x:event.clientX,y:event.clientY};swiped.current=false;}} onPointerUp={finishSwipe} onPointerCancel={()=>{pointerStart.current=null;}} onClickCapture={event=>{if(swiped.current){event.preventDefault();event.stopPropagation();swiped.current=false;}}}>
          {picks.map((pick,index)=><article key={pick.name} className={`outing-card ${pick.type}`} data-position={(index-active+picks.length)%picks.length} aria-hidden={index!==active}>
            <button className="card-hit-area" tabIndex={index===active ? 0 : -1} aria-label={index===active ? `Next outing after ${pick.name}` : `Show ${pick.name} outing`} onClick={()=>selectPick(index===active ? active+1 : index)}/>
            <div className="card-top"><span className="card-category">{pick.category}</span><span className="card-walk"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 14s5-4.5 5-8A5 5 0 003 6c0 3.5 5 8 5 8Z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.3"/></svg>{pick.walk}</span></div>
            <CardArtwork type={pick.type}/>
            <div className="card-content">
              <div className="pick-index"><span>OUTRN PICKS</span><span>0{index + 1}</span></div>
              <h2>{pick.title}</h2>
              <dl className="card-facts">{pick.facts.map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
              <p className="local-note"><span>WORTH KNOWING</span>{pick.note}</p>
              <div className="card-price"><span><span className="price-label">{pick.priceLabel}</span><strong>{pick.price}</strong></span><span className="directions-preview">Next pick <span className="next-pick-arrow" aria-hidden="true">↗</span></span></div>
            </div>
          </article>)}
        </div>
        <div className="discovery-bottom"><div className="pick-controls" role="group" aria-label="Choose an example outing">{picks.map((pick,index)=><button key={pick.name} className={index===active ? "active" : ""} onClick={()=>selectPick(index)} aria-pressed={index===active}>{pick.name}</button>)}</div><span className="micro example-label">SWIPE OR TAP</span></div>
      <p className="example-disclaimer">Example picks. Crowd and parking info shown for illustration.</p></div>
      <div className="hero-foot"><a href="#the-idea">Out the door in 3 clicks.</a><button className="motion-control" onClick={()=>{if(paused || autoplayStopped){setPaused(false);setAutoplayStopped(false);}else{setPaused(true);}}} aria-pressed={paused || autoplayStopped}>{paused || autoplayStopped ? "Play motion" : "Pause motion"}</button></div>
    </section>
    <section className="the-idea" id="the-idea">
      <div className="idea-layout">
        <div className="idea-story reveal">
          <p className="eyebrow">LESS SEARCHING. MORE GOING.</p>
          <h2>Don’t spend all your free time finding plans.</h2>
          <p className="idea-summary">Open OutRN for at least three things to do nearby, curated for you and ready right now.</p>
          <p className="idea-invitation">Try going out <RightNow/>.</p>
          <a className="button" href="#waitlist">Join the waitlist</a>
        </div>
        <figure className="street reveal">
          <img className="street-image" src={daytimeImage} alt="People crossing a sunlit street toward a café and gallery" loading="lazy"/>
          <div className="street-shade"/>
          <figcaption>Nothing planned?<br/>Your perfect day is a click away.</figcaption>
        </figure>
      </div>
      <div className="plan-journey reveal">
        <div className="journey-heading"><h3>Out the door in 3 easy clicks.</h3><p>Got a budget or a time limit? Add it if you want.</p></div>
        <ol className="journey-steps">
          <li><span className="step-number" aria-hidden="true">01</span><div><h4>Open OutRN.</h4><p>Your picks are already waiting.</p></div></li>
          <li><span className="step-number" aria-hidden="true">02</span><div><h4>Pick your plan.</h4><p>See the vibe, the cost, and the walk.</p></div></li>
          <li><span className="step-number" aria-hidden="true">03</span><div><h4>Get directions.</h4><p>Phone away. You’re on your way.</p></div></li>
        </ol>
      </div>
    </section>
    <section className="waitlist" id="waitlist"><div className="waitlist-copy reveal"><p className="eyebrow">YOUR NEXT GOOD PLAN STARTS HERE.</p><h2>Try OutRN.</h2><p>Join the waitlist. We’ll let you know when you can try OutRN near you.</p><p className="waitlist-free">Free to use. Now and always.</p></div><div className="signup-panel reveal"><WaitlistForm/></div></section>
    <footer><a className="wordmark" href="#" aria-label="Back to top">OUT<span>RN</span></a><p>Got free time? Try going out <RightNow/>.</p><span className="micro">© {new Date().getFullYear()} OUT RN</span></footer>
  </main>;
}
