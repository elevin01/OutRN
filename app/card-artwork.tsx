/** Original vector artwork: each preview has the character of its outing. */
export default function CardArtwork({ type }: { type: string }) {
  return <div className={`pick-artwork artwork-${type}`} aria-hidden="true">
    {type === "music" && <>
      <svg viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="record-shine"><stop stopColor="#344c49"/><stop offset=".5" stopColor="#152724"/><stop offset="1" stopColor="#071916"/></radialGradient></defs><path fill="#153b33" d="M0 0h420v150H0z"/><path fill="#d4edbe" d="M0 0h21v150H0z"/>{[0,1,2,3,4,5,6,7].map(n=><path key={n} d={`M${36+n*19} 0v150`} stroke="#b0d2a7" opacity=".09"/>)}<circle cx="111" cy="92" r="105" fill="url(#record-shine)" stroke="#779d81" strokeWidth="1"/>{[47,56,65,74,83,92].map(r=><circle key={r} cx="111" cy="92" r={r} fill="none" stroke="#779d81" strokeWidth=".7" opacity=".4"/>)}<circle cx="111" cy="92" r="35" fill="#d2ff00"/><circle cx="111" cy="92" r="6" fill="#102d25"/><path d="M158 0l-28 63M95 122l-13 28" stroke="#fff" strokeWidth="18" opacity=".055"/></svg>
      <div className="artwork-type"><small>SIDE A / LIVE TONIGHT</small><strong>One<br/>more set.</strong><span>GOOD MUSIC. CLOSE QUARTERS.</span></div>
      <span className="artwork-seal">ADMIT<br/>YOURSELF</span>
    </>}
    {type === "art" && <>
      <svg viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice"><path fill="#7049db" d="M0 0h420v150H0z"/><path d="M0 25h420M0 75h420M0 125h420M30 0v150M80 0v150M130 0v150M180 0v150M230 0v150M280 0v150M330 0v150M380 0v150" stroke="#f7e9ff" opacity=".15"/><g transform="translate(270 76) rotate(-19)"><path d="M-75 100V-15a75 75 0 01150 0v115" fill="#fb886e"/><path d="M-50 100V-15a50 50 0 01100 0v115" fill="#f4dac4"/><path d="M-25 100V-15a25 25 0 0150 0v115" fill="#332861"/></g><circle cx="345" cy="34" r="20" fill="#d2ff00"/><path d="M70 15v28M56 29h28" stroke="#f9dfc5" strokeWidth="2"/></svg>
      <div className="artwork-type"><small>AN OPEN INVITATION</small><strong>After<br/>hours.</strong><span>TAKE A CLOSER LOOK.</span></div>
      <span className="artwork-edition">EXHIBITION<br/>NO. 02</span>
    </>}
    {type === "food" && <>
      <svg viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice"><defs><pattern id="diner-check" width="24" height="24" patternUnits="userSpaceOnUse"><path fill="#ffe5c5" d="M0 0h24v24H0z"/><path fill="#b63c2b" d="M0 0h12v12H0zm12 12h12v12H12z"/></pattern></defs><path fill="#bd3f2e" d="M0 0h420v150H0z"/><path fill="url(#diner-check)" d="M0 131h420v19H0z"/><g transform="translate(300 68) rotate(12)"><ellipse rx="76" ry="59" fill="#822d24"/><ellipse cy="-5" rx="76" ry="59" fill="#fae9d0"/><ellipse cy="-5" rx="59" ry="43" fill="none" stroke="#c79470"/><path d="M-37-16q70-34 55 0t-59 11 65 11-58 5 56-34-14 10" fill="none" stroke="#b55129" strokeWidth="5" strokeLinecap="round"/><path d="M-10-28l9 11m20 22l-8 7m-45-4l11-7" stroke="#3a6342" strokeWidth="4"/><path d="M-88-44v92m-9-93v24q9 17 18 0v-24m-9 0v29" stroke="#f6d9b6" fill="none" strokeWidth="3"/></g></svg>
      <div className="artwork-type"><small>WALK-INS WELCOME</small><strong>Stay<br/>for dinner.</strong><span>THE KITCHEN’S STILL ON.</span></div>
    </>}
    {type === "outside" && <>
      <svg viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="postcard-sky" x2="0" y2="1"><stop stopColor="#6c879e"/><stop offset="1" stopColor="#edb697"/></linearGradient></defs><path fill="url(#postcard-sky)" d="M0 0h420v150H0z"/><circle cx="307" cy="62" r="34" fill="#ffdd99"/><path d="M0 106Q140 70 250 104T420 93v57H0" fill="#587f80"/><path d="M0 127q115-39 238-4t182-14v41H0" fill="#254f59"/><path d="M0 149q158-32 256-11t164-4" fill="none" stroke="#f7caa1" opacity=".6"/><path d="M170 150q38-26 80-24t50-18" fill="none" stroke="#e9e8ca" strokeWidth="2" strokeDasharray="4 5"/><circle cx="300" cy="108" r="4" fill="#e9e8ca"/><path d="M315 22q6-6 12 0 6-6 12 0" fill="none" stroke="#294851" strokeWidth="1.5"/></svg>
      <div className="artwork-type"><small>A LITTLE FURTHER OUT</small><strong>The long<br/>way home.</strong><span>NO RESERVATION NEEDED.</span></div>
      <span className="postcard-stamp">OUT<br/>SIDE</span>
    </>}
  </div>;
}
