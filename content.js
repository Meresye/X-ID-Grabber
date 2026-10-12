(function () {
  'use strict';
  const CACHE_KEY = 'xidg_cache';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) {}
  const save = (sn, id) => { if (!sn || !id) return; sn = sn.toLowerCase(); if (cache[sn] !== id) { cache[sn] = id; try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {} } };

  const fiberOf = (el) => { const k = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')); return k ? el[k] : null; };
  function idFromUser(u) { if (!u || typeof u !== 'object') return null; const id = u.id_str || u.rest_id; return id ? { id: String(id), sn: u.screen_name || (u.legacy && u.legacy.screen_name) || (u.core && u.core.screen_name) } : null; }

  // Mesmo sistema do script original, generalizado para qualquer elemento
  function findUserFromEl(el, maxDepth) {
    let fiber = fiberOf(el), d = 0;
    while (fiber && d++ < (maxDepth || 60)) {
      const p = fiber.memoizedProps;
      if (p) {
        let r = idFromUser(p.user || p.adalovelaceUser || p.primaryUser);
        if (r) return r;
        const t = p.tweet || p.status;
        if (t) {
          const tt = t.retweeted_status || null; // ignore, author handled per article
          r = idFromUser(t.user) || idFromUser(t.core && t.core.user_results && t.core.user_results.result);
          if (r) return r;
        }
        if (p.rest_id || p.id_str) { if (!p.full_text && !p.text) return { id: String(p.rest_id || p.id_str), sn: p.screen_name }; }
      }
      fiber = fiber.return;
    }
    return null;
  }

  function toast(msg) { const t = document.createElement('div'); t.className = 'xidg-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 1800); }
  async function copy(text) { try { await navigator.clipboard.writeText(text); } catch (e) { const a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } }
  const ICON_ID = '<svg viewBox="0 0 24 24"><path d="M4 4h16v2H4zm0 14h16v2H4zM7 8h2v8H7zm4 0h2v8h-2zm4 0h2v8h-2z"/></svg>';
  const ICON_LINK = '<svg viewBox="0 0 24 24"><path d="M18.36 5.64a4.5 4.5 0 0 0-6.36 0l-1.42 1.42 1.42 1.41L13.41 7a2.5 2.5 0 1 1 3.54 3.54l-2.83 2.82 1.42 1.42 2.82-2.83a4.5 4.5 0 0 0 0-6.31zM10.59 17l-1.41 1.41a2.5 2.5 0 0 1-3.54-3.54l2.83-2.82-1.42-1.42-2.82 2.83a4.5 4.5 0 0 0 6.36 6.36l1.42-1.42z"/><path d="M8.47 14.12l5.66-5.66 1.41 1.42-5.65 5.65z"/></svg>';

  function makeButtons(getId, extraClass) {
    const w = document.createElement('span'); w.className = 'xidg-wrap ' + (extraClass || '');
    const mk = (label, icon, fn) => { const b = document.createElement('button'); b.className = 'xidg-btn'; b.title = label; b.innerHTML = icon + '<span>' + label + '</span>';
      b.addEventListener('click', async (e) => { e.preventDefault(); e.stopPropagation(); const r = getId(); if (!r) { toast('Não foi possível capturar o ID ainda'); return; } await copy(fn(r.id)); b.classList.add('ok'); toast('Copiado: ' + fn(r.id)); setTimeout(() => b.classList.remove('ok'), 1200); }, true);
      ['mousedown','mouseup','pointerdown'].forEach(ev => b.addEventListener(ev, e => e.stopPropagation(), true)); return b; };
    w.appendChild(mk('ID', ICON_ID, id => id));
    w.appendChild(mk('Link', ICON_LINK, id => 'https://x.com/intent/user?user_id=' + id));
    return w;
  }

  function screenNameFrom(container) {
    const a = container.querySelector('a[href^="/"]'); if (!a) return null;
    const m = a.getAttribute('href').match(/^\/([A-Za-z0-9_]{1,15})(?:$|\/|\?)/); return m ? m[1] : null;
  }

  function processTweets() {
    document.querySelectorAll('article[data-testid="tweet"] [data-testid="User-Name"]:not([data-xidg])').forEach(un => {
      un.setAttribute('data-xidg', '1');
      const sn = screenNameFrom(un);
      const getId = () => { let r = findUserFromEl(un) || findUserFromEl(un.closest('article'));
        if (r && sn && r.sn && r.sn.toLowerCase() !== sn.toLowerCase()) r = null;
        if (r) { save(r.sn || sn, r.id); return r; }
        const c = sn && cache[sn.toLowerCase()]; return c ? { id: c } : null; };
      getId();
      const target = un.lastElementChild || un;
      target.appendChild(makeButtons(getId));
    });
    document.querySelectorAll('[data-testid="UserCell"]:not([data-xidg])').forEach(cell => {
      cell.setAttribute('data-xidg', '1'); const sn = screenNameFrom(cell);
      const getId = () => { const r = findUserFromEl(cell.querySelector('[data-testid$="-follow"],[data-testid$="-unfollow"]') || cell); if (r) { save(r.sn || sn, r.id); return r; } const c = sn && cache[sn.toLowerCase()]; return c ? { id: c } : null; };
      getId();
    });
  }

  function findProfileId() {
    const els = document.querySelectorAll('[data-testid$="-unfollow"], [data-testid$="-follow"], [data-testid="userActions"], [data-testid="UserName"]');
    for (const el of els) { if (el.closest('[data-testid="UserCell"]')) continue; const r = findUserFromEl(el); if (r) return r;
      const m = (el.getAttribute('data-testid') || '').match(/^(\d+)-(un)?follow$/); if (m) return { id: m[1] }; }
    return null;
  }

  function processProfile() {
    const un = document.querySelector('[data-testid="primaryColumn"] [data-testid="UserName"]');
    if (!un) return;
    const path = location.pathname.split('/')[1];
    if (un.getAttribute('data-xidg') === path) return;
    un.querySelectorAll('.xidg-profile').forEach(n => n.remove());
    un.setAttribute('data-xidg', path);
    const getId = () => { const r = findProfileId(); if (r) { save(r.sn || path, r.id); return r; } const c = cache[(path || '').toLowerCase()]; return c ? { id: c } : null; };
    un.appendChild(makeButtons(getId, 'xidg-profile'));
  }

  let scheduled = false;
  const run = () => { scheduled = false; try { processTweets(); processProfile(); } catch (e) {} };
  new MutationObserver(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(run); } }).observe(document.documentElement, { childList: true, subtree: true });
  run();
})();
