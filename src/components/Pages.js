import { escapeAttr, escapeHtml } from '../utils/html.js';
import { filterConfig, getExamConfig, getStatusLabel, matchesSearch, questionMatchesSkill } from '../utils/filters.js';
import { QuestionCard, QuestionDetail } from './QuestionCard.js';
import { QuestionForm } from './QuestionForm.js';
import { VocabCard, VocabDetail } from './VocabCard.js';

export { ReviewPage } from '../pages/ReviewPage.js';

function buttonGroup(items, active, dataName, formatter = item => item) {
  return items.map(item => `
    <button class="chip ${active === item ? 'active' : ''}" type="button" data-${dataName}="${escapeAttr(item)}">
      ${escapeHtml(formatter(item))}
    </button>
  `).join('');
}

function questionMatches(question, keyword) {
  return matchesSearch(question, keyword, ['question_text', 'ai_explanation', 'my_answer_text', 'source_name', 'chapter', 'section', 'question_type']) ||
    (question.error_reason_tags || []).some(tag => String(tag).toLowerCase().includes(String(keyword || '').toLowerCase()));
}

export function LoadingPage() {
  return `
    <section class="panel hero center-panel">
      <h1>正在加载错题本</h1>
      <p>正在从 Supabase 读取错题和生词。</p>
    </section>
  `;
}

export function ErrorPage(error) {
  return `
    <section class="panel hero center-panel">
      <h1>加载失败</h1>
      <p>${escapeHtml(error?.message || '未知错误')}</p>
      <div class="actions"><button class="btn" type="button" data-reload>重新加载</button></div>
    </section>
  `;
}

export function HomePage(state) {
  const recommended = state.questions.slice(0, 3);

  return `
    <section class="panel hero home-hero">
      <h1>错题复习本</h1>
      <p>真实数据来自 Supabase。列表页不提前暴露答案，详情页再看解析。</p>
      <div class="quick-grid home-quick-grid">
        <article class="quick-card" data-go="questions"><strong>查看错题本</strong><span>按题复习，先看普通选项。</span></article>
        <article class="quick-card" data-go="review"><strong>开始刷题</strong><span>随机抽题，点击选项后立刻判断对错。</span></article>
        <article class="quick-card" data-go="filter"><strong>标签筛选</strong><span>按考试、能力分类、题型和状态过滤。</span></article>
      </div>
    </section>

    <section class="panel recommended-panel compact-recommended-panel">
      <div class="section-head">
        <div><h2>建议复习</h2><p>优先展示当前读取到的前 3 道错题。</p></div>
        <button class="btn secondary compact" type="button" data-go="review">开始刷题</button>
      </div>
      <div class="home-recommended-list">
        ${recommended.map(question => QuestionCard(question)).join('') || '<div class="empty-note">暂无错题数据。</div>'}
      </div>
    </section>
  `;
}

export function QuestionsPage(state) {
  const keyword = state.search.trim();
  const questions = keyword ? state.questions.filter(question => questionMatches(question, keyword)) : state.questions;

  return `
    <section class="panel hero compact-hero">
      <h1>错题列表</h1>
      <p>先看题目和普通选项，不提前暴露正确答案。</p>
    </section>
    <section class="panel">
      <div class="results-topbar">
        <div class="section-head"><div><h2>全部错题</h2><p>${questions.length} 条显示结果</p></div></div>
        <div class="search-box"><span>🔎</span><input id="questionSearch" value="${escapeAttr(state.search)}" placeholder="搜索题目、解析或错因"></div>
      </div>
      <div class="result-list">${questions.map(QuestionCard).join('') || '<div class="empty-note">没有找到错题。</div>'}</div>
    </section>
  `;
}

export function FilterPage(state) {
  const cfg = getExamConfig(state.filters.exam);
  const keyword = state.search.trim();
  const sourceQuestions = state.filterResults ?? state.questions;
  const questions = sourceQuestions.filter(question => {
    const examOk = question.exam_category === state.filters.exam;
    const skillOk = questionMatchesSkill(question, state.filters.skill);
    const levelOk = !state.filters.level || question.level === state.filters.level;
    const statusOk = state.filters.status === 'all' || question.status === state.filters.status;
    const searchOk = !keyword || questionMatches(question, keyword);
    return examOk && skillOk && levelOk && statusOk && searchOk;
  });

  return `
    <section class="panel hero compact-hero">
      <h1>按标签找错题</h1>
      <p>先选考试，再选能力分类、等级 / Part 和掌握状态。</p>
      <div class="pills">
        <span class="pill">当前：${escapeHtml(state.filters.exam)}</span>
        <span class="pill">能力：${escapeHtml(state.filters.skill)}</span>
        <span class="pill">等级 / Part：${escapeHtml(state.filters.level)}</span>
      </div>
    </section>
    <section class="layout">
      <aside class="panel filter-panel">
        <div class="section"><div class="step-row"><div class="step-badge">1</div><div><strong>考试类别</strong><div class="subline">决定数据范围</div></div></div><div class="card-soft filter-row">${buttonGroup(filterConfig.exams, state.filters.exam, 'filter-exam')}</div></div>
        <div class="section"><div class="step-row"><div class="step-badge">2</div><div><strong>能力分类</strong><div class="subline">每题一个主分类</div></div></div><div class="card-soft filter-row">${buttonGroup(cfg.skills, state.filters.skill, 'filter-skill')}</div></div>
        <div class="section"><div class="step-row"><div class="step-badge">3</div><div><strong>等级 / Part</strong><div class="subline">JLPT N 级或 TOEIC Part</div></div></div><div class="card-soft filter-row">${buttonGroup(cfg.levels, state.filters.level, 'filter-level')}</div></div>
        <div class="section"><div class="step-row"><div class="step-badge">＋</div><div><strong>状态</strong><div class="subline">可选补充筛选</div></div></div><div class="card-soft filter-row">${buttonGroup(filterConfig.statuses, state.filters.status, 'filter-status', getStatusLabel)}</div></div>
        <div class="actions compact-actions"><button class="btn compact" type="button" data-refresh-filter>刷新结果</button><button class="btn soft compact" type="button" data-reset-filter>重置筛选</button></div>
      </aside>
      <section class="panel">
        <div class="results-topbar">
          <div class="section-head"><div><h2>筛选结果</h2><p>${questions.length} 条结果。</p></div></div>
          <div class="search-box"><span>🔎</span><input id="filterSearch" value="${escapeAttr(state.search)}" placeholder="在当前结果里搜索"></div>
        </div>
        <div class="result-list">${questions.map(QuestionCard).join('') || '<div class="empty-note">没有找到符合条件的错题。</div>'}</div>
      </section>
    </section>
  `;
}

export function DetailPage(state) {
  const question = state.questions.find(item => item.id === state.selectedQuestionId) || state.questions[0];
  return QuestionDetail(question, state.lastListPage || 'questions');
}

export function EditPage(state) {
  const question = state.questions.find(item => item.id === state.selectedQuestionId) || state.questions[0];
  if (!question) {
    return '<section class="panel"><div class="empty-note">没有找到这道错题。</div></section>';
  }

  return QuestionForm({ question, mode: 'edit' });
}

export function VocabPage(state) {
  const { exam, status, query } = state.vocabFilters;
  const pageSize = 10;
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = state.vocabulary.filter(item => {
    const examOk = exam === 'all' || item.exam_category === exam;
    const statusOk = status === 'all' || item.status === status;
    const searchOk = !normalizedQuery || [item.word, item.reading, item.meaning_zh, item.meaning_en, item.example_sentence, item.note].join(' ').toLowerCase().includes(normalizedQuery);
    return examOk && statusOk && searchOk;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(state.vocabPage, 1), totalPages);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = filtered.find(item => item.id === state.selectedVocabId) || filtered[0];
  const linkedQuestions = selected ? (selected.linked_question_ids || []).map(id => state.questions.find(question => question.id === id)).filter(Boolean) : [];

  return `
    <section class="panel hero compact-hero">
      <h1>生词本</h1>
      <p>搜索、分页、发音，并回到对应错题。</p>
    </section>
    <section class="two-col vocab-layout">
      <section class="panel vocab-sidebar">
        <div class="results-topbar"><div class="section-head"><div><h2>生词列表</h2><p>${filtered.length} 个结果</p></div></div></div>
        <div class="search-box"><span>🔎</span><input id="vocabSearch" value="${escapeAttr(query)}" placeholder="搜索单词 / 中文 / 英文解释"></div>
        <div class="filter-row">${buttonGroup(['all', ...filterConfig.exams], exam, 'vocab-exam', item => item === 'all' ? '全部' : item)}</div>
        <div class="filter-row">${buttonGroup(filterConfig.statuses, status, 'vocab-status', getStatusLabel)}</div>
        <div class="vocab-page-summary">第 ${page} / ${totalPages} 页｜共 ${filtered.length} 个单词</div>
        <div class="vocab-list">${paged.map(item => VocabCard({ ...item, isActive: selected?.id === item.id })).join('') || '<div class="empty-note">没有找到生词。</div>'}</div>
        <div class="vocab-pagination"><button class="btn soft" type="button" data-vocab-page="prev" ${page <= 1 ? 'disabled' : ''}>上一页</button><button class="btn soft" type="button" data-vocab-page="next" ${page >= totalPages ? 'disabled' : ''}>下一页</button></div>
      </section>
      <section class="panel vocab-detail-panel">${VocabDetail(selected, linkedQuestions)}</section>
    </section>
  `;
}

export function AddPage() {
  return QuestionForm({ mode: 'add' });
}
