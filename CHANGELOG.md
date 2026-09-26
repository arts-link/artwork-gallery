# Changelog

## Unreleased

Nothing is tagged yet; the first release will be 0.1.0. Extracted from
the alainavarrone.art Hugo rebuild.

- Artwork pages: resized JPEG and WebP images, a permanent URL per piece,
  status, VisualArtwork and BreadcrumbList JSON-LD, and a generated sharing
  card when the folder has no `social.*`.
- Collections nested to any depth, shown as cards with covers and counts.
- Albums: several photos in one bundle, captions from front matter or EXIF,
  `#photo` links, hidden images and sort options.
- Progressive grid (content-addressed JSON batches) and an accessible
  lightbox with zoom; artwork URLs open straight into the lightbox.
- `grid: justified`, `private: true`, `section = ""` for a home-page root.
- `artworks` and `collections` shortcodes.
- Pieces with several photos: the main image plus further views, shown as a
  strip or stacked on the page and as buttons in the lightbox, with captions
  from front matter, EXIF or the file name, and listed in the JSON-LD.
- Collection taxonomies: media such as `collage` or `sculpture` whose terms
  are series, ordered by `<taxonomy>_weight`; a piece's first series is its
  home collection for navigation and breadcrumbs.
- A folder with several photos is now one piece; albums need `album: true`.
- Duplicate weights warn instead of failing the build.
