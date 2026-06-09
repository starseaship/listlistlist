import { hasSupabaseConfig, listQuestionsByFilters } from './api.js';

const state = {
  loaded: false,
  loading: false,
  questions: []
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseTargetTermsFromText(text = '') {
  const source = String(text || '');
  const targetLine = source.match(/対象語[：:]\s*([^\n\r]+)/);
  if (!targetLine?.[1]) return [];
  return targetLine[1]
    .split(/[、,，/／・|｜]+/)
    .map(term => term.trim())
    .filter(Boolean);
}

function normalizeTargetTerms(value, question = {}) {
  const direct = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .replace(/^\{/, '')
          .replace(/\}$/, '')
          .split(/[、,，/／・|｜]+/)
      : [];

  const fallback = [
    ...parseTargetTermsFromText(question.context_text),
    ...parseTargetTermsFromText(question.ai_explanation)
  ];

  return [...direct, ...fallback]
    .map(term => String(term || '').trim())
    .filter(Boolean)
    .filter((term, index, terms) => terms.indexOf(term) === index)
    .sort((a, b) => b.length - a.length);
}

function highlightText(text = '', targetTerms = []) {
  const terms = normalizeTargetTerms(targetTerms)
    .filter(term => String(text).includes(term));
  if (!terms.length) return escapeHtml(text);

  const pattern = terms.map(escapeRegExp).join('|');
  const regex = new RegExp(`(${pattern})`, 'g');
  return escapeHtml(text).replace(regex, '<mark class="target-highlight">$1</mark>');
}

function renderQuestionText(question) {
  return highlightText(question.question_text || '', question.target_terms || []);
}

function normalizeOption(option, index, question) {
  const label = option.original_label || option.label || String.fromCharCode(65 + index);
  const mine = String(question.my_answer_text || '');
  const isMine = option.is_my_answer || mine.includes(label) || mine.includes(option.option_text || '');
  return { ...option, label, is_my_answer: isMine };
}

function normalizeQuestion(question) {
  return {
    ...question,
    target_terms: normalizeTargetTerms(question.target_terms, question),
    question_options: (question.question_options || []).map((option, index) => normalizeOption(option, index, question))
  };
}

async function loadQuestions() {
  if (!hasSupabaseConfig || state.loading || state.loaded) return;
  state.loading = true;
  try {
    const questions = await listQuestionsByFilters({ limit: 100 });
    state.questions = Array.isArray(questions) ? questions.map(normalizeQuestion) : [];
    state.loaded = true;
  } catch (error) {
    console.warn('Failed to load live Supabase questions', error);
  } finally {
    state.loading = false;
  }
}

function statusLabel(status) {
  return {
    unmastered: '未掌握',
    uncertain: '模糊',
    mastered: '已掌握'
  }[status] || status || '未掌握';
}

function questionCard(question) {
  const options = (question.question_options || []).map(option => (
    `<span class="option-chip">${escapeHtml(option.label)}. ${escapeHtml(option.option_text)}</span>`
  )).join('');

  return `
    <article class="result-card live-question-card" data-live-question-id="${escapeHtml(question.id)}">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        <span class="tag lavender">${escapeHtml(question.level || question.section || '')}</span>
        <span class="tag teal">${escapeHtml(question.question_type || question.section || '')}</span>
        <span class="tag pink">${escapeHtml(statusLabel(question.status))}</span>
      </div>
      <h3>${renderQuestionText(question)}</h3>
      <div class="compact-options">${options}</div>
      <div class="subline">来自 Supabase · ${escapeHtml((question.error_reason_tags || []).join(' / ') || '未填写')}</div>
      <div class="actions" style="margin-top:12px">
        <button class="btn secondary" data-live-detail="${escapeHtml(question.id)}">查看详情</button>
      </div>
    </article>
  `;
}

function latestPanel() {
  if (!state.questions.length) return '';
  const latest = state.questions.slice(0, 3).map(questionCard).join('');
  return `
    <section class="panel live-question-panel" data-live-question-panel>
      <div class="section-head">
        <div>
          <h2>Supabase 最新错题</h2>
          <p>这里显示数据库里的真实记录，不是本地示例数据。</p>
        </div>
      </div>
      <div class="result-list live-question-list">${latest}</div>
    </section>
  `;
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function cutBetween(text, startPattern, endPatterns = []) {
  const start = text.search(startPattern);
  if (start < 0) return '';
  const afterStart = text.slice(start).replace(startPattern, '').trim();
  const endIndexes = endPatterns
    .map(pattern => afterStart.search(pattern))
    .filter(index => index > 0);
  const end = endIndexes.length ? Math.min(...endIndexes) : afterStart.length;
  return afterStart.slice(0, end).trim().replace(/[。；;]$/, '');
}

function sentenceFromQuestion(question, correctOption) {
  if (!question.question_text || !correctOption?.option_text) return '';
  return question.question_text.replace(/（\s*　?\s*）|\(\s*\)/, correctOption.option_text);
}

function buildExplanationModel(question) {
  const text = String(question.ai_explanation || '').trim();
  const correctOption = (question.question_options || []).find(option => option.is_correct);
  const myOption = (question.question_options || []).find(option => option.is_my_answer);
  const completeSentence = firstMatch(text, [/完整句子[：:](.*?)(?:意思是|意思：|$)/]) || sentenceFromQuestion(question, correctOption);
  const meaning = firstMatch(text, [/意思是[“"]?(.*?)[。”"]/, /意思[：:](.*?)(?:。|$)/]);
  const grammarPoint = correctOption?.option_text ? `〜${correctOption.option_text}` : question.question_type || question.section || '本题考点';
  const connection = cutBetween(text, /接续[：:]/, [/错误选项/, /Excel\s*索引/, /资料来源/]);
  const wrongReason = cutBetween(text, /错误选项/, [/Excel\s*索引/, /资料来源/]);
  const source = cutBetween(text, /Excel\s*索引相关定位[：:]/) || cutBetween(text, /资料来源[：:]/);
  const why = cutBetween(text, /意思是[“"]?.*?[。”"]?/, [/接续[：:]/, /错误选项/, /Excel\s*索引/, /资料来源/]) ||
    cutBetween(text, /「.*?」表示/, [/接续[：:]/, /错误选项/, /Excel\s*索引/, /资料来源/]);

  return {
    raw: text,
    correctLabel: correctOption ? `${correctOption.label}. ${correctOption.option_text}` : '未标记',
    myLabel: myOption ? `${myOption.label}. ${myOption.option_text}` : question.my_answer_text || '未填写',
    completeSentence,
    meaning,
    grammarPoint,
    connection,
    why,
    wrongReason,
    source
  };
}

function renderInfoRow(label, value, emphasis = false) {
  if (!value) return '';
  return `
    <div class="explain-summary-row ${emphasis ? 'strong' : ''}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderExplainCard(title, body, tone = '') {
  if (!body) return '';
  return `
    <section class="explain-card ${tone}">
      <div class="explain-card-title">${escapeHtml(title)}</div>
      <div class="explain-card-body">${escapeHtml(body).replaceAll('\n', '<br>')}</div>
    </section>
  `;
}

function renderStructuredExplanation(question) {
  const model = buildExplanationModel(question);
  if (!model.raw) {
    return '<div class="explain-empty">暂无解析。</div>';
  }

  return `
    <div class="structured-explain">
      <section class="explain-answer-summary">
        <div class="explain-card-title">答案摘要</div>
        <div class="explain-summary-grid">
          ${renderInfoRow('正确答案', model.correctLabel, true)}
          ${renderInfoRow('我的答案', model.myLabel)}
          ${renderInfoRow('完整句子', model.completeSentence, true)}
          ${renderInfoRow('意思', model.meaning)}
        </div>
      </section>
      <div class="explain-card-grid">
        ${renderExplainCard('核心考点', model.grammarPoint, 'accent')}
        ${renderExplainCard('接续', model.connection)}
        ${renderExplainCard('为什么选这个', model.why)}
        ${renderExplainCard('错因提醒', model.wrongReason, 'warning')}
        ${renderExplainCard('资料来源', model.source, 'source')}
      </div>
    </div>
  `;
}

function renderDetail(question) {
  const options = (question.question_options || []).map(option => {
    const cls = option.is_correct ? 'correct' : option.is_my_answer ? 'mine' : '';
    const note = option.is_correct ? '　正确答案' : option.is_my_answer ? '　我的答案' : '';
    return `<div class="option ${cls}">${escapeHtml(option.label)}. ${escapeHtml(option.option_text)}${note}</div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'live-detail-overlay';
  overlay.innerHTML = `
    <div class="live-detail-backdrop" data-live-close></div>
    <section class="panel live-detail-modal">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        <span class="tag lavender">${escapeHtml(question.level || '')}</span>
        <span class="tag teal">${escapeHtml(question.question_type || question.section || '')}</span>
        <span class="tag pink">${escapeHtml(statusLabel(question.status))}</span>
      </div>
      <h2>${renderQuestionText(question)}</h2>
      <h3>完整选项</h3>
      <div class="full-options">${options}</div>
      <h3>AI 解析</h3>
      ${renderStructuredExplanation(question)}
      <div class="actions" style="margin-top:16px"><button class="btn secondary" data-live-close>关闭</button></div>
    </section>
  `;
  document.body.appendChild(overlay);
}

function installStyles() {
  if (document.getElementById('liveQuestionsPatchStyles')) return;
  const style = document.createElement('style');
  style.id = 'liveQuestionsPatchStyles';
  style.textContent = `
    .live-question-panel { margin-top: 18px; }
    .live-question-card { border-color: rgba(121, 179, 174, 0.36); }
    .target-highlight {
      background: linear-gradient(180deg, rgba(255, 250, 168, 0.18) 15%, rgba(255, 235, 106, 0.82) 15%, rgba(255, 235, 106, 0.82) 88%, rgba(255, 250, 168, 0.18) 88%);
      border-radius: 0.28em;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      padding: 0 0.12em;
    }
    .live-detail-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 18px; }
    .live-detail-backdrop { position: absolute; inset: 0; background: rgba(34, 40, 49, 0.42); backdrop-filter: blur(3px); }
    .live-detail-modal { position: relative; width: min(940px, 100%); max-height: min(88vh, 940px); overflow: auto; }
    .live-detail-modal h2 { margin: 12px 0 16px; line-height: 1.35; }
    .live-detail-modal h3 { margin: 20px 0 10px; }
    .structured-explain { display: grid; gap: 12px; }
    .explain-answer-summary,
    .explain-card {
      border: 1px solid rgba(124, 184, 178, 0.28);
      background: rgba(250, 253, 252, 0.78);
      border-radius: 16px;
      padding: 14px 16px;
    }
    .explain-answer-summary { border-left: 6px solid #80bbb6; }
    .explain-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .explain-card.accent { background: rgba(235, 247, 246, 0.95); }
    .explain-card.warning { background: rgba(255, 247, 238, 0.94); border-color: rgba(220, 158, 89, 0.28); }
    .explain-card.source { grid-column: 1 / -1; background: rgba(247, 247, 244, 0.9); color: #56636a; }
    .explain-card-title { color: #263854; font-size: 15px; font-weight: 800; margin-bottom: 8px; }
    .explain-card-body { color: #5f6d70; font-size: 16px; line-height: 1.75; overflow-wrap: anywhere; }
    .explain-summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .explain-summary-row { display: grid; gap: 5px; min-width: 0; }
    .explain-summary-row span { color: #718184; font-size: 13px; font-weight: 700; }
    .explain-summary-row strong { color: #263854; font-size: 17px; line-height: 1.55; overflow-wrap: anywhere; }
    .explain-summary-row.strong strong { color: #1f6f6b; }
    .explain-empty { color: #718184; border: 1px dashed rgba(124, 184, 178, 0.35); border-radius: 14px; padding: 16px; }
    @media (max-width: 760px) {
      .live-detail-overlay { padding: 10px; align-items: end; }
      .live-detail-modal { width: 100%; max-height: 92vh; border-radius: 20px 20px 0 0; }
      .explain-card-grid,
      .explain-summary-grid { grid-template-columns: 1fr; }
      .explain-card-body { font-size: 15px; }
    }
  `;
  document.head.appendChild(style);
}

function injectPanel() {
  if (!state.questions.length || document.querySelector('[data-live-question-panel]')) return;
  const app = document.querySelector('main.app');
  const hero = app?.querySelector('.panel.hero');
  if (!app || !hero) return;
  hero.insertAdjacentHTML('afterend', latestPanel());
}

function applyInlineHighlights() {
  if (!state.questions.length) return;
  const selectors = [
    '.result-card h3',
    '.home-recommended-card h3',
    '.linked-item-title',
    '.hero h1',
    '.panel h2'
  ].join(',');

  document.querySelectorAll(selectors).forEach(element => {
    if (element.querySelector('.target-highlight')) return;
    const text = element.textContent.trim();
    const question = state.questions.find(item => item.question_text === text);
    if (!question?.target_terms?.length) return;
    element.innerHTML = renderQuestionText(question);
  });
}

function sync() {
  installStyles();
  injectPanel();
  applyInlineHighlights();
}

document.addEventListener('click', event => {
  const detailButton = event.target.closest('[data-live-detail]');
  if (detailButton) {
    const question = state.questions.find(item => item.id === detailButton.dataset.liveDetail);
    if (question) renderDetail(question);
  }

  if (event.target.closest('[data-live-close]')) {
    event.target.closest('.live-detail-overlay')?.remove();
  }
}, true);

loadQuestions().then(sync);
window.addEventListener('load', sync);
setInterval(sync, 700);
