"""Проверка ресурсов APK: resources.arsc, адаптивная иконка, ссылки манифеста. Запуск: python3 tools/verify_apk.py [путь к apk]"""
import struct, zipfile, os, sys
r32=lambda b,o:struct.unpack_from('<I',b,o)[0]; r16=lambda b,o:struct.unpack_from('<H',b,o)[0]
bad=0
def chk(c,m):
    global bad
    print(('OK   ' if c else 'FAIL ')+m)
    if not c: bad+=1
z=zipfile.ZipFile(sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist','Epicenter-demo.apk'));names=set(z.namelist())
a=z.read('resources.arsc')
print('== ARSC',len(a),'bytes')
zi=z.getinfo('resources.arsc');off=zi.header_offset+30+len(zi.filename.encode())+len(zi.extra)
chk(zi.compress_type==0 and off%4==0,'resources.arsc stored + 4-byte aligned in zip (Android 11+ requirement)')
chk(r16(a,0)==2 and r16(a,2)==12 and r32(a,4)==len(a) and r32(a,8)==1,'table header: type, headerSize=12, size==file, 1 package')
def pool(o):
    t,hs,sz=r16(a,o),r16(a,o+2),r32(a,o+4);assert t==1 and hs==28
    n,sc,fl,ss,sts=struct.unpack_from('<5I',a,o+8);assert sc==0 and ss==28+4*n and ss<sz
    out=[]
    for i in range(n):
        so=r32(a,o+28+4*i);p=o+ss+so;L=r16(a,p);out.append(a[p+2:p+2+2*L].decode('utf-16-le'));assert a[p+2+2*L:p+4+2*L]==b'\0\0'
    return out,sz
g,gs=pool(12);print('   global pool:',g)
po=12+gs;t,hs,psz=r16(a,po),r16(a,po+2),r32(a,po+4)
chk(t==0x200 and hs==288 and po+psz==len(a),'package chunk: type 0x200, headerSize 288, ends at file end')
pid=r32(a,po+8);nm=a[po+12:po+12+256].decode('utf-16-le').split('\0')[0];tsO,lpt,ksO,lpk,tio=struct.unpack_from('<5I',a,po+268)
chk(pid==0x7f and nm=='com.epicenter.game','package id 0x7f, name '+nm)
tp,tpsz=pool(po+tsO);kp,kpsz=pool(po+ksO);print('   types:',tp,'keys:',kp)
chk(ksO==tsO+tpsz,'key pool directly follows type pool')
o=po+ksO+kpsz;specs={};types=[]
while o<po+psz:
    t,hs,sz=r16(a,o),r16(a,o+2),r32(a,o+4);assert sz>=hs and o+sz<=po+psz,'chunk overrun'
    if t==0x202:
        tid,_,_,ec=struct.unpack_from('<BBHI',a,o+8);chk(hs==16 and sz==16+4*ec,f'typespec id={tid} entries={ec} sized right');specs[tid]=ec
    elif t==0x201:
        tid,fl,_,ec,es=struct.unpack_from('<BBHII',a,o+8);cs=r32(a,o+20)
        chk(tid!=0 and es>=hs and es-hs>=4*ec and es<=sz and es%4==0,f'type chunk id={tid} entries={ec} entriesStart ok (cfg size {cs})')
        chk(ec==specs.get(tid),'entryCount matches typespec')
        dens=r16(a,o+20+14);sdk=r16(a,o+20+24)
        ents={}
        for i in range(ec):
            eo=r32(a,o+hs+4*i)
            if eo==0xFFFFFFFF:continue
            p=o+es+eo;esz,efl,key=struct.unpack_from('<HHI',a,p);vsz,r0,dt,dat=struct.unpack_from('<HBBI',a,p+8)
            chk(esz==8 and vsz==8 and dt==3 and key<len(kp) and dat<len(g),f'  entry {i} key={kp[key]} -> {g[dat]!r}');ents[i]=g[dat]
        types.append((dens,sdk,ents))
    o+=sz
chk(o==po+psz,'chunks tile package exactly')
# разрешение иконки
print('== resolve 0x7f010000')
for dens,sdk,e in types:
    for i,pth in e.items():
        chk(pth in names,f'file exists in APK: {pth} (config density={dens:#x} sdk={sdk}, id 0x7f01{i:04x})')
# adaptive xml
x=z.read('res/mipmap-anydpi-v26/ic_launcher.xml');print('== adaptive icon AXML',len(x),'bytes');chk(r16(x,0)==3 and r32(x,4)==len(x),'root chunk size')
o=8;strs=[];rm=[];tags=[]
while o<len(x):
    t,hs,sz=r16(x,o),r16(x,o+2),r32(x,o+4)
    if t==1:
        n=r32(x,o+8);ss=r32(x,o+20);strs=[x[o+ss+r32(x,o+28+4*i)+2:o+ss+r32(x,o+28+4*i)+2+2*r16(x,o+ss+r32(x,o+28+4*i))].decode('utf-16-le') for i in range(n)]
    elif t==0x180:rm=[r32(x,o+8+4*i) for i in range((sz-8)//4)]
    elif t==0x102:
        nm_=r32(x,o+20);ac=r16(x,o+28);at=[]
        for k in range(ac):
            p=o+36+20*k;ns,an,raw,_,_,ty,da=struct.unpack_from('<IIIHBBI',x,p);at.append((strs[an],hex(rm[an]) if an<len(rm) else '-',ty,hex(da)))
        tags.append((strs[nm_],at))
    o+=sz
for t_,at in tags:print('   <'+t_+'>',at)
chk(tags[1][1][0][3]=='0x7f010002' and tags[2][1][0][3]=='0x7f010001','background->ic_launcher_bg (0x7f010002), foreground->ic_launcher_fg (0x7f010001)')
# манифест: ссылка на иконку
m=z.read('AndroidManifest.xml');chk(struct.pack('<I',0x7f010000) in m,'manifest contains reference 0x7f010000 (application icon)')
print('\nFAILURES:',bad)
