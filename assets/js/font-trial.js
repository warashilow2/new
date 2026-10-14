/* Eco Spark Cleaning - TEMPORARY font trial

   One badge, fixed to the viewport, naming the pair the section you are
   currently looking at is set in. A badge per section was the obvious first
   go, but it sits at the top of its section and scrolls away, so for most of
   a tall section you are looking at a face with nothing to tell you which one
   it is - which is the one thing the trial exists to do.

   The pairs themselves live in assets/css/fonts-trial.css; this file only
   names them, so the two cannot disagree about what is on screen.

   DELETE THIS FILE, assets/css/fonts-trial.css and assets/fonts/trial/ once a
   pairing has been picked. Nothing else refers to any of them. */
(function () {
  'use strict';

  var PAIRS = [
    ['.hero',     1, 'Manrope', 'Inter'],
    ['.results',  1, 'Manrope', 'Inter'],
    ['.services', 1, 'Manrope', 'Inter'],
    ['.reviews',  1, 'Manrope', 'Inter'],
    ['.crew',     1, 'Manrope', 'Inter'],
    ['.flow',     1, 'Manrope', 'Inter'],
    ['.faq',      1, 'Manrope', 'Inter']
  ];

  var items = PAIRS.map(function (p) {
    return { el: document.querySelector(p[0]), n: p[1], display: p[2], ui: p[3] };
  }).filter(function (it) { return it.el; });
  if (!items.length) return;

  var tag = document.createElement('div');
  tag.className = 'ftrial';
  // scaffolding, not content: never read out, never part of what a crawler sees
  tag.setAttribute('aria-hidden', 'true');

  var num = document.createElement('b');
  var display = document.createElement('i');
  var ui = document.createElement('s');
  tag.appendChild(num);
  tag.appendChild(display);
  tag.appendChild(ui);
  document.body.appendChild(tag);

  var shown = null;

  /* Which section is being looked at = the one under the middle of the screen.
     Measuring against the centre rather than the top means the badge changes
     when the new section actually dominates the view, not the moment its first
     pixel appears. */
  function pick() {
    var mid = window.innerHeight / 2;
    var found = null;
    for (var i = 0; i < items.length; i++) {
      var r = items[i].el.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { found = items[i]; break; }
    }
    // between sections (or past the last one) the badge keeps the last answer
    // rather than flickering off and back on
    if (!found || found === shown) return;
    shown = found;
    num.textContent = 'all headings';
    display.textContent = found.display;
    ui.textContent = '+ ' + found.ui;
    // the badge sets each name in the face it names, so it is a specimen too
    tag.style.setProperty('--f-display', getComputedStyle(found.el).getPropertyValue('--f-display'));
    tag.style.setProperty('--f-ui', getComputedStyle(found.el).getPropertyValue('--f-ui'));
  }

  /* Straight off the scroll event, with no requestAnimationFrame hop. Browsers
     already coalesce scroll events to one per frame, so the hop would buy no
     throttling that is not there anyway - it would only put the badge a frame
     behind the page it is labelling, and seven getBoundingClientRect calls are
     not worth a frame of lag. */
  window.addEventListener('scroll', pick, { passive: true });
  window.addEventListener('resize', pick);
  pick();
})();
