# artwork-gallery

A Hugo theme component for artist portfolios. Each artwork is a page bundle;
the component resizes its image, publishes a permanent page for it, builds a
progressively loaded gallery grid with a lightbox, and describes every piece
with schema.org `VisualArtwork` structured data.

It provides no page chrome. Stack it in front of the theme that does:

```toml
theme = ["artwork-gallery", "your-theme"]
```

Developed inside the alainavarrone.art repository; intended to move to its
own repository once a second site uses it.

## Content

```
content/gallery/
  _index.md                 title, and `type: artworks` for the section
  iggy-pop/
    index.md                the details below
    artwork.jpg             the image (any name works; see `image`)
    social.jpg              optional 1200 x 630 sharing card
```

`_index.md` sets the layout for the section and its artworks, and stops Hugo
publishing unused originals:

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

Front matter for one artwork:

| Field    | Required | Meaning |
| -------- | -------- | ------- |
| `title`  | no       | Leave empty for untitled pieces |
| `weight` | yes      | Position in the gallery; must be unique |
| `status` | no       | Shown under the title, e.g. `sold`, `not for sale` |
| `year`   | no       | Stored for filtering; not displayed yet |
| `alt`    | no       | Image description; defaults to the title |
| `image`  | no       | Filename of the artwork image if it is not `artwork.*` |

The folder name is the artwork's URL: `/gallery/iggy-pop/`.

Without a `social.*` file, the sharing card is generated: the artwork,
uncropped, on a 1200 x 630 field of its own dominant colour.

The build fails with a readable message when an artwork has no image, no
weight, or the same weight as another piece.

## Settings

```toml
[params.artworkGallery]
  section = "gallery"      # content section holding the artworks
  batchSize = 24           # tiles in the HTML; the rest load while scrolling
  artform = "Embroidery"   # VisualArtwork artform, alt text, descriptions
  untitled = "Untitled embroidery"
  thumbSize = 640          # square, centre-cropped
  largeSize = 1600         # long edge of the lightbox image
```

## Theme contract

The layouts in `layouts/artworks/` fill three blocks, which the theme's
`baseof.html` must declare: `main`, `head` (inside `<head>`) and `scripts`
(before `</body>`).

For search and sharing tags, the theme's `<head>` calls
`partial "artwork-gallery/meta.html" .`. On artwork and gallery pages it
returns `pageType`, `title`, `description`, `image`, `imageAlt`, `mainEntity`
and (on artworks) `breadcrumb`; elsewhere an empty map.

`partial "artwork-gallery/assets.html" .` returns the stylesheet for the theme
to link or concatenate. Colours and fonts are `--ag-*` custom properties;
override them in the theme's CSS rather than the selectors.

## Shortcode

Embed a selection on any page; each tile links to its artwork page:

```
{{< artworks limit="6" >}}
{{< artworks status="sold" >}}
{{< artworks year="2018" limit="4" >}}
```
