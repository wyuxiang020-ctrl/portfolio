export function buildContactDraft(recipient, fields) {
  const text = key => String(fields[key] || '').trim();
  const subject = (text('subject') || `来自 ${text('name')} 的网站来信`).replace(/[\r\n]/g, ' ');
  const body = `称呼：${text('name')}\n回复邮箱：${text('email')}\n公司 / 团队：${text('company') || '未填写'}\n\n${text('message')}`;
  return {
    uri: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    text: `收件人：${recipient}\n主题：${subject}\n\n${body}`,
  };
}
