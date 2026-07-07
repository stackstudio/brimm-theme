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
document.addEventListener("DOMContentLoaded", () => {
  const stickyHeaderEl = document.querySelector("sticky-header");
  if (stickyHeaderEl) {
    const setHeaderHeight = () => {
      document.documentElement.style.setProperty("--header-height", stickyHeaderEl.offsetHeight + "px");
    };
    if (window.ResizeObserver) {
      new ResizeObserver(setHeaderHeight).observe(stickyHeaderEl);
    }
    setHeaderHeight();
  }

  // Announcement bar marquee - progressive enhancement.
  // The real message is NEVER hidden unless a working scrolling replacement
  // has been built and measured successfully. If anything fails (fonts not
  // ready yet, zero width, an error), the plain centered message stays
  // visible instead of vanishing - this fixes the mobile bug.
  document.querySelectorAll(".utility-bar").forEach(setupBrimmMarquee);

  function setupBrimmMarquee(utilBar) {
    const messageEls = utilBar.querySelectorAll(".announcement-bar__message");
    if (!messageEls.length) return;

    const texts = [];
    utilBar.querySelectorAll(".announcement-bar__message span").forEach((span) => {
      const t = (span.textContent || "").trim();
      if (t) texts.push(t);
    });
    if (!texts.length) return;

    const msgText = texts.join("  •  ");

    let outer = null, item1 = null, item2 = null, resizeTimer = null;

    function teardown() {
      if (outer && outer.parentNode) outer.parentNode.removeChild(outer);
      outer = item1 = item2 = null;
      messageEls.forEach((el) => {
        el.style.visibility = "";
        el.style.whiteSpace = "";
        el.style.overflow = "";
      });
      utilBar.querySelectorAll(".slider-button").forEach((el) => {
        el.style.visibility = "";
      });
    }

    function build() {
      try {
        teardown();

        outer = document.createElement("div");
        outer.className = "brimm-marquee-outer";

        item1 = document.createElement("div");
        item1.className = "brimm-marquee-item";
        item1.textContent = msgText;

        item2 = document.createElement("div");
        item2.className = "brimm-marquee-item";
        item2.setAttribute("aria-hidden", "true");
        item2.textContent = msgText;

        outer.appendChild(item1);
        outer.appendChild(item2);

        // Build hidden first so we can measure without a flash, and so the
        // original message only gets hidden once we know this actually worked.
        outer.style.visibility = "hidden";
        utilBar.appendChild(outer);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const outerW = outer.offsetWidth;
            const itemW = item1.scrollWidth + 4;

            if (!outerW || !itemW) {
              teardown(); // couldn't measure - keep the plain message visible
              return;
            }

            const duration = (outerW + itemW) / 120;
            const rawElapsed = (itemW + 150) / 120;
            const cloneDelay = -Math.min(rawElapsed, duration * 0.95);

            outer.style.setProperty("--brimm-outer-w", outerW + "px");
            outer.style.setProperty("--brimm-item-w", itemW + "px");

            item1.style.animationDuration = duration + "s";
            item1.style.animationDelay = "0s";
            item2.style.animationDuration = duration + "s";
            item2.style.animationDelay = cloneDelay + "s";

            item1.style.animationPlayState = "running";
            item2.style.animationPlayState = "running";

            messageEls.forEach((el) => {
              el.style.visibility = "hidden";
              el.style.whiteSpace = "nowrap";
              el.style.overflow = "hidden";
            });
            utilBar.querySelectorAll(".slider-button").forEach((el) => {
              el.style.visibility = "hidden";
            });

            outer.style.visibility = "";

            if (stickyHeaderEl) {
              document.documentElement.style.setProperty("--header-height", stickyHeaderEl.offsetHeight + "px");
            }
          });
        });
      } catch (err) {
        teardown(); // never leave the bar blank on error
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(build).catch(build);
    } else {
      build();
    }

    // Recheck once everything (images etc.) has fully loaded, in case layout shifted.
    window.addEventListener("load", build);

    // Recalculate on resize/orientation change so it stays correct afterwards.
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });

    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener("change", build);
    }
  }
});
