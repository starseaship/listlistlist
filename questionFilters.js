export const statusLabelMap = {
  unmastered: '未掌握',
  uncertain: '模糊',
  mastered: '已掌握',
  all: ''
};

export function normalizeKeyword(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function questionMatchesKeyword(question, keyword = '') {
  const q = normalizeKeyword(keyword);
  if (!q) return true;

  return [
    question.question_text,
    question.ai_explanation,
    question.my_answer_text,
    question.source_name,
    question.chapter,
    ...(question.error_reason_tags || []),
    ...(question.target_terms || [])
  ]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function filterQuestions(questions = [], filters = {}, keyword = '') {
  return questions.filter(question => {
    const examOk = !filters.exam || filters.exam === 'all' || question.exam_category === filters.exam;
    const levelOk = !filters.level || filters.level === 'all' || question.level === filters.level || question.section === filters.level;
    const statusOk = !filters.status || filters.status === 'all' || question.status === filters.status;

    const skillText = [
      question.question_type,
      question.section,
      ...(question.error_reason_tags || [])
    ].join(' ');
    const skillOk = !filters.skill || skillText.includes(String(filters.skill).split(' ')[0]) || question.question_type === filters.skill;

    return examOk && levelOk && statusOk && skillOk && questionMatchesKeyword(question, keyword);
  });
}

export function cardTags(card) {
  return Array.from(card.querySelectorAll('.meta-tags .tag'))
    .map(tag => tag.textContent.trim())
    .filter(Boolean);
}

export function applyStrictDomQuestionFilters({
  resultList,
  exam = '',
  level = '',
  status = '',
  emptyClassName = 'strict-filter-empty',
  emptyText = '没有找到符合当前等级 / Part 的错题。',
  countElement = null,
  countText = count => `列表里只预览四个普通选项，不显示对错。当前显示 ${count} 条结果。`
} = {}) {
  if (!resultList) return 0;

  const statusLabel = statusLabelMap[status] || '';
  let visibleCount = 0;

  resultList.querySelectorAll('.result-card').forEach(card => {
    const tags = cardTags(card);
    const ok = (!exam || exam === 'all' || tags.includes(exam)) &&
      (!level || level === 'all' || tags.includes(level)) &&
      (!statusLabel || tags.includes(statusLabel));

    card.hidden = !ok;
    card.style.display = ok ? '' : 'none';
    if (ok) visibleCount += 1;
  });

  let empty = resultList.querySelector(`.${emptyClassName}`);
  if (visibleCount === 0) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = `empty-note ${emptyClassName}`;
      resultList.appendChild(empty);
    }
    empty.textContent = emptyText;
  } else if (empty) {
    empty.remove();
  }

  if (countElement) countElement.textContent = countText(visibleCount);
  return visibleCount;
}
