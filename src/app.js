import { hasSupabaseConfig } from './api/supabaseClient.js';
import { addQuestion, listQuestionsByFilters, listVocabulary, markQuestionReviewed, updateQuestion } from './api/index.js';
import { AppShell } from './components/AppShell.js';
import { AddPage, DetailPage, EditPage, ErrorPage, FilterPage, HomePage, LoadingPage, QuestionsPage, ReviewPage, VocabPage } from './components/Pages.js';
import { advancePractice, applyPracticeAnswer, buildPracticeSession, createInitialPracticeState, finishPracticeSave, rollbackPracticeAnswer } from './controllers/practiceController.js';
import { getExamConfig } from './utils/filters.js';
import { normalizeQuestion, normalizeVocabulary } from './utils/normalizers.js';
import { DISPLAY_LABELS, getOptionKey } from './utils/questionOptions.js';
import { answerToReviewUpdate, statusToReviewResult } from './utils/reviewStatus.js';
import { speakWord } from './speech.js';

const pageRenderers = {
  home: HomePage,
  questions: QuestionsPage,
  filter: FilterPage,
  detail: DetailPage,
  edit: EditPage,
  vocab: VocabPage,
  add: AddPage,
  review: ReviewPage
};

const initialFilters = {
  exam: 'JLPT',
  skill: '语法 / 文法',
  level: 'N3',
  status: 'all'
};

const SEARCH_RENDER_DELAY_MS = 160;
const DETAIL_SOURCE_PAGES = ['questions', 'filter', 'vocab', 'review'];

const state = {
  page: 'home',
  loading: true,
  error: null,
  questions: [],
  filterResults: null,
  vocabulary: [],
  selectedQuestionId: null,
  practiceQuestionId: null,
  selectedVocabId: null,
  lastListPage: 'questions',
  search: '',
  filters: { ...initialFilters },
  vocabFilters: {
    exam: 'all',
    status: 'all',
    query: ''
  },
  vocabPage: 1,
  practice: createInitialPracticeState()
};

let appRoot = null;
let toastTimer = null;
let searchRenderTimer = null;

export function startApp(root) {
  appRoot = root;
  bindGlobalEvents();
  render();
  loadInitialData();
}

function render() {
  if (!appRoot) return;

  if (state.loading) {
    appRoot.innerHTML = AppShell(state, LoadingPage());
    return;
  }

  if (state.error) {
    appRoot.innerHTML = AppShell(state, ErrorPage(state.error));
    return;
  }

  const renderer = pageRenderers[state.page] || HomePage;
  appRoot.innerHTML = AppShell(state, renderer(state));
}

function scheduleSearchRender() {
  clearTimeout(searchRenderTimer);
  searchRenderTimer = setTimeout(() => {
    searchRenderTimer = null;
    render();
  }, SEARCH_RENDER_DELAY_MS);
}

async function loadInitialData() {
  state.loading = true;
  state.error = null;
  render();

  try {
    if (!hasSupabaseConfig()) {
      throw new Error('Supabase 环境变量未配置。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
    }

    const [questions, vocabulary] = await Promise.all([
      listQuestionsByFilters({ limit: 120 }),
      listVocabulary({ limit: 200 })
    ]);

    state.questions = Array.isArray(questions) ? questions.map(normalizeQuestion) : [];
    state.filterResults = null;
    state.vocabulary = Array.isArray(vocabulary) ? vocabulary.map(normalizeVocabulary) : [];
    state.selectedQuestionId = state.questions[0]?.id ?? null;
    state.practiceQuestionId = null;
    state.selectedVocabId = state.vocabulary[0]?.id ?? null;
    state.practice = createInitialPracticeState();
  } catch (error) {
    state.error = error;
  } finally {
    state.loading = false;
    render();
  }
}

async function refreshQuestionsFromFilters() {
  const data = await listQuestionsByFilters({
    examCategory: state.filters.exam,
    skillGroup: state.filters.skill,
    level: state.filters.level,
    status: state.filters.status,
    limit: 120
  });

  state.filterResults = Array.isArray(data) ? data.map(normalizeQuestion) : [];
  state.selectedQuestionId = state.filterResults[0]?.id ?? state.selectedQuestionId;
}

function resetRemoteFilterResults() {
  state.filterResults = null;
}

function go(page, patch = {}) {
  state.page = page;
  Object.assign(state, patch);

  if (page === 'review' && (!state.practice.queue.length || patch.selectedQuestionId)) {
    startPractice(patch.selectedQuestionId || null);
  }

  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindGlobalEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('submit', handleSubmit);
}

async function handleClick(event) {
  const target = event.target.closest('button, article, [data-go], [data-detail], [data-edit], [data-select-vocab], [data-practice-answer]');
  if (!target) return;

  if (target.matches('[data-reload]')) {
    await loadInitialData();
    return;
  }

  if (target.matches('[data-practice-answer]')) {
    await handlePracticeAnswer(target.dataset.practiceAnswer);
    return;
  }

  if (target.matches('[data-practice-next]')) {
    handlePracticeNext();
    return;
  }

  if (target.matches('[data-practice-reset]')) {
    startPractice();
    render();
    return;
  }

  if (target.matches('[data-go]')) {
    go(target.dataset.go);
    return;
  }

  if (target.matches('[data-detail]')) {
    const listPage = DETAIL_SOURCE_PAGES.includes(state.page) ? state.page : state.lastListPage || 'questions';
    go('detail', { selectedQuestionId: target.dataset.detail, lastListPage: listPage });
    return;
  }

  if (target.matches('[data-edit]')) {
    go('edit', { selectedQuestionId: target.dataset.edit, lastListPage: state.page === 'detail' ? state.lastListPage : state.page });
    return;
  }

  if (target.matches('[data-review-one]')) {
    go('review', { selectedQuestionId: target.dataset.reviewOne });
    return;
  }

  if (target.matches('[data-filter-exam]')) {
    const exam = target.dataset.filterExam;
    const config = getExamConfig(exam);
    state.filters.exam = exam;
    state.filters.skill = config.skills[0];
    state.filters.level = config.levels[0];
    resetRemoteFilterResults();
    render();
    return;
  }

  if (target.matches('[data-filter-skill]')) {
    state.filters.skill = target.dataset.filterSkill;
    resetRemoteFilterResults();
    render();
    return;
  }

  if (target.matches('[data-filter-level]')) {
    state.filters.level = target.dataset.filterLevel;
    resetRemoteFilterResults();
    render();
    return;
  }

  if (target.matches('[data-filter-status]')) {
    state.filters.status = target.dataset.filterStatus;
    resetRemoteFilterResults();
    render();
    return;
  }

  if (target.matches('[data-refresh-filter]')) {
    try {
      await refreshQuestionsFromFilters();
      showToast('已刷新筛选结果');
    } catch (error) {
      showToast(`刷新失败：${error.message}`);
    }
    render();
    return;
  }

  if (target.matches('[data-reset-filter]')) {
    state.filters = { ...initialFilters };
    state.search = '';
    resetRemoteFilterResults();
    render();
    return;
  }

  if (target.matches('[data-status]')) {
    await handleStatusUpdate(target.dataset.qid, target.dataset.status);
    return;
  }

  if (target.matches('[data-vocab-exam]')) {
    state.vocabFilters.exam = target.dataset.vocabExam;
    state.vocabPage = 1;
    render();
    return;
  }

  if (target.matches('[data-vocab-status]')) {
    state.vocabFilters.status = target.dataset.vocabStatus;
    state.vocabPage = 1;
    render();
    return;
  }

  if (target.matches('[data-vocab-page]')) {
    state.vocabPage += target.dataset.vocabPage === 'next' ? 1 : -1;
    render();
    return;
  }

  if (target.matches('[data-select-vocab]')) {
    state.selectedVocabId = target.dataset.selectVocab;
    render();
    return;
  }

  if (target.matches('[data-speak-vocab]')) {
    const item = state.vocabulary.find(vocab => vocab.id === target.dataset.speakVocab);
    if (item) speakWord(item.word, item.speak_lang);
  }
}

function handleInput(event) {
  if (event.target.matches('#questionSearch, #filterSearch')) {
    state.search = event.target.value;
    scheduleSearchRender();
  }

  if (event.target.matches('#vocabSearch')) {
    state.vocabFilters.query = event.target.value;
    state.vocabPage = 1;
    scheduleSearchRender();
  }
}

function splitTags(value) {
  return String(value || '')
    .replaceAll('，', ',')
    .replaceAll('、', ',')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function buildQuestionPayload(form, baseQuestion = {}) {
  const correct = form.get('correct_label');
  const mine = form.get('my_label');
  const options = DISPLAY_LABELS.map(label => ({
    label,
    option_text: String(form.get(`option_${label}`) || '').trim(),
    is_correct: label === correct,
    is_my_answer: label === mine
  })).filter(option => option.option_text);

  return {
    ...baseQuestion,
    exam_category: String(form.get('exam_category') || ''),
    level: String(form.get('level') || ''),
    section: String(form.get('section') || ''),
    question_type: String(form.get('question_type') || ''),
    source_name: String(form.get('source_name') || ''),
    question_text: String(form.get('question_text') || ''),
    ai_explanation: String(form.get('ai_explanation') || ''),
    my_answer_text: mine ? String(form.get(`option_${mine}`) || '').trim() : '',
    error_reason_tags: splitTags(form.get('error_reason_tags')),
    options,
    vocabulary_items: Array.isArray(baseQuestion.vocabulary_items) ? baseQuestion.vocabulary_items : []
  };
}

function validateQuestionPayload(payload) {
  if (!String(payload.exam_category || '').trim()) return '考试类别不能为空';
  if (!String(payload.section || '').trim()) return '能力分类不能为空';
  if (!String(payload.question_text || '').trim()) return '题目不能为空';
  if (!Array.isArray(payload.options) || payload.options.length < 2) return '至少填写 2 个选项';
  if (!payload.options.some(option => option.is_correct)) return '正确答案对应的选项不能为空';
  return null;
}

async function handleSubmit(event) {
  if (!event.target.matches('#addForm, #editForm')) return;
  event.preventDefault();

  const form = new FormData(event.target);
  const isEdit = event.target.matches('#editForm');
  const questionId = String(form.get('id') || state.selectedQuestionId || '');
  const baseQuestion = isEdit ? state.questions.find(question => question.id === questionId) || {} : {};
  const payload = buildQuestionPayload(form, baseQuestion);
  const validationError = validateQuestionPayload(payload);

  if (validationError) {
    showToast(validationError);
    return;
  }

  try {
    const saved = isEdit ? await updateQuestion(questionId, payload) : await addQuestion(payload);
    const savedId = saved?.id || saved?.question?.id || saved?.question_id || questionId || null;
    await loadInitialData();
    showToast(isEdit ? '错题已更新' : '错题已保存');
    go(savedId ? 'detail' : 'questions', savedId ? { selectedQuestionId: savedId } : {});
  } catch (error) {
    showToast(`${isEdit ? '更新' : '保存'}失败：${error.message}`);
  }
}

function startPractice(preferredQuestionId = null) {
  const { practice, currentQuestionId } = buildPracticeSession(state.questions, preferredQuestionId);
  state.practice = practice;
  state.practiceQuestionId = currentQuestionId;
}

function findPracticeQuestion() {
  return state.questions.find(question => question.id === state.practiceQuestionId) || null;
}

async function handlePracticeAnswer(optionKey) {
  const question = findPracticeQuestion();
  if (!question || state.practice.selectedOptionKey || state.practice.isSaving) return;

  const option = (question.question_options || []).find((item, index) => getOptionKey(item, index) === optionKey);
  if (!option) return;

  const previousStatus = question.status;
  const previousReviewedAt = question.last_reviewed_at;
  const isCorrect = Boolean(option.is_correct);
  const { result, status } = answerToReviewUpdate(isCorrect);

  state.practice = applyPracticeAnswer(state.practice, optionKey, isCorrect);
  question.status = status;
  question.last_reviewed_at = '刚刚';
  render();

  try {
    await markQuestionReviewed(question.id, result, status);
    state.practice = finishPracticeSave(state.practice);
    render();
    showToast(isCorrect ? '答对了，已记录' : '答错了，已记录');
  } catch (error) {
    state.practice = rollbackPracticeAnswer(state.practice, isCorrect);
    question.status = previousStatus;
    question.last_reviewed_at = previousReviewedAt;
    render();
    showToast(`复习记录失败：${error.message}`);
  }
}

function handlePracticeNext() {
  if (state.practice.isSaving) {
    showToast('正在保存复习记录');
    return;
  }

  const { practice, currentQuestionId } = advancePractice(state.practice, state.questions);
  state.practice = practice;
  state.practiceQuestionId = currentQuestionId;
  render();
}

async function handleStatusUpdate(questionId, status) {
  const question = state.questions.find(item => item.id === questionId);
  const previousStatus = question?.status;
  if (question) question.status = status;
  render();

  try {
    await markQuestionReviewed(questionId, statusToReviewResult(status), status);
    showToast('复习状态已保存');
  } catch (error) {
    if (question && previousStatus) question.status = previousStatus;
    render();
    showToast(`保存失败：${error.message}`);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}
