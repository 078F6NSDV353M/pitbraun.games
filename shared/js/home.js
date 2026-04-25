document.addEventListener("DOMContentLoaded", () => {

  // --- CAROUSEL ---
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const images = carousel.querySelectorAll('.carousel-image');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');

    let index = 0;

    function showSlide(i){
      images.forEach(img => img.classList.remove('active'));
      images[i].classList.add('active');
    }

    prevBtn.addEventListener('click', () => {
      index = (index - 1 + images.length) % images.length;
      showSlide(index);
    });

    nextBtn.addEventListener('click', () => {
      index = (index + 1) % images.length;
      showSlide(index);
    });

    // --- OPEN OVERLAY ON CLICK ---
    images.forEach((img, i) => {
      img.addEventListener('click', () => {
        openOverlay(images, i);
      });
    });
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
