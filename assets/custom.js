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
  const msgEl = utilBar.querySelector('.announcement-bar__message');
  if (!msgEl) return;
  const msgText = msgEl.innerText.trim();
  if (!msgText) return;

  // Hide original, keep single-line so bar height stays correct
  msgEl.style.visibility = 'hidden';
  msgEl.style.whiteSpace  = 'nowrap';
  msgEl.style.overflow    = 'hidden';

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

  // Measure and start
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const PX_PER_SEC = 120;
      const GAP_PX    = 150; // px gap between end of item1 text and start of item2

      const outerW = outer.offsetWidth;   // full container width
      const itemW  = item1.offsetWidth;   // text + padding width

      const totalTravel = outerW + itemW; // px each item travels
      const duration    = totalTravel / PX_PER_SEC;
      // delay for item2: it should be (itemW + GAP_PX) behind item1 in distance
      const delay2      = -((itemW + GAP_PX) / PX_PER_SEC);
      // But we want item2 to not already be past center — cap so it starts from right
      // If delay2 would put item2 off-screen left, adjust:
      // position at t=0 for item2 = outerW - (itemW + GAP_PX) * (1 - delay2/duration)
      // Actually: item2 at t=0 is at outerW + delay2*PX_PER_SEC
      //         = outerW - (itemW + GAP_PX)
      // If itemW + GAP_PX > outerW, item2 starts off-screen LEFT — bad on narrow screens
      // Fix: item2 starts at outerW + 0 and is just (itemW+GAP_PX)/totalTravel of a cycle behind
      const delay2Safe = -(totalTravel - outerW) / PX_PER_SEC; // starts exactly at right edge when item1 is at outerW-(itemW+GAP_PX)
      // Simpler: always use -(itemW + GAP_PX) / PX_PER_SEC but ensure item2 >= 0 at t=0:
      // pos2_at_t0 = outerW - (PX_PER_SEC * Math.abs(delay2Safe))
      //            = outerW - (itemW + GAP_PX)
      // On mobile outerW~390, itemW~400, GAP~150 → pos = 390-550 = -160 → off screen left ✗
      // 
      // Correct delay so item2 starts AT outerW (right edge) when page loads:
      // animation at t: pos = outerW - totalTravel*(t/duration)
      // at t=delay_elapsed: pos = outerW → outerW - totalTravel*(elapsed/duration) = outerW
      // → elapsed = 0 → delay = 0
      // That means item2 starts at the same position as item1 (overlap)!
      // 
      // What we want: item2 at outerW when item1 is at outerW-(itemW+GAP_PX)
      // item1 reaches outerW-(itemW+GAP_PX) at time t1 where:
      // outerW - totalTravel*(t1/duration) = outerW - (itemW+GAP_PX)
      // totalTravel*(t1/duration) = itemW+GAP_PX
      // t1 = (itemW+GAP_PX)/PX_PER_SEC
      // So item2 should START its animation (elapsed=0) at t1 seconds after item1.
      // Negative delay on item2 = item2 has been running for some time.
      // We want item2 to be at outerW at t1 of the global clock.
      // item2 position at global clock t = outerW - totalTravel*((t - delay2_abs)/duration)
      //   where delay2_abs = |delay2| (seconds item2 started before t=0)
      // At t=t1: pos2 = outerW → outerW - totalTravel*((t1-delay2_abs)/duration) = outerW
      // → t1 - delay2_abs = 0 → delay2_abs = t1 = (itemW+GAP_PX)/PX_PER_SEC
      // 
      // So: delay2 = -(itemW + GAP_PX) / PX_PER_SEC  (what we had before!)
      // Problem was itemW > outerW on mobile.
      // 
      // The fix: GAP_PX should be NEGATIVE if itemW > outerW, OR we just clamp item2
      // so it never starts more than outerW pixels into its animation:
      const maxDelay = outerW / PX_PER_SEC; // furthest back item2 can start and still be on-screen right
      const rawDelay = (itemW + GAP_PX) / PX_PER_SEC;
      const finalDelay2 = -Math.min(rawDelay, maxDelay - 0.01);

      // Set CSS custom properties for the keyframe end values
      outer.style.setProperty('--brimm-item-w', itemW + 'px');

      item1.style.animationDuration = duration + 's';
      item1.style.animationDelay    = '0s';
      item2.style.animationDuration = duration + 's';
      item2.style.animationDelay    = finalDelay2 + 's';

      // Start both
      item1.style.animationPlayState = 'running';
      item2.style.animationPlayState = 'running';

      if (stickyHeaderEl) {
        document.documentElement.style.setProperty('--header-height', stickyHeaderEl.offsetHeight + 'px');
      }
    });
  });
});
