import { hasSupabaseConfig, listQuestionsByFilters } from './api.js';
import { questionMatchesKeyword } from './questionFilters.js';

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

function normalizeTargetTerms(value) {
  if (Array.isArray(value)) return value.map(String).map(x => x.trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .replace(/^\{/, '')
      .replace(/\}$/, '')
      .split(/[、,，/／・|｜]+/)
      .map(x => x.trim())
      .filter(Boolean);
  }
  return [];
}

function highlightText(text = '', targetTerms = []) {
  const terms = normalizeTargetTerms(targetTerms)
    .filter(term => String(text).includes(term))
    .sort((a, b) => b.length - a.length);
  if (!terms.length) return escapeHtml(text);
  const regex = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'g');
  return escapeHtml(text).replace(regex, '<mark class="target-highlight">$1</mark>');
}

function normalizeOption(option, index, question) {
  const label = option.original_label || option.label || String(index + 1);
  const mine = String(question.my_answer_text || '');
  const isMine = option.is_my_answer || mine.includes(label) || mine.includes(option.option_text || '');
  return { ...option, label, is_my_answer: isMine };
}

function normalizeQuestion(question) {
  return {
    ...question,
    target_terms: normalizeTargetTerms(question.target_terms),
    question_options: (question.question_options || []).map((option, index) => normalizeOption(option, index, question))
  };
}

async function loadQuestions() {
  if (!hasSupabaseConfig || state.loading || state.loaded) return;
  state.loading = true;
  try {
    const questions = await listQuestionsByFilters({ limit: 300 });
    state.questions = Array.isArray(questions) ? questions.map(normalizeQuestion) : [];
    state.loaded = true;
  } catch (error) {
    console.warn('Failed to load Supabase questions for main list', error);
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
    <article class="result-card" data-supabase-question-id="${escapeHtml(question.id)}">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        <span class="tag lavender">${escapeHtml(question.level || question.section || '')}</span>
        <span class="tag teal">${escapeHtml(question.question_type || question.section || '')}</span>
        <span class="tag pink">${escapeHtml(statusLabel(question.status))}</span>
      </div>
      <h3>${highlightText(question.question_text || '', question.target_terms || [])}</h3>
      <div class="compact-options">${options}</div>
      <div class="subline">来自 Supabase · ${escapeHtml((question.error_reason_tags || []).join(' / ') || '未填写')}</div>
      <div class="actions" style="margin-top:12px">
        <button class="btn secondary" data-supabase-detail="${escapeHtml(question.id)}">查看详情</button>
      </div>
    </article>
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
    <div class="live-detail-backdrop" data-supabase-close></div>
    <section class="panel live-detail-modal">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        <span class="tag lavender">${escapeHtml(question.level || '')}</span>
        <span class="tag teal">${escapeHtml(question.question_type || question.section || '')}</span>
        <span class="tag pink">${escapeHtml(statusLabel(question.status))}</span>
      </div>
      <h2>${highlightText(question.question_text || '', question.target_terms || [])}</h2>
      <h3>完整选项</h3>
      <div class="full-options">${options}</div>
      <h3>AI 解析</h3>
      <div class="explain">${escapeHtml(question.ai_explanation || '暂无解析。').replaceAll('\n', '<br>')}</div>
      <div class="actions" style="margin-top:16px"><button class="btn secondary" data-supabase-close>关闭</button></div>
    </section>
  `;
  document.body.appendChild(overlay);
}

function currentQuestionSearchValue() {
  return document.getElementById('questionSearch')?.value || '';
}

function isQuestionsPage() {
  return Array.from(document.querySelectorAll('h1')).some(el => el.textContent.trim() === '错题列表');
}

function renderSupabaseQuestionList() {
  if (!state.loaded || !isQuestionsPage()) return;

  const resultList = document.querySelector('.result-list:not(.live-question-list)');
  if (!resultList) return;

  const keyword = currentQuestionSearchValue().trim();
  const filtered = keyword
    ? state.questions.filter(question => questionMatchesKeyword(question, keyword))
    : state.questions;

  resultList.innerHTML = filtered.map(questionCard).join('') || '<div class="empty-note">没有找到错题。</div>';

  const heading = Array.from(document.querySelectorAll('.section-head h2')).find(el => el.textContent.includes('全部错题'));
  const countLine = heading?.parentElement?.querySelector('p');
  if (countLine) countLine.textContent = `${filtered.length} 条显示结果`;
}

function sync() {
  renderSupabaseQuestionList();
}

window.addEventListener('load', () => loadQuestions().then(sync));
window.addEventListener('input', event => {
  if (event.target?.id === 'questionSearch') requestAnimationFrame(sync);
}, true);
document.addEventListener('click', event => {
  const detail = event.target.closest('[data-supabase-detail]');
  if (detail) {
    const question = state.questions.find(item => item.id === detail.dataset.supabaseDetail);
    if (question) renderDetail(question);
  }
  if (event.target.closest('[data-supabase-close]')) {
    event.target.closest('.live-detail-overlay')?.remove();
  }
  requestAnimationFrame(sync);
}, true);

loadQuestions().then(sync);
setInterval(sync, 700);
