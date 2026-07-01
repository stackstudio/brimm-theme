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
  // 1. Dynamic header height - update when announcement bar changes size
  const stickyHeaderEl = document.querySelector('sticky-header');
  if (stickyHeaderEl && window.ResizeObserver) {
    const headerResizeObserver = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
    });
    headerResizeObserver.observe(stickyHeaderEl);
  }

  // 2. Seamless marquee with pixel-per-second timing
  const PX_PER_SEC = 120; // scroll speed in pixels per second

  const annMessages = document.querySelectorAll('.announcement-bar__message');
  annMessages.forEach(msg => {
    // Clean up any previous implementations
    const track = msg.querySelector('.brimm-marquee-track');
    if (track) {
      const origSpan = track.querySelector('span:not([aria-hidden])');
      if (origSpan) msg.appendChild(origSpan);
      track.remove();
    }
    msg.querySelectorAll('.brimm-marquee-clone').forEach(el => el.remove());

    const span = msg.querySelector('span');
    if (!span) return;

    // Clone for seamless repeat
    const clone = span.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('brimm-marquee-clone');
    msg.appendChild(clone);

    // Set timing after layout so we can measure real rendered widths
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const vw = window.innerWidth;
        const spanW = span.scrollWidth; // rendered width including padding-right

        // Total distance each span travels: viewport width + span width
        const totalTravel = vw + spanW;

        // Duration for one full cycle at our target speed
        const duration = totalTravel / PX_PER_SEC;

        // Clone starts spanW behind the first span
        // Time for first span to travel spanW pixels = spanW / PX_PER_SEC
        const cloneDelay = -(spanW / PX_PER_SEC);

        // Apply to both spans
        span.style.animationDuration = duration + 's';
        clone.style.animationDuration = duration + 's';
        clone.style.animationDelay = cloneDelay + 's';
      });
    });
  });
});
