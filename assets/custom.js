document.addEventListener("DOMContentLoaded", function() {
  const header = document.querySelector('.header-wrapper')
  const firstBlock = document.querySelector('main > div:first-child')
  console.log(document.querySelector('main > div:first-child > section:first-child'), "LOG")
  if(firstBlock.querySelector('section:first-child').classList.contains('brimm-blocks--hero')) {
    firstBlock.after(header)
    header.classList.add('sticky')
  }
});
