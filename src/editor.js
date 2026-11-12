/**
 * @file editor.js  数値エディタ。渡したオブジェクトの数値(と数値配列)を再帰的にスライダー化し、即反映。
 * 変更は localStorage に自動保存(キー sl_override_v1)。「コピー」で data/*.js に貼れる形式を出力。
 * 公開: SL.editor.loadSaved() / SL.editor.init(hostEl, [[見出し, オブジェクト, [min,max,step]], ...])
 */
(() => {
  const KEY = 'sl_override_v1', D = SL.data, store = () => ({tune: D.tune, parts: D.parts});
  const merge = (t, s) => { for (const k in t) { if (!(k in s)) continue;
    if (typeof t[k] === 'number' && typeof s[k] === 'number') t[k] = s[k];
    else if (t[k] && typeof t[k] === 'object' && s[k] && typeof s[k] === 'object') merge(t[k], s[k]); } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store())); } catch (e) {} };
  const loadSaved = () => { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) merge(store(), s); return !!s; } catch (e) { return false; } };
  const fmt = (name, o) => 'SL.data.' + name + ' = ' + JSON.stringify(o, null, 1).replace(/\n\s+(?=[-\d\]])/g, '') + ';';

  function row(host, label, get, set, [min, max, step]) {
    const l = document.createElement('label');
    l.innerHTML = '<span>' + label + '</span><input type="range" min="' + min + '" max="' + max + '" step="' + step + '"><input type="number" step="' + step + '">';
    const [r, n] = l.querySelectorAll('input'); r.value = n.value = get();
    r.oninput = n.oninput = e => { r.value = n.value = e.target.value; set(+e.target.value); save(); };
    host.appendChild(l);
  }
  function build(host, obj, rg) {
    for (const k in obj) { const v = obj[k];
      if (typeof v === 'number') row(host, k, () => obj[k], x => { obj[k] = x; }, rg);
      else if (Array.isArray(v) && v.every(n => typeof n === 'number'))
        v.forEach((_, i) => row(host, k + '.' + 'xyzw'[i], () => v[i], x => { v[i] = x; }, rg));
      else if (v && typeof v === 'object') { const d = document.createElement('details'); d.innerHTML = '<summary>' + k + '</summary>'; host.appendChild(d); build(d, v, rg); } }
  }
  function init(host, groups) {
    for (const [title, obj, rg] of groups) { const d = document.createElement('details'); d.innerHTML = '<summary>' + title + '</summary>'; host.appendChild(d); build(d, obj, rg); }
    const bar = document.createElement('div'); bar.className = 'bar';
    const btn = (txt, fn) => { const b = document.createElement('button'); b.textContent = txt; b.onclick = () => fn(b); bar.appendChild(b); };
    const cp = (txt, b) => (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { b.textContent = 'コピーした'; setTimeout(() => b.textContent = b.dataset.t, 1200); }).catch(() => prompt('Ctrl+C', txt));
    btn('tune.js 用にコピー', b => { b.dataset.t = 'tune.js 用にコピー'; cp(fmt('tune', D.tune), b); });
    btn('parts.js 用にコピー', b => { b.dataset.t = 'parts.js 用にコピー'; cp(fmt('parts', D.parts), b); });
    btn('保存値を破棄して初期化', () => { localStorage.removeItem(KEY); location.reload(); });
    host.appendChild(bar);
  }
  SL.editor = {loadSaved, init};
})();
