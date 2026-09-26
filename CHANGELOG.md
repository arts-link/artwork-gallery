# Changelog

## v0.1.0

First release, extracted from the alainavarrone.art Hugo rebuild.

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
