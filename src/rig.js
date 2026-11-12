/**
 * @file rig.js  パーツ画像(or 仮ボーン)の階層描画・接地・槍の判定座標
 * 公開: SL.rig.load() / SL.rig.draw(ctx, x, groundY, dir, dd, pose) / SL.rig.last={grip,tip}(シーン座標)
 * 階層: pelvis(原点=股関節) > [腿>脛>足] / 胴 > [頭>髪] [腕(上腕>前腕>手>槍)]。奥側(far)は farTint で色替え。
 * 設計は旧HTMLリグと同じ: 各パーツを pivot 基準で回転し、子は親のend点へ置く。数値は data/*.js を毎フレーム読む(=ライブ編集可)
 * 画像が無いパーツは寸法どおりの仮ボーンを描く。dbg.bones=ピボット点, dbg.hit=当たり判定の可視化
 */
(() => {
  const {rot, add} = SL.u, D = SL.data, dbg = SL.debug = {bones: false, hit: true};
  const IM = {}, IMD = {}; let ctx, inv;
  const P = () => D.parts, T = () => D.tune, S = () => D.tune.rig.scale;
  const off = (n, k) => { const c = P()[n]; return [(c[k][0] - c.pivot[0]) * S(), (c[k][1] - c.pivot[1]) * S()]; };
  const J = (k, o) => { const a = T().joint[k] || [0, 0]; return [o[0] + a[0], o[1] + a[1]]; };
  const footAng = (th, sh) => Math.max(-0.9, Math.min(0.9, -(th + sh) * 0.9));

  function tint(i) {
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
    const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = T().farTint; x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function load() {
    return Promise.all(Object.keys(P()).map(n => new Promise(r => {
      const i = new Image();
      i.onload = () => { IM[n] = i; IMD[n] = tint(i); r(); };
      i.onerror = () => { IM[n] = null; r(); };
      i.src = D.assetDir + n + '.png';
    })));
  }
  function ph(n, far) { // 仮ボーン: 画像pxの寸法で丸角矩形(槍は柄+穂先)
    const c = P()[n], s = S(), x = ctx;
    x.save(); x.translate(-c.pivot[0] * s, -c.pivot[1] * s); x.scale(s, s);
    x.fillStyle = far ? '#2b2c38' : '#0c0c10'; x.strokeStyle = far ? '#5a5c70' : '#9a9db4'; x.lineWidth = 9; x.lineJoin = 'round';
    x.beginPath();
    if (n === 'spear') { const m = c.w / 2, y = c.tip[1]; x.rect(m - 8, y + 140, 16, c.h - y - 140); x.moveTo(m, y); x.lineTo(m + 24, y + 140); x.lineTo(m - 24, y + 140); x.closePath(); }
    else x.roundRect(0, 0, c.w, c.h, Math.min(c.w, c.h) / 2);
    x.fill(); x.stroke();
    if (n === 'head') { x.fillStyle = '#e6e8f5'; x.fillRect(c.w * 0.68, c.h * 0.4, c.w * 0.14, 10); } // 目=向きの目印
    x.restore();
  }
  function put(n, o, r, kids, far, behind) {
    ctx.save(); ctx.translate(o[0], o[1]); ctx.rotate(r);
    if (behind) behind();
    const c = P()[n], s = S(), im = (far ? IMD : IM)[n];
    if (im) ctx.drawImage(im, -c.pivot[0] * s, -c.pivot[1] * s, c.w * s, c.h * s); else ph(n, far);
    if (n === 'spear') { // 槍の握り点/穂先をシーン座標で記録(攻撃判定に使う)
      const m = ctx.getTransform(), q = (x, y) => { const p = inv.transformPoint(m.transformPoint(new DOMPoint(x, y))); return [p.x, p.y]; };
      SL.rig.last = {grip: q(0, 0), tip: q((c.tip[0] - c.pivot[0]) * s, (c.tip[1] - c.pivot[1]) * s)};
    }
    if (kids) kids();
    if (dbg.bones) { ctx.beginPath(); ctx.arc(0, 0, 2, 0, 7); ctx.fillStyle = '#ff3b4a'; ctx.fill(); }
    ctx.restore();
  }
  function footBottom(th, sh, dx) { // 股関節原点から見た足裏(heel/toeの低い方)のy
    const k = add(J('hip', [dx, 0]), rot(J('knee', off('thigh', 'end')), th));
    const a = add(k, rot(J('ankle', off('shin', 'end')), th + sh)), f = P().foot, s = S(), psi = footAng(th, sh);
    return a[1] + Math.max(...[f.heel, f.toe].map(p => rot([(p[0] - f.pivot[0]) * s, (p[1] - f.pivot[1]) * s], psi)[1]));
  }
  function leg(th, sh, far, dx) {
    put('thigh', J('hip', [dx, 0]), th, () =>
      put('shin', J('knee', off('thigh', 'end')), sh, () =>
        put('foot', J('ankle', off('shin', 'end')), footAng(th, sh), null, far), far), far);
  }
  function spear(rel) { const h = P().hand, s = S(); put('spear', [(h.grip[0] - h.pivot[0]) * s, (h.grip[1] - h.pivot[1]) * s], rel, null, false); }
  function arm(p, ua, fa, far, withSpear) {
    const hf = T().rig.hand, hw = p.tor + ua + fa * (1 + hf); // 手のワールド角(槍の向き補正用)
    put('uarm', J('shoulder', off('torso', 'shoulder')), ua, () =>
      put('farm', J('elbow', off('uarm', 'end')), fa, () =>
        put('hand', J('wrist', off('farm', 'end')), fa * hf, null, far, withSpear ? () => spear(p.sp - hw) : null), far), far);
  }
  function boxes(x, gy, dir) {
    const h = T().hurt, t = T().hit, l = SL.rig.last;
    ctx.save(); ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(80,220,120,.9)'; ctx.strokeRect(x + (dir > 0 ? h.x : -h.x - h.w), gy + h.y, h.w, h.h);
    if (l) {
      const dx = l.tip[0] - l.grip[0], dy = l.tip[1] - l.grip[1], d = Math.hypot(dx, dy) || 1;
      ctx.lineCap = 'round'; ctx.lineWidth = t.r * 2; ctx.strokeStyle = 'rgba(255,70,80,.4)';
      ctx.beginPath(); ctx.moveTo(l.grip[0] + dx / d * t.from, l.grip[1] + dy / d * t.from); ctx.lineTo(l.grip[0] + dx / d * t.to, l.grip[1] + dy / d * t.to); ctx.stroke();
    }
    ctx.restore();
  }
  function draw(c, x, gy, dir, dd, p) {
    ctx = c; inv = ctx.getTransform().inverse();
    const hy = gy - Math.max(footBottom(p.thA, p.shA, 0), footBottom(p.thB, p.shB, -3)) + p.pel;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x, gy + 1, 22, 3, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(x, hy); ctx.scale(dd, 1);
    leg(p.thB, p.shB, true, -3);
    put('pelvis', [0, 0], 0, null, false);
    leg(p.thA, p.shA, false, 0);
    put('torso', J('torso', off('pelvis', 'top')), p.tor, () => {
      put('head', J('head', off('torso', 'head')), p.head, null, false,
        () => put('hair', J('hair', off('head', 'hair')), p.hair - p.tor - p.head, null, false));
      arm(p, p.uaR, p.faR, false, true);
    }, false, () => arm(p, p.uaL, p.faL, true, false));
    ctx.restore();
    if (dbg.hit) boxes(x, gy, dir);
  }
  SL.rig = {load, draw, last: null};
})();
