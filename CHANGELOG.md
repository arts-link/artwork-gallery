# Changelog

## 0.2.1 (2026-09-30)

- Piece images are never wider than the new `maxWidth` setting (default
  2400). Since 0.2.0 a large photo, such as a 4032px phone picture, published
  a derivative at its full width.
- Image widths are measured after EXIF orientation. A photo stored sideways
  (orientation 5-8) was sized by its stored width, so a 3024px-wide portrait
  stored as 4032x3024 got upscaled 2400 and 4032 derivatives. The JPEG
  fallback had the same fault.

## 0.2.0 (2026-09-30)

- Piece images and their further views now include the photo's own width as
  the largest size when it is at least 10% wider than the largest
  `largeWidths` entry it reaches. Portrait photos (narrower than they are
  tall) no longer stop at 1600px when the master is, say, 1800x2400. Grid
  tiles, cards and the JPEG fallback are unchanged.

## 0.1.0 (2026-09-28)

First release.

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
  keyboard and swipe paging in grid order, views, zoom in place with drag
  to pan, Back to close). Each piece's own URL is the same lightbox as a
  standalone, chrome-free page that follows the collection it was opened
  from.
- AVIF and WebP `srcset`s with a JPEG fallback for every image.
- Progressive grid (content-addressed JSON batches), square or justified.
- `private: true` pieces are unlisted, left out of the sitemap and noindex.
- `artworks` and `collections` shortcodes.
