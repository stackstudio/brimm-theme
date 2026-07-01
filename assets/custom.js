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

  // 2. Seamless marquee - wrap spans in a track div, animate the track
  const annMessages = document.querySelectorAll('.announcement-bar__message');
  annMessages.forEach(msg => {
    const span = msg.querySelector('span');
    if (!span) return;
    // Create a track wrapper
    const track = document.createElement('div');
    track.className = 'brimm-marquee-track';
    // Clone the span for seamless loop
    const clone = span.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    // Move original span into track, add clone
    track.appendChild(span);
    track.appendChild(clone);
    msg.appendChild(track);
    // After render, calculate negative delay so text starts off-screen right
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const trackWidth = track.scrollWidth; // total width of both spans
        const halfTrack = trackWidth / 2;     // one span width
        const vw = window.innerWidth;
        // Animation: 0 → -50% over 35s. At time T: position = -50% * (T/35)
        // We want position at t=0 to be +vw (off right).
        // position = translateX(X%) where X = -50 * (T/35)
        // But X is in % of trackWidth: X% of trackWidth = vw means X = vw/trackWidth*100
        // So: -50 * (delay/35) = -(vw/trackWidth*100) → delay = (vw/trackWidth*100) * 35 / 50
        // Negative delay = already elapsed time
        const pctOffset = (vw / trackWidth) * 100; // how far into animation vw corresponds to
        const delaySeconds = -(pctOffset * 35 / 50);
        track.style.animationDelay = delaySeconds + 's';
      });
    });
  });
});
