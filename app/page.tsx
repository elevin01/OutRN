"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import WaitlistForm from "./waitlist-form";

const daytimeImage = `${import.meta.env.BASE_URL}public/images/city-afternoon.webp`;
const picks = [
  {
    image: `${import.meta.env.BASE_URL}public/images/jazz-film.webp`, name: "Jazz", title: ["JAZZ", "DOWNSTAIRS."], walk: "8 min walk", category: "LIVE MUSIC", type: "music",
    facts: [{ label: "Next set", value: "8:30 pm" }, { label: "At the door", value: "Walk right in" }],
    note: "You can sit close to the band. Gets loud, in a good way.", priceLabel: "Entry", price: "$15 at the door",
  },
  {
    image: `${import.meta.env.BASE_URL}public/images/gallery-film.webp`, name: "Art", title: ["THE GALLERY’S", "STILL OPEN."], walk: "12 min walk", category: "POP-UP SHOW", type: "art",
    facts: [{ label: "Open until", value: "10 pm" }, { label: "On the walls", value: "Prints + photography" }],
    note: "Tiny place, lots to look at. Don’t miss the prints at the back.", priceLabel: "Entry", price: "Free",
  },
  {
    image: `${import.meta.env.BASE_URL}public/images/dinner-film.webp`, name: "Food", title: ["TWO SEATS", "AT THE BAR."], walk: "5 min walk", category: "LATE DINNER", type: "food",
    facts: [{ label: "Kitchen until", value: "11 pm" }, { label: "Seats", value: "Two at the counter" }],
    note: "The chilli noodles are the reason to come. Grab a counter seat.", priceLabel: "Food", price: "Plates from $12",
  },
  {
    image: `${import.meta.env.BASE_URL}public/images/waterfront-film.webp`, name: "Outside", title: ["CATCH THE", "LAST LIGHT."], walk: "10 min walk", category: "BY THE WATER", type: "outside",
    facts: [{ label: "The plan", value: "A walk by the water" }, { label: "Bring", value: "A layer for the breeze" }],
    note: "Keep walking past the first benches. The view opens up around the bend.", priceLabel: "Entry", price: "Free",
  },
];

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
    <header className="nav"><a className="wordmark" href="#" aria-label="OutRN home">OUT<span>RN</span></a><span className="nav-note">TRY GOING OUT (rn).</span><a className="nav-link" href="#waitlist">Join the waitlist</a></header>
    <section className="hero" id="main-content">
      <div className="hero-backdrop" aria-hidden="true">
        {picks.map((item, index) => <img key={item.name} src={item.image} alt="" className={active === index ? "scene-visible" : ""} fetchPriority={index === 0 ? "high" : "low"} loading={index === 0 ? "eager" : "lazy"} decoding="async"/>)}
        <div className="hero-shade"/>
      </div>
      <div className="hero-copy">
        <p className="eyebrow intro-enter">THE APP FOR FINDING THINGS TO DO.</p>
        <h1 aria-label="Got free time? Try going out (rn)."><span className="hero-question">GOT FREE TIME?</span><span className="hero-answer"><span>TRY GOING</span><span>OUT <span className="rn-aside">(rn)</span></span></span></h1>
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
            <div className="card-top"><span className="micro">{pick.walk}</span><span className="micro">{pick.category}</span></div>
            {pick.type === "music" && <div className="jazz-poster" aria-hidden="true"><div className="record"><i/></div><div className="gig-type"><span>LIVE / TONIGHT</span><strong>ONE<br/>MORE SET.</strong></div></div>}
            {pick.type === "art" && <div className="gallery-print" aria-hidden="true"><i/><i/><i/><span>AFTER HOURS / EXHIBITION 03</span></div>}
            {pick.type === "food" && <div className="dinner-slip" aria-hidden="true"><span>WALK-INS WELCOME</span><strong>ORDER SOMETHING GOOD.</strong><span>THE KITCHEN’S STILL ON.</span></div>}
            {pick.type === "outside" && <div className="sunset-poster" aria-hidden="true"><i/><span>TAKE THE LONG WAY.</span></div>}
            <div className="card-content">
              <h2>{pick.title.map(line=><span key={line}>{line}</span>)}</h2>
              <dl className="card-facts">{pick.facts.map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
              <p className="local-note"><span>LOCAL TAKE</span>{pick.note}</p>
              <div className="card-price"><span><span className="price-label">{pick.priceLabel}</span><strong>{pick.price}</strong></span><span className="directions-preview">Next idea <span aria-hidden="true">↗</span></span></div>
            </div>
          </article>)}
        </div>
        <div className="discovery-bottom"><div className="pick-controls" role="group" aria-label="Choose an example outing">{picks.map((pick,index)=><button key={pick.name} className={index===active ? "active" : ""} onClick={()=>selectPick(index)} aria-pressed={index===active}>{pick.name}</button>)}</div><span className="micro example-label">SWIPE OR TAP</span></div>
      <p className="example-disclaimer">Illustrative picks. Your app picks will be personal.</p></div>
      <div className="hero-foot"><a href="#the-idea">Out the door in 3 clicks.</a><button className="motion-control" onClick={()=>{if(paused || autoplayStopped){setPaused(false);setAutoplayStopped(false);}else{setPaused(true);}}} aria-pressed={paused || autoplayStopped}>{paused || autoplayStopped ? "Play motion" : "Pause motion"}</button></div>
    </section>
    <section className="the-idea" id="the-idea">
      <div className="idea-intro reveal"><p className="eyebrow">FROM “WHAT SHOULD I DO?” TO OUT THE DOOR.</p><div className="idea-explanation"><p>Find the one worth your time.<br/><strong>Get out the door in 3 easy clicks.</strong></p><p className="three-clicks">Open OutRN. Pick your plan. Get directions.</p><p className="optional-filters">Got a budget or a time limit? Add it if you want.</p></div></div>
      <div className="street"><img className="street-image" src={daytimeImage} alt="People crossing a sunlit street toward a café and gallery" loading="lazy"/><div className="street-shade"/><div className="street-story reveal"><p className="street-setup">Don’t spend all your free time finding plans.</p><h2 className="street-invitation" aria-label="Try going out (rn)."><span>TRY GOING </span><span>OUT <span className="rn-aside">(rn)</span></span></h2></div><div className="street-bottom"><p>Try OutRN.<br/>A few good options. One worth stepping out for.</p><a className="button" href="#waitlist">Join the waitlist</a></div></div>
    </section>
    <section className="waitlist" id="waitlist"><div className="waitlist-copy reveal"><p className="eyebrow">YOUR NEXT GOOD PLAN STARTS HERE.</p><h2><span>TRY</span> OUTRN.</h2><p>Join the waitlist. We’ll let you know when you can try OutRN near you.</p></div><div className="signup-panel reveal"><WaitlistForm/></div></section>
    <footer><a className="wordmark" href="#" aria-label="Back to top">OUT<span>RN</span></a><p>Got free time? Try going out (rn).</p><span className="micro">© {new Date().getFullYear()} OUT RN</span></footer>
  </main>;
}
