# Генератор иллюстраций для слайдов и карточек (game/img/art_*.png). Запуск: python3 tools/make_art.py
# Нужны: Pillow, numpy. Внимание: перезапишет картинки в game/img.
import numpy as np, random, math, os
from PIL import Image, ImageDraw, ImageFont
W,H=336,189
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'game','img')+'/'
B4=np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]])/16.0-.5
try: F7=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',8)
except Exception: F7=None
def hx(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
def new(c='#000000'): return Image.new('RGB',(W,H),hx(c))
def mixc(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def vgrad(im,stops):
    a=np.zeros((H,W,3),np.float32)
    for y in range(H):
        t=y/(H-1)
        for k in range(len(stops)-1):
            if stops[k][0]<=t<=stops[k+1][0]:
                u=(t-stops[k][0])/max(1e-6,stops[k+1][0]-stops[k][0]);a[y,:]=mixc(hx(stops[k][1]),hx(stops[k+1][1]),u);break
        else:a[y,:]=hx(stops[-1][1])
    return Image.fromarray(a.astype(np.uint8))
def glow(im,x,y,r,col,k=1.0,steps=6,sq=1.0):
    a=np.asarray(im).astype(np.float32);yy,xx=np.mgrid[0:H,0:W]
    d=np.sqrt(((xx-x)/sq)**2+(yy-y)**2)/r;m=np.clip(1-d,0,1);m=np.floor(m*steps)/steps
    a+=m[...,None]*np.array(hx(col),np.float32)*k;return Image.fromarray(np.clip(a,0,255).astype(np.uint8))
def darken(im,k=.5,y0=0,y1=H):
    a=np.asarray(im).astype(np.float32);a[y0:y1]*=k;return Image.fromarray(a.astype(np.uint8))
def vignette(im,k=.75,steps=5):
    a=np.asarray(im).astype(np.float32);yy,xx=np.mgrid[0:H,0:W];d=np.maximum(abs(xx-W/2)/(W/2),abs(yy-H/2)/(H/2))
    m=np.floor(np.clip((d-.45)/.55,0,1)*steps)/steps;a*=(1-m*k)[...,None];return Image.fromarray(a.astype(np.uint8))
def noisefog(im,y0,y1,col,amp,seed,scale=6):
    r=np.random.RandomState(seed);a=np.asarray(im).astype(np.float32)
    n=r.rand(H//scale+2,W//scale+2);n=np.kron(n,np.ones((scale,scale)))[:H,:W]
    for _ in range(2):n=(n+np.roll(n,3,0)+np.roll(n,5,1))/3
    yy=np.arange(H)[:,None];m=np.clip(1-abs((yy-(y0+y1)/2)/((y1-y0)/2+1)),0,1)*n*amp
    m=np.floor(m*6)/6;a+=m[...,None]*np.array(hx(col),np.float32);return Image.fromarray(np.clip(a,0,255).astype(np.uint8))
def rain(im,seed,n=130,col=(170,205,225),al=.5,ln=6,slant=1):
    r=random.Random(seed);d=ImageDraw.Draw(im,'RGBA')
    for _ in range(n):
        x=r.randrange(-10,W);y=r.randrange(0,H);d.line([(x,y),(x-slant,y+ln)],fill=col+(int(255*al*r.uniform(.4,1)),))
    return im
def bld(d,x,y,w,h,col,lit=.0,seed=1,wc=('#e5c07b','#7fd8d0'),edge=None):
    c=hx(col);d.rectangle([x,y,x+w-1,y+h],fill=c)
    d.rectangle([x,y,x+w-1,y],fill=mixc(c,(255,255,255),.18));d.rectangle([x+w-2,y,x+w-1,y+h],fill=mixc(c,(0,0,0),.35))
    r=random.Random(seed)
    if lit>0:
        for wy in range(y+3,y+h-2,4):
            for wx in range(x+2,x+w-3,3):
                if r.random()<lit:d.point((wx,wy),fill=hx(wc[0] if r.random()<.82 else wc[1]))
def person(d,x,y,h,col,coat=True,carry=None):
    c=hx(col);hd=max(2,h//6);d.ellipse([x-hd//2,y-h,x+hd//2+1,y-h+hd+1],fill=c)
    d.rectangle([x-hd,y-h+hd+1,x+hd,y-h//3],fill=c)
    if coat:d.polygon([(x-hd,y-h//3),(x+hd,y-h//3),(x+hd+1,y-h//6),(x-hd-1,y-h//6)],fill=c)
    d.rectangle([x-hd,y-h//3,x-hd+1,y],fill=c);d.rectangle([x+hd-1,y-h//3,x+hd,y],fill=c)
def fin(im,seed=0,colors=56,amp=13):
    a=np.asarray(im).astype(np.float32);h,w=a.shape[:2];n=np.tile(B4,(h//4+1,w//4+1))[:h,:w,None]*amp
    q=Image.fromarray(np.clip(a+n,0,255).astype(np.uint8)).quantize(colors=colors,method=Image.MEDIANCUT,dither=Image.NONE)
    return q
def skyline(im,y,seed,layers,pal):
    d=ImageDraw.Draw(im)
    for li,(hmin,hmax,col,lit) in enumerate(layers):
        r=random.Random(seed+li);x=-r.randrange(0,10)
        while x<W:
            bw=r.randrange(9,26);bh=r.randrange(hmin,hmax);bld(d,x,y-bh,bw,bh+4,col,lit,seed+x+li*7)
            if r.random()<.18:d.rectangle([x+bw//2,y-bh-r.randrange(5,12),x+bw//2,y-bh],fill=hx(col));d.point((x+bw//2,y-bh-9),fill=(255,60,50))
            x+=bw+r.randrange(0,3)
    return im
def stars(im,seed,n=60,ymax=70):
    r=random.Random(seed);d=ImageDraw.Draw(im)
    for _ in range(n):d.point((r.randrange(W),r.randrange(ymax)),fill=mixc((120,130,160),(235,240,255),r.random()))
    return im
def moon(im,x,y,rad,col='#e8e6cc',halo='#6a78a0'):
    im=glow(im,x,y,rad*5,halo,.55,7);d=ImageDraw.Draw(im);d.ellipse([x-rad,y-rad,x+rad,y+rad],fill=hx(col));d.ellipse([x-rad+3,y-rad+1,x+rad+3,y+rad+1],fill=mixc(hx(col),(0,0,0),.0))
    return im
# ================= СЦЕНЫ =================
def cityscape(v='night'):
    P={'night':('#05081a','#14123a','#3a2440','#07101c',('#0a1124','#060b18','#04070f')),
       'dawn':('#243a66','#8a5a78','#f0a060','#3a3550',('#2a3454','#1c2440','#121a30')),
       'ruin':('#1a0d0d','#3a1612','#6a2a14','#120808',('#1c1010','#120a0a','#0a0606')),
       'blast':('#2a1008','#7a3010','#ffb050','#1a0c08',('#2a1410','#1a0c0a','#100606')),
       'dome':('#04101c','#0c2a3c','#1a5a64','#06121c',('#0a1c2c','#071420','#040c14')),
       'siege':('#080810','#16162a','#2a2438','#08090f',('#10121e','#0a0c16','#06070e'))}[v]
    im=vgrad(new(),[(0,P[0]),(.45,P[1]),(.62,P[2]),(.63,P[3]),(1,P[3])])
    if v in('night','siege','dome'):im=stars(im,5,80);im=moon(im,262,30,8)
    if v=='dawn':im=glow(im,170,118,90,'#ffcf80',.8,8,1.8)
    if v=='blast':im=glow(im,170,100,110,'#fff0a0',1.2,9,1.4)
    sc={'night':(.34,.2,.1),'dawn':(.18,.12,.06),'ruin':(.04,.03,.02),'blast':(.1,.06,.03),'dome':(.4,.28,.16),'siege':(.2,.12,.06)}[v]
    lay=[(16,42,P[4][0],sc[0]),(22,58,P[4][1],sc[1]),(34,76,P[4][2],sc[2])]
    d0=ImageDraw.Draw(im)
    im=skyline(im,120,11,lay[:1],P);im=noisefog(im,86,126,'#6a7090' if v!='ruin' else '#503028',.6,3)
    im=skyline(im,134,23,lay[1:2],P);im=skyline(im,150,37,lay[2:],P)
    d=ImageDraw.Draw(im);d.rectangle([0,150,W,H],fill=hx(P[3]))
    # река/мокрый асфальт с отражениями
    a=np.asarray(im).astype(np.float32);ref=a[100:150][::-1]*.45;a[151:151+min(38,len(ref))]=ref[:38]*.9+a[151:151+min(38,len(ref))]*.1
    im=Image.fromarray(a.astype(np.uint8));d=ImageDraw.Draw(im)
    for y in range(152,H,3):d.line([(0,y),(W,y)],fill=mixc(hx(P[3]),(255,255,255),.05))
    if v=='ruin':
        for sx in(60,150,240,300):
            im=glow(im,sx,128,26,'#ff6a20',.8,6,1.2);im=noisefog(im,20,120,'#201010',1.4,sx)
    if v=='blast':
        d=ImageDraw.Draw(im);d.polygon([(150,150),(160,110),(140,90),(170,60),(200,90),(180,110),(190,150)],fill=(255,150,40));d.ellipse([130,38,210,92],fill=(255,190,70))
        im=glow(im,170,64,70,'#ffe090',1.0,8)
    if v=='dome':
        d=ImageDraw.Draw(im,'RGBA');d.ellipse([-40,40,W+40,260],outline=(120,230,230,120),width=2)
        for i in range(3):im=glow(im,60+i*100,40,60,'#40d0d0',.25,5,1.6)
    if v=='siege':
        d=ImageDraw.Draw(im,'RGBA')
        for bx,ang in((70,-.5),(250,.4),(160,.1)):
            d.polygon([(bx,148),(bx+math.tan(ang-.07)*150,0),(bx+math.tan(ang+.07)*150,0)],fill=(210,230,240,34))
        d.rectangle([0,148,W,152],fill=(30,34,46))
        for x in range(4,W,12):d.line([(x,134),(x,152)],fill=(42,48,62));
        d.line([(0,138),(W,138)],fill=(42,48,62))
    if v in('night','dawn','siege'):
        for lx in(30,90,200,280):
            im=glow(im,lx,148,20,'#ffb050' if v!='siege' else '#c0d8ff',.45,5,1.3)
            ImageDraw.Draw(im).rectangle([lx-1,136,lx,150],fill=(20,22,30))
    if v=='night':im=rain(im,3,120)
    if v=='dawn':
        d=ImageDraw.Draw(im)
        for px,ph in((120,16),(142,14),(156,17),(180,15)):person(d,px,150,ph,'#0c0a12')
    return vignette(im,.55)
def gate():
    im=vgrad(new(),[(0,'#06091a'),(.5,'#10152e'),(1,'#080a14')]);d=ImageDraw.Draw(im)
    d.rectangle([0,70,W,H],fill=hx('#0c1018'))
    # здание проходной
    d.rectangle([120,34,300,150],fill=hx('#161c28'));d.rectangle([120,34,300,38],fill=hx('#2a3446'));d.rectangle([296,34,300,150],fill=hx('#0a0e16'))
    for k in range(5):d.rectangle([128+k*34,50,150+k*34,66],fill=hx('#0a0e16'))
    d.rectangle([186,88,236,150],fill=hx('#0a0c10'));d.rectangle([190,92,232,150],fill=hx('#ffd98a'))
    d.rectangle([186,84,236,88],fill=hx('#3a465a'));d.rectangle([196,70,226,82],fill=hx('#0a0c10'))
    if F7:d.text((199,72),'ВХОД',font=F7,fill=hx('#e0453a'))
    im=glow(im,211,120,60,'#ffa850',.9,8,1.1);d=ImageDraw.Draw(im)
    d.rectangle([205,92,207,150],fill=hx('#7a5a28'));d.rectangle([215,92,217,150],fill=hx('#7a5a28'))
    # забор
    for x in range(0,120,5):d.line([(x,92),(x,150)],fill=hx('#1e2838'))
    for y in range(92,150,5):d.line([(0,y),(120,y)],fill=hx('#1a2230'))
    d.line([(0,88),(120,88)],fill=hx('#3a465a'),width=2)
    # асфальт, лужи с отражением
    a=np.asarray(im).astype(np.float32);ref=a[96:150][::-1]*.55;a[150:150+39]=np.clip(ref[:39]+a[150:189]*.3,0,255);im=Image.fromarray(a.astype(np.uint8))
    im=glow(im,211,160,50,'#ffa850',.5,6,1.9);d=ImageDraw.Draw(im)
    person(d,150,150,46,'#05060a');d.rectangle([146,112,158,150],fill=hx('#05060a'))
    im=glow(im,40,60,40,'#c0d8ff',.3,5);d.line([(40,52),(40,92)],fill=hx('#20262e'),width=2)
    im=noisefog(im,118,160,'#506078',.7,5);im=rain(im,9,170,al=.55,ln=7)
    return vignette(im,.6)
def lab():
    im=vgrad(new(),[(0,'#0c1824'),(1,'#050a10')]);d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,120],fill=hx('#17222e'));
    for x in range(0,W,28):d.line([(x,0),(x,120)],fill=hx('#101a24'))
    d.rectangle([0,120,W,H],fill=hx('#0e1620'))
    for y in range(120,H,6):d.line([(0,y),(W,y)],fill=hx('#141f2a'))
    d.rectangle([40,24,170,84],fill=hx('#0a1218'));d.rectangle([44,28,166,80],fill=hx('#1a3a52'))   # окно в соседний зал
    for i in range(6):d.line([(44+i*22,28),(44+i*22,80)],fill=hx('#0e1c28'))
    for bx in(20,110,200,260):
        d.rectangle([bx,100,bx+62,130],fill=hx('#2a3a4a'));d.rectangle([bx,98,bx+62,102],fill=hx('#5a7488'));d.rectangle([bx,130,bx+62,140],fill=hx('#0c141c'))
        d.rectangle([bx+6,82,bx+26,98],fill=hx('#0a1418'));d.rectangle([bx+8,84,bx+24,96],fill=hx('#2fe0b0'))
        for k in range(3):d.line([(bx+10,87+k*4),(bx+10+8+k*3,87+k*4)],fill=hx('#0a2a22'))
        for k in range(4):
            c=['#e0453a','#e5a93b','#4cc9c0','#9fe8d6'][k];d.rectangle([bx+34+k*6,88,bx+37+k*6,98],fill=hx(c))
    im=glow(im,36,90,36,'#2fe0b0',.5,5);im=glow(im,216,90,36,'#2fe0b0',.4,5)
    for lx in(60,170,280):d=ImageDraw.Draw(im);d.rectangle([lx-24,6,lx+24,9],fill=hx('#e8f4fa'));im=glow(im,lx,10,70,'#a0c8e0',.35,6,1.2)
    d=ImageDraw.Draw(im);d.polygon([(280,36),(298,36),(298,60),(289,70),(280,60)],fill=hx('#e5c53b'));d.polygon([(284,40),(294,40),(294,57),(289,64),(284,57)],fill=hx('#14171a'))
    person(d,306,150,40,'#05080c')
    return vignette(noisefog(im,100,140,'#406070',.5,4),.55)
def tank():
    im=vgrad(new(),[(0,'#04080c'),(1,'#02040a')]);d=ImageDraw.Draw(im)
    for x in range(0,W,20):d.line([(x,0),(x,H)],fill=hx('#080e16'))
    d.rectangle([108,10,228,150],fill=hx('#0a2a2a'));d.rectangle([108,10,228,16],fill=hx('#3a5a62'));d.rectangle([100,146,236,160],fill=hx('#2a3a44'))
    im=glow(im,168,86,120,'#2fe0a0',.55,9,.9);d=ImageDraw.Draw(im)
    d.rectangle([114,20,222,146],fill=hx('#0f4a3c'))
    r=random.Random(3)
    for _ in range(40):d.point((r.randrange(116,220),r.randrange(22,144)),fill=hx('#9fe8d6'))
    d.polygon([(150,40),(160,20),(168,60),(180,90),(172,120),(166,140),(158,100),(152,70)],outline=hx('#d8ffee'))
    d.line([(160,20),(170,70),(158,120),(168,146)],fill=hx('#ffffff'))
    person(d,170,144,60,'#04241c',coat=False);im=glow(im,170,84,16,'#9fffd8',.4,4)
    d=ImageDraw.Draw(im);d.ellipse([268,40,300,72],fill=hx('#10141a'),outline=hx('#5a6a74'));d.line([(284,56),(292,46)],fill=hx('#e0453a'),width=2)
    im=glow(im,284,56,28,'#ff3b2f',.5,5)
    return vignette(noisefog(im,120,170,'#2fe0a0',.5,8),.7)
def levels():
    im=vgrad(new(),[(0,'#080c1c'),(.2,'#141428'),(.2001,'#0a0e16'),(1,'#06080e')]);im=stars(im,4,50,26);d=ImageDraw.Draw(im)
    x=0;r=random.Random(5)
    while x<W:
        bw=r.randrange(10,24);bh=r.randrange(8,22);d.rectangle([x,38-bh,x+bw,38],fill=hx('#070a14'));x+=bw+1
    d.rectangle([0,38,W,42],fill=hx('#1c2430'));
    FL=[168,136,104]
    for i,y in enumerate(FL):
        d.rectangle([20,y-28,316,y],fill=hx(['#16222e','#1a2230','#1e2433'][i]));d.rectangle([20,y,316,y+4],fill=hx('#3a4a5a'))
        r2=random.Random(i)
        for k in range(14):
            wx=24+k*21
            if r2.random()<.55:d.rectangle([wx,y-28,wx+3,y],fill=hx('#0e1620'))
        for wx in range(30,310,40):d.rectangle([wx,y-24,wx+12,y-22],fill=hx('#e8f4fa'))
    # лестницы зигзагом
    for (lx,yb) in((280,168),(40,136)):
        for k in range(8):d.line([(lx-5,yb-k*4),(lx+5,yb-k*4-0)],fill=hx('#8fa6b4'))
        d.line([(lx-5,yb-32),(lx-5,yb)],fill=hx('#8fa6b4'));d.line([(lx+5,yb-32),(lx+5,yb)],fill=hx('#8fa6b4'))
    for i,y in enumerate(FL):   # оборудование
        for k in range(5):d.rectangle([60+k*36,y-12,60+k*36+22,y],fill=hx('#2a3a4a'));d.rectangle([60+k*36+4,y-18,60+k*36+10,y-12],fill=hx(['#2fe0b0','#e5a93b','#e0453a','#4cc9c0','#9fe8d6'][(k+i)%5]))
    person(d,60,168,16,'#f0f4f8');im=glow(im,60,156,22,'#fff0b0',.6,5)
    im=glow(im,300,76,26,'#3fd68a',.55,5);d=ImageDraw.Draw(im);d.rectangle([292,60,308,76],fill=hx('#1e3b2f'),outline=hx('#3fd68a'))
    # красный пульс в глубине
    im=glow(im,170,150,60,'#ff3b2f',.22,6,2.0)
    return vignette(rain(im,2,40,al=.3),.55)
def dispatch():
    im=vgrad(new(),[(0,'#0a0e1a'),(1,'#06080e')]);d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,86],fill=hx('#0c1624'))     # окно с городом
    r=random.Random(6)
    for x in range(0,W,14):
        bh=r.randrange(14,50);d.rectangle([x,86-bh,x+12,86],fill=hx('#080e1a'))
        for wy in range(86-bh+3,84,4):
            for wx in range(x+2,x+11,3):
                if r.random()<.35:d.point((wx,wy),fill=hx('#e5c07b'))
    d.rectangle([0,86,W,H],fill=hx('#0e0c12'));d.rectangle([0,128,W,H],fill=hx('#1c1612'));d.rectangle([0,126,W,130],fill=hx('#3a2e22'))
    d.rectangle([90,50,250,122],fill=hx('#05080c'));d.rectangle([94,54,246,118],fill=hx('#0e2a3a'))
    for gx in range(94,246,12):d.line([(gx,54),(gx,118)],fill=hx('#12384c'))
    for gy in range(54,118,12):d.line([(94,gy),(246,gy)],fill=hx('#12384c'))
    d.line([(120,54),(150,118)],fill=hx('#2a6a8a'),width=2);d.line([(94,90),(246,76)],fill=hx('#2a6a8a'),width=2)
    for (mx,my) in((130,80),(190,96),(160,66),(220,72)):
        im=glow(im,mx,my,12,'#ff3b2f',.8,4);ImageDraw.Draw(im).rectangle([mx-1,my-1,mx+1,my+1],fill=hx('#ff8a7a'))
    im=glow(im,170,88,100,'#3a9ac0',.35,8,1.3);d=ImageDraw.Draw(im)
    d.rectangle([150,122,190,128],fill=hx('#0a0e14'));d.rectangle([20,110,70,128],fill=hx('#0a0e14'));d.rectangle([24,114,66,124],fill=hx('#12384c'))
    d.ellipse([268,104,288,126],fill=hx('#e8e0d0'));d.rectangle([286,110,292,118],fill=hx('#e8e0d0'));d.ellipse([272,108,284,114],fill=hx('#3a2a1a'))
    im=glow(im,278,100,16,'#ffb060',.3,4)
    d=ImageDraw.Draw(im);d.ellipse([300,20,324,44],fill=hx('#f0eadc'),outline=hx('#3a3a3a'));d.line([(312,32),(312,24)],fill=hx('#202020'));d.line([(312,32),(318,34)],fill=hx('#202020'))
    d.arc([40,140,120,200],200,340,fill=hx('#1a1a22'),width=3)
    im=glow(im,60,150,60,'#ffb060',.28,6,1.5)
    return vignette(im,.6)
def streets():
    im=cityscape('night').convert('RGB');d=ImageDraw.Draw(im,'RGBA')
    d.rectangle([0,140,W,H],fill=(8,10,16,230))
    for (cx_,col) in((70,(224,60,50)),(250,(60,100,255))):
        d.rectangle([cx_-26,148,cx_+26,168],fill=(18,22,32,255));d.rectangle([cx_-20,142,cx_+20,150],fill=(26,32,46,255));d.rectangle([cx_-26,158,cx_+26,160],fill=(220,220,230,255))
        im=glow(im,cx_,150,70,'#%02x%02x%02x'%col,.5,7,1.6);d=ImageDraw.Draw(im,'RGBA')
    im=glow(im,160,152,60,'#ff3b2f',.2,5,2.2)
    for sx in(120,170,210):person(ImageDraw.Draw(im),sx,172,22,'#05070a')
    d=ImageDraw.Draw(im,'RGBA')
    for x in range(100,230,10):d.line([(x,138),(x+5,146)],fill=(230,200,40,230),width=1)
    return vignette(rain(im,12,120),.55)
def convoy(burn=False):
    im=vgrad(new(),[(0,'#0a0a1c'),(.5,'#2a1a30'),(.62,'#4a2a30'),(.63,'#080c14'),(1,'#06080e')]);d=ImageDraw.Draw(im)
    im=skyline(im,112,17,[(12,36,'#0c1022',.3)],None);d=ImageDraw.Draw(im)
    d.rectangle([0,118,W,128],fill=hx('#101620'));d.rectangle([0,128,W,H],fill=hx('#080a10'))
    for x in range(0,W,22):d.rectangle([x,118,x+2,160],fill=hx('#0c1018'))
    d.rectangle([0,150,W,152],fill=hx('#1c2430'))
    for i,(bx,by,w) in enumerate((10,138,64),(90,138,64),(170,138,64),(250,138,64)) if False else []:pass
    for bx in(8,92,176,260):
        d.rectangle([bx,128,bx+68,150],fill=hx('#e5b83a'));d.rectangle([bx,128,bx+68,131],fill=hx('#ffe28a'));d.rectangle([bx+2,150,bx+66,152],fill=hx('#06080c'))
        for k in range(8):d.rectangle([bx+4+k*8,134,bx+9+k*8,141],fill=hx('#2a3a4a'))
        for wx in(bx+8,bx+54):d.ellipse([wx-4,148,wx+4,156],fill=hx('#06080c'))
        im=glow(im,bx+68,146,16,'#fff0b0',.8,4)
        im=glow(im,bx+70,150,40,'#ffe28a',.25,5,2.2);d=ImageDraw.Draw(im)
    r=random.Random(8)
    for k in range(40):person(d,r.randrange(4,332),176+r.randrange(0,6),14+r.randrange(0,4),'#04060a')
    d.polygon([(200,22),(226,26),(234,30),(228,33),(204,30)],fill=hx('#05070c'));d.line([(206,21),(228,21)],fill=hx('#05070c'))
    im=glow(im,226,32,14,'#ff4030',.6,4)
    d=ImageDraw.Draw(im,'RGBA');d.polygon([(226,34),(180,160),(260,160)],fill=(230,240,255,26))
    if burn:
        for sx in(60,290):im=glow(im,sx,110,40,'#ff6a20',.8,7,1.2);im=noisefog(im,20,112,'#150c0c',1.3,sx)
    return vignette(rain(im,4,60,al=.3),.55)
def hq():
    im=vgrad(new(),[(0,'#080c14'),(1,'#04060a')]);d=ImageDraw.Draw(im)
    for sx in range(14,W-30,56):
        d.rectangle([sx,12,sx+48,52],fill=hx('#05080c'),outline=hx('#1c2c3a'));d.rectangle([sx+3,15,sx+45,49],fill=hx(['#0e2a3a','#12303a','#2a1018'][(sx//56)%3]))
        for k in range(4):d.line([(sx+6,20+k*8),(sx+6+10+k*6,20+k*8)],fill=hx('#4cc9c0'))
        im=glow(im,sx+24,32,40,'#3a9ac0',.28,5);d=ImageDraw.Draw(im)
    d.polygon([(40,96),(300,96),(330,160),(10,160)],fill=hx('#0a2430'));d.polygon([(40,96),(300,96),(296,100),(44,100)],fill=hx('#2a6a8a'))
    for gx in range(30,310,30):d.line([(gx,98),(gx-20+0,158)],fill=hx('#12485e'))
    for gy in range(104,158,14):d.line([(30,gy),(310,gy)],fill=hx('#12485e'))
    r=random.Random(2)
    for _ in range(12):
        mx,my=r.randrange(70,270),r.randrange(104,152);im=glow(im,mx,my,10,'#ff3b2f',.8,4);ImageDraw.Draw(im).point((mx,my),fill=hx('#ffb0a0'))
    im=glow(im,170,128,130,'#2a9ac0',.4,8,1.8);d=ImageDraw.Draw(im)
    for (px,ph) in((30,60),(70,56),(260,58),(300,62)):person(d,px,176,ph,'#03050a')
    d.ellipse([160,150,180,170],fill=hx('#02040a'));d.rectangle([150,166,190,189],fill=hx('#02040a'))
    return vignette(noisefog(im,60,100,'#3a6a8a',.4,9),.6)
def country():
    im=vgrad(new(),[(0,'#06101a'),(1,'#040a12')]);d=ImageDraw.Draw(im)
    for gx in range(0,W,16):d.line([(gx,0),(gx,H)],fill=hx('#0a1a28'))
    for gy in range(0,H,16):d.line([(0,gy),(W,gy)],fill=hx('#0a1a28'))
    pts=[(60,120),(48,84),(74,52),(120,36),(170,44),(214,34),(262,56),(284,92),(268,128),(232,150),(190,146),(160,162),(112,158),(80,146)]
    d.polygon(pts,fill=hx('#1c3a36'),outline=hx('#3a8a86'))
    r=random.Random(11)
    for _ in range(300):
        x,y=r.randrange(48,290),r.randrange(34,162)
        if d.getpixel((x,y))==hx('#1c3a36') if hasattr(d,'getpixel') else True:pass
    a=np.asarray(im).astype(np.float32);yy,xx=np.mgrid[0:H,0:W]
    for (cx_,cy_,rr) in((160,100,50),(215,80,30),(110,70,26),(120,128,24)):
        dd=np.sqrt((xx-cx_)**2+((yy-cy_)*1.1)**2)/rr;m=np.clip(1-dd,0,1);m=np.floor(m*7)/7;a[...,0]+=m*190;a[...,1]-=m*20
    im=Image.fromarray(np.clip(a,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
    for (cx_,cy_) in((160,100),(110,70),(215,80),(120,128),(240,120),(90,100)):d.rectangle([cx_-1,cy_-1,cx_+1,cy_+1],fill=hx('#ffd98a'))
    for i in range(4):d.ellipse([160-14-i*14,100-14-i*14,160+14+i*14,100+14+i*14],outline=hx('#7a2024'))
    return vignette(im,.55)
def bunker():
    im=vgrad(new(),[(0,'#0a0c10'),(1,'#04050a')]);d=ImageDraw.Draw(im)
    vx,vy=168,92
    d.polygon([(0,0),(W,0),(vx+30,vy-24),(vx-30,vy-24)],fill=hx('#12171e'));d.polygon([(0,H),(W,H),(vx+30,vy+24),(vx-30,vy+24)],fill=hx('#0c1016'))
    d.polygon([(0,0),(vx-30,vy-24),(vx-30,vy+24),(0,H)],fill=hx('#161d26'));d.polygon([(W,0),(vx+30,vy-24),(vx+30,vy+24),(W,H)],fill=hx('#10161e'))
    d.rectangle([vx-30,vy-24,vx+30,vy+24],fill=hx('#02030a'))
    for k in range(1,8):
        t=k/8;x0=vx-30-(vx-30)*t*1.2;
        d.line([(vx-30-(vx-30)*t,vy-24-(vy-24)*t),(vx-30-(vx-30)*t,vy+24+(H-vy-24)*t)],fill=hx('#0a0e14'))
        d.line([(vx+30+(W-vx-30)*t,vy-24-(vy-24)*t),(vx+30+(W-vx-30)*t,vy+24+(H-vy-24)*t)],fill=hx('#0a0e14'))
    for k in(2,4,6):
        t=k/8;d.rectangle([vx-30-(vx-30)*t+2,18+int(t*0)-0,vx-30-(vx-30)*t+6,24],fill=hx('#5a1a16'))
    for lx,ly in((40,20),(296,20),(100,50),(236,50)):im=glow(im,lx,ly,40,'#ff2a20',.5,6,1.4)
    d=ImageDraw.Draw(im,'RGBA');d.polygon([(110,170),(70,189),(150,189)],fill=(220,235,245,34))
    for sx,sh in((100,70),(150,56),(214,64)):person(d,sx,176,sh,'#030508');d.rectangle([sx+4,176-sh//2,sx+14,176-sh//2+2],fill=(8,10,14,255))
    for bx in((92,176),(220,168)):
        d.polygon([(bx[0],bx[1]),(bx[0]-6,60),(bx[0]+40,60)],fill=(230,240,255,22)) if False else None
    im=glow(im,172,84,50,'#ff4030',.25,5,1.4)
    return vignette(noisefog(im,60,130,'#4a2a2a',.8,12),.65)
SCENES={'city':lambda:cityscape('night'),'gate':gate,'lab':lab,'tank':tank,'levels':levels,'dispatch':dispatch,'streets':streets,'convoy':convoy,'bridge':lambda:convoy(True),'hq':hq,'country':country,'bunker':bunker,
        'dawn':lambda:cityscape('dawn'),'ruin':lambda:cityscape('ruin'),'blast':lambda:cityscape('blast'),'dome':lambda:cityscape('dome'),'siege':lambda:cityscape('siege')}
if __name__=='__main__':
    os.makedirs(OUT,exist_ok=True)
    for f in os.listdir(OUT):os.remove(OUT+f)
    for k,fn in SCENES.items():fin(fn()).save(OUT+f'art_{k}.png',optimize=True)
    names=sorted(os.listdir(OUT));print(len(names),'files',sum(os.path.getsize(OUT+n) for n in names)//1024,'KB')
    sheet=Image.new('RGB',(W*4,H*5))
    for i,n in enumerate(names):sheet.paste(Image.open(OUT+n).convert('RGB'),((i%4)*W,(i//4)*H))
    os.makedirs(os.path.join(ROOT,'build'),exist_ok=True)
    sheet.resize((W*2,int(H*2.5)),Image.NEAREST).save(os.path.join(ROOT,'build','art_sheet.png'))
