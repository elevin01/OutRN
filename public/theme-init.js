/* Runs before the stylesheet so the saved/system theme is applied on first paint. */
(function () {
  var key = 'outrn-theme';
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var choice = null;
  function valid(value) { return value === 'light' || value === 'dark' ? value : null; }
  try { choice = valid(window.localStorage.getItem(key)); } catch (_) {}
  function apply() {
    var theme = choice || (media.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#20251f' : '#f7f5ef';
    document.dispatchEvent(new Event('outrn:theme-change'));
  }
  document.addEventListener('outrn:toggle-theme', function () {
    choice = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { window.localStorage.setItem(key, choice); } catch (_) {}
    apply();
  });
  media.addEventListener('change', function () { if (!choice) apply(); });
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) { choice = valid(event.newValue); apply(); }
  });
  apply();
})();
