// artwork-gallery: progressive grids, a lightbox overlay over them, and the
// same lightbox controls on piece pages. Every link and image works without it.
(function () {
  var FROM = 'ag-from';   // sessionStorage: the grid a piece page was reached from

  function store(key, value) {
    try {
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch (_) {}
  }
  function stored(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }
  function modified(ev) {
    return ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey;
  }
  function typing() {
    return /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  }

  // Wire one .lightbox element: views swap into the main image, zoom scales
  // it 2x in place (drag to pan), and a horizontal swipe calls onSwipe(-1 | 1).
  function bindLightbox(box, onSwipe) {
    var main = box.querySelector('.lightbox__image');
    var picture = main && main.closest('picture');
    var stage = box.querySelector('.lightbox__stage');
    var note = box.querySelector('.lightbox__view-caption');
    var zoomButton = box.querySelector('.lightbox__zoom');
    var views = [].slice.call(box.querySelectorAll('.lightbox__views a[data-avif]'));
    var at = 0;

    // Zoom: scale(2) on the image, panned by dragging within its bounds. The
    // image's sizes doubles meanwhile so the browser loads a sharper source.
    var SCALE = 2, zoomed = false, panX = 0, panY = 0;
    var sized = picture ? [].slice.call(picture.querySelectorAll('source, img')) : [];
    var sizes = sized.map(function (el) { return el.getAttribute('sizes'); });
    function applyPan() {
      main.style.transform = zoomed ?
        'translate(' + panX + 'px, ' + panY + 'px) scale(' + SCALE + ')' : '';
    }
    function setZoom(on) {
      if (!main || !zoomButton) return;
      zoomed = on;
      panX = panY = 0;
      box.classList.toggle('lightbox--zoomed', on);
      sized.forEach(function (el, k) {
        if (sizes[k]) el.setAttribute('sizes', on ? SCALE * 100 + 'vw' : sizes[k]);
      });
      applyPan();
      zoomButton.setAttribute('aria-pressed', String(on));
      zoomButton.setAttribute('aria-label', on ? 'Reset zoom' : 'Zoom image');
    }
    function bounds() {
      var w = main.offsetWidth, h = main.offsetHeight;
      return { x: w * (SCALE - 1) / 2, y: h * (SCALE - 1) / 2 };
    }
    function clamp(v, max) { return Math.max(-max, Math.min(max, v)); }

    function show(n) {
      if (!views.length || !main) return;
      setZoom(false);
      at = (n + views.length) % views.length;
      var view = views[at];
      var sources = picture.querySelectorAll('source');
      sources[0].srcset = view.getAttribute('data-avif');
      sources[1].srcset = view.getAttribute('data-webp');
      main.src = view.getAttribute('href');
      main.width = +view.getAttribute('data-w');
      main.height = +view.getAttribute('data-h');
      main.alt = view.getAttribute('data-alt') || '';
      if (note) note.textContent = view.getAttribute('data-caption') || '';
      views.forEach(function (link, k) {
        if (k === at) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }
    views.forEach(function (link, n) {
      link.addEventListener('click', function (ev) {
        if (modified(ev)) return;
        ev.preventDefault();
        show(n);
      });
    });
    if (zoomButton && main) {
      zoomButton.hidden = false;
      zoomButton.addEventListener('click', function (ev) {
        ev.stopPropagation();
        setZoom(!zoomed);
      });
    }

    // One pointer gesture on the stage: a drag pans while zoomed, a
    // horizontal swipe pages otherwise, and a plain tap toggles zoom.
    var start = null;
    if (stage && main) {
      stage.addEventListener('pointerdown', function (ev) {
        if (ev.button) return;
        start = { x: ev.clientX, y: ev.clientY, panX: panX, panY: panY, moved: false,
                  onImage: ev.target === main };
        if (zoomed) {
          stage.setPointerCapture(ev.pointerId);
          main.classList.add('is-dragging');
          ev.preventDefault();
        }
      });
      stage.addEventListener('pointermove', function (ev) {
        if (!start) return;
        var dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) start.moved = true;
        if (!zoomed) return;
        var b = bounds();
        panX = clamp(start.panX + dx, b.x);
        panY = clamp(start.panY + dy, b.y);
        applyPan();
      });
      stage.addEventListener('pointerup', function (ev) {
        if (!start) return;
        var dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        var moved = start.moved, onImage = start.onImage;
        start = null;
        main.classList.remove('is-dragging');
        if (!moved) {
          if (onImage && zoomButton) setZoom(!zoomed);
        } else if (!zoomed && ev.pointerType !== 'mouse' &&
                   Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
          onSwipe(dx < 0 ? 1 : -1);
        }
      });
      stage.addEventListener('pointercancel', function () {
        start = null;
        main.classList.remove('is-dragging');
      });
    }
    return {
      step: function (d) { if (views.length) show(at + d); },
      hasViews: views.length > 0,
      zoomed: function () { return zoomed; },
      zoom: function (on) { setZoom(on === undefined ? !zoomed : on); }
    };
  }

  // ------------------------------------------------------------------ grid --
  function tile(record, sizes) {
    var item = document.createElement('li');
    item.className = 'tile';
    item.id = record.slug;
    item.style.setProperty('--ar', (record.w / record.h).toFixed(4));
    var link = document.createElement('a');
    link.href = record.href;
    link.setAttribute('data-slug', record.slug);
    var picture = document.createElement('picture');
    [['image/avif', record.avif], ['image/webp', record.webp]].forEach(function (pair) {
      var source = document.createElement('source');
      source.type = pair[0];
      source.srcset = pair[1];
      source.sizes = sizes;
      picture.appendChild(source);
    });
    var image = document.createElement('img');
    image.src = record.jpg;
    image.alt = record.alt || '';
    image.width = record.w;
    image.height = record.h;
    image.loading = 'lazy';
    image.decoding = 'async';
    picture.appendChild(image);
    link.appendChild(picture);
    if (record.title || record.meta) {
      var caption = document.createElement('span');
      caption.className = 'tile__caption';
      [['tile__title', record.title], ['tile__meta', record.meta]].forEach(function (pair) {
        if (!pair[1]) return;
        var span = document.createElement('span');
        span.className = pair[0];
        span.textContent = pair[1];
        caption.appendChild(span);
      });
      link.appendChild(caption);
    }
    item.appendChild(link);
    return item;
  }

  function initGrid(grid) {
    var urls;
    try { urls = JSON.parse(grid.getAttribute('data-batches') || '[]'); }
    catch (_) { urls = []; }
    var sizes = grid.getAttribute('data-sizes') || '100vw';
    var gridPath = grid.getAttribute('data-gallery-path') || location.pathname;
    var next = 0, loading = null, observer;
    var sentinel = document.getElementById('gallery-sentinel');
    var status = document.getElementById('gallery-status');

    function complete() { return next >= urls.length; }
    function near() {
      return sentinel && sentinel.getBoundingClientRect().top < innerHeight + 1000;
    }
    // Resolves true when a batch was added.
    function loadNext() {
      if (loading) return loading;
      if (complete()) return Promise.resolve(false);
      var url = urls[next++];
      loading = fetch(url, { credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) throw new Error('batch request failed');
          return response.json();
        })
        .then(function (items) {
          var fragment = document.createDocumentFragment();
          items.forEach(function (record) { fragment.appendChild(tile(record, sizes)); });
          grid.appendChild(fragment);
          if (status) status.textContent = 'Loaded ' + items.length + ' more works.';
          if (complete()) {
            if (sentinel) sentinel.hidden = true;
            if (observer) observer.disconnect();
          }
          loading = null;
          // The observer fires only when the sentinel enters its margin, so
          // keep going while it is still within reach after this batch.
          requestAnimationFrame(function () { if (near()) loadNext(); });
          return true;
        })
        .catch(function () {
          next--;
          loading = null;
          if (status) status.textContent = 'More work could not be loaded. Please reload the page.';
          return false;
        });
      return loading;
    }
    if (sentinel && urls.length) {
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) loadNext();
        }, { rootMargin: '1000px 0px' });
        observer.observe(sentinel);
      } else {
        addEventListener('scroll', function () { if (near()) loadNext(); }, { passive: true });
        if (near()) loadNext();
      }
    }
    initOverlay(grid, gridPath, loadNext, complete);
  }

  // --------------------------------------------------------------- overlay --
  // Tiles open the piece in an overlay over the grid: its lightbox element is
  // taken from the piece page itself, so there is one source of markup.
  function initOverlay(grid, gridPath, loadNext, complete) {
    var cache = {};
    var overlay = null, current = -1, pushed = false;
    var gridTitle = document.title;
    var page = grid.closest('main') || document.body;

    function links() { return [].slice.call(grid.querySelectorAll('a[data-slug]')); }
    function fetchPiece(href) {
      if (!cache[href]) {
        cache[href] = fetch(href, { credentials: 'same-origin' })
          .then(function (response) {
            if (!response.ok) throw new Error('piece request failed');
            return response.text();
          })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var box = doc.querySelector('.lightbox');
            if (!box) throw new Error('no lightbox');
            return { box: box, title: doc.title };
          })
          .catch(function (error) { delete cache[href]; throw error; });
      }
      return cache[href];
    }
    // Fetch a piece page as soon as the pointer or focus reaches its tile.
    ['pointerover', 'focusin'].forEach(function (type) {
      grid.addEventListener(type, function (ev) {
        var link = ev.target.closest && ev.target.closest('a[data-slug]');
        if (link) fetchPiece(link.getAttribute('href')).catch(function () {});
      });
    });

    function frame() {
      overlay = document.createElement('div');
      overlay.className = 'ag-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('tabindex', '-1');
      document.body.appendChild(overlay);
      page.inert = true;
      document.documentElement.classList.add('ag-overlay-open');
    }
    // A placeholder from the tile's own image while the piece page arrives.
    function placeholder(link) {
      var image = link.querySelector('img');
      overlay.innerHTML = '<div class="lightbox lightbox--loading"><div class="lightbox__stage"></div></div>';
      if (image) {
        var copy = document.createElement('img');
        copy.className = 'lightbox__image';
        copy.src = image.currentSrc || image.src;
        copy.alt = image.alt;
        overlay.querySelector('.lightbox__stage').appendChild(copy);
      }
    }

    function show(i, historyMode) {
      var all = links();
      if (i >= all.length) {
        if (complete()) return;
        loadNext().then(function (added) { if (added) show(i, historyMode); });
        return;
      }
      if (i < 0) return;
      current = i;
      var link = all[i];
      var href = link.getAttribute('href');
      if (!overlay) frame();
      placeholder(link);
      if (historyMode === 'push') { history.pushState({ agOverlay: true }, '', href); pushed = true; }
      else if (historyMode === 'replace') history.replaceState({ agOverlay: true }, '', href);
      fetchPiece(href).then(function (piece) {
        if (!overlay || current !== i) return;
        var box = document.importNode(piece.box, true);
        overlay.innerHTML = '';
        overlay.appendChild(box);
        document.title = piece.title;
        wire(box, i);
        var close = box.querySelector('.lightbox__close');
        if (close) close.focus({ preventScroll: true });
        // Get the neighbours ready.
        [i - 1, i + 1].forEach(function (k) {
          var neighbour = links()[k];
          if (neighbour) fetchPiece(neighbour.getAttribute('href')).catch(function () {});
        });
      }).catch(function () {
        location.href = href;   // fall back to the piece page itself
      });
    }

    var controls = null;
    function wire(box, i) {
      var all = links();
      var prev = box.querySelector('[data-nav="prev"]');
      var next = box.querySelector('[data-nav="next"]');
      var close = box.querySelector('[data-nav="up"]');
      // Previous and next follow this grid, not the piece's home collection.
      if (prev) {
        prev.hidden = i === 0;
        if (all[i - 1]) prev.href = all[i - 1].getAttribute('href');
        prev.onclick = function (ev) { if (modified(ev)) return; ev.preventDefault(); step(-1); };
      }
      if (next) {
        next.hidden = i === all.length - 1 && complete();
        if (all[i + 1]) next.href = all[i + 1].getAttribute('href');
        next.onclick = function (ev) { if (modified(ev)) return; ev.preventDefault(); step(1); };
      }
      if (close) {
        close.href = gridPath;
        close.onclick = function (ev) { if (modified(ev)) return; ev.preventDefault(); closeOverlay(); };
      }
      controls = bindLightbox(box, step);
      box.addEventListener('click', function (ev) {
        if (ev.target === box) closeOverlay();   // the dark backdrop closes
      });
    }
    function step(d) { show(current + d, 'replace'); }

    function teardown() {
      if (!overlay) return;
      overlay.remove();
      overlay = null;
      controls = null;
      page.inert = false;
      document.documentElement.classList.remove('ag-overlay-open');
      document.title = gridTitle;
      var link = links()[current];
      if (link) {
        link.focus({ preventScroll: true });
        var rect = link.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) link.scrollIntoView({ block: 'center' });
      }
      current = -1;
    }
    function closeOverlay() {
      if (pushed && history.state && history.state.agOverlay) {
        history.back();   // popstate tears the overlay down
      } else {
        history.replaceState(null, '', gridPath);
        teardown();
      }
    }

    grid.addEventListener('click', function (ev) {
      var link = ev.target.closest && ev.target.closest('a[data-slug]');
      if (!link || modified(ev)) return;
      ev.preventDefault();
      store(FROM, gridPath);
      show(links().indexOf(link), 'push');
    });
    addEventListener('popstate', function () {
      if (location.pathname === gridPath) { pushed = false; teardown(); return; }
      var i = links().map(function (a) { return a.getAttribute('href'); }).indexOf(location.pathname);
      if (i >= 0) show(i, null);
    });
    addEventListener('keydown', function (ev) {
      if (!overlay || modified(ev) || typing()) return;
      if (ev.key === 'Escape' && controls && controls.zoomed()) { ev.preventDefault(); controls.zoom(false); }
      else if (ev.key === 'Escape') { ev.preventDefault(); closeOverlay(); }
      else if (ev.key.toLowerCase() === 'z' && controls) controls.zoom();
      else if (ev.key === 'ArrowLeft') step(-1);
      else if (ev.key === 'ArrowRight') step(1);
      else if (ev.key === 'ArrowDown' && controls && controls.hasViews) { ev.preventDefault(); controls.step(1); }
      else if (ev.key === 'ArrowUp' && controls && controls.hasViews) { ev.preventDefault(); controls.step(-1); }
      else if (ev.key === 'Tab') {
        var focusable = [].slice.call(overlay.querySelectorAll('a[href]:not([hidden]), button:not([hidden])'));
        if (!focusable.length) return;
        var k = focusable.indexOf(document.activeElement);
        if (ev.shiftKey && k <= 0) { ev.preventDefault(); focusable[focusable.length - 1].focus(); }
        else if (!ev.shiftKey && k === focusable.length - 1) { ev.preventDefault(); focusable[0].focus(); }
      }
    });
  }

  // ----------------------------------------------------------------- piece --
  // A piece page opened directly: the same controls, driving real links.
  function initPiece(contexts) {
    var box = document.querySelector('.lightbox');
    if (!box) return;
    var nav = {};
    [].forEach.call(box.querySelectorAll('[data-nav]'), function (link) {
      nav[link.getAttribute('data-nav')] = link;
    });
    var sameSite = document.referrer &&
      new URL(document.referrer).origin === location.origin;

    // Follow the collection the visitor came from, if this piece is in it.
    function applyContext() {
      var from = sameSite ? stored(FROM) : null;
      if (!sameSite) store(FROM, null);
      var context = from && contexts[from];
      if (!context || !nav.up) return;
      nav.up.href = from;
      nav.up.setAttribute('aria-label', 'Close: back to ' + context.label);
      ['prev', 'next'].forEach(function (key) {
        var link = nav[key];
        if (!link) return;
        if (context[key]) { link.href = context[key]; link.hidden = false; }
        else { link.removeAttribute('href'); link.hidden = true; }
      });
    }
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', applyContext, { once: true });
    } else {
      applyContext();
    }
    [nav.prev, nav.next].forEach(function (link) {
      if (link) link.addEventListener('click', function () {
        if (!stored(FROM)) store(FROM, nav.up.getAttribute('href'));
      });
    });
    // Closing returns to the collection; straight back if we came from it.
    if (nav.up) nav.up.addEventListener('click', function (ev) {
      if (modified(ev)) return;
      if (sameSite && new URL(document.referrer).pathname === nav.up.getAttribute('href')) {
        ev.preventDefault();
        history.back();
      }
    });

    function go(key) {
      var link = nav[key];
      if (link && !link.hidden && link.getAttribute('href')) link.click();
    }
    var controls = bindLightbox(box, function (d) { go(d < 0 ? 'prev' : 'next'); });
    addEventListener('keydown', function (ev) {
      if (modified(ev) || ev.defaultPrevented || typing()) return;
      if (ev.key === 'Escape' && controls.zoomed()) controls.zoom(false);
      else if (ev.key.toLowerCase() === 'z') controls.zoom();
      else if (ev.key === 'ArrowLeft') go('prev');
      else if (ev.key === 'ArrowRight') go('next');
      else if (ev.key === 'Escape') go('up');
      else if (ev.key === 'ArrowDown' && controls.hasViews) { ev.preventDefault(); controls.step(1); }
      else if (ev.key === 'ArrowUp' && controls.hasViews) { ev.preventDefault(); controls.step(-1); }
    });
  }

  var grid = document.getElementById('gallery');
  if (grid) initGrid(grid);
  var context = document.getElementById('ag-context');
  if (context) {
    try { initPiece(JSON.parse(context.textContent)); } catch (_) {}
  }
})();
