from pathlib import Path
from fontTools.ttLib import TTCollection
root = Path(__file__).resolve().parents[1]
collection = TTCollection(root / 'fonts/alabuga-sans.ttc')
out = root / 'src/fonts'
out.mkdir(parents=True, exist_ok=True)
for index, name in [(3, 'regular'), (4, 'medium'), (6, 'heading-bold'), (7, 'heading-extra-bold')]:
    font = collection.fonts[index]
    font.flavor = 'woff2'
    font.save(out / f'alabuga-{name}.woff2')
    print(name, (out / f'alabuga-{name}.woff2').stat().st_size)
