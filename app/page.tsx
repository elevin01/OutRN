import WaitlistForm from "./waitlist-form";
import ThemeToggle from "./theme-toggle";
import PhoneDemo from "./phone-demo";
import RightNow from "./right-now";

const streetImage = `${import.meta.env.BASE_URL}public/images/street-afternoon.webp`;

function Wordmark() {
  return <><span className="brand-out">out</span><span className="brand-rn">RN</span></>;
}

export default function Home() {
  return <main>
    <a href="#main-content" className="skip-link">Skip to content</a>

    <div className="field field-hero">
      <header className="nav wrap">
        <a className="wordmark" href="#" aria-label="OutRN home"><Wordmark/></a>
        <div className="nav-actions">
          <ThemeToggle/>
          <a className="button button-small" href="#waitlist">Join the waitlist</a>
        </div>
      </header>

      <section className="hero wrap" id="main-content">
        <div className="hero-copy">
          <h1 aria-label="Got free time? Try going out Right Now.">
            <span className="line"><span>Got free time?</span></span>
            <span className="line"><span>Try going out</span></span>
            <span className="line"><span>Right Now.</span></span>
          </h1>
          <p className="hero-sub">OutRN is an app that finds at least three things worth doing near you, each one checked against the time you have.</p>
          <div className="hero-actions">
            <a className="button" href="#waitlist">Join the waitlist</a>
            <a className="text-link" href="#try">See how it picks</a>
          </div>
          <p className="hero-note">Free to use. Launching one neighborhood at a time.</p>
        </div>
        <PhoneDemo/>
      </section>
    </div>

    <RightNow/>

    <section className="steps" aria-labelledby="steps-title">
      <div className="wrap steps-layout">
        <figure className="steps-photo">
          <img src={streetImage} alt="People crossing a sunlit street toward a café and a gallery" width={1440} height={960} loading="lazy" decoding="async"/>
        </figure>
        <div className="steps-copy">
          <h2 id="steps-title">Out the door in three taps.</h2>
          <ol className="steps-list">
            <li><h3>Open OutRN</h3><p>Your picks are already there, fitted to where you are and how long you have.</p></li>
            <li><h3>Pick one</h3><p>Each pick shows the cost, the walk and how long you’d get there.</p></li>
            <li><h3>Get directions</h3><p>OutRN hands you to your maps app, and you can put the phone away.</p></li>
          </ol>
          <p className="steps-aside">Have a budget, or need to be back by a certain time? Add it if you want to. You never have to.</p>
        </div>
      </div>
    </section>

    <section className="honest" aria-labelledby="honest-title">
      <div className="wrap honest-layout">
        <div className="honest-copy">
          <h2 id="honest-title">It tells you what it knows and what it’s guessing.</h2>
          <p>Every detail in OutRN says where it came from. Hours a venue published are shown differently from an estimate, and a pick with something unconfirmed is marked Check first instead of Go now.</p>
          <p>When only two things fit your evening, you see two. OutRN won’t stretch your budget or your walk to fill a third slot.</p>
        </div>
        <div className="sheet" role="group" aria-label="Example of the details OutRN shows before you go">
          <div className="sheet-head"><p className="sheet-title">Before you go</p><p className="stamp">Go now</p></div>
          <dl className="sheet-facts">
            <div><dt>Hours</dt><dd>Open until 1:00 AM<small>From the venue’s website</small></dd></div>
            <div><dt>Getting in</dt><dd>Walk in<small>From the venue’s website</small></dd></div>
            <div><dt>Price</dt><dd>$15 at the door<small>From the venue’s website</small></dd></div>
            <div><dt>Getting there</dt><dd>About 8 min on foot<small>Estimate</small></dd></div>
            <div><dt>Wait</dt><dd>Not reported<small>Nobody has reported one yet</small></dd></div>
          </dl>
          <p className="sheet-foot">An example for an invented place.</p>
        </div>
      </div>
    </section>

    <section className="field field-waitlist" id="waitlist" aria-labelledby="waitlist-title">
      <div className="wrap waitlist-layout">
        <div className="waitlist-copy">
          <h2 id="waitlist-title">Be first to try it where you live.</h2>
          <p>Tell us your neighborhood and we’ll email you when OutRN opens there. It’s free to use, and it will stay that way.</p>
        </div>
        <div className="signup-panel"><WaitlistForm/></div>
      </div>
    </section>

    <footer className="wrap">
      <a className="wordmark" href="#" aria-label="OutRN, back to top"><Wordmark/></a>
      <p>Got free time? Try going out Right Now.</p>
      <p>© {new Date().getFullYear()} OutRN</p>
    </footer>
  </main>;
}
