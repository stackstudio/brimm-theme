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




// Dynamic announcement bar: height observer + seamless scrolling text
document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic header height
  const stickyHeaderEl = document.querySelector('sticky-header');
  if (stickyHeaderEl && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
    });
    ro.observe(stickyHeaderEl);
    document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
  }

  // 2. Seamless marquee
  const PX_PER_SEC = 120;
  const GAP_PX = 200; // gap in pixels between end of text and start of clone

  const annMessages = document.querySelectorAll('.announcement-bar__message');
  annMessages.forEach(msg => {
    // Clean up old implementations
    const track = msg.querySelector('.brimm-marquee-track');
    if (track) { const s = track.querySelector('span:not([aria-hidden])'); if (s) msg.appendChild(s); track.remove(); }
    msg.querySelectorAll('.brimm-marquee-clone').forEach(el => el.remove());

    const span = msg.querySelector('span');
    if (!span) return;

    // Remove CSS padding-right from span; we control gap via delay instead
    span.style.paddingRight = '0';

    const clone = span.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('brimm-marquee-clone');
    clone.style.paddingRight = '0';
    msg.appendChild(clone);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const vw = window.innerWidth;
        const textW = span.scrollWidth; // text width without padding
        const totalUnit = textW + GAP_PX; // one "unit" = text + gap
        const totalTravel = vw + totalUnit; // full travel distance

        const duration = totalTravel / PX_PER_SEC;
        // Clone is exactly one unit (textW + GAP_PX) behind span1
        const cloneDelay = -(totalUnit / PX_PER_SEC);

        span.style.animationDuration = duration + 's';
        clone.style.animationDuration = duration + 's';
        clone.style.animationDelay = cloneDelay + 's';

        // Update header height after layout settles
        if (stickyHeaderEl) {
          setTimeout(() => {
            document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
          }, 100);
        }
      });
    });
  });
});
