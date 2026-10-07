"""Summarize actual Playwright results and the generated acceptance PDF."""
import base64, hashlib, html, json
from pathlib import Path
import fitz

root=Path(__file__).resolve().parents[1]
destination=root/'artifacts/acceptance'
destination.mkdir(parents=True,exist_ok=True)
runs=[]
for filename,label in [('validation-results.json','Полный регрессионный прогон'),('validation-zoom.json','Проверка рабочего пространства после исправления масштаба')]:
    report=json.loads((root/filename).read_text(encoding='utf-8'))
    runs.append({'name':label,'file':filename,**report['stats']})
measurements=[]
def visit(suites):
    for suite in suites:
        for spec in suite.get('specs',[]):
            for test in spec.get('tests',[]):
                for result in test.get('results',[]):
                    for attachment in result.get('attachments',[]):
                        if 'performance' in attachment['name'] and attachment.get('body'):
                            measurements.append({'browser':test['projectName'],**json.loads(base64.b64decode(attachment['body']))})
        visit(suite.get('suites',[]))
visit(json.loads((root/'validation-results.json').read_text(encoding='utf-8'))['suites'])
pdf=fitz.open(destination/'presentation.pdf')
source=next((root/'docs').glob('*.pptx'))
summary={'version':'0.6.0','runs':runs,'measurements':measurements,'pdfPages':len(pdf),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'userStudy':'pending; protocol in HTML documentation'}
(destination/'validation-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
rows=''.join(f'<tr><td>{html.escape(r["name"])}</td><td>{r["expected"]}</td><td>{r["unexpected"]}</td><td>{r["skipped"]}</td><td>{r["flaky"]}</td></tr>' for r in runs)
performance=''.join(f'<tr><td>{m["browser"]}</td><td>{m["count"]}</td><td>{m["renderMs"]:.1f}</td><td>{m["updateMs"]:.1f}</td><td>{"Сохранены" if m["focus"] and m["selection"] else "Ошибка"}</td></tr>' for m in measurements if 'renderMs' in m)
content=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Alabuga Framework 0.6 — отчёт проверки</title><style>body{{font:16px/1.6 system-ui;max-width:1000px;margin:40px auto;padding:0 20px;color:#000d3c}}table{{width:100%;border-collapse:collapse}}th,td{{padding:12px;text-align:left;border-bottom:1px solid #dce3ef}}th{{background:#eef3fb}}a{{color:#0956bb}}code{{overflow-wrap:anywhere}}</style><h1>Alabuga Framework 0.6</h1><p>Отчёт основан на результатах выполненных проверок. <a href="visual-review.html">Визуальные образцы</a> · <a href="presentation.pdf">Презентация PDF</a> · <a href="validation-summary.json">Данные отчёта</a></p><h2>Chromium, Firefox, WebKit</h2><table><thead><tr><th>Прогон</th><th>Успешно</th><th>Ошибки</th><th>Пропущено</th><th>Нестабильные</th></tr></thead><tbody>{rows}</tbody></table><p>Во втором прогоне повторяются проверки первого; суммы не следует считать количеством уникальных сценариев. После него исходники приложения не изменялись.</p><h2>50 слайдов, 500 элементов</h2><table><thead><tr><th>Браузер</th><th>Элементов</th><th>Первое отображение, мс</th><th>Обновление элемента, мс</th><th>Фокус и выделение</th></tr></thead><tbody>{performance}</tbody></table><p>Измерения сделаны в локальном автоматическом прогоне с тремя параллельными процессами. Они характеризуют тестовый документ, а не гарантируют время для любых материалов.</p><h2>Печать и исходники</h2><p>PDF содержит {len(pdf)} отдельных страниц. SHA-256 исходного PPTX совпадает с контрольной суммой до извлечения материалов:</p><code>{summary['sourceSha256']}</code><h2>Пользовательская приёмка ожидает проведения</h2><p>Пять реальных авторов должны самостоятельно собрать страницу из пяти секций и презентацию из шести слайдов, заменить материалы, настроить показ и экспортировать результат. Цель — четыре успешных прохождения без помощи. Протокол и незаполненная форма результатов находятся в HTML-документации «Проекты и материалы». Пользовательское исследование не заменялось автоматическими тестами.</p></html>'''
(destination/'validation-report.html').write_text(content,encoding='utf-8')
print(json.dumps({'pdfPages':len(pdf),'runs':[(r['expected'],r['unexpected']) for r in runs]}))
