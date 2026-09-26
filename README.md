# artwork-gallery

A Hugo theme component for artist portfolios. It resizes images, publishes a
permanent page for every artwork, groups work into nested collections and
albums, shows it in a progressively loaded grid with a lightbox, and describes
everything with schema.org structured data.

It provides no page chrome. Stack it in front of the theme that does:

```toml
theme = ["artwork-gallery", "your-theme"]
```

Developed inside the alainavarrone.art repository; intended to move to its
own repository once a second site uses it. `exampleSite/` shows every feature
with generated placeholder images:

```sh
cd exampleSite && hugo server --themesDir ../..
```

## Three kinds of page

Everything under the gallery section is one of these, decided by its folder:

| Kind | Folder | Shows |
| --- | --- | --- |
| **Collection** | has `_index.md` | Cards for its sub-collections and albums, then a grid of its artworks |
| **Artwork** | has `index.md` and one image | One piece, on its own permanent page |
| **Album** | has `index.md` and several images | All its photos in a grid, opening in the lightbox |

Collections nest to any depth:

```
content/gallery/
  _index.md                  the gallery root (a collection)
  moth/                      an artwork: /gallery/moth/
    index.md
    artwork.jpg
  sculpture/                 a collection: /gallery/sculpture/
    _index.md
    boxes/                   an album: /gallery/sculpture/boxes/
      index.md
      box-1.jpg
      box-2.jpg
    stele/                   a collection inside a collection
      _index.md
      stele-1/
        index.md
        artwork.jpg
```

The gallery root's `_index.md` gives everything below it the component's
layouts and stops Hugo publishing unused originals:

```yaml
---
title: Gallery
type: artworks
cascade:
  type: artworks
  build:
    publishResources: false
---
```

With `section = ""` the home page is the root and each top-level section is a
collection; put the same `cascade` in `content/_index.md` and render the root
from the theme's home template with the `artwork-gallery/collection.html` and
`artwork-gallery/collection-scripts.html` partials.

### Artwork front matter

| Field    | Meaning |
| -------- | ------- |
| `title`  | Leave empty for untitled pieces |
| `weight` | Position in its collection; two artworks in one collection cannot share one |
| `status` | Shown under the title, e.g. `sold`, `not for sale` |
| `year`   | Stored for filtering (`{{< artworks year="2018" >}}`); not displayed yet |
| `alt`    | Image description; defaults to the title |
| `image`  | Filename of the artwork image if it is not `artwork.*` |
| `album`  | `true` or `false` to override the one-image / several-images rule |

The body text, if any, is shown under the image. The folder name is the URL.
A `social.*` file in the folder is used as the 1200 x 630 sharing card;
without one, the artwork is placed uncropped on a field of its own dominant
colour.

### Album front matter

Photos are shown in file-name order. Captions come from the photo's EXIF
description, or from `resources` titles, which win:

```yaml
---
title: Boxes
weight: 1
sort_by: Params.weight        # optional; default Name
resources:
  - src: box-3.jpg
    title: Box with keys
    params:
      cover: true             # the album's card and sharing image
  - src: box-1.jpg
    title: Tin box, 2019
    params:
      status: sold
      weight: 1
  - src: studio-shot.jpg
    params:
      hidden: true            # kept out of the grid
---
```

For EXIF captions, allow the field in the site configuration:

```toml
[imaging.exif]
  includeFields = "ImageDescription"
```

Photos in an album have no pages of their own; the lightbox addresses them as
`/gallery/sculpture/boxes/#box-3` so each can still be linked and shared.

### Collection and album settings

| Field      | Meaning |
| ---------- | ------- |
| `weight`   | Order among its siblings |
| `grid`     | `justified` for rows that keep each image's shape; `square` (default) crops |
| `private`  | Unlisted everywhere and marked `noindex`, but still reachable by URL |
| `featured` | Listed by `{{< collections featured="true" >}}` |
| `breadcrumb` | Short name for breadcrumbs (default: the title) |
| `featured_image` | Cover file name; otherwise a `cover: true` resource, a file named `*feature*`, or the first image |

A collection without images of its own borrows the cover of its first card or
artwork. `grid` can be set for a whole tree through `cascade`.

The build fails with a readable message when an artwork has no image or shares
its weight with another artwork in the same collection.

## Site settings

```toml
[params.artworkGallery]
  section = "gallery"      # section holding the gallery; "" makes the home page the root
  batchSize = 24           # tiles in the HTML; the rest load while scrolling
  artform = "Embroidery"   # VisualArtwork artform, alt text, descriptions
  untitled = "Untitled embroidery"
  grid = "square"          # default grid for every collection and album
  thumbSize = 640          # grid thumbnails (justified grids use 1.5x)
  largeSize = 1600         # long edge of the lightbox image
```

## Theme contract

The layouts in `layouts/artworks/` fill three blocks, which the theme's
`baseof.html` must declare: `main`, `head` (inside `<head>`) and `scripts`
(before `</body>`). `exampleSite/layouts/baseof.html` is a minimal example.

For search and sharing tags, the theme's `<head>` calls
`partial "artwork-gallery/meta.html" .`. On gallery pages it returns
`pageType`, `title`, `description`, `image`, `imageAlt`, `mainEntity`,
`breadcrumb` and `noindex`; elsewhere an empty map.

`partial "artwork-gallery/assets.html" .` returns the stylesheet for the theme
to link or concatenate. Colours and fonts are `--ag-*` custom properties;
override them in the theme's CSS rather than the selectors.

Sitemaps and indexes can use `artwork-gallery/all-artworks.html` (every public
artwork) and `artwork-gallery/groups.html` (every public collection and album).

## Shortcodes

```
{{< artworks limit="6" >}}                 artworks from the whole gallery
{{< artworks collection="sculpture/stele" >}}
{{< artworks status="sold" >}}
{{< artworks year="2018" limit="4" >}}
{{< collections >}}                        cards for the top level
{{< collections path="sculpture" >}}       cards inside one collection
{{< collections featured="true" >}}        every page marked featured
```
