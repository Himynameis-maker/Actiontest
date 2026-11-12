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
  const run = p => { const s = sin(p), c = cos(p); return {
    pel: 1.4 * cos(2 * p), tor: 0.32 + 0.03 * cos(2 * p), head: -0.3 + 0.05 * s,
    uaR: -0.3 + 0.15 * s, faR: -1.4, uaL: -0.7 + 0.5 * s, faL: -1.2 + 0.3 * c,
    thA: -0.25 - 0.8 * s, shA: 0.25 + 1.1 * Math.max(0, c), thB: -0.25 + 0.8 * s, shB: 0.25 + 1.1 * Math.max(0, -c),
    sp: 1.45 + 0.05 * s
  }; };
  SL.poses = {stand, run, get(mv, phase, t) { // mv: 0=立ち 1=走り
    const b = SL.data.tune.bias, a = stand(t), r = run(phase);
    for (const k in b.stand) a[k] += b.stand[k];
    for (const k in b.run) r[k] += b.run[k];
    return mix(a, r, ease(mv));
  }};
})();
