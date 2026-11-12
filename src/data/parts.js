/**
 * @file data/parts.js  パーツ画像の寸法とピボット（編集対象）
 * 単位=画像px。右向き(+x前 / +y下)。画像は assets/player/<キー名>.png (黒調整済み)。assets/player_orig/ は元色(グレー)。
 * 元シート: assets/source/parts_sheet_v1.png（v1: GPT生成。tools/cut_parts.py で切り出し）
 * pivot = そのパーツの回転中心(親との関節)。他のキー(end/top/head/shoulder/grip/tip/heel/toe) = 子の取り付け点や接地点。
 * 値は形状から推定した初期値。ベンチのスライダーで微調整→「parts.js 用にコピー」で貼り戻す。
 * 注意: v1の腕は「肩〜手首の1本腕」だったため、肘のプレート位置で uarm / farm に分割している。
 * 表示サイズは tune.rig.scale (画像px→ゲームpx)。
 */
SL.data.assetDir = 'assets/player/';
SL.data.parts = {
  pelvis: {w: 220, h: 220, pivot: [110, 140], top: [110, 35]},
  torso: {w: 192, h: 390, pivot: [90, 309], head: [71, 34], shoulder: [95, 84]},
  head: {w: 193, h: 252, pivot: [92, 218]},
  uarm: {w: 90, h: 202, pivot: [43, 39], end: [43, 229]},
  farm: {w: 90, h: 162, pivot: [47, 44], end: [47, 153]},
  hand: {w: 95, h: 152, pivot: [46, 18], grip: [43, 91]},
  thigh: {w: 150, h: 390, pivot: [91, 41], end: [54, 351]},
  shin: {w: 127, h: 446, pivot: [55, 44], end: [65, 414]},
  foot: {w: 195, h: 132, pivot: [38, 29], heel: [21, 120], toe: [182, 117]},
  spear: {w: 92, h: 1894, pivot: [46, 1050], tip: [46, 4]},
};
