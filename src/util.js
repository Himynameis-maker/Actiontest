/** @file util.js  共通の名前空間 SL と数学ヘルパ。他の全ファイルより先に読む。 */
window.SL = window.SL || {data: {}};
SL.u = {
  lerp: (a, b, t) => a + (b - a) * t,
  ease: t => t * t * (3 - 2 * t),
  rot: (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; },
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  mix: (a, b, t) => { const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * t; return o; }, // 数値だけのposeを補間
  hash: n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }, // 決定的乱数(背景/将来の地形)
};
