// Premium cinematic interactions for "The Night of Forgotten Treats"
// Smooth reveal + reading progress

const progressBar = document.getElementById('readingProgressBar');
const revealItems = document.querySelectorAll('.reveal-ready');

function updateProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  ) - window.innerHeight;
  if (docHeight <= 0) {
    progressBar.style.width = '0%';
    return;
  }
  const pct = (scrollTop / docHeight) * 100;
  progressBar.style.width = Math.min(Math.max(pct, 0), 100) + '%';
}

if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });

  revealItems.forEach((el) => obs.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('is-visible'));
}

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('load', updateProgress);
updateProgress();
