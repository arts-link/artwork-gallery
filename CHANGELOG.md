# Changelog

## Unreleased

Nothing is tagged yet; the first release will be 0.1.0.

- A page per piece: resized JPEG and WebP images, status, VisualArtwork and
  BreadcrumbList JSON-LD, and a generated sharing card when the folder has
  no `social.*`.
- Several photos per piece: a main image plus further views, shown as a
  strip or stacked on the page and as buttons in the lightbox, with captions
  from front matter, EXIF or the file name.
- Series: media such as collage or sculpture are taxonomies whose terms are
  series, with cards on the medium's page and a grid on each series' page. A
  piece's first series is its home collection for navigation and
  breadcrumbs.
- Progressive grid (content-addressed JSON batches), square or justified, and
  an accessible lightbox with zoom; a piece's URL opens straight into it.
- `private: true` pieces are unlisted, left out of the sitemap and noindex.
- `artworks` and `collections` shortcodes.
