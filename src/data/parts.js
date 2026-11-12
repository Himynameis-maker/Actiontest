/**
 * @file data/parts.js  パーツ画像の寸法とピボット（編集対象）
 * 単位=画像px。右向き(+x前 / +y下)。画像は assets/player/<キー名>.png。無ければ仮ボーンで描画。
 * pivot = そのパーツの回転中心(親との関節)。他のキー(end/top/head/shoulder/hair/grip/tip/heel/toe)
 * = 子パーツの取り付け点や接地点。実画像を入れたら w,h,pivot,各点 を画像に合わせて書き換える。
 * 表示サイズは tune.rig.scale (画像px→ゲームpx)。
 */
SL.data.assetDir = 'assets/player/';
SL.data.parts = {
  pelvis: {w: 110, h: 150, pivot: [55, 100], top: [55, 20]},            // 原点=股関節。topが腰(胴体の付け根)
  torso:  {w: 120, h: 290, pivot: [60, 275], head: [62, 22], shoulder: [56, 60]}, // pivot=腰
  head:   {w: 140, h: 170, pivot: [66, 158], hair: [28, 62]},            // pivot=首。hair=ポニテ付け根
  hair:   {w: 60,  h: 260, pivot: [30, 14]},                              // 上端から垂れる
  uarm:   {w: 60,  h: 230, pivot: [30, 24], end: [30, 210]},
  farm:   {w: 50,  h: 220, pivot: [25, 20], end: [25, 200]},
  hand:   {w: 60,  h: 90,  pivot: [30, 12], grip: [30, 40]},             // grip=槍を握る点
  thigh:  {w: 90,  h: 250, pivot: [45, 28], end: [45, 230]},
  shin:   {w: 70,  h: 250, pivot: [35, 22], end: [35, 232]},
  foot:   {w: 150, h: 80,  pivot: [34, 14], heel: [10, 70], toe: [140, 70]}, // heel/toe=接地点(高さ合わせに使用)
  spear:  {w: 40,  h: 1400, pivot: [20, 900], tip: [20, 0]},             // pivot=握り位置。穂先が上向きの縦画像
};
