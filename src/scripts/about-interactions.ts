const palette = ['#455ce9', '#a7422c', '#28745a', '#8c467b'];
const names = ['蓝色', '赤陶色', '绿色', '紫色'];
const button = document.querySelector<HTMLButtonElement>('[data-color-button]');
const status = document.querySelector<HTMLElement>('[data-color-status]');
let color = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
function changeColor(announce = false) {
  color = (color + 1) % palette.length;
  document.querySelector<HTMLElement>('.story-page')?.style.setProperty('--story-accent', palette[color]);
  if (announce && status) status.textContent = `现在是${names[color]}，再点一下换色`;
}
button?.addEventListener('click', () => { changeColor(true); });
window.setInterval(() => {
  if (!reduced.matches && !document.hidden && button && button.getBoundingClientRect().bottom > 0 && button.getBoundingClientRect().top < innerHeight) changeColor();
}, 5000);
