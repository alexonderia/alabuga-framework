import html,json,pathlib,statistics
root=pathlib.Path(__file__).resolve().parent.parent/'artifacts'/'ai'
def read(name,default):
    p=root/name
    return json.loads(p.read_text('utf-8-sig')) if p.exists() else default
report=read('acceptance.json',{})
review=read('review.json',{})
if review.get('_runFinished')!=report.get('finished'):
    review={}
exports=read('exports.json',[])
cases=report.get('cases',[])
rows=[]
for c in cases:
    n=c['index'];item=review.get(str(n),{})
    rows.append(f'<tr><td>{n}</td><td>{html.escape(c["prompt"])}</td><td>{"Пройдено" if c["success"] else "Ошибка"}</td><td>{c["elapsedMs"]/1000:.1f} с</td><td>{html.escape(item.get("note","Редакторская проверка не зафиксирована"))}</td><td><a href="case-{n:02}.json">Данные</a> · <a href="case-{n:02}.png">Вид</a></td></tr>')
loaded=report.get('loaded',{}).get('models',[])
gpu=bool(loaded) and all(m.get('size_vram',0)>=m.get('size',1) for m in loaded)
summary=f'{sum(c["success"] for c in cases)} / {len(cases)} технических сценариев · пик {report.get("peakMiB","—")} МиБ · полностью на GPU: {"да" if gpu else "не подтверждено"}'
editorial=sum(bool(review.get(str(c['index']),{}).get('usable')) for c in cases)
assessment=f'Проверка содержания агентом: {editorial} / {len(cases)} пригодных черновиков. Критерий 18 / 20 {"достигнут" if editorial>=18 else "НЕ достигнут"}. Это оценка черновиков, а не готовности к публикации и не исследование с пользователями.'
if not review:
    assessment='Проверка содержания этого прогона ещё не зафиксирована. Технические проверки не подтверждают пригодность текста.'
text=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alabuga — проверка локального ИИ</title><style>body{{font:16px/1.6 system-ui;background:#f3f6fb;color:#000d3c;max-width:1200px;margin:40px auto;padding:24px}}h1{{font-size:40px}}table{{width:100%;border-collapse:collapse;background:white}}td,th{{padding:12px;text-align:left;border-bottom:1px solid #d9e4f0}}a{{color:#0c6ff1}}.lead{{font-size:22px}}pre{{white-space:pre-wrap}}</style><h1>Локальный ИИ: проверка прототипа</h1><p class="lead">{summary}</p><p>Реальная Qwen3.5-2B через Ollama. Техническое прохождение означает проверку схемы, команд и компоновки; качество содержания оценивается отдельно.</p><p><a href="landing.html">Лендинг</a> · <a href="presentation.html">Презентация</a> · <a href="presentation.pdf">PDF</a> · <a href="landing.project.json">Проект лендинга</a> · <a href="presentation.project.json">Проект презентации</a></p><table><thead><tr><th>№</th><th>Запрос</th><th>Техника</th><th>Время</th><th>Содержание</th><th>Артефакт</th></tr></thead><tbody>{''.join(rows)}</tbody></table><h2>Автономный экспорт</h2><pre>{html.escape(json.dumps(exports,ensure_ascii=False,indent=2))}</pre><h2>Окружение</h2><pre>{html.escape(json.dumps(report.get('environment',{}),ensure_ascii=False,indent=2))}</pre><p><a href="acceptance.json">Полный протокол с замерами</a></p></html>'''
text=text.replace('<h2>Автономный экспорт</h2>', '<h2>Содержание и границы готовности</h2><p>'+assessment+'</p><p>Функциональный прототип работает. До выпуска необходимо повысить следование запросу, исключить повторы и довести надёжность заполнения сложных композиций. Успешная проверка схемы не гарантирует точности текста.</p><h2>Автономный экспорт</h2>')
text=text.replace('<p><a href="landing.html">', '<p>Примеры ниже созданы в отдельном прогоне и прошли явную редакторскую правку текстов и кадрирования логотипа. Исходные ответы модели сохранены в examples/*-source.json. Редакторские правки не включены в результат 20 испытаний.</p><p><a href="landing.html">')
text=text.replace('<h2>Окружение</h2>', '<h2>Проверки приложения</h2><p>Полный браузерный прогон: 153 / 153. После последующих правок повторено 21 / 21 сценариев ИИ в Chromium, Firefox и WebKit. Модульные проверки: 26. Реальный сценарий в собранном редакторе: генерация, правка, применение и отмена — пройден.</p><p><a href="editor-real-draft.png">Реальный черновик в редакторе</a> · <a href="ui-live.json">Протокол интерфейса</a></p><h2>Окружение</h2>')
(root/'report.html').write_text(text,encoding='utf-8')
print(summary)
print(assessment)
