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
     '{{< collections >}}\n')
page(f'{C}/gallery/_index.md', '''---
title: Work
breadcrumb: Work
type: artworks
cascade:
  type: artworks
  build:
    publishResources: false
---
Every piece has its own folder here. Media such as Sculpture and Collage are
taxonomies: a piece joins a series by listing it in its front matter.
''')


def piece(slug, title, weight, images, extra=''):
    """images: list of (filename, w, h, caption-in-EXIF or None)."""
    page(f'{C}/gallery/{slug}/index.md',
         f'---\ntitle: "{title}"\nweight: {weight}\n{extra}---\n')
    for n, (name, w, h, exif) in enumerate(images):
        img(f'{C}/gallery/{slug}/{name}', w, h, f'{title or slug} {n + 1}',
            (60 + (weight * 37) % 150, 90 + n * 25, 140 - n * 20), caption=exif)


# Single pieces.
piece('moth', 'Moth', 1, [('artwork.jpg', 1400, 1800, None)], 'status: sold\n')
piece('untitled-3', '', 3, [('artwork.jpg', 1400, 1400, None)])
# Camera file names, no artwork.jpg: the first file is the main image and the
# second is a view without a caption.
piece('lantern', 'Lantern', 2, [('IMG_3220.jpg', 1400, 1800, None), ('IMG_3221.jpg', 1400, 1800, None)])

# Sculpture: boxes, with one piece photographed several ways.
page(f'{C}/sculpture/_index.md', '---\ntitle: Sculpture\nweight: 1\n---\nBoxes, vessels and stele.\n')
page(f'{C}/sculpture/boxes/_index.md', '---\ntitle: Boxes\nweight: 1\n---\nAssemblage boxes.\n')
page(f'{C}/sculpture/vessels/_index.md', '---\ntitle: Vessels\nweight: 2\ngrid: justified\n---\n')
page(f'{C}/sculpture/stele/_index.md', '---\ntitle: Stele\nweight: 3\n---\n')
for n in range(1, 5):
    views = [('artwork.jpg', 1600, 1200, None)]
    extra = f'sculpture: ["boxes"]\nsculpture_weight: {n}\n'
    if n == 2:
        views += [('detail_1.jpg', 1200, 1200, None), ('detail_2.jpg', 1200, 1600, None),
                  ('back.jpg', 1600, 1200, 'Back, from EXIF')]
        extra += 'resources:\n  - src: detail_2.jpg\n    title: Lid open\n'
    piece(f'box-{n}', f'Box {n}', 10 + n, views, extra)
for n, (w, h) in enumerate([(1600, 1000), (900, 1600), (1600, 1600), (1600, 700),
                            (1000, 1500), (1500, 1100)], 1):
    extra = f'sculpture: ["vessels"]\nsculpture_weight: {n}\n'
    views = [('artwork.jpg', w, h, None)]
    if n == 1:
        views += [('detail_1.jpg', 1200, 1200, None), ('detail_2.jpg', 1200, 800, None)]
    piece(f'vessel-{n}', f'Vessel {n}', 20 + n, views, extra)
for n in range(1, 4):
    extra = f'sculpture: ["stele"]\nsculpture_weight: {n}\n'
    if n == 3:
        extra = 'sculpture: ["stele"]\ncollage: ["night-garden"]\n'
    piece(f'stele-{n}', f'Stele {n}', 30 + n, [('artwork.jpg', 900, 1800, None)], extra)

# Collage: one series, sharing Stele 3 with Sculpture.
page(f'{C}/collage/_index.md', '---\ntitle: Collage\nweight: 2\n---\n')
page(f'{C}/collage/night-garden/_index.md', '---\ntitle: Night Garden\n---\n')
for n in range(1, 3):
    piece(f'garden-{n}', f'Garden {n}', 40 + n, [('artwork.jpg', 1400, 1100, None)],
          'collage: ["night-garden"]\n')

# A private piece: built and reachable by URL, but unlisted and noindex.
piece('work-in-progress', 'Work in progress', 90, [('artwork.jpg', 1200, 1200, None)], 'private: true\n')

page(f'{C}/about.md', '---\ntitle: About\n---\nInside Sculpture:\n\n'
     '{{< collections taxonomy="sculpture" >}}\n\nSold pieces:\n\n{{< artworks status="sold" >}}\n\n'
     'Boxes:\n\n{{< artworks collection="sculpture/boxes" >}}\n')
print('example content written')
