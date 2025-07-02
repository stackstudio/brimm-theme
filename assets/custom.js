document.addEventListener("DOMContentLoaded", function() {
  const header = document.querySelector('.header-wrapper')
  const firstBlock = document.querySelector('main > div:first-child')
  if(firstBlock.querySelector('section:first-child').classList.contains('brimm-blocks--hero')) {
    firstBlock.after(header)
    header.classList.add('sticky')
  }
});
