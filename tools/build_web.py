# Сборка HTML-версии для компьютера: один самодостаточный файл (скрипты, стили, картинки, иконка внутри)
# Запуск из корня проекта: python3 tools/build_web.py  ->  dist/Epicenter-web.html
import re,base64,os,json
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A=os.path.join(ROOT,'game')
OUT=os.path.join(ROOT,'dist','Epicenter-web.html')
h=open(A+'/index.html',encoding='utf-8').read()
imgs={}
for f in sorted(os.listdir(A+'/img')):
    if f.endswith('.png'):
        imgs[f[:-4]]='data:image/png;base64,'+base64.b64encode(open(A+'/img/'+f,'rb').read()).decode()
pre='<script>const IMG='+json.dumps(imgs)+';</script>'
def js(m):
    return '<script>'+open(A+'/'+m.group(1),encoding='utf-8').read().replace('</script','<\\/script')+'</script>'
h=re.sub(r'<script src="(js/[^"]+)"></script>',js,h)
h=re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">',lambda m:'<style>'+open(A+'/'+m.group(1),encoding='utf-8').read()+'</style>',h)
i=h.index('<script>');h=h[:i]+pre+h[i:]
ico=base64.b64encode(open(os.path.join(ROOT,'icon','ic_launcher.png'),'rb').read()).decode()
h=h.replace('<title>Эпицентр</title>','<title>Эпицентр</title><link rel="icon" type="image/png" href="data:image/png;base64,'+ico+'">',1)
assert 'src="js/' not in h and 'href="css/' not in h
os.makedirs(os.path.dirname(OUT),exist_ok=True)
open(OUT,'w',encoding='utf-8').write(h)
print('web',OUT,len(h),'bytes;',len(imgs),'images')
