const routeRoot = document.documentElement;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let navigationTimer = 0;
let navigationPending = false;
if (routeRoot.classList.contains('nav-arriving')) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    routeRoot.classList.add('nav-arrived');
    routeRoot.classList.remove('nav-arriving');
  }));
}
function resetNavigation() {
  clearTimeout(navigationTimer); navigationPending = false;
  routeRoot.classList.add('nav-reset');
  routeRoot.classList.remove('nav-leaving','nav-arriving','nav-arrived');
  requestAnimationFrame(() => requestAnimationFrame(() => routeRoot.classList.remove('nav-reset')));
}
document.addEventListener('click', event => {
  const link = (event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download') || motionQuery.matches) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname === location.pathname || !url.pathname.endsWith('/')) return;
  event.preventDefault();
  if (navigationPending) return;
  navigationPending = true;
  const labels: Record<string,[string,string]> = {'/':['首页','Home'],'/work/':['作品','Work'],'/about/':['关于','About'],'/contact/':['联系','Contact'],'/resume/':['简历','Resume'],'/ai/':['产品','Products'],'/architecture/':['建筑','Architecture']};
  const label = labels[url.pathname] || ['项目','Project'];
  document.querySelector('[data-route-label]')!.textContent = label[0];
  document.querySelector('[data-route-en]')!.textContent = label[1];
  routeRoot.classList.remove('nav-arrived','nav-reset');
  routeRoot.classList.add('nav-leaving');
  try { sessionStorage.setItem('portfolio-route-transition',JSON.stringify({path:url.pathname,time:Date.now()})); } catch {}
  navigationTimer = window.setTimeout(() => location.assign(url.href),700);
});
document.addEventListener('keydown', event => {
  if(event.key === 'Escape' && navigationPending) { resetNavigation(); try {sessionStorage.removeItem('portfolio-route-transition');}catch{} }
});
window.addEventListener('pageshow', event => {if(event.persisted)resetNavigation();});
