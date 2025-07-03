document.addEventListener('DOMContentLoaded', function () {
  const elements = document.querySelectorAll('.brimm-blocks--split-text');

  elements.forEach(function (element) {
    const originalText = element.textContent.trim();
    const words = originalText.split(/\s+/);

    // Create a temporary wrapper to build the new structure without affecting layout
    const tempWrapper = document.createElement('span');
    tempWrapper.style.visibility = 'hidden';
    tempWrapper.style.pointerEvents = 'none';
    tempWrapper.style.whiteSpace = 'normal';
    tempWrapper.style.width = `${element.offsetWidth}px`;
    tempWrapper.classList.add(...element.classList); // inherit styles
    tempWrapper.classList.add('brimm-blocks--hidden'); // start hidden

    let group = [];

    const flushGroup = () => {
      group.forEach((span) => tempWrapper.appendChild(span));
      const br = document.createElement('span');
      br.classList.add('brimm-blocks--line-break');
      tempWrapper.appendChild(br);
      group = [];
    };

    words.forEach((word, index) => {
      const span = document.createElement('span');
      const wordCutoff = words.length > 4 ? 7 : 5;
      span.textContent = word;
      const isLong = word.length > wordCutoff;
      span.classList.add(
        isLong ? 'brimm-blocks--long-word' : 'brimm-blocks--short-word',
      );
      group.push(span);

      if (
        group.length === 3 &&
        group.every((w) => w.classList.contains('brimm-blocks--short-word'))
      ) {
        flushGroup();
      }

      if (
        group.length === 2 &&
        ((group[0].classList.contains('brimm-blocks--short-word') &&
          group[1].classList.contains('brimm-blocks--long-word')) ||
          (group[0].classList.contains('brimm-blocks--long-word') &&
            group[1].classList.contains('brimm-blocks--short-word')))
      ) {
        flushGroup();
      }

      if (index === words.length - 1 && group.length > 0) {
        group.forEach((span) => tempWrapper.appendChild(span));
      }
    });

    // Replace original content only after the new layout is fully built
    element.innerHTML = '';
    element.appendChild(tempWrapper.cloneNode(true));
    tempWrapper.classList.remove('brimm-blocks--hidden'); // start hidden
  });
});
