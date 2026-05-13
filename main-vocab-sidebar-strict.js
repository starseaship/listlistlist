import './main-vocab-sidebar.js';

const statusLabels = {
  unmastered: '未掌握',
  uncertain: '模糊',
  mastered: '已掌握',
  all: ''
};

function activeValue(selector, key) {
  const el = document.querySelector(`${selector}.active`);
  return el?.dataset?.[key] || '';
}

function applyFilterFix() {
  const resultList = document.querySelector('.result-list');
  const isFilterPage = document.querySelector('[data-filter-level]') && document.querySelector('.filter-result-copy');
  if (!resultList || !isFilterPage) return;

  const exam = activeValue('[data-filter-exam]', 'filterExam');
  const level = activeValue('[data-filter-level]', 'filterLevel');
  const status = activeValue('[data-filter-status]', 'filterStatus');
  const statusLabel = statusLabels[status] || '';
  let count = 0;

  resultList.querySelectorAll('.result-card').forEach(card => {
    const tags = Array.from(card.querySelectorAll('.meta-tags .tag')).map(tag => tag.textContent.trim());
    const ok = (!exam || tags.includes(exam)) && (!level || tags.includes(level)) && (!statusLabel || tags.includes(statusLabel));
    card.style.display = ok ? '' : 'none';
    if (ok) count += 1;
  });

  let empty = resultList.querySelector('.strict-filter-empty');
  if (count === 0) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'empty-note strict-filter-empty';
      resultList.appendChild(empty);
    }
    empty.textContent = '没有找到符合当前等级 / Part 的错题。';
  } else if (empty) {
    empty.remove();
  }

  const copy = document.querySelector('.filter-result-copy');
  if (copy) copy.textContent = `列表里只预览四个普通选项，不显示对错。当前显示 ${count} 条结果。`;
}

function scheduleFilterFix() {
  requestAnimationFrame(applyFilterFix);
}

window.addEventListener('click', scheduleFilterFix, true);
window.addEventListener('input', scheduleFilterFix, true);
window.addEventListener('load', scheduleFilterFix);
setInterval(applyFilterFix, 400);
scheduleFilterFix();
