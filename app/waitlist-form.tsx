"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, ValidationError } from "@formspree/react";
import siteConfig from "../web/site-config.json";
const formId = new URL(siteConfig.waitlistEndpoint).pathname.split("/").pop()!;

export default function WaitlistForm() {
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
    catch { setNetworkError("That didn’t go through. Your details are still here. Give it another try."); }
    finally { submitLock.current = false; setSending(false); }
  }
  if (state.succeeded) return <div className="success" role="status"><h3 ref={successTitle} tabIndex={-1}>You’re on the list.</h3><p>We’ll email you when we’re ready in your neighborhood.</p></div>;
  return <form action={siteConfig.waitlistEndpoint} method="POST" onSubmit={submit} aria-busy={busy}>
    
    <label htmlFor="email">Your email</label>
    <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required readOnly={busy} aria-invalid={!!state.errors?.getFieldErrors("email").length} aria-describedby="email-error"/>
    <ValidationError id="email-error" field="email" prefix="Email" errors={state.errors} className="form-error"/>
    <label htmlFor="neighborhood">Your neighborhood or city</label>
    <input id="neighborhood" name="neighborhood" autoComplete="address-level2" placeholder="e.g. Lower East Side, NYC" maxLength={120} minLength={2} required pattern=".*\S.*" readOnly={busy} aria-invalid={!!state.errors?.getFieldErrors("neighborhood").length} aria-describedby="neighborhood-error"/>
    <ValidationError id="neighborhood-error" field="neighborhood" prefix="Neighborhood" errors={state.errors} className="form-error"/>
    <input type="hidden" name="_subject" value="OutRN: early access signup"/>
    <input type="hidden" name="source" value="OutRN GitHub Pages waitlist"/>
    <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this empty</label><input id="website" name="_gotcha" tabIndex={-1} autoComplete="off"/></div>
    <button className="button" disabled={busy} type="submit">{busy ? "Joining…" : "Count me in"}</button>
    <div aria-live="polite"><ValidationError errors={state.errors} className="form-error"/>{networkError && <p className="form-error" role="alert">{networkError}</p>}</div>
    <p className="privacy-note">Launch updates only. Your details are stored through Formspree. Reply to any update to unsubscribe.</p>
  </form>;
}

