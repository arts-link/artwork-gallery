// Turn a real artwork URL into the gallery lightbox without a reload.
// The original artwork HTML remains the no-JavaScript and crawler fallback.
(function () {
  // Fingerprinted script URLs are handed over by the template.
  var self = document.currentScript;
  var lightboxSrc = self && self.getAttribute('data-lightbox');
  var progressiveSrc = self && self.getAttribute('data-progressive');
  var galleryPath = (self && self.getAttribute('data-gallery-path')) || '/gallery/';
  function revealFallback() {
    clearTimeout(window.__galleryFallback);
    document.documentElement.classList.remove('gallery-enhancing');
    document.documentElement.removeAttribute('aria-busy');
  }
  var main = document.querySelector('main');
  if (!main || !lightboxSrc || !progressiveSrc ||
      !location.pathname.startsWith(galleryPath)) {
    revealFallback();
    return;
  }
  var original = main.innerHTML;

  fetch(galleryPath, { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('Gallery request failed');
      return response.text();
    })
    .then(function (html) {
      var source = new DOMParser().parseFromString(html, 'text/html').querySelector('main');
      var gallery = source && source.querySelector('#gallery');
      if (!gallery) throw new Error('Gallery markup missing');
      gallery.hidden = true;
      gallery.setAttribute('data-reveal-on-close', '');
      [].forEach.call(gallery.querySelectorAll('img'), function (image) {
        image.loading = 'lazy';
        image.removeAttribute('fetchpriority');
      });
      main.innerHTML = source.innerHTML;
      gallery = main.querySelector('#gallery');

      function loadLightbox() {
        var script = document.createElement('script');
        script.src = lightboxSrc;
        script.onload = function () {
          if (!document.querySelector('.lightbox')) main.innerHTML = original;
          revealFallback();
        };
        script.onerror = function () {
          main.innerHTML = original;
          revealFallback();
        };
        document.body.appendChild(script);
      }
      var progressive = document.createElement('script');
      progressive.src = progressiveSrc;
      progressive.onload = function () {
        var loader = window.GalleryProgressive && window.GalleryProgressive.init(gallery);
        var slug = location.pathname.replace(/\/+$/, '').split('/').pop();
        if (!loader) throw new Error('Gallery loader missing');
        loader.ensureSlug(slug).then(function (found) {
          if (found) loadLightbox();
          else { main.innerHTML = original; revealFallback(); }
        }).catch(function () { main.innerHTML = original; revealFallback(); });
      };
      progressive.onerror = function () { main.innerHTML = original; revealFallback(); };
      document.body.appendChild(progressive);
    })
    .catch(function () {
      // Keep the complete artwork page usable if enhancement cannot load.
      main.innerHTML = original;
      revealFallback();
    });
})();
