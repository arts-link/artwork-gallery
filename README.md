# artwork-gallery

A Hugo theme component for artist portfolios. Every piece gets its own page
with resized images and structured data; pieces are grouped into series by
medium; everything is shown in a progressively loaded grid with a lightbox.

It provides no page chrome. Stack it in front of the theme that does.

## Installation

Not yet released: it is still being shaped, and changes may break the sites
that try it. Pin a site's submodule to a commit and upgrade deliberately.
Requires Hugo extended 0.146 or later.

```sh
git submodule add https://github.com/arts-link/artwork-gallery.git themes/artwork-gallery
git -C themes/artwork-gallery checkout <commit>
```

```toml
theme = ["artwork-gallery", "your-theme"]
```

It also works as a Hugo module (`github.com/arts-link/artwork-gallery`) for
sites that build with Go available.

`exampleSite/` shows every feature with generated placeholder images. From a
clone named `artwork-gallery`:

```sh
cd exampleSite && hugo server
```

## Pieces

Every piece is one folder in the gallery section, and the folder name is its
URL:

```
content/gallery/
  _index.md                  the gallery page: every piece
  box-2/                     /gallery/box-2/
    index.md
    artwork.jpg              the main image
    detail_1.jpg             further views of the same piece
    detail_2.jpg
    back.jpg
    social.jpg               optional sharing card; never shown in the gallery
```

The gallery's `_index.md` gives the pieces the component's layouts and stops
Hugo publishing unused originals:

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

Front matter for a piece:

| Field    | Meaning |
| -------- | ------- |
| `title`  | Leave empty for untitled pieces |
| `weight` | Position in the gallery |
| `status` | Shown under the title, e.g. `sold`, `not for sale` |
| `year`   | Stored for filtering (`{{< artworks year="2018" >}}`); not displayed yet |
| `alt`    | Main image description; defaults to the title |
| `image`  | File name of the main image if it is not `artwork.*` |
| `views`  | `strip` (default) or `stack`: how further photos are shown on the page |
| `private` | `true` leaves the piece out of every listing and the sitemap and marks it `noindex`; its URL still works |
| `<taxonomy>` | The series the piece belongs to, e.g. `sculpture: ["boxes"]` |
| `<taxonomy>_weight` | Its place within that series, e.g. `sculpture_weight: 2` |

The body text, if any, is shown under the image. Two pieces with the same
weight still build; the build log warns about it.

**Main image:** the `image` named in front matter, else `artwork.*`, else the
first photo by file name, so a folder of camera files such as `IMG_3220.JPG`,
`IMG_3221.JPG` works without renaming. It is the grid tile and the sharing
image.

**Further views:** every other photo in the folder, in file-name order
(`detail_01`, `detail_02`… keeps ten or more in order). They appear under the
main image as a strip of thumbnails, or full size with `views: stack`, and in
the lightbox as buttons under the caption (arrow up and down step through
them). A view's caption is, in order of preference, its `resources` title, the
photo's EXIF description, or its file name made readable (`detail_1` becomes
"Detail 1"; camera names give none). `hidden: true` keeps a photo out:

```yaml
resources:
  - src: detail_2.jpg
    title: Lid open
  - src: studio-shot.jpg
    params:
      hidden: true
```

Hugo 0.155 and later read EXIF descriptions without configuration; older
versions need:

```toml
[imaging.exif]
  includeFields = "ImageDescription"
```

**Sharing card:** a `social.*` file in the folder is used as the 1200 x 630
card; without one, the main image is placed uncropped on a field of its own
dominant colour.

The piece's VisualArtwork structured data lists every view as an image. The
build fails with a readable message when a piece has no image.

## Series

Media such as collage or sculpture are taxonomies, and each series is one of
their terms. A piece can belong to several series, and it keeps its
`/gallery/<piece>/` URL whichever series it is in. In the site configuration:

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

That gives `/sculpture/`, with a card for each series, and
`/sculpture/boxes/`, with the grid of its pieces ordered by
`sculpture_weight` (pieces without one come last).

A series can have its own title, order, intro text, grid and cover in
`content/sculpture/boxes/_index.md`: `title`, `weight`, `grid`, the body, and
an image in that folder (the first by name, or one marked `cover: true` in
`resources`). Without one, its cover is its first piece's main image. The
medium's own page is `content/sculpture/_index.md`.

A piece's **home collection** is its first series in the first collection
taxonomy it uses, else the gallery. Previous/next, the link back, the
breadcrumbs (Home › Sculpture › Boxes › Box 2) and the grid behind the
lightbox when a piece's URL is opened directly all follow it.

## Site settings

```toml
[params.artworkGallery]
  section = "gallery"        # section holding one folder per piece
  batchSize = 24             # tiles in the HTML; the rest load while scrolling
  artform = "Embroidery"     # VisualArtwork artform, alt text, descriptions
  untitled = "Untitled embroidery"
  grid = "square"            # or "justified": rows that keep each image's shape
  views = "strip"            # further photos of a piece: "strip" or "stack"
  collectionTaxonomies = []  # e.g. ["collage", "sculpture"]
  thumbSize = 640            # grid thumbnails (justified grids use 1.5x)
  largeSize = 1600           # long edge of the lightbox image
```

`grid` can also be set on the gallery's or a series' `_index.md`.

## Theme contract

The layouts in `layouts/artworks/` fill three blocks, which the theme's
`baseof.html` must declare: `main`, `head` (inside `<head>`) and `scripts`
(before `</body>`). `exampleSite/layouts/baseof.html` is a minimal example.

For search and sharing tags, the theme's `<head>` calls
`partial "artwork-gallery/meta.html" .`. On gallery, series and piece pages it
returns `pageType`, `title`, `description`, `image`, `imageAlt`, `mainEntity`,
`breadcrumb` and (for pieces) `noindex`; elsewhere an empty map.

`partial "artwork-gallery/assets.html" .` returns the stylesheet for the theme
to link or concatenate. Colours and fonts are `--ag-*` custom properties;
override them in the theme's CSS rather than the selectors.

The component's `sitemap.xml` leaves out private pieces. A site with its own
sitemap can use `artwork-gallery/all-artworks.html` (every public piece) and
`artwork-gallery/collections.html` (every collection taxonomy page and series).

## Shortcodes

```
{{< artworks >}}                              every piece
{{< artworks collection="sculpture/boxes" >}} one series
{{< artworks status="sold" >}}
{{< artworks year="2018" limit="4" >}}
{{< collections >}}                           one card per medium
{{< collections taxonomy="sculpture" >}}      the series of one medium
```
