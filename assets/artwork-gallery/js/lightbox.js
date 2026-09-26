// Optional. Without it every tile links to its complete artwork page.
(function () {
  var g = document.getElementById('gallery');
  if (!g) return;
  var links = [];
  var box, img, cap, zoomButton, stage, at = 0, returnFocus = null, pageMain = g.closest('main');
  var zoomed = false, panX = 0, panY = 0, dragging = false, didDrag = false;
  var dragStartX = 0, dragStartY = 0, dragPanX = 0, dragPanY = 0;
  var zoomScale = 2;
  var lastInputWasKeyboard = false;
  var galleryPath = g.getAttribute('data-gallery-path') || '/gallery/';
  var galleryTitle = g.getAttribute('data-gallery-title') || document.title;

  function refreshLinks() {
    links = [].slice.call(g.querySelectorAll('a[data-i]'));
  }
  refreshLinks();
  g.addEventListener('gallery:items-appended', refreshLinks);

  function slug(i) { return links[i].getAttribute('data-slug'); }
  function path(i) { return galleryPath + encodeURIComponent(slug(i)) + '/'; }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function panBounds() {
    var rect = img.getBoundingClientRect();
    return { x: Math.max(0, rect.width * (zoomScale - 1) / (2 * zoomScale)),
             y: Math.max(0, rect.height * (zoomScale - 1) / (2 * zoomScale)) };
  }

  function applyPan() {
    img.style.transform = zoomed ?
      'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomScale + ')' : '';
  }

  function setZoom(nextZoom) {
    if (!img) return;
    zoomed = nextZoom;
    if (!zoomed) panX = panY = 0;
    img.classList.toggle('is-zoomed', zoomed);
    applyPan();
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.setAttribute('aria-label', zoomed ? 'Reset image zoom' : 'Zoom image to 2 times');
    zoomButton.title = zoomed ? 'Reset zoom' : 'Zoom image';
  }

  function show(i, updatePath) {
    if (i >= links.length && g.__galleryProgressive &&
        !g.__galleryProgressive.isComplete()) {
      g.__galleryProgressive.loadNext().then(function (loaded) {
        refreshLinks();
        if (loaded) show(i, updatePath);
      });
      return;
    }
    if (!links.length) return;
    if (i < 0) i = g.__galleryProgressive && !g.__galleryProgressive.isComplete() ? 0 : links.length - 1;
    if (i >= links.length) i = 0;
    at = i;
    var a = links[at];
    var source = a.getAttribute('data-image');
    if (img.getAttribute('src') !== source) img.src = source;
    setZoom(false);
    img.alt = a.getAttribute('data-alt') || '';
    var t = a.getAttribute('data-title'), m = a.getAttribute('data-meta');
    cap.textContent = '';
    var strong = document.createElement('b');
    strong.id = 'lightbox-title';
    strong.textContent = t || a.getAttribute('data-alt') || 'Artwork';
    cap.appendChild(strong);
    if (m) cap.appendChild(document.createTextNode(m));
    document.title = a.getAttribute('data-document-title') || document.title;
    if (updatePath) history.replaceState({ gallery: true }, '', path(at));
  }
  function close(clearPath) {
    if (box) {
      box.remove(); box = null; document.body.style.overflow = '';
    }
    if (pageMain) {
      pageMain.inert = false;
      pageMain.removeAttribute('aria-hidden');
    }
    if (g.hasAttribute('data-reveal-on-close')) {
      g.hidden = false;
      g.removeAttribute('data-reveal-on-close');
    }
    if (clearPath && location.pathname !== galleryPath) {
      history.replaceState(null, '', galleryPath + location.search);
    }
    if (location.pathname === galleryPath) document.title = galleryTitle;
    var focusTarget = returnFocus && returnFocus !== document.body &&
                      document.contains(returnFocus) ? returnFocus : links[at];
    if (focusTarget) {
      if (!lastInputWasKeyboard) {
        focusTarget.setAttribute('data-pointer-focus-return', '');
        focusTarget.addEventListener('blur', function () {
          focusTarget.removeAttribute('data-pointer-focus-return');
        }, { once: true });
      }
      focusTarget.focus({ preventScroll: true });
    }
  }
  function open(i, pushPath) {
    returnFocus = document.activeElement;
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'lightbox-title');
    box.setAttribute('tabindex', '-1');
    box.innerHTML = '<button class="lightbox__close" aria-label="Close">&times;</button>' +
                    '<button class="lightbox__prev" aria-label="Previous">&lsaquo;</button>' +
                    '<button class="lightbox__next" aria-label="Next">&rsaquo;</button>' +
                    '<button class="lightbox__zoom" aria-label="Zoom image to 2 times" aria-pressed="false" title="Zoom image">' +
                    '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5"></circle><path d="m15 15 5 5"></path></svg></button>' +
                    '<div class="lightbox__stage"><img alt=""></div>' +
                    '<p class="lightbox__cap" aria-live="polite" aria-atomic="true"></p>';
    if (pageMain) {
      pageMain.inert = true;
      pageMain.setAttribute('aria-hidden', 'true');
    }
    document.body.appendChild(box);
    document.body.style.overflow = 'hidden';
    img = box.querySelector('img'); cap = box.querySelector('.lightbox__cap');
    stage = box.querySelector('.lightbox__stage');
    zoomButton = box.querySelector('.lightbox__zoom');
    box.querySelector('.lightbox__close').onclick = function () { close(true); };
    box.querySelector('.lightbox__prev').onclick = function (ev) { ev.stopPropagation(); show(at - 1, true); };
    box.querySelector('.lightbox__next').onclick = function (ev) { ev.stopPropagation(); show(at + 1, true); };
    zoomButton.onclick = function (ev) {
      ev.stopPropagation(); setZoom(!zoomed);
    };
    img.onclick = function (ev) {
      if (didDrag) { didDrag = false; return; }
      setZoom(!zoomed);
    };
    stage.addEventListener('pointerdown', function (ev) {
      if (!zoomed || ev.button) return;
      dragging = true; didDrag = false;
      dragStartX = ev.clientX; dragStartY = ev.clientY;
      dragPanX = panX; dragPanY = panY;
      stage.setPointerCapture(ev.pointerId);
      img.classList.add('is-dragging');
      ev.preventDefault();
    });
    stage.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      var dx = ev.clientX - dragStartX, dy = ev.clientY - dragStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;
      var bounds = panBounds();
      panX = clamp(dragPanX + dx, -bounds.x, bounds.x);
      panY = clamp(dragPanY + dy, -bounds.y, bounds.y);
      applyPan();
    });
    function stopDrag() {
      dragging = false;
      if (img) img.classList.remove('is-dragging');
    }
    stage.addEventListener('pointerup', stopDrag);
    stage.addEventListener('pointercancel', stopDrag);
    box.onclick = function (ev) { if (ev.target === box) close(true); };
    show(i, false);
    if (pushPath) history.pushState({ gallery: true }, '', path(at));
    box.querySelector('.lightbox__close').focus();
  }
  function indexFromPath() {
    var current = location.pathname.replace(/\/*$/, '/');
    return links.findIndex(function (a) { return a.getAttribute('href') === current; });
  }
  function syncFromPath() {
    var i = indexFromPath();
    if (i < 0) close(false);
    else if (box) show(i, false);
    else open(i, false);
  }
  g.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[data-i]');
    if (!a || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    open(parseInt(a.getAttribute('data-i'), 10), true);
  });
  document.addEventListener('keydown', function (ev) {
    lastInputWasKeyboard = true;
    links.forEach(function (link) {
      link.removeAttribute('data-pointer-focus-return');
    });
    if (!box) return;
    if (ev.key === 'Escape') close(true);
    else if (ev.key === 'ArrowLeft') show(at - 1, true);
    else if (ev.key === 'ArrowRight') show(at + 1, true);
    else if (ev.key.toLowerCase() === 'z') setZoom(!zoomed);
    else if (ev.key === 'Tab') {
      var controls = [].slice.call(box.querySelectorAll('button'));
      var position = controls.indexOf(document.activeElement);
      if (ev.shiftKey && position <= 0) {
        ev.preventDefault(); controls[controls.length - 1].focus();
      } else if (!ev.shiftKey && position === controls.length - 1) {
        ev.preventDefault(); controls[0].focus();
      }
    }
  });
  document.addEventListener('pointerdown', function () {
    lastInputWasKeyboard = false;
  }, true);
  addEventListener('popstate', syncFromPath);
  syncFromPath();
})();
