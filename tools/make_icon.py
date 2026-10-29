# Генератор иконки приложения (пиксель-арт). Запуск: python3 tools/make_icon.py -> icon/*.png
# Нужны: Pillow, numpy
import numpy as np, math, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));ICON=os.path.join(ROOT,'icon')
from PIL import Image, ImageDraw
N=48
B4=np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]])/16.0
def lerp(a,b,t):return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def hexc(h):return tuple(int(h[i:i+2],16) for i in (1,3,5))
# ---------- фон 48x48
bg=Image.new('RGB',(N,N));P=bg.load()
top,mid,bot=hexc('#070b18'),hexc('#1b1030'),hexc('#2c0e14')
for y in range(N):
    for x in range(N):
        t=y/(N-1);c=lerp(top,mid,t/.55) if t<.55 else lerp(mid,bot,(t-.55)/.45)
        d=math.hypot(x-23.5,y-24.5);g=max(0,1-d/25)**1.6          # красное свечение эпицентра
        r=(c[0]+g*150,c[1]+g*20,c[2]+g*22)
        th=B4[y%4][x%4]-.5                                           # дизеринг
        P[x,y]=tuple(int(max(0,min(255,v+th*14))) for v in r)
d=ImageDraw.Draw(bg)
for R,col in((9,'#7a2024'),(14,'#5a1a22'),(19,'#44141c'),(24,'#34101a')):   # ударные кольца
    for a in range(0,360*2):
        ang=a/2*math.pi/180
        if (a//14)%2==0:
            x=int(round(23.5+math.cos(ang)*R));y=int(round(24.5+math.sin(ang)*R*.95))
            if 0<=x<N and 0<=y<N:P[x,y]=hexc(col)
rn=np.random.RandomState(7)
x=0
while x<N:    # силуэт города
    bw=int(rn.randint(3,7));bh=int(rn.randint(6,13))
    d.rectangle([x,N-bh,x+bw-1,N-1],fill=hexc('#06080f'))
    for wy in range(N-bh+2,N-1,3):
        for wx in range(x+1,x+bw-1,2):
            if rn.rand()<.4:P[wx,wy]=hexc('#e5c07b') if rn.rand()<.8 else hexc('#7fd8d0')
    x+=bw+int(rn.randint(0,2))
for i in range(26):    # дождь
    x=int(rn.randint(0,N));y=int(rn.randint(0,N-10))
    for k in range(3):
        xx,yy=x-k//2,y+k
        if 0<=xx<N and 0<=yy<N-8:
            c=P[xx,yy];P[xx,yy]=tuple(min(255,int(c[j]*.55+[130,160,185][j]*.45)) for j in range(3))
# ---------- передний план (RGBA)
fg=Image.new('RGBA',(N,N),(0,0,0,0));F=fg.load()
cxx,cyy=23.5,23.5
AM,AMD,AML=hexc('#ffc83a'),hexc('#c4781a'),hexc('#fff0a0')
for y in range(N):
    for x in range(N):
        dx,dy=x-cxx,y-cyy;r=math.hypot(dx,dy);ang=(math.degrees(math.atan2(-dy,dx))+360)%360
        col=None
        if r<=3.1:col=AM
        elif 5<=r<=12.2:
            for c in(90,210,330):
                if abs(((ang-c+180)%360)-180)<=30:col=AM;break
        if col:
            if dx+dy>5.5:col=AMD        # тень справа-снизу
            elif dx+dy<-8:col=AML       # блик слева-сверху
            F[x,y]=col+(255,)
ring=set()
for a in range(0,720):
    ang=a/2*math.pi/180
    if (a//12)%2==0:
        x=int(round(cxx+math.cos(ang)*13.6));y=int(round(cyy+math.sin(ang)*13.6));ring.add((x,y))
for x,y in ring:
    if 0<=x<N and 0<=y<N and F[x,y][3]==0:F[x,y]=hexc('#ff3b2f')+(255,)
# обводка
ol=fg.copy();O=ol.load()
for y in range(N):
    for x in range(N):
        if F[x,y][3]==0:
            for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                xx,yy=x+dx,y+dy
                if 0<=xx<N and 0<=yy<N and F[xx,yy][3]>0 and F[xx,yy][:3]!=hexc('#ff3b2f'):O[x,y]=hexc('#1a0a08')+(255,);break
fg=ol
# ---------- экспорт
os.makedirs(ICON,exist_ok=True);os.makedirs(os.path.join(ROOT,'build'),exist_ok=True)
fgL=fg.resize((432,432),Image.NEAREST);bgL=bg.convert('RGBA').resize((432,432),Image.NEAREST)
fgL.save(os.path.join(ICON,'ic_launcher_fg.png'),optimize=True);bgL.convert('RGB').save(os.path.join(ICON,'ic_launcher_bg.png'),optimize=True)
leg=Image.alpha_composite(bg.convert('RGBA'),fg).resize((192,192),Image.NEAREST)
m=Image.new('L',(192,192),0);ImageDraw.Draw(m).rounded_rectangle([0,0,191,191],radius=40,fill=255)
leg.putalpha(m);leg.save(os.path.join(ICON,'ic_launcher.png'),optimize=True)
prev=Image.new('RGB',(192*3+40,200),(30,36,44))
prev.paste(leg,(10,4),leg)
ad=Image.alpha_composite(bgL,fgL).resize((192,192),Image.NEAREST)
for k,(shape) in enumerate(['circle','squircle']):
    mk=Image.new('L',(192,192),0);dr=ImageDraw.Draw(mk)
    (dr.ellipse([0,0,191,191],fill=255) if shape=='circle' else dr.rounded_rectangle([0,0,191,191],radius=58,fill=255))
    t=ad.copy();t.putalpha(mk);prev.paste(t,(10+(k+1)*(192+10),4),t)
prev.save(os.path.join(ROOT,'build','icon_preview.png'));print('icons ok',[os.path.getsize(ICON+'/'+f) for f in sorted(os.listdir(ICON))])
