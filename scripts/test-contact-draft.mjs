import assert from 'node:assert/strict';
import { buildContactDraft } from '../src/scripts/contact-draft.mjs';
const draft = buildContactDraft('owner@example.com', {
  name: '  王先生  ', email: 'reader@example.com', company: '',
  subject: '产品 & 交流\r\ncc:other@example.com', message: '你好！\n问个问题：A&B / 50% #1',
});
const uri = new URL(draft.uri);
assert.equal(uri.pathname, 'owner@example.com');
assert.deepEqual([...uri.searchParams.keys()], ['subject', 'body']);
assert.equal(uri.searchParams.get('subject'), '产品 & 交流  cc:other@example.com');
assert.ok(uri.searchParams.get('body').endsWith('你好！\n问个问题：A&B / 50% #1'));
assert.ok(draft.text.includes('公司 / 团队：未填写'));
assert.equal(new URL(buildContactDraft('owner@example.com', {name:'小王',message:'你好'}).uri).searchParams.get('subject'), '来自 小王 的网站来信');
console.log('Contact draft: Chinese, multiline content, special characters, optional fields and header encoding passed. No email sent.');
