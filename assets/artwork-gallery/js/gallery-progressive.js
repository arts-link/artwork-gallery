// Add small, cacheable artwork batches as visitors approach the end of the grid.
(function () {
  function text(value) { return value || ''; }

  function tile(record) {
    var item = document.createElement('li');
    item.className = 'tile';
    item.id = record.slug;
    var link = document.createElement('a');
    link.href = record.href;
    link.setAttribute('data-i', record.i);
    link.setAttribute('data-slug', record.slug);
    link.setAttribute('data-image', record.image);
    link.setAttribute('data-title', text(record.title));
    link.setAttribute('data-meta', text(record.meta));
    link.setAttribute('data-alt', text(record.alt));
    link.setAttribute('data-document-title', record.documentTitle);
    var picture = document.createElement('picture');
    var source = document.createElement('source');
    source.srcset = record.thumbWebp;
    source.type = 'image/webp';
    var image = document.createElement('img');
    image.src = record.thumb;
    image.alt = text(record.alt);
    image.width = 640;
    image.height = 640;
    image.loading = 'lazy';
    picture.appendChild(source);
    picture.appendChild(image);
    link.appendChild(picture);
    if (record.title || record.meta) {
      var caption = document.createElement('span');
      caption.className = 'tile__caption';
      if (record.title) {
        var title = document.createElement('span');
        title.className = 'tile__title';
        title.textContent = record.title;
        caption.appendChild(title);
      }
      if (record.meta) {
        var meta = document.createElement('span');
        meta.className = 'tile__meta';
        meta.textContent = record.meta;
        caption.appendChild(meta);
      }
      link.appendChild(caption);
    }
    item.appendChild(link);
    return item;
  }

  function init(gallery) {
    if (!gallery) return null;
    if (gallery.__galleryProgressive) return gallery.__galleryProgressive;
    var urls;
    try { urls = JSON.parse(gallery.getAttribute('data-batches') || '[]'); }
    catch (_) { urls = []; }
    var next = 0, loading = null, observer;
    var sentinel = document.getElementById('gallery-sentinel');
    var status = document.getElementById('gallery-status');

    function complete() { return next >= urls.length; }
    function announce(message) { if (status) status.textContent = message; }
    function finish() {
      if (complete() && sentinel) {
        sentinel.hidden = true;
        if (observer) observer.disconnect();
      }
    }
    function loadNext() {
      if (loading) return loading;
      if (complete()) return Promise.resolve(false);
      var url = urls[next++];
      loading = fetch(url, { credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) throw new Error('Gallery batch request failed');
          return response.json();
        })
        .then(function (items) {
          if (!Array.isArray(items)) throw new Error('Gallery batch is invalid');
          var fragment = document.createDocumentFragment();
          items.forEach(function (record) { fragment.appendChild(tile(record)); });
          gallery.appendChild(fragment);
          gallery.dispatchEvent(new CustomEvent('gallery:items-appended'));
          announce('Loaded ' + items.length + ' more artworks.');
          finish();
          return true;
        })
        .catch(function () {
          next--;
          announce('More artwork could not be loaded. Please reload the page.');
          return false;
        })
        .then(function (result) { loading = null; return result; });
      return loading;
    }
    function ensureSlug(slug) {
      if ([].some.call(gallery.querySelectorAll('[data-slug]'), function (item) {
        return item.getAttribute('data-slug') === slug;
      })) {
        return Promise.resolve(true);
      }
      if (complete()) return Promise.resolve(false);
      return loadNext().then(function (loaded) {
        return loaded ? ensureSlug(slug) : false;
      });
    }

    var api = { loadNext: loadNext, ensureSlug: ensureSlug, isComplete: complete };
    gallery.__galleryProgressive = api;
    if (sentinel && urls.length) {
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) loadNext();
        }, { rootMargin: '1000px 0px' });
        observer.observe(sentinel);
      } else {
        var check = function () {
          if (sentinel.getBoundingClientRect().top < window.innerHeight + 1000) loadNext();
        };
        addEventListener('scroll', check, { passive: true });
        addEventListener('resize', check);
        check();
      }
    }
    finish();
    return api;
  }

  window.GalleryProgressive = { init: init };
  init(document.getElementById('gallery'));
})();
