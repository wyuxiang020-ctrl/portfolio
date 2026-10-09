import { buildContactDraft } from './contact-draft.mjs';
const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
const status = document.querySelector<HTMLElement>('[data-contact-status]');
const fallback = document.querySelector<HTMLElement>('[data-contact-fallback]');
const copyArea = document.querySelector<HTMLTextAreaElement>('[data-letter-copy]');
let draft = '';
form?.addEventListener('submit', event => {
  event.preventDefault();
  for (const element of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required], textarea[required]')) {
    element.setCustomValidity(element.value.trim() ? '' : '请填写这一项。');
  }
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const letter = buildContactDraft(form.dataset.recipient, Object.fromEntries(data));
  draft = letter.text;
  if (copyArea) copyArea.value = draft;
  if (fallback) fallback.hidden = false;
  if (status) status.textContent = '正在尝试打开邮件应用。请在邮件中确认并发送；此页面不会直接发送留言。';
  window.location.href = letter.uri;
});
form?.addEventListener('input', event => (event.target as HTMLInputElement).setCustomValidity?.(''));
document.querySelector('[data-copy-letter]')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draft);
    if (status) status.textContent = '信件已复制，请粘贴到你的邮件应用中发送。';
  } catch {
    if (copyArea) { copyArea.hidden = false; copyArea.focus(); copyArea.select(); }
    if (status) status.textContent = '请选中下方信件内容并复制。';
  }
});
