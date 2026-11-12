# v1シート専用(座標ハードコード)。リポジトリ直下で実行: python3 tools/cut_parts.py  ※要 pillow numpy scipy
from PIL import Image, ImageDraw
import numpy as np, os, json
from scipy import ndimage as ndi
SRC='assets/source/parts_sheet_v1.png'
im=Image.open(SRC).convert('RGB'); a=np.array(im).astype(int); g=a.mean(axis=2)
fg=~((g>205)&(a.max(axis=2)-a.min(axis=2)<14))
fg=ndi.binary_fill_holes(ndi.binary_closing(ndi.binary_opening(fg),iterations=2))
lab,n=ndi.label(fg)
def comp(x0,y0):  # 座標を含む成分
    return lab==lab[y0,x0]
M={'head':comp(220,200),'torso':comp(500,200),'pelvis':comp(800,300),'arm':comp(1285,250),'hand':comp(1430,330),
   'thigh':comp(200,650),'shin':comp(470,700),'foot':comp(790,880),'spear':comp(300,952)}
def rows(m,y0,y1): r=m.copy(); r[:y0]=False; r[y1:]=False; return r
M['uarm']=rows(M['arm'],70,264); M['farm']=rows(M['arm'],255,409); del M['arm']
# 腕の成分は手込みなので farm は y<409 で手(拳)を除去
PAD=4
def grade(rgb):
    lum=(0.299*rgb[...,0]+0.587*rgb[...,1]+0.114*rgb[...,2])/255
    t=np.clip((lum-0.28)/0.72,0,1)**2
    base=np.array([10,10,14]);hi=np.array([150,158,185])
    out=base*(1-t[...,None])+hi*t[...,None]
    red=(rgb[...,0]>140)&(rgb[...,0]-rgb[...,1]>60)
    out[red]=rgb[red]
    return out
info={}
for d in ('assets/player','assets/player_orig','assets/source'): os.makedirs(''+d,exist_ok=True)
Image.open(SRC).save('assets/source/parts_sheet_v1.png')
for k,m in M.items():
    ys,xs=np.where(m); x0,x1,y0,y1=xs.min()-PAD,xs.max()+1+PAD,ys.min()-PAD,ys.max()+1+PAD
    mm=ndi.binary_erosion(m,iterations=1)
    al=ndi.gaussian_filter(mm.astype(float),0.7)
    al=(np.clip(al,0,1)*255).astype(np.uint8)
    rgb=np.array(im).astype(float)
    def mk(rgbarr):
        o=np.dstack([np.clip(rgbarr,0,255).astype(np.uint8),al]); return Image.fromarray(o,'RGBA').crop((x0,y0,x1,y1))
    orig=mk(rgb); dark=mk(grade(rgb))
    sc=1.3 if k=='spear' else 1
    if k=='spear':
        orig=orig.rotate(90,expand=True); dark=dark.rotate(90,expand=True)
        orig=orig.resize((round(orig.width*sc),round(orig.height*sc)),Image.LANCZOS); dark=dark.resize(orig.size,Image.LANCZOS)
    orig.save(f'assets/player_orig/{k}.png'); dark.save(f'assets/player/{k}.png')
    info[k]=dict(x0=x0,y0=y0,w=orig.width,h=orig.height,sc=sc)
# 接続点(シート上の絶対座標)。スピアは回転後座標へ変換
ABS={'head':{'pivot':(215,300)},'torso':{'pivot':(500,330),'head':(481,55),'shoulder':(505,105)},
 'pelvis':{'pivot':(797,310),'top':(797,205)},'uarm':{'pivot':(1285,105),'end':(1285,295)},
 'farm':{'pivot':(1285,295),'end':(1285,404)},'hand':{'pivot':(1428,262),'grip':(1425,335)},
 'thigh':{'pivot':(222,505),'end':(185,815)},'shin':{'pivot':(462,510),'end':(472,880)},
 'foot':{'pivot':(722,815),'heel':(705,906),'toe':(866,903)}}
sp=info['spear']; W0=round(sp['w']/1.0)  # 回転後: 幅=元の高さ, 高さ=元の幅(×1.3)
ys,xs=np.where(M['spear']); sx0,sx1=xs.min()-PAD,xs.max()+1+PAD; sy0=ys.min()-PAD
def sp_pt(x,y): return ((y-sy0)*1.3,(sx1-1-x)*1.3)
ABS['spear']={'pivot':sp_pt(700,952),'tip':sp_pt(1505,952)}
parts={}
for k,pts in ABS.items():
    i=info[k]; d={'w':i['w'],'h':i['h']}
    for name,(x,y) in pts.items():
        if k=='spear': d[name]=[round(x),round(y)]
        else: d[name]=[round(x-i['x0']),round(y-i['y0'])]
    parts[k]=d
order=['pelvis','torso','head','uarm','farm','hand','thigh','shin','foot','spear']
def fmt(d): return '{'+', '.join(f"{k}: {v if isinstance(v,int) else json.dumps(v)}" for k,v in d.items())+'}'
open('src/data/parts.js','w',encoding='utf8').write('''/**
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
'''+'\n'.join(f"  {k}: {fmt(parts[k])}," for k in order)+'\n};\n')
# 確認用プレビュー(ピボット点つき)
cv=Image.new('RGB',(1500,1000),(27,27,33)); dr=ImageDraw.Draw(cv); x=10;y=10;rowh=0
for k in order:
    p=Image.open(f'assets/player/{k}.png')
    if k=='spear': p=p.resize((p.width//2,p.height//2))
    f=0.5 if k=='spear' else 1
    if x+p.width>1490: x=10;y+=rowh+10;rowh=0
    cv.paste(p,(x,y),p)
    for nm,v in parts[k].items():
        if nm in('w','h'):continue
        px,py=v
        c=(255,60,70) if nm=='pivot' else (60,255,120)
        dr.ellipse((x+px*f-4,y+py*f-4,x+px*f+4,y+py*f+4),fill=c)
    x+=p.width+14;rowh=max(rowh,p.height)
cv.save('preview.png'); print({k:(v['w'],v['h']) for k,v in parts.items()})
