document.addEventListener("DOMContentLoaded", () => {

  // --- NAV ACTIVE LINK ---
  setTimeout(() => {
    const path = window.location.pathname;

    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');

      if (
        (href === '/' && path === '/') ||
        (href !== '/' && path.startsWith(href))
      ) {
        link.classList.add('active');
      }
    });
  }, 100);

});