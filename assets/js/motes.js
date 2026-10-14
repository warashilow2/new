/* Eco Spark Cleaning - vanishing motes

   Very small particles drifting slowly behind the content, each one fading out
   as it goes. Occasionally one catches the light.

   THE IDEA, AND WHY IT SURVIVES AN OBJECTION I RAISED EARLIER
   Floating dust is normally the worst possible motif for a cleaning company:
   drifting dirt on the page argues against the product. What makes this work
   is that the particles DISAPPEAR. Nothing accumulates, nothing settles -
   every mote appears, moves a little, and is gone. The sentence it writes is
   dirt -> removed -> clean, and the removal is the part that is animated.

   It must not announce itself as dust. So: no falling-snow column, no uniform
   downward drift, no clustering into a visible texture. Directions are spread
   across all four quadrants with a bias to nothing in particular, sizes stay
   near the threshold of visibility, and the fade is long enough that you never
   catch the moment one goes out. What should register is "the background is
   quietly clearing itself", not "there are specks on this page".

   The rare glints are gold or white and last under a second inside a cycle of
   half a minute, so they read as an occasional catch of light rather than as
   twinkling. Twinkling is a Christmas effect and would cheapen it.

   BUILT AS PURE CSS, DELIBERATELY
   Every mote is one element animating only opacity and transform, which the
   compositor handles without a repaint and without JavaScript running per
   frame. There is no canvas and no animation loop: nothing here can drop a
   frame on the main thread or keep a phone's CPU awake. That is a deliberate
   correction - the previous background effect leant on backdrop-filter, which
   is re-filtered every frame and whose cost could not even be measured in the
   preview pane.

   Layering: the field sits at z-index 0 inside each section, above that
   section's background. styles.css gives .container z-index 1, so every
   heading, price and photo paints over the particles and nothing readable ever
   has one on top of it. */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // the particles ARE the motion; with motion turned down there is nothing
  // left worth keeping, so the page simply does without them
  if (reduced) return;

  var narrow = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;

  // selector, motes, glints
  var SECTIONS = [
    ['.hero',     narrow ? 10 : 26, 2],
    ['.results',  narrow ?  8 : 22, 2],
    ['.services', narrow ?  8 : 22, 2],
    ['.reviews',  narrow ?  8 : 20, 1],
    ['.crew',     narrow ?  7 : 18, 1],
    ['.flow',     narrow ?  7 : 16, 1],
    ['.faq',      narrow ?  6 : 14, 1]
  ];

  // deterministic, so the page looks the same every load and any change is
  // actually comparable against the last one
  function rand(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  var css = document.createElement('style');
  css.textContent =
    '.motes{ position:absolute; inset:0; z-index:0; overflow:hidden;' +
    '  pointer-events:none; }' +

    '.motes__m{ position:absolute; border-radius:50%;' +
    '  background:radial-gradient(circle, rgba(244,243,241,.9) 0%,' +
    '    rgba(244,243,241,.35) 45%, rgba(244,243,241,0) 72%);' +
    '  opacity:0; will-change:transform, opacity;' +
    '  animation-name:mote-drift; animation-timing-function:linear;' +
    '  animation-iteration-count:infinite; }' +

    /* appears from nothing, drifts, goes out. Because both ends are at zero
       opacity the loop has no visible restart - the mote is simply gone and a
       new one is somewhere else. */
    '@keyframes mote-drift{' +
    '  0%{   opacity:0; transform:translate3d(0,0,0) scale(.5); }' +
    '  16%{  opacity:var(--peak); }' +
    '  68%{  opacity:var(--peak); }' +
    '  100%{ opacity:0; transform:translate3d(var(--dx),var(--dy),0) scale(1.25); } }' +

    '.motes__g{ position:absolute; border-radius:50%;' +
    '  opacity:0; will-change:transform, opacity;' +
    '  animation-name:mote-glint; animation-timing-function:ease-in-out;' +
    '  animation-iteration-count:infinite; }' +

    /* one short catch of light inside a long cycle: present for well under a
       second, then nothing for half a minute */
    '@keyframes mote-glint{' +
    '  0%, 44%{ opacity:0; transform:scale(.3); }' +
    '  49%{ opacity:var(--peak); transform:scale(1); }' +
    '  54%{ opacity:0; transform:scale(.3); }' +
    '  100%{ opacity:0; transform:scale(.3); } }' +

    /* a section nobody is looking at costs nothing */
    '.motes.is-idle *{ animation-play-state:paused; }';
  document.head.appendChild(css);

  var observer = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle('is-idle', !e.isIntersecting);
        });
      }, { rootMargin: '100px 0px' })
    : null;

  SECTIONS.forEach(function (conf, si) {
    var host = document.querySelector(conf[0]);
    if (!host) return;

    var layer = document.createElement('div');
    // starts running; the observer only ever pauses. If it never fires the
    // page still looks right and merely costs a little more - the safe way
    // round to fail, same as ensureFanned() in deck.js
    layer.className = 'motes';
    layer.setAttribute('aria-hidden', 'true');

    // ---- the motes
    for (var i = 0; i < conf[1]; i++) {
      var n = si * 83 + i * 7;
      var a = rand(n + 1), b = rand(n + 2), c = rand(n + 3), d = rand(n + 4), e = rand(n + 5);

      var m = document.createElement('div');
      m.className = 'motes__m';
      // near the threshold of visibility: big enough to register, small enough
      // not to be identifiable as anything
      var size = 2 + Math.pow(c, 2) * 5;
      m.style.width = size.toFixed(2) + 'px';
      m.style.height = size.toFixed(2) + 'px';
      m.style.left = (a * 100).toFixed(2) + '%';
      m.style.top = (b * 100).toFixed(2) + '%';
      // every direction, so it never reads as falling or as a current
      var ang = e * Math.PI * 2;
      var dist = 40 + d * 130;
      m.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
      m.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(0) + 'px');
      m.style.setProperty('--peak', (0.14 + c * 0.20).toFixed(3));
      m.style.animationDuration = (26 + d * 40).toFixed(1) + 's';
      m.style.animationDelay = (-(a * 66)).toFixed(1) + 's';
      layer.appendChild(m);
    }

    // ---- the glints
    for (var j = 0; j < conf[2]; j++) {
      var k = si * 197 + j * 29;
      var p = rand(k + 1), q = rand(k + 2), r = rand(k + 3);

      var g = document.createElement('div');
      g.className = 'motes__g';
      var gs = 2.5 + r * 3;
      g.style.width = gs.toFixed(2) + 'px';
      g.style.height = gs.toFixed(2) + 'px';
      g.style.left = (6 + p * 88).toFixed(2) + '%';
      g.style.top = (6 + q * 88).toFixed(2) + '%';
      // gold or white, roughly half and half
      var warm = r > 0.5;
      g.style.background = warm
        ? 'radial-gradient(circle, rgba(243,217,141,1) 0%, rgba(212,175,55,.5) 40%, rgba(212,175,55,0) 70%)'
        : 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(244,243,241,.5) 40%, rgba(244,243,241,0) 70%)';
      g.style.setProperty('--peak', (0.45 + r * 0.3).toFixed(2));
      // long cycles and scattered phases: two glints never fire together
      g.style.animationDuration = (22 + q * 26).toFixed(1) + 's';
      g.style.animationDelay = (-(p * 48)).toFixed(1) + 's';
      layer.appendChild(g);
    }

    // first child: the section's own content keeps painting over the field
    host.insertBefore(layer, host.firstChild);
    if (observer) observer.observe(layer);
  });
})();
