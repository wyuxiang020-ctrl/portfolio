const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const heroItems = [...document.querySelectorAll<HTMLElement>('[data-hero-enter]')];
let entered = false;
const entranceAnimations: Animation[] = [];
function enterHero() {
  if (entered || root.classList.contains('intro-pending') || root.classList.contains('nav-arriving')) return;
  entered = true;
  root.classList.remove('home-enter-pending');
  if (reduced.matches) return;
  heroItems.forEach((item, index) => {
    const centered = item.classList.contains('portrait-center');
    const base = centered ? 'translateX(-50%) ' : '';
    entranceAnimations.push(item.animate([
      { opacity: 0, transform: `${base}translateY(${centered ? 130 : 60}px)` },
      { opacity: 1, transform: `${base}translateY(0)` }
    ], { duration: centered ? 1250 : 1000, delay: index * 110, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
  });
}
const entryObserver = new MutationObserver(() => { enterHero(); if (entered) entryObserver.disconnect(); });
entryObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
enterHero();
if (entered) entryObserver.disconnect();

const reveals = [...document.querySelectorAll<HTMLElement>('[data-scroll-reveal]')];
const curve = document.querySelector<SVGPathElement>('[data-footer-curve]');
const curveBox = document.querySelector<HTMLElement>('.footer-curve');
const footer = document.querySelector<HTMLElement>('.footer');
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
}), { threshold: .08 });
reveals.forEach(el => observer.observe(el));
let frame = 0;
const clamp = (n:number) => Math.min(1, Math.max(0, n));
function updateScroll() {
  frame = 0;
  if (reduced.matches) return;
  const height = innerHeight;
  if (curve && curveBox) {
    const progress = clamp((height - curveBox.getBoundingClientRect().top) / (height * .8));
    curve.setAttribute('d', `M0 0 H1000 V0 Q500 ${190 * (1 - progress)} 0 0 Z`);
    footer?.style.setProperty('--footer-shift', `${45 * (1 - progress)}px`);
  }
}
function scheduleScroll() { if (!frame && !reduced.matches) frame = requestAnimationFrame(updateScroll); }
function setMotion() {
  root.classList.toggle('scroll-motion', !reduced.matches);
  if (reduced.matches) {
    cancelAnimationFrame(frame); frame = 0;
    entranceAnimations.forEach(animation => animation.finish());
    root.classList.remove('home-enter-pending');
    footer?.style.removeProperty('--footer-shift');
    curve?.setAttribute('d', 'M0 0 H1000 V0 Q500 95 0 0 Z');
  } else scheduleScroll();
}
setMotion();
window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll);
window.addEventListener('pageshow', scheduleScroll);
window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
reduced.addEventListener('change', setMotion);

const marqueeButton = document.querySelector<HTMLButtonElement>('[data-marquee-toggle]');
marqueeButton?.addEventListener('click', () => {
  const paused = document.querySelector('.hero-marquee')?.classList.toggle('is-paused') || false;
  marqueeButton.setAttribute('aria-pressed', String(paused));
  marqueeButton.setAttribute('aria-label', paused ? '继续文字移动' : '暂停文字移动');
});
