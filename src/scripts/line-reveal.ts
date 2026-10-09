// Measure actual rendered lines so a wrapped Chinese sentence reveals line by line, too.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal-line], [data-line-reveal], .story-text > p:not(.story-index):not(.story-footnote), .intro-aside > p')];
const originals = new Map(targets.map(el => [el, el.textContent || '']));
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('lines-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

function splitLines(el: HTMLElement, text: string) {
  el.textContent = text;
  if (preference.matches || !el.firstChild) return;
  const node = el.firstChild;
  const range = document.createRange();
  const groups: string[] = [];
  let offset = 0;
  let lastTop = -Infinity;
  for (const char of text) {
    range.setStart(node, offset);
    offset += char.length;
    range.setEnd(node, offset);
    const rect = range.getBoundingClientRect();
    if (rect.height && Math.abs(rect.top - lastTop) > 3) {
      groups.push(char); lastTop = rect.top;
    } else if (groups.length) groups[groups.length - 1] += char;
    else groups.push(char);
  }
  el.replaceChildren(...groups.map((line, index) => {
    const mask = document.createElement('span');
    mask.className = 'line-mask';
    const inner = document.createElement('span');
    inner.className = 'line-rise';
    inner.style.setProperty('--line-delay', `${index * 100}ms`);
    inner.textContent = line;
    mask.append(inner);
    return mask;
  }));
  el.classList.add('lines-ready');
}
function prepare() {
  originals.forEach((text, el) => {
    splitLines(el, text);
    if (preference.matches) el.classList.add('lines-visible');
    else observer.observe(el);
  });
}
prepare();
document.fonts.ready.then(prepare);
let width = innerWidth;
let resizeTimer: ReturnType<typeof setTimeout>;
addEventListener('resize', () => {
  if (width === innerWidth) return;
  width = innerWidth;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(prepare, 160);
});
preference.addEventListener('change', prepare);
