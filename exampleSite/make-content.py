#!/usr/bin/env python3
"""Regenerate the example site's content and placeholder images.

  python3 make-content.py        (needs Pillow)

The images are generated so the component carries no real artwork.
"""
import os, random, shutil
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
C = os.path.join(HERE, 'content')
random.seed(7)


def img(path, w, h, label, colour, caption=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = Image.new('RGB', (w, h), colour)
    d = ImageDraw.Draw(im)
    for _ in range(18):
        x, y = random.randrange(w), random.randrange(h)
        r = random.randrange(w // 12, w // 4)
        c = tuple(min(255, max(0, v + random.randrange(-60, 60))) for v in colour)
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)
    d.rectangle((w // 2 - 170, h // 2 - 40, w // 2 + 170, h // 2 + 40), fill=(255, 255, 255))
    d.text((w // 2 - 150, h // 2 - 18), label, fill=(0, 0, 0), font_size=34)
    exif = Image.Exif()
    if caption:
        exif[0x010E] = caption  # ImageDescription
    im.save(path, 'JPEG', quality=70, exif=exif.tobytes())


def page(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as handle:
        handle.write(text)


if os.path.isdir(C):
    shutil.rmtree(C)
page(f'{C}/_index.md', '---\ntitle: Example artist\n---\n'
     'Collections:\n\n{{< collections >}}\n')
page(f'{C}/gallery/_index.md', '''---
title: Work
breadcrumb: Work
type: artworks
cascade:
  type: artworks
  build:
    publishResources: false
---
Collections, albums and single artworks, nested.
''')

# Single artworks at the top level.
for n, (title, status) in enumerate([('Moth', 'sold'), ('Lantern', ''), ('', '')], 1):
    slug = title.lower() or f'untitled-{n}'
    page(f'{C}/gallery/{slug}/index.md', f'---\ntitle: "{title}"\nweight: {n}\n'
         + (f'status: {status}\n' if status else '') + '---\n')
    img(f'{C}/gallery/{slug}/artwork.jpg', 1400, 1800, title or 'untitled', (120 + n * 30, 90, 70))

# A collection holding two albums and a sub-collection of artworks.
page(f'{C}/gallery/sculpture/_index.md', '---\ntitle: Sculpture\nweight: 10\n'
     'description: Boxes, vessels and stele.\n---\nThree-dimensional work.\n')
page(f'{C}/gallery/sculpture/boxes/index.md', '''---
title: Boxes
weight: 1
resources:
  - src: box-3.jpg
    title: Box with keys
    params:
      cover: true
  - src: box-1.jpg
    title: Tin box, 2019
    params:
      status: sold
---
Assemblage boxes. Captions come from `resources` titles, or from the photo's
EXIF description (box 2).
''')
for n in range(1, 5):
    img(f'{C}/gallery/sculpture/boxes/box-{n}.jpg', 1600, 1200 if n % 2 else 1600,
        f'box {n}', (60, 110 + n * 25, 140), caption='Caption from EXIF' if n == 2 else None)
page(f'{C}/gallery/sculpture/vessels/index.md', '---\ntitle: Vessels\nweight: 2\ngrid: justified\n---\n')
for n, (w, h) in enumerate([(1600, 1000), (900, 1600), (1600, 1600), (1600, 700),
                            (1000, 1500), (1500, 1100)], 1):
    img(f'{C}/gallery/sculpture/vessels/vessel-{n}.jpg', w, h, f'vessel {n}', (150, 120, 60 + n * 20))
page(f'{C}/gallery/sculpture/stele/_index.md', '---\ntitle: Stele\nweight: 3\n---\n')
for n in range(1, 4):
    page(f'{C}/gallery/sculpture/stele/stele-{n}/index.md', f'---\ntitle: "Stele {n}"\nweight: {n}\n---\n')
    img(f'{C}/gallery/sculpture/stele/stele-{n}/artwork.jpg', 900, 1800, f'stele {n}', (90, 90, 90 + n * 40))

# A private collection: built, but unlisted and marked noindex.
page(f'{C}/gallery/studio/_index.md', '---\ntitle: Studio\nweight: 20\nprivate: true\n---\n')
page(f'{C}/gallery/studio/wip/index.md', '---\ntitle: Work in progress\nweight: 1\n---\n')
img(f'{C}/gallery/studio/wip/artwork.jpg', 1200, 1200, 'wip', (200, 200, 120))

page(f'{C}/about.md', '---\ntitle: About\n---\nInside Sculpture:\n\n'
     '{{< collections path="sculpture" >}}\n\nSold pieces:\n\n{{< artworks status="sold" >}}\n')
print('example content written')
