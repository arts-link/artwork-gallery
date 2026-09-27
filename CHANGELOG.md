# Changelog

## Unreleased

Nothing is tagged yet; the first release will be 0.1.0.

- A page per piece: resized JPEG and WebP images, status, VisualArtwork and
  BreadcrumbList JSON-LD, and a generated sharing card when the folder has
  no `social.*`.
- Several photos per piece: a main image plus further views that swap into
  it in the lightbox, with captions from front matter, EXIF or the file name.
- Series: media such as collage or sculpture are taxonomies whose terms are
  series, with cards on the medium's page and a grid on each series' page. A
  piece's first series is its home collection for navigation and
  breadcrumbs.
- Grids open pieces in a lightbox overlay (piece URL in the address bar,
  keyboard and swipe paging in grid order, views, zoom, Back to close). Each
  piece's own URL is the same lightbox as a standalone, chrome-free page that
  follows the collection it was opened from.
- AVIF and WebP `srcset`s with a JPEG fallback for every image.
- Progressive grid (content-addressed JSON batches), square or justified.
- `private: true` pieces are unlisted, left out of the sitemap and noindex.
- `artworks` and `collections` shortcodes.
