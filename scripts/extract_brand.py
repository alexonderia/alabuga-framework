"""Reproducible, read-only extraction of the corporate presentation."""
import hashlib, io, json, posixpath, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = next((root / 'docs').glob('*.pptx'))
output = root / 'public/assets/brand'
originals = root / 'design/pptx-originals'
output.mkdir(parents=True, exist_ok=True)
originals.mkdir(parents=True, exist_ok=True)
ns = {'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
backgrounds = {1,2,3,4,5,6,7,8,9,11,12,28,29,34,35,50,51,58,59,60}
logos = {10,37,40}
photos = {36,38,43,46,49,52,53,54,56}
decor = {39,48,55,57}
names = {1:'Светлая геометрия',2:'Белые грани',3:'Светлый рельеф',8:'Прозрачная геометрия',9:'Светлое поле',11:'Светлая сетка',12:'Белый ритм',28:'Геометрический слой',29:'Фоновый слой',34:'Светлый слой',35:'Прозрачный акцент',50:'Белая композиция',51:'Прозрачное поле',39:'Синий ромб',48:'Синий треугольник',55:'Градиентный многогранник',57:'Синий квадрат',4:'Глубокий синий',5:'Световая геометрия',6:'Синие грани',7:'Стеклянная геометрия',10:'Алабуга — горизонтальный логотип',37:'Алабуга — основной логотип',40:'Алабуга — белый логотип',36:'Архитектура',38:'Производственный корпус',43:'Специалист на производстве',46:'Промышленное производство',49:'Образование',52:'Роботизированное производство',53:'Команда',54:'Лаборатория',56:'Портрет на прозрачном фоне',58:'Светлый градиент',59:'Графика с цитатой',60:'Синее свечение'}
with zipfile.ZipFile(source) as z:
    usages = {}
    slides = sorted(n for n in z.namelist() if __import__('re').fullmatch(r'ppt/slides/slide\d+.xml',n))
    def media_dependencies(part, visited=None):
        visited = set() if visited is None else visited
        if part in visited:
            return set()
        visited.add(part)
        rel = posixpath.join(posixpath.dirname(part),'_rels',posixpath.basename(part)+'.rels')
        media = set()
        if rel in z.namelist():
            for entry in ET.fromstring(z.read(rel)):
                if entry.get('TargetMode') == 'External':
                    continue
                target = posixpath.normpath(posixpath.join(posixpath.dirname(part),entry.get('Target','')))
                if target.startswith('ppt/media/'):
                    media.add(target)
                elif entry.get('Type','').endswith(('/slideLayout','/slideMaster')):
                    media.update(media_dependencies(target,visited))
        return media
    for slide in slides:
        number = int(__import__('re').search(r'slide(\d+)',slide)[1])
        for target in media_dependencies(slide):
            usages.setdefault(target,[]).append(number)
    assets, seen = [], {}
    for path in sorted(n for n in z.namelist() if n.startswith('ppt/media/') and not n.endswith('/')):
        data = z.read(path); digest = hashlib.sha256(data).hexdigest(); filename = Path(path).name
        (originals/filename).write_bytes(data)
        if digest in seen:
            seen[digest]['sourceFiles'].append(filename)
            seen[digest]['slides'] = sorted(set(seen[digest]['slides']+usages.get(path,[])))
            continue
        num = int(filename.split('.')[0].replace('image','')) if '-' not in filename else 0
        category = 'background' if num in backgrounds else 'logo' if num in logos else 'photo' if num in photos else 'decoration' if num in decor or filename.endswith('.svg') else 'reference'
        item = dict(id='brand-'+digest[:20],name=names.get(num,('Фирменный фон ' if category=='background' else 'Графика ')+filename),category=category,sourceFiles=[filename],slides=usages.get(path,[]),sha256=digest,source=source.name,originalBytes=len(data))
        if filename.endswith('.svg'):
            item['name']='Градиентный многогранник SVG' if filename=='image-5-29.svg' else 'Стрелка вниз SVG '+filename.split('-')[-1].split('.')[0]
            svg=ET.fromstring(data); item.update(width=svg.get('width'),height=svg.get('height'),transparent=True)
            (output/(item['id']+'.svg')).write_bytes(data)
            item['url']='../assets/brand/'+item['id']+'.svg'; item['thumbnail']=item['url']
        else:
            im=Image.open(io.BytesIO(data)); alpha=im.convert('RGBA').getchannel('A')
            item.update(width=im.width,height=im.height,transparent=alpha.getextrema()[0]<255)
            if category!='reference':
                im.thumbnail((1920,1920)); im.save(output/(item['id']+'.webp'),'WEBP',quality=88)
                im.thumbnail((320,200)); im.save(output/(item['id']+'-thumb.webp'),'WEBP',quality=78)
                item['url']='../assets/brand/'+item['id']+'.webp'; item['thumbnail']='../assets/brand/'+item['id']+'-thumb.webp'
        item['usage']={'background':'Фон секции; текст с проверенным затемнением','logo':'Сохранять пропорции и свободное поле','photo':'Корпоративная фотография, не иллюстрация функций конструктора','decoration':'Декоративный слой','reference':'Только источник; не увеличивать и не использовать как готовый компонент'}[category]
        assets.append(item);seen[digest]=item
    manifest=dict(source=source.name,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),slideCount=len(slides),mediaCount=sum(len(a['sourceFiles']) for a in assets),chartCount=len([n for n in z.namelist() if __import__('re').fullmatch(r'ppt/charts/chart\d+.xml',n)]),tableCount=sum(len(ET.fromstring(z.read(n)).findall('.//a:tbl',ns)) for n in slides),assets=assets)
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in manifest.items() if k!='assets'}));print('Unique assets:',len(assets))
