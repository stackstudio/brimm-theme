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
      document.documentElement.style.setProperty(
        '--header-height', stickyHeaderEl.offsetHeight + 'px'
      );
    });
    ro.observe(stickyHeaderEl);
    // Fire immediately so body padding-top is correct from the start
    document.documentElement.style.setProperty(
      '--header-height', stickyHeaderEl.offsetHeight + 'px'
    );
  }

  // ── 2. Marquee ────────────────────────────────────────────────────────
  const utilBar = document.querySelector('.utility-bar');
  if (!utilBar) return;

  // Get the announcement text from the existing element
  const msgEl = utilBar.querySelector('.announcement-bar__message');
  if (!msgEl) return;
  const msgText = msgEl.innerText.trim();
  if (!msgText) return;

  // Hide original text (keep element so bar retains its height/padding)
  msgEl.style.visibility = 'hidden';

  // Build marquee overlay — same position/size as utility-bar
  const outer = document.createElement('div');
  outer.className = 'brimm-marquee-outer';

  // Two copies of the text side by side inside the outer
  const inner = document.createElement('div');
  inner.className = 'brimm-marquee-inner';

  const item1 = document.createElement('span');
  item1.className = 'brimm-marquee-item';
  item1.textContent = msgText;

  const item2 = document.createElement('span');
  item2.className = 'brimm-marquee-item';
  item2.setAttribute('aria-hidden', 'true');
  item2.textContent = msgText;

  inner.appendChild(item1);
  inner.appendChild(item2);
  outer.appendChild(inner);

  // Insert overlay inside utility-bar, absolutely positioned
  utilBar.style.position = 'relative';
  utilBar.appendChild(outer);

  // After render: measure item width and set animation duration
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const PX_PER_SEC = 120;
      const itemW = item1.offsetWidth; // includes padding-right gap

      // inner is 2x itemW wide. Animation moves it left by itemW (50% of inner).
      // When it reaches -itemW it snaps back to 0 — seamless because item2 = item1.
      const duration = (itemW / PX_PER_SEC);

      inner.style.animationDuration = duration + 's';
    });
  });
});
