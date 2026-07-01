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

  // 2. Seamless marquee - clone span, stagger delay so it enters from right when first exits left
  const annMessages = document.querySelectorAll('.announcement-bar__message');
  annMessages.forEach(msg => {
    // Clean up any previous track wrappers from old implementation
    const track = msg.querySelector('.brimm-marquee-track');
    if (track) {
      const origSpan = track.querySelector('span:not([aria-hidden])');
      if (origSpan) msg.appendChild(origSpan);
      track.remove();
    }
    // Remove any previous clones
    msg.querySelectorAll('.brimm-marquee-clone').forEach(el => el.remove());

    const span = msg.querySelector('span');
    if (!span) return;

    // Clone for seamless repeat
    const clone = span.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('brimm-marquee-clone');
    msg.appendChild(clone);

    // Measure and set delay after layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const duration = 35; // seconds - must match CSS
        const vw = window.innerWidth;
        const spanW = span.scrollWidth; // includes padding-right
        const totalTravel = vw + spanW;  // 100vw + 100% of span
        // Clone needs to be exactly spanW behind first span at all times
        // delay = -(duration * spanW / totalTravel)
        const delay = -(duration * spanW / totalTravel);
        clone.style.animationDelay = delay + 's';
      });
    });
  });
});
