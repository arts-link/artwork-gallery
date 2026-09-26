# artwork-gallery

A Hugo theme component for artist portfolios. It resizes images, publishes a
permanent page for every artwork, groups work into nested collections and
albums, shows it in a progressively loaded grid with a lightbox, and describes
everything with schema.org structured data.

It provides no page chrome. Stack it in front of the theme that does.

## Installation

Not yet released: it is still being shaped against the Arts-Link sites that
use it, and changes may break them. Pin each site's submodule to a commit and
upgrade deliberately. Requires Hugo extended 0.146 or later.

```sh
git submodule add https://github.com/arts-link/artwork-gallery.git themes/artwork-gallery
git -C themes/artwork-gallery checkout <commit>
```

```toml
theme = ["artwork-gallery", "your-theme"]
```

It also works as a Hugo module (`github.com/arts-link/artwork-gallery`) for
sites that build with Go available.

To upgrade a site, check out a newer commit in the submodule, read
[CHANGELOG.md](CHANGELOG.md), rebuild and compare before committing.

`exampleSite/` shows every feature with generated placeholder images:

```sh
cd exampleSite && hugo server --themesDir ../..
```

## Pieces, collections and albums

Every piece has its own folder, and every folder with one `index.md` is a
piece, however many photos it holds:

```
content/gallery/
  _index.md                  the gallery root
  box-2/                     a piece: /gallery/box-2/
    index.md
    artwork.jpg              the main image
    detail_1.jpg             further views of the same piece
    detail_2.jpg
    back.jpg
    social.jpg               optional sharing card; never shown in the gallery
```

Pieces are grouped into **collections** in two ways, which can be mixed:

| Kind | How | URL |
| --- | --- | --- |
| **Collection taxonomy** | the piece lists its series in front matter, e.g. `sculpture: ["boxes"]` | `/sculpture/` lists the series, `/sculpture/boxes/` shows the pieces |
| **Folder collection** | a folder with `_index.md` holding piece folders; nests to any depth | `/gallery/early-work/` |
| **Album** (opt-in) | a folder whose `index.md` says `album: true`: its photos are shown, but get no pages | `/gallery/studio-visit/` |

A collection page shows cards for its sub-collections (or, for a taxonomy,
its series), then its pieces in the grid.

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

### Collection taxonomies

Media such as collage or sculpture work well as taxonomies, with a series as
each term. A piece can then belong to several series, it keeps its
`/gallery/<piece>/` URL when it moves between them, and its series need no
folders. In the site configuration:

```toml
[taxonomies]
  collage = "collage"
  sculpture = "sculpture"

[params.artworkGallery]
  collectionTaxonomies = ["collage", "sculpture"]

# Give their pages the component's layouts. Other taxonomies (tags from the
# theme, for example) are left alone.
[[cascade]]
  type = "artworks"
  [cascade.target]
    path = "{/collage,/collage/**,/sculpture,/sculpture/**}"
```

In a piece:

```yaml
sculpture: ["boxes"]
sculpture_weight: 2        # optional: its place within the series
```

A series can have its own page content, cover, order and grid in
`content/sculpture/boxes/_index.md` (`title`, `weight`, `grid`, body text,
and images for its cover); the medium's page is `content/sculpture/_index.md`.
Pieces without a series weight come after those with one.

A piece's **home collection** is its first series in the first collection
taxonomy it uses, else the folder it sits in. Previous/next, the link back,
breadcrumbs (Home › Sculpture › Boxes › Box 2) and the lightbox behind a
directly opened piece all follow it.

### Piece front matter

| Field    | Meaning |
| -------- | ------- |
| `title`  | Leave empty for untitled pieces |
| `weight` | Position in its folder collection |
| `status` | Shown under the title, e.g. `sold`, `not for sale` |
| `year`   | Stored for filtering (`{{< artworks year="2018" >}}`); not displayed yet |
| `alt`    | Main image description; defaults to the title |
| `image`  | Filename of the main image if it is not `artwork.*` |
| `views`  | `strip` (default) or `stack`: how further photos are shown on the page |
| `<taxonomy>` | Series the piece belongs to, e.g. `collage: ["night-garden"]` |

The body text, if any, is shown under the image. The folder name is the URL.
Two pieces with the same weight still build; the build log warns about it.

**Main image:** the `image` named in front matter, else `artwork.*`, else the
first photo by file name, so a folder of camera files such as `IMG_3220.JPG`,
`IMG_3221.JPG` works without renaming. It is the grid tile and the sharing
image.

**Further views:** every other photo, in file-name order (`detail_01`,
`detail_02`… keeps ten or more in order). They appear under the main image as
a strip of thumbnails, or full size with `views: stack`, and in the lightbox
as buttons under the caption (arrow up and down step through them). Each
caption is, in order of preference, a `resources` title, the photo's EXIF
description, or its file name made readable (`detail_1` becomes "Detail 1";
camera names give none). `hidden: true` keeps a photo out:

```yaml
resources:
  - src: detail_2.jpg
    title: Lid open
  - src: studio-shot.jpg
    params:
      hidden: true
```

For EXIF captions, allow the field in the site configuration:

```toml
[imaging.exif]
  includeFields = "ImageDescription"
```

The piece's VisualArtwork structured data lists every view as an image.

A `social.*` file in the folder is used as the 1200 x 630 sharing card;
without one, the main image is placed uncropped on a field of its own
dominant colour.

### Albums

With `album: true`, a folder's photos are shown as a grid of their own and
none of them gets a page; the lightbox addresses them as
`/gallery/studio-visit/#visit-2` so each can still be linked. Captions follow
the same rules as views; `sort_by: Params.weight` orders them by resource
`weight`, and a resource with `params.cover: true` is the album's card.

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

The build fails with a readable message when a piece has no image.

## Site settings

```toml
[params.artworkGallery]
  section = "gallery"      # section holding the gallery; "" makes the home page the root
  batchSize = 24           # tiles in the HTML; the rest load while scrolling
  artform = "Embroidery"   # VisualArtwork artform, alt text, descriptions
  untitled = "Untitled embroidery"
  grid = "square"          # default grid for every collection and album
  views = "strip"          # further photos of a piece: "strip" or "stack"
  collectionTaxonomies = []  # e.g. ["collage", "sculpture"]
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
{{< artworks collection="early-work" >}}      one folder collection
{{< artworks collection="sculpture/boxes" >}} one series
{{< artworks status="sold" >}}
{{< artworks year="2018" limit="4" >}}
{{< collections >}}                        cards for the top level
{{< collections path="early-work" >}}      cards inside one folder collection
{{< collections taxonomy="sculpture" >}}   the series of one medium
{{< collections taxonomies="true" >}}      one card per collection taxonomy
{{< collections featured="true" >}}        every page marked featured
```
