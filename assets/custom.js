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
