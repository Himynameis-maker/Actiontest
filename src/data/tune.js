/**
 * @file data/tune.js  調整値（エディタのスライダーで即変更→「コピー」でここに貼り戻す）
 * joint: 関節の微調整 [x前+, y下+] ゲームpx / bias: ポーズ角への加算(rad)。首のバランスは bias.*.head と joint.head
 * hurt: 被弾箱(足元中心, 向き基準, y上が負) / hit: 槍の攻撃判定(握り点から穂先方向 from〜to の距離, 半径r)
 * move: 走り速度px/s と脚の回転速度 / view.zoom: 表示拡大 / rig.scale: 画像px→ゲームpx, rig.hand: 手首が前腕に追従する率
 * gait: 走りの接地割合/脚の伸び率(0〜1) / gaitPx: 膝上げ・張り出し・沈み・着地位置・空中高さ(px) / runPose: 前傾・腕振り・肘(rad)
 * farTint: 奥側の手足の色かぶせ(リロードで反映)
 */
SL.data.tune = {
  joint: {head: [0, 0], torso: [0, 0], shoulder: [0, 0], elbow: [0, 0], wrist: [0, 0], hip: [0, 0], knee: [0, 0], ankle: [0, 0]},
  bias: {stand: {tor: 0, head: 0, sp: 0}, run: {tor: 0, head: 0, sp: 0}},
  hurt: {x: -9, y: -100, w: 18, h: 100},
  hit: {from: 12, to: 80, r: 4},
  move: {speed: 240, cycle: 10},
  gait: {stance: 0.3, crouch: 0.88},
  gaitPx: {lift: 20, reach: 8, dip: 3, x0: 3, air: 14},
  runPose: {lean: 0.7, armN: 0.9, armF: 0.9, elbow: 0.35},
  view: {zoom: 2.2},
  rig: {scale: 0.078, hand: 0.3},
  farTint: 'rgba(80,90,130,0.45)'
};
