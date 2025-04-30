document.addEventListener("DOMContentLoaded", function() {
  const elements = document.querySelectorAll('.split-text');

  elements.forEach(function(element) {
    const words = element.textContent.trim().split(/\s+/);
    element.innerHTML = '';

    let group = [];

    const flushGroup = () => {
      group.forEach(span => element.appendChild(span));
      const br = document.createElement('span');
      br.classList.add('line-break');
      element.appendChild(br);
      group = [];
    };

    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word;
      const isLong = word.length > 6;
      span.classList.add(isLong ? 'long-word' : 'short-word');
      group.push(span);

      // Handle 3 short words
      if (
        group.length === 3 &&
        group.every(w => w.classList.contains('short-word'))
      ) {
        flushGroup();
      }

      // Handle short + long or long + short
      if (
        group.length === 2 &&
        ((group[0].classList.contains('short-word') && group[1].classList.contains('long-word')) ||
         (group[0].classList.contains('long-word') && group[1].classList.contains('short-word')))
      ) {
        flushGroup();
      }

      // Flush any leftover at the end
      if (index === words.length - 1 && group.length > 0) {
        group.forEach(span => element.appendChild(span));
      }
    });
  });
});
