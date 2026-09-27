// artwork-gallery: progressive grids, and piece pages that follow the
// collection a visitor came from. Every link and image works without it.
(function () {
  var FROM = 'ag-from';   // sessionStorage: path of the grid last clicked from
  var ART = 'ag-art';     // view-transition name shared by tile and piece image

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
    var next = 0, loading = null, observer;
    var sentinel = document.getElementById('gallery-sentinel');
    var status = document.getElementById('gallery-status');

    function complete() { return next >= urls.length; }
    function near() {
      return sentinel && sentinel.getBoundingClientRect().top < innerHeight + 1000;
    }
    function loadNext() {
      if (loading || complete()) return;
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
        })
        .catch(function () {
          next--;
          loading = null;
          if (status) status.textContent = 'More work could not be loaded. Please reload the page.';
        });
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

    // Remember which collection a piece was opened from, and let its image
    // carry into the piece page's view transition.
    grid.addEventListener('click', function (ev) {
      var link = ev.target.closest && ev.target.closest('a[data-slug]');
      if (!link || modified(ev)) return;
      store(FROM, grid.getAttribute('data-gallery-path'));
      var image = link.querySelector('img');
      if (image) image.style.viewTransitionName = ART;
    });

    // Coming back from a piece: morph its image into its tile, if loaded.
    addEventListener('pagereveal', function (ev) {
      if (!ev.viewTransition || !window.navigation || !navigation.activation) return;
      var from = navigation.activation.from;
      var path = from && new URL(from.url).pathname;
      var image = path && grid.querySelector('a[href="' + path + '"] img');
      if (!image) { ev.viewTransition.skipTransition(); return; }
      image.style.viewTransitionName = ART;
      ev.viewTransition.finished.then(function () { image.style.viewTransitionName = ''; });
    });
    addEventListener('pageshow', function () {
      [].forEach.call(grid.querySelectorAll('img'), function (image) {
        image.style.viewTransitionName = '';
      });
    });
  }

  // ----------------------------------------------------------------- piece --
  function initPiece(contexts) {
    var nav = {};
    [].forEach.call(document.querySelectorAll('[data-nav]'), function (link) {
      nav[link.getAttribute('data-nav')] = link;
    });

    // Follow the collection the visitor came from, if this piece is in it.
    function applyContext() {
      var sameSite = document.referrer &&
        new URL(document.referrer).origin === location.origin;
      var from = sameSite ? stored(FROM) : null;
      if (!sameSite) store(FROM, null);
      var context = from && contexts[from];
      if (!context || !nav.up) return;
      nav.up.href = from;
      nav.up.textContent = context.label;
      ['prev', 'next'].forEach(function (key) {
        var link = nav[key];
        if (!link) return;
        if (context[key]) {
          link.href = context[key];
          link.hidden = false;
        } else {
          link.removeAttribute('href');
          link.hidden = true;
        }
      });
    }
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', applyContext, { once: true });
    } else {
      applyContext();
    }
    // Moving on to a neighbour keeps the same collection.
    [nav.prev, nav.next].forEach(function (link) {
      if (link) link.addEventListener('click', function () {
        if (!stored(FROM)) store(FROM, nav.up.getAttribute('href'));
      });
    });

    function go(key) {
      var link = nav[key];
      if (link && !link.hidden && link.getAttribute('href')) link.click();
    }

    // Further views of the piece replace the main image in place.
    var main = document.querySelector('.artwork__image');
    var picture = main && main.closest('picture');
    var caption = document.querySelector('.artwork__caption');
    var zoom = document.querySelector('.artwork__zoom');
    var views = [].slice.call(document.querySelectorAll('.artwork__views a[data-avif]'));
    var at = 0;
    function show(n) {
      if (!views.length || !main) return;
      at = (n + views.length) % views.length;
      var view = views[at];
      var sources = picture.querySelectorAll('source');
      sources[0].srcset = view.getAttribute('data-avif');
      sources[1].srcset = view.getAttribute('data-webp');
      main.src = view.getAttribute('href');
      main.width = +view.getAttribute('data-w');
      main.height = +view.getAttribute('data-h');
      main.alt = view.getAttribute('data-alt') || '';
      if (zoom) zoom.setAttribute('data-zoom', view.getAttribute('data-zoom'));
      if (caption) caption.textContent = view.getAttribute('data-caption') || '';
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

    var swiped = false;
    // Zoom: the largest version at full size, scrollable in a dialog.
    if (zoom && window.HTMLDialogElement) {
      zoom.hidden = false;
      var dialog = document.createElement('dialog');
      dialog.className = 'ag-zoom';
      dialog.innerHTML = '<img alt="">';
      document.body.appendChild(dialog);
      var large = dialog.querySelector('img');
      zoom.addEventListener('click', function () {
        if (swiped) { swiped = false; return; }
        large.src = zoom.getAttribute('data-zoom');
        large.alt = main ? main.alt : '';
        dialog.showModal();
        large.decode().catch(function () {}).then(function () {
          dialog.scrollTop = (dialog.scrollHeight - dialog.clientHeight) / 2;
          dialog.scrollLeft = (dialog.scrollWidth - dialog.clientWidth) / 2;
        });
      });
      dialog.addEventListener('click', function () { dialog.close(); });
    }

    addEventListener('keydown', function (ev) {
      if (modified(ev) || ev.defaultPrevented) return;
      if (document.querySelector('dialog[open]')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      if (ev.key === 'ArrowLeft') go('prev');
      else if (ev.key === 'ArrowRight') go('next');
      else if (ev.key === 'ArrowDown' && views.length) { ev.preventDefault(); show(at + 1); }
      else if (ev.key === 'ArrowUp' && views.length) { ev.preventDefault(); show(at - 1); }
    });

    // Swipe left or right on the image for the next or previous piece.
    var stage = document.querySelector('.artwork__stage') || zoom;
    var startX = null, startY = 0;
    if (stage) {
      stage.parentNode.addEventListener('pointerdown', function (ev) {
        if (ev.pointerType === 'mouse') return;
        startX = ev.clientX; startY = ev.clientY;
      });
      stage.parentNode.addEventListener('pointerup', function (ev) {
        if (startX === null) return;
        var dx = ev.clientX - startX, dy = ev.clientY - startY;
        startX = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
          swiped = true;   // the tap that ends a swipe must not open the zoom
          go(dx < 0 ? 'next' : 'prev');
        }
      });
    }
  }

  var grid = document.getElementById('gallery');
  if (grid) initGrid(grid);
  var context = document.getElementById('ag-context');
  if (context) {
    try { initPiece(JSON.parse(context.textContent)); } catch (_) {}
  }
})();
