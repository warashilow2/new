/* Eco Spark Cleaning - work album

   The mosaic in the crew section shows five tiles; the markup holds twelve.
   This reads the whole set off those tiles - so the photo list lives in the
   HTML and nowhere else - marks up the two plates that tell a visitor there is
   more behind the mosaic, and runs the lightbox. */
(function () {
  'use strict';

  var grid = document.getElementById('albumGrid');
  var modal = document.getElementById('albumModal');
  if (!grid || !modal) return;

  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.album-tile'));
  if (!tiles.length) return;

  var shots = tiles.map(function (tile) {
    var img = tile.querySelector('img');
    return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
  });

  /* How many tiles the mosaic shows depends on the breakpoint (5, then 4, then
     3), so the "+N more" plate cannot be pinned to one tile from here. Instead
     every tile that is last-visible at some width gets its own plate, each with
     the count that is correct for that width, and CSS shows exactly one. */
  var PLATE_AT = [2, 3, 4];              // zero-based; see .album-tile__more rules

  var img = document.getElementById('albumImg');
  var stage = document.getElementById('albumStage');
  var caption = document.getElementById('albumCaption');
  var indexEl = document.getElementById('albumIndex');
  var totalEl = document.getElementById('albumTotal');
  var thumbsEl = document.getElementById('albumThumbs');

  var at = 0;
  var lastTrigger = null;
  var thumbs = [];

  /* ------------------------------------------------------ mosaic plates */

  function plate(html, cls, into) {
    var el = document.createElement('span');
    el.className = cls;
    el.innerHTML = html;
    into.appendChild(el);
  }

  // the opener says how many there are...
  plate(
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2.5"/>' +
    '<path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V6"/><circle cx="12" cy="13" r="3.4"/></svg>' +
    shots.length + ' photos',
    'album-tile__badge', tiles[0]
  );

  // ...and whichever tile ends the mosaic says how many are still behind it
  PLATE_AT.forEach(function (i) {
    var left = shots.length - (i + 1);
    if (left > 0 && tiles[i]) {
      plate('<b>+' + left + '</b><span>more</span>', 'album-tile__more', tiles[i]);
    }
  });

  /* ----------------------------------------------------------- lightbox */

  function show(i) {
    at = ((i % shots.length) + shots.length) % shots.length;
    img.src = shots[at].src;
    img.alt = shots[at].alt;
    caption.textContent = shots[at].alt;
    indexEl.textContent = String(at + 1);

    thumbs.forEach(function (t, n) {
      var on = n === at;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-current', on ? 'true' : 'false');
    });
    // keep the active thumbnail in the strip rather than off the end of it
    if (thumbs[at] && thumbs[at].scrollIntoView) {
      thumbs[at].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  function go(step) { show(at + step); }

  function open(i, trigger) {
    lastTrigger = trigger || null;
    show(i);
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    document.body.classList.add('is-locked');
  }

  // idempotent: the close button, Esc and the backdrop all land here
  function close() {
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
    document.body.classList.remove('is-locked');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  }

  /* -------------------------------------------------------------- wiring */

  totalEl.textContent = String(shots.length);

  shots.forEach(function (shot, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'album__thumb';
    b.setAttribute('aria-label', 'Photo ' + (i + 1));
    var t = document.createElement('img');
    t.src = shot.src;
    t.alt = '';
    t.loading = 'lazy';
    b.appendChild(t);
    b.addEventListener('click', function () { show(i); });
    thumbsEl.appendChild(b);
    thumbs.push(b);
  });

  // every tile opens the album on its own photo, the "+N" one included: you
  // clicked a picture, you get that picture, and the rest are a swipe away
  grid.addEventListener('click', function (e) {
    var tile = e.target.closest('.album-tile');
    if (!tile) return;
    open(Number(tile.dataset.shot) || 0, tile);
  });

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close-album]')) { close(); return; }
    var nav = e.target.closest('[data-album]');
    if (nav) go(Number(nav.dataset.album));
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });

  /* Swiping the photo. Same shape as the deck: touch-action:pan-y leaves
     vertical scrolling to the browser, and the axis check does the same job for
     a mouse, which has no such split. preventDefault on pointerdown stops the
     browser starting its own image drag, which would otherwise cancel the
     gesture before it began. */
  var drag = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    drag = { x: e.clientX, y: e.clientY, locked: false, id: e.pointerId };
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id || drag.locked) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }   // that was a scroll
    drag.locked = true;
    modal.classList.add('is-dragging');
    go(dx < 0 ? 1 : -1);
  });
  function endDrag() { drag = null; modal.classList.remove('is-dragging'); }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* Backdrop close, same two guards as every other dialog here: the press has
     to land on the dialog element itself rather than a child, and its
     coordinates have to be outside the panel - the dialog has padding of its
     own and a click on that strip is a click inside. Measured on pointerdown,
     before anything can move. */
  var pressWasOutside = false;
  modal.addEventListener('pointerdown', function (e) {
    if (e.target !== modal) { pressWasOutside = false; return; }
    var r = modal.getBoundingClientRect();
    pressWasOutside = e.clientX < r.left || e.clientX > r.right ||
                      e.clientY < r.top  || e.clientY > r.bottom;
  });
  modal.addEventListener('click', function (e) {
    if (pressWasOutside && e.target === modal) close();
    pressWasOutside = false;
  });
})();
