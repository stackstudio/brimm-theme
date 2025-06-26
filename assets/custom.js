document.addEventListener("DOMContentLoaded", function() {
  const header = document.querySelector('.header-wrapper')
  const firstBlock = document.querySelector('main > div:first-child')
  firstBlock.after(header)
  header.classList.add('sticky')
});
