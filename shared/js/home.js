document.addEventListener("DOMContentLoaded", () => {

  // --- CAROUSEL ---
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const images = carousel.querySelectorAll('.carousel-image');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');

    let index = 0;

    function updateCarousel(){
      images.forEach(img => {
        img.classList.remove('active', 'prev', 'next');
      });

      const prevIndex = (index - 1 + images.length) % images.length;
      const nextIndex = (index + 1) % images.length;

      images[index].classList.add('active');
      images[prevIndex].classList.add('prev');
      images[nextIndex].classList.add('next');
    }

    function showPrev(){
      index = (index - 1 + images.length) % images.length;
      updateCarousel();
    }

    function showNext(){
      index = (index + 1) % images.length;
      updateCarousel();
    }

    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);

    images.forEach((img, i) => {
      img.addEventListener('click', () => {
        if (img.classList.contains('prev')) {
          showPrev();
          return;
        }

        if (img.classList.contains('next')) {
          showNext();
          return;
        }

        openOverlay(images, i);
      });
    });

    updateCarousel();
  });


  // --- OVERLAY (LIGHTBOX) ---
  const hasCarousel = document.querySelector('[data-carousel]');
  if (!hasCarousel) return;

  const overlay = document.createElement('div');
  overlay.className = 'carousel-overlay';
  overlay.innerHTML = `
    <button class="overlay-close" aria-label="Close">×</button>
    <button class="overlay-prev" aria-label="Previous">‹</button>
    <img class="overlay-image" src="" alt="">
    <button class="overlay-next" aria-label="Next">›</button>
  `;
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector('.overlay-image');
  const closeBtn = overlay.querySelector('.overlay-close');
  const prevBtn = overlay.querySelector('.overlay-prev');
  const nextBtn = overlay.querySelector('.overlay-next');

  let overlayImages = [];
  let overlayIndex = 0;

  function openOverlay(images, startIndex){
    overlayImages = Array.from(images);
    overlayIndex = startIndex;
    overlay.style.display = 'flex';
    updateOverlay();
  }

  function updateOverlay(){
    overlayImg.src = overlayImages[overlayIndex].src;
    overlayImg.alt = overlayImages[overlayIndex].alt || "";
  }

  function closeOverlay(){
    overlay.style.display = 'none';
  }

  function prevOverlay(){
    overlayIndex = (overlayIndex - 1 + overlayImages.length) % overlayImages.length;
    updateOverlay();
  }

  function nextOverlay(){
    overlayIndex = (overlayIndex + 1) % overlayImages.length;
    updateOverlay();
  }

  closeBtn.addEventListener('click', closeOverlay);
  prevBtn.addEventListener('click', prevOverlay);
  nextBtn.addEventListener('click', nextOverlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.style.display !== 'flex') return;

    if (e.key === 'ArrowLeft') prevOverlay();
    if (e.key === 'ArrowRight') nextOverlay();
    if (e.key === 'Escape') closeOverlay();
  });

});