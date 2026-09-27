# Changelog

## Unreleased

Nothing is tagged yet; the first release will be 0.1.0.

- A page per piece: resized JPEG and WebP images, status, VisualArtwork and
  BreadcrumbList JSON-LD, and a generated sharing card when the folder has
  no `social.*`.
- Several photos per piece: a main image plus further views, shown as a
  strip that swaps into the main image or stacked full size, with captions
  from front matter, EXIF or the file name.
- Series: media such as collage or sculpture are taxonomies whose terms are
  series, with cards on the medium's page and a grid on each series' page. A
  piece's first series is its home collection for navigation and
  breadcrumbs.
- Every tile is a link to the piece's own page, prerendered on hover and
  joined by a view transition; the piece page follows the collection it was
  opened from (keyboard, swipe, views, zoom) without changing its URL.
- AVIF and WebP `srcset`s with a JPEG fallback for every image.
- Progressive grid (content-addressed JSON batches), square or justified.
- `private: true` pieces are unlisted, left out of the sitemap and noindex.
- `artworks` and `collections` shortcodes.
