/**
 * @file main.js  ベンチのループ・入力・背景(無限横スクロール)・HUD。ゲーム本体はここから育てる。
 * 状態 st: world=横位置 dir=向き dd=見た目の反転補間 mv=0立ち〜1走り phase=脚位相。入力は A/D か ←/→。
 * 描画は「背景(等倍)→キャラ(足元中心にzoom拡大)」。シーン座標=等倍の800x450、足元=(CX,GY)。
 */
(() => {
  const W = 800, H = 450, CX = 400, GY = 372, $ = id => document.getElementById(id);
  const cv = $('c'), ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2), D = SL.data, hash = SL.u.hash;
  cv.width = W * dpr; cv.height = H * dpr;
  const st = {world: 0, dir: 1, dd: 1, mv: 0, phase: 0, t: 0, mode: 'auto'}, keys = {l: 0, r: 0};

  const key = (e, v) => { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const c = e.key.toLowerCase();
    if (c === 'arrowleft' || c === 'a') keys.l = v; else if (c === 'arrowright' || c === 'd') keys.r = v; else return;
    e.preventDefault(); };
  addEventListener('keydown', e => key(e, 1)); addEventListener('keyup', e => key(e, 0));
  addEventListener('pointerup', () => { const a = document.activeElement; if (a && a.type === 'range') a.blur(); }); // スライダー後もキー操作可

  function update(dt) {
    const m = D.tune.move, go = keys.r - keys.l; if (go) st.dir = go;
    const want = st.mode === 'run' || (st.mode === 'auto' && go) ? 1 : 0, step = (a, b, r) => a + Math.sign(b - a) * Math.min(Math.abs(b - a), r);
    st.mv = step(st.mv, want, dt * 8); st.dd = step(st.dd, st.dir, dt * 18);
    st.t += dt; st.phase += dt * m.cycle * st.mv; st.world += st.dir * m.speed * st.mv * dt;
  }
  function layer(sp, f, fn) { const o = st.world * f, i0 = Math.floor((o - CX - 80) / sp), i1 = Math.ceil((o + W - CX + 80) / sp);
    for (let i = i0; i <= i1; i++) fn(i * sp - o + CX, i); }
  function background() { // 仮背景。将来は world/ の地形に置換
    const g = ctx.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#15151b'); g.addColorStop(1, '#26262e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, GY);
    layer(170, 0.2, (x, i) => { const w = 34 + hash(i) * 34, h = 130 + hash(i + 9) * 130; ctx.fillStyle = '#1e1e26'; ctx.fillRect(x - w / 2, GY - 30 - h, w, h + 30); });
    layer(260, 0.5, (x) => { ctx.fillStyle = '#2b2b35'; ctx.fillRect(x - 8, 0, 16, GY - 8); });
    ctx.fillStyle = '#24242c'; ctx.fillRect(0, GY, W, H - GY); ctx.fillStyle = '#3b3b46'; ctx.fillRect(0, GY, W, 2);
    layer(70, 1, (x, i) => { ctx.fillStyle = '#34343e'; ctx.fillRect(x, GY + 8, 3, 10); if (hash(i + 5) < 0.3) ctx.fillRect(x + 20, GY + 22, 14, 3); });
  }
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); background();
    const z = D.tune.view.zoom; ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * CX * (1 - z), dpr * GY * (1 - z));
    SL.rig.draw(ctx, CX, GY, st.dir, st.dd, SL.poses.get(st.mv, st.phase, st.t));
  }
  // HUD
  $('hud').innerHTML = '<button data-m="auto">自動(A/D)</button><button data-m="stand">立ち固定</button><button data-m="run">走り固定</button>' +
    '<label><input type="checkbox" id="dB">ピボット点</label><label><input type="checkbox" id="dH" checked>当たり判定</label>';
  const btns = [...document.querySelectorAll('#hud button')], mark = () => btns.forEach(b => b.classList.toggle('on', b.dataset.m === st.mode));
  btns.forEach(b => b.onclick = () => { st.mode = b.dataset.m; mark(); }); mark();
  $('dB').onchange = e => SL.debug.bones = e.target.checked; $('dH').onchange = e => SL.debug.hit = e.target.checked;

  const T = D.tune;
  SL.editor.loadSaved();
  SL.editor.init($('panel'), [
    ['関節オフセット(px)', T.joint, [-30, 30, 0.5]], ['ポーズ補正(rad) 首=head', T.bias, [-1.5, 1.5, 0.01]],
    ['当たり判定: 被弾箱', {hurt: T.hurt}, [-150, 150, 1]], ['当たり判定: 槍', {hit: T.hit}, [0, 200, 1]],
    ['移動', T.move, [0, 600, 1]], ['表示倍率', T.view, [0.5, 6, 0.1]], ['リグ(scale/hand)', T.rig, [0, 1, 0.005]],
    ['パーツ寸法・ピボット(画像px)', D.parts, [-50, 1500, 1]]
  ]);
  let last = performance.now();
  (function loop(now) { update(Math.min(0.05, (now - last) / 1000)); last = now; render(); requestAnimationFrame(loop); })(last);
  SL.rig.load(); // 画像は非同期。読み込み前後は仮ボーン→画像に自動で切り替わる
})();
