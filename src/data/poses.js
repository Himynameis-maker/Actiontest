/**
 * @file data/poses.js  立ち/走りのポーズ（角度rad, 親相対。+は「垂れた手足が後ろへ」、胴は+で前傾）
 * キー: pel=骨盤の上下px / tor胴 / head頭(胴相対) / uaR,faR=手前腕の上腕,前腕 / uaL,faL=奥腕 /
 * thA,shA=手前脚の腿,脛 / thB,shB=奥脚 / sp=槍のワールド角(0=真上,+で前へ倒れる)
 * 全ポーズは同じキー集合にすること(mixで補間するため)。攻撃/パリィ等は同形式で追加していく。
 */
(() => {
  const {mix, ease} = SL.u, sin = Math.sin, cos = Math.cos;
  const stand = t => ({
    pel: 0.25 * sin(t * 2), tor: 0.08 + 0.015 * sin(t * 2), head: -0.06 + 0.03 * sin(t * 1.3),
    uaR: -0.45, faR: -1.25, uaL: -0.8, faL: -0.9,
    thA: -0.3, shA: 0.22, thB: 0.32, shB: 0.3, sp: 1.2 + 0.01 * sin(t * 2)
  });
  // 走り(大げさ版): 足先の軌道(腰からの相対座標)を決め、2リンクIKで腿/脛の角度を出す。
  // 接地中は足が地面と同じ速さで後ろへ流れる(滑らない)。両足が離れる「空中」区間で pel を持ち上げて実際に跳ぶ。
  // gait.stance=接地割合(小さいほど空中が長い。0.5で空中なし) / crouch=接地中の脚の伸び率
  // gaitPx: lift=遊脚の持ち上げ(膝上げ/踵蹴り) / reach=遊脚の前方への張り出し / dip=接地中の沈み / x0=着地位置の前後 / air=空中の最大高さ
  // runPose(rad): lean=前傾 / armN,armF=手前/奥の腕の振り幅 / elbow=肘の曲げ伸ばし幅
  const PI2 = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const legAt = u => { // u:0〜1の脚位相。戻り=[thigh角, shin角]
    const T = SL.data.tune, g = T.gait, q = T.gaitPx, P = SL.data.parts, S = T.rig.scale;
    const v1 = [(P.thigh.end[0] - P.thigh.pivot[0]) * S, (P.thigh.end[1] - P.thigh.pivot[1]) * S];
    const v2 = [(P.shin.end[0] - P.shin.pivot[0]) * S, (P.shin.end[1] - P.shin.pivot[1]) * S];
    const L1 = Math.hypot(v1[0], v1[1]), L2 = Math.hypot(v2[0], v2[1]), f1 = Math.atan2(v1[1], v1[0]), f2 = Math.atan2(v2[1], v2[0]);
    const H = g.crouch * (L1 + L2), D = T.move.speed * g.stance * PI2 / Math.max(1, T.move.cycle);
    let x, y;
    if (u < g.stance) { const k = u / g.stance; x = q.x0 + D / 2 - D * k; y = H - q.dip * Math.sin(Math.PI * k); }
    else { const t = (u - g.stance) / (1 - g.stance), w = Math.sin(Math.PI * t);
      x = q.x0 - D / 2 + D * ease(t) + q.reach * w * w; y = H - q.lift * w; }
    let d = Math.hypot(x, y); const mx = L1 + L2 - 0.3; if (d > mx) { x *= mx / d; y *= mx / d; d = mx; }
    const a = Math.atan2(y, x), al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), t1 = a - al; // 膝は前へ
    const t2 = Math.atan2(y - L1 * Math.sin(t1), x - L1 * Math.cos(t1));
    return [t1 - f1, t2 - f2 - (t1 - f1)];
  };
  const wrap = u => u - Math.floor(u);
  const run = p => { const T = SL.data.tune, g = T.gait, r = T.runPose, s = sin(p), c = cos(p);
    const uA = wrap((p - Math.PI / 2) / PI2), uB = wrap(uA + 0.5), A = legAt(uA), B = legAt(uB);
    const fw = wrap(uA * 2), fl = (g.stance < 0.5 && fw > g.stance * 2) ? (fw - g.stance * 2) / (1 - g.stance * 2) : 0; // 空中区間(0〜1)
    return {
    pel: -T.gaitPx.air * Math.sin(Math.PI * fl), // 空中で腰ごと持ち上げる(負=上)
    tor: r.lean + 0.03 * cos(2 * p), head: -r.lean * 0.9 + 0.05 * s,
    uaR: -0.35 + r.armN * s, faR: -1.45 + r.elbow * s,          // 手前腕: 手前脚が前のとき後ろへ(逆位相)
    uaL: -0.55 - r.armF * s, faL: -1.4 - r.elbow * s,           // 奥腕: 手前脚が前のとき前へ
    thA: A[0], shA: A[1], thB: B[0], shB: B[1],
    sp: 1.35 + 0.1 * s
  }; };
  SL.poses = {stand, run, get(mv, phase, t) { // mv: 0=立ち 1=走り
    const b = SL.data.tune.bias, a = stand(t), r = run(phase);
    for (const k in b.stand) a[k] += b.stand[k];
    for (const k in b.run) r[k] += b.run[k];
    return mix(a, r, ease(mv));
  }};
})();
