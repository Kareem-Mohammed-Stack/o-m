(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('click', (event) => {
    const toTop = event.target.closest('[data-om-to-top]');
    if (!toTop) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  const pad = (value) => String(Math.max(0, value)).padStart(2, '0');

  const remaining = (end) => {
    const diff = Math.max(0, end - Date.now());
    return {
      done: diff <= 0,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const parseDeadline = (value) => {
    if (!value) return NaN;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    return Date.parse(normalized);
  };

  const evergreenEnd = (hours, key) => {
    const storageKey = `${key}-evergreen-end`;
    const saved = Number(sessionStorage.getItem(storageKey));
    if (saved && saved > Date.now()) return saved;
    const end = Date.now() + hours * 3600000;
    sessionStorage.setItem(storageKey, String(end));
    return end;
  };

  const initPromo = (root) => {
    if (sessionStorage.getItem(root.dataset.storageKey) === '1') {
      root.remove();
      return;
    }

    root.hidden = false;
    const timer = root.querySelector('[data-om-promo-timer]');
    const expired = root.querySelector('[data-om-promo-expired]');
    const copy = root.querySelector('[data-om-promo-copy]');
    const close = root.querySelector('[data-om-promo-close]');
    const mode = root.dataset.mode;
    const expireAction = root.dataset.expireAction;
    let end =
      mode === 'deadline'
        ? parseDeadline(root.dataset.deadline)
        : evergreenEnd(Number(root.dataset.evergreenHours || 24), root.dataset.storageKey);

    const tick = () => {
      if (Number.isNaN(end)) return;
      const time = remaining(end);
      if (timer) {
        timer.querySelector('[data-days]').textContent = pad(time.days);
        timer.querySelector('[data-hours]').textContent = pad(time.hours);
        timer.querySelector('[data-minutes]').textContent = pad(time.minutes);
        timer.querySelector('[data-seconds]').textContent = pad(time.seconds);
      }
      if (time.done) {
        if (expireAction === 'hide') {
          root.remove();
        } else {
          if (copy) copy.hidden = true;
          if (timer) timer.hidden = true;
          if (expired) expired.hidden = false;
        }
        return false;
      }
      return true;
    };

    if (!tick()) return;
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      if (!tick()) window.clearInterval(interval);
    }, 1000);

    close?.addEventListener('click', () => {
      sessionStorage.setItem(root.dataset.storageKey, '1');
      root.remove();
    });
  };

  const initAll = (container = document) => {
    container.querySelectorAll('[data-om-promo]').forEach(initPromo);
  };

  initAll();
  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
