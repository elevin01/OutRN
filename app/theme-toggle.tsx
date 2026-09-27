import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme || "light");
    update();
    document.addEventListener("outrn:theme-change", update);
    return () => document.removeEventListener("outrn:theme-change", update);
  }, []);
  return <button type="button" className="theme-toggle" aria-label={theme ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Switch color theme"} onClick={() => document.dispatchEvent(new Event("outrn:toggle-theme"))}>
    <svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
    <svg className="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 018.5 4a8.5 8.5 0 1011.5 11.5Z"/></svg>
    <span className="theme-light-label">Light</span><span className="theme-dark-label">Dark</span>
  </button>;
}
