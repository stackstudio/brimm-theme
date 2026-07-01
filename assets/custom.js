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

  // Collect text from ALL spans inside .announcement-bar__message elements
  // Using textContent (not innerText) to avoid CSS clipping issues
  const texts = [];
  utilBar.querySelectorAll('.announcement-bar__message span').forEach(span => {
    const t = (span.textContent || '').trim();
    if (t) texts.push(t);
  });
  if (!texts.length) return;

  // All messages in one scrolling string separated by bullet
  const msgText = texts.join('  •  ');

  // Hide originals — force single line so bar height stays correct
  utilBar.querySelectorAll('.announcement-bar__message').forEach(el => {
    el.style.visibility = 'hidden';
    el.style.whiteSpace  = 'nowrap';
    el.style.overflow    = 'hidden';
  });
  utilBar.querySelectorAll('.slider-button').forEach(el => {
    el.style.visibility = 'hidden';
  });

  // Build overlay inside utility-bar (which is already position:fixed)
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

  // Measure then start — paused in CSS until we set the right duration
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const PX_PER_SEC = 120;
      const GAP_PX    = 150;

      const outerW = outer.offsetWidth;
      const itemW  = item1.scrollWidth + 4; // +4 subpixel buffer

      const totalTravel = outerW + itemW;
      const duration    = totalTravel / PX_PER_SEC;

      // item2 should be (itemW + GAP_PX) behind item1 in distance.
      // If that would push item2 past left edge (itemW+GAP > outerW on mobile),
      // clamp so item2 starts no earlier than the beginning of its cycle.
      const rawElapsed  = (itemW + GAP_PX) / PX_PER_SEC;
      const cloneDelay  = -Math.min(rawElapsed, duration * 0.95);

      // Set CSS vars on outer (inherited by both items)
      outer.style.setProperty('--brimm-outer-w', outerW + 'px');
      outer.style.setProperty('--brimm-item-w',  itemW  + 'px');

      item1.style.animationDuration  = duration + 's';
      item1.style.animationDelay     = '0s';
      item2.style.animationDuration  = duration + 's';
      item2.style.animationDelay     = cloneDelay + 's';

      item1.style.animationPlayState = 'running';
      item2.style.animationPlayState = 'running';

      if (stickyHeaderEl) {
        document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
      }
    });
  });
});
