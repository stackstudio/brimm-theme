document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.collection-products').forEach(collection => {
    const track = collection.querySelector('.product-track');
    const prevBtn = collection.querySelector('.leftArrow');
    const nextBtn = collection.querySelector('.rightArrow');
    if (!track || !prevBtn || !nextBtn) return;

    const items = Array.from(track.children).filter(n => n.nodeType === 1);
    if (!items.length) return;

    const getPaddingLeft = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const getMaxScrollLeft = () => Math.max(0, Math.round(track.scrollWidth - track.clientWidth));

    function getFirstVisibleIndex() {
      const scrollLeft = Math.round(track.scrollLeft);
      for (let i = 0; i < items.length; i++) {
        const itemStart = Math.round(items[i].offsetLeft);
        const itemEnd = itemStart + Math.round(items[i].offsetWidth);
        if (itemEnd > scrollLeft) return i;
      }
      return items.length - 1;
    }

    function getLastVisibleIndex() {
      const rightEdge = track.scrollLeft + track.clientWidth - 1;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].offsetLeft < rightEdge) return i;
      }
      return 0;
    }

    function scrollToIndex(index) {
          index = Math.max(0, Math.min(items.length - 1, index));
          const maxScrollLeft = getMaxScrollLeft();

          let left;
          // If it's the final item, go to the very end
          if (index === items.length - 1) {
            left = maxScrollLeft;
          } else {
            // Normal behaviour: align item to left edge (account for track padding)
            left = Math.max(0, Math.round(items[index].offsetLeft - getPaddingLeft()));
            // But never exceed the true max scroll
            left = Math.min(left, maxScrollLeft);
          }

          // Smooth scroll with fallback
          if ('scrollBehavior' in document.documentElement.style) {
            track.scrollTo({ left, behavior: 'smooth' });
          } else {
            track.scrollLeft = left;
          }
        }

    prevBtn.addEventListener('click', () => {
      const first = getFirstVisibleIndex();
      scrollToIndex(first > 0 ? first - 1 : 0);
    });

    nextBtn.addEventListener('click', () => {
      const first = getFirstVisibleIndex();
      scrollToIndex(Math.min(items.length - 1, first + 1));
    });

    function updateButtons() {
      const first = getFirstVisibleIndex();
      const last = getLastVisibleIndex();
      prevBtn.disabled = first <= 0;
      nextBtn.disabled = last >= items.length - 1;
    }

    track.addEventListener('scroll', () => requestAnimationFrame(updateButtons));
    window.addEventListener('resize', () => requestAnimationFrame(updateButtons));

    updateButtons();
  })
});









// Dynamic announcement bar: height observer + seamless scrolling marquee
document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Dynamic header height ──────────────────────────────────────────
  const stickyHeaderEl = document.querySelector('sticky-header');
  if (stickyHeaderEl && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
    });
    ro.observe(stickyHeaderEl);
    document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
  }

  // ── 2. Marquee ────────────────────────────────────────────────────────
  const utilBar = document.querySelector('.utility-bar');
  if (!utilBar) return;

  // Collect ALL announcement message texts from all slides
  const allMsgEls = utilBar.querySelectorAll('.announcement-bar__message');
  const texts = [];
  allMsgEls.forEach(el => {
    const t = el.innerText.trim();
    if (t) texts.push(t);
  });
  if (!texts.length) return;

  // All messages joined with bullet separator into one scrolling string
  const msgText = texts.join('  •  ');

  // Hide originals, force single-line
  allMsgEls.forEach(el => {
    el.style.visibility = 'hidden';
    el.style.whiteSpace  = 'nowrap';
    el.style.overflow    = 'hidden';
  });
  utilBar.querySelectorAll('.slider-button').forEach(el => {
    el.style.visibility = 'hidden';
  });

  // Build overlay
  const outer = document.createElement('div');
  outer.className = 'brimm-marquee-outer';

  const item1 = document.createElement('div');
  item1.className = 'brimm-marquee-item';
  item1.textContent = msgText;

  const item2 = document.createElement('div');
  item2.className = 'brimm-marquee-item';
  item2.setAttribute('aria-hidden', 'true');
  item2.textContent = msgText;

  outer.appendChild(item1);
  outer.appendChild(item2);
  utilBar.appendChild(outer);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const PX_PER_SEC = 120;
      const GAP_PX    = 150;

      const outerW = outer.offsetWidth;
      // scrollWidth gives full content width; add small buffer for subpixel rendering
      const itemW  = item1.scrollWidth + 4;

      const totalTravel = outerW + itemW;
      const duration    = totalTravel / PX_PER_SEC;

      // item2 should be (itemW + GAP_PX) behind item1.
      // At t=0: item1 is at outerW (right edge).
      // item2 at t=0 should be at outerW + itemW + GAP_PX (off-screen right, further right).
      // That means item2 delay = -(time for item1 to travel itemW+GAP_PX)
      //   = -(itemW + GAP_PX) / PX_PER_SEC
      // Clamped: item2 can't start further left than outerW (right edge)
      // pos2_at_t0 = outerW - PX_PER_SEC * |delay2|
      //            = outerW - (itemW + GAP_PX)
      // If itemW+GAP_PX > outerW → pos2 < 0 → already past left edge on mobile
      // Fix: if itemW+GAP_PX > outerW, gap is naturally there since item takes full width.
      //      In this case item2 starts at -( itemW+GAP_PX - outerW) which is negative.
      //      Instead clamp so item2 always starts >= outerW (i.e. delay2 = 0 at minimum):
      const rawElapsed = (itemW + GAP_PX) / PX_PER_SEC;
      // Ensure item2 starts no further left than right edge of outer:
      // max elapsed = duration (full cycle) — don't want it wrapping around
      const safeElapsed = Math.min(rawElapsed, duration * 0.99);
      const delay2 = -safeElapsed;

      // Set CSS custom properties on outer (inherited by both items via cascade)
      outer.style.setProperty('--brimm-outer-w', outerW + 'px');
      outer.style.setProperty('--brimm-item-w',  itemW  + 'px');

      item1.style.animationDuration  = duration + 's';
      item1.style.animationDelay     = '0s';
      item2.style.animationDuration  = duration + 's';
      item2.style.animationDelay     = delay2   + 's';

      item1.style.animationPlayState = 'running';
      item2.style.animationPlayState = 'running';

      if (stickyHeaderEl) {
        document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
      }
    });
  });
});
