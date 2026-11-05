import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSupportResponse } from './supportChatLogic.ts';

test('supportChatLogic strictly prevents password requests and warns user', () => {
  const res1 = generateSupportResponse('هل تحتاجون كلمة سر حسابي؟');
  assert.equal(res1.category, 'security');
  assert.match(res1.reply, /تنبيه أمان/);

  const res2 = generateSupportResponse('نسيت الباسورد بتاعي');
  assert.equal(res2.category, 'security');
});

test('supportChatLogic provides comprehensive guide on how to use the website step by step', () => {
  const res = generateSupportResponse('ازاي استخدم الموقع خطوة بخطوة؟');
  assert.equal(res.category, 'how_to_use');
  assert.match(res.reply, /دليل استخدام منصة KOUMND/);
  assert.match(res.reply, /01556266856/);
  assert.match(res.reply, /إيداع الرصيد/);
  assert.match(res.reply, /متجر الخدمات/);
  assert.match(res.reply, /طلباتي/);
});

test('supportChatLogic provides accurate TikTok services without external provider names', () => {
  const res = generateSupportResponse('خدمات تيك توك وسوشيال ميديا');
  assert.equal(res.category, 'tiktok');
  assert.match(res.reply, /تيك توك/);
  assert.match(res.reply, /KOUMND/);
});

test('supportChatLogic provides wallet recharge details exclusively via cash wallet 01556266856', () => {
  const res = generateSupportResponse('عايز اشحن المحفظة برصيد');
  assert.equal(res.category, 'wallet');
  assert.match(res.reply, /01556266856/);
  assert.match(res.reply, /10 ج\.م/);
});

test('supportChatLogic answers gaming recharge queries specifying Player ID safety under KOUMND', () => {
  const res = generateSupportResponse('عايز اشحن شدات ببجي وفري فاير');
  assert.equal(res.category, 'games');
  assert.match(res.reply, /Player ID/);
  assert.match(res.reply, /KOUMND/);
  assert.match(res.reply, /ببجي/);
  assert.match(res.reply, /فري فاير/);
});

test('supportChatLogic provides accounts details for 6K, 14K, 14.5K and 64K accounts inside TikTok', () => {
  const res = generateSupportResponse('عايز حسابات تيك توك جاهزة 14k و 6000 متابع');
  assert.equal(res.category, 'accounts');
  assert.match(res.reply, /650/);
  assert.match(res.reply, /850/);
  assert.match(res.reply, /900/);
  assert.match(res.reply, /1,500/);
  assert.match(res.reply, /2,900/);
});

test('supportChatLogic provides pricing and discount information under KOUMND', () => {
  const res = generateSupportResponse('اسعار الخدمات والعروض');
  assert.equal(res.category, 'pricing');
  assert.match(res.reply, /KOUMND/);
  assert.match(res.reply, /الجنيه المصري/);
});

test('supportChatLogic answers custom design and video montage queries', () => {
  const res = generateSupportResponse('متوفر تصميم فيديو ومونتاج وإدارة أموال؟');
  assert.equal(res.category, 'custom');
  assert.match(res.reply, /01556266856/);
  assert.match(res.reply, /تصميم/);
});
