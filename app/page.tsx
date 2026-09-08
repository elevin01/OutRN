"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import WaitlistForm from "./waitlist-form";

const cityImage = `${import.meta.env.BASE_URL}public/images/city-night.jpg`;
const picks = [
  { name: "Jazz", title: ["JAZZ", "DOWNSTAIRS."], walk: "8 min walk", price: "$15 at the door", detail: "Live band. Room for a few more.", type: "music" },
  { name: "Art", title: ["THE GALLERY’S", "STILL OPEN."], walk: "12 min walk", price: "Free entry", detail: "A pop-up show around the corner.", type: "art" },
  { name: "Food", title: ["TWO SEATS", "AT THE BAR."], walk: "5 min walk", price: "Around $20", detail: "Walk in hungry. Stay a while.", type: "food" },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const motionOff = paused || reduced;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (motionOff || interacting) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(n => (n + 1) % picks.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [motionOff, interacting]);
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
    <header className="nav"><a className="wordmark" href="#" aria-label="OutRN home">OUT<span>RN</span></a><span className="nav-note">RIGHT NOW IS A GOOD TIME.</span><a className="nav-link" href="#waitlist">Join the waitlist</a></header>
    <section className="hero" id="main-content">
      <div className="hero-copy"><p className="eyebrow intro-enter">GOT A FEW HOURS?</p><h1 aria-label="Go out."><span className="type-line"><span>GO</span></span><span className="type-line"><span>OUT.</span></span></h1><div className="hero-bottom intro-enter"><p>Find something worth doing nearby.<br/>Right now.</p><a className="button" href="#waitlist">I’m in</a><span className="launch-note">Coming soon. One neighborhood at a time.</span></div></div>
      <div className="discovery intro-enter" ref={stage} onPointerMove={tilt} onPointerEnter={()=>setInteracting(true)} onPointerLeave={resetTilt} onFocusCapture={()=>setInteracting(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setInteracting(false);}}>
        <div className="orbit-field" aria-hidden="true"><div className="orbit-ring ring-a"/><div className="orbit-ring ring-b"/><div className="orbit-line"/><div className="orbit-sweep"/><div className="orbit-track"><i/></div><div className="orbit-track track-two"><i/></div></div>
        <div className="discovery-top"><span className="micro">A FEW BLOCKS AWAY</span><span className="micro">0{active+1} / 03</span></div>
        <div className="card-deck" aria-label="Example nearby outings">
          {picks.map((pick,index)=><article key={pick.name} className={`outing-card ${pick.type}`} data-position={(index-active+picks.length)%picks.length} aria-hidden={index!==active}>
            <div className="card-top"><span className="micro">{pick.walk}</span><span className="micro">WALK IN</span></div>
            {index===0 ? <div className="card-image"><img src={cityImage} alt=""/></div> : <div className="card-type" aria-hidden="true">{index===1 ? "AFTER HOURS" : "TABLE FOR TWO"}</div>}
            <div className="card-content"><h2>{pick.title.map(line=><span key={line}>{line}</span>)}</h2><p>{pick.detail}</p><div className="card-price"><span>{pick.price}</span><span>GO RN</span></div></div>
          </article>)}
        </div>
        <div className="discovery-bottom"><div className="pick-controls" role="group" aria-label="Choose an example outing">{picks.map((pick,index)=><button key={pick.name} className={index===active ? "active" : ""} onClick={()=>setActive(index)} aria-pressed={index===active}>{pick.name}</button>)}</div><span className="micro example-label">EXAMPLE PICKS</span></div>
      </div>
      <div className="hero-foot"><a href="#the-idea">Less deciding. More doing.</a><button className="motion-control" onClick={()=>setPaused(!paused)} aria-pressed={paused}>{paused ? "Play motion" : "Pause motion"}</button></div>
    </section>
    <section className="the-idea" id="the-idea">
      <div className="idea-intro reveal"><p className="eyebrow">THE WHOLE IDEA</p><p>Tell us how much time you have.<br/>We’ll find <strong>at least three good options.</strong></p></div>
      <div className="street"><img className="street-image" src={cityImage} alt="Friends outside a neighborhood music venue" loading="lazy"/><div className="street-shade"/><h2 className="street-title reveal"><span>PICK ONE.</span><span>GET GOING.</span></h2><div className="street-bottom"><span>Checked by locals.</span><span>Walk-in first.</span><span>Directions in one tap.</span></div></div>
    </section>
    <section className="waitlist" id="waitlist"><div className="waitlist-copy reveal"><p className="eyebrow">OUT RN IS ON ITS WAY.</p><h2><span>BE</span> FIRST.</h2><p>We’ll email you when we’re in your neighborhood.</p></div><div className="signup-panel reveal"><WaitlistForm/></div></section>
    <footer><a className="wordmark" href="#" aria-label="Back to top">OUT<span>RN</span></a><p>See you out there.</p><span className="micro">© {new Date().getFullYear()} OUT RN</span></footer>
  </main>;
}
