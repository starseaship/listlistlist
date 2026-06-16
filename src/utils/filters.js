export const examFilterConfig = {
  JLPT: {
    skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'],
    levels: ['N5', 'N4', 'N3', 'N2', 'N1']
  },
  TOEIC: {
    skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'],
    levels: ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5', 'Part 6', 'Part 7', 'TOEIC 500', 'TOEIC 700']
  },
  EJU: {
    skills: ['记述 / Writing', '读解 / Reading', '听解 / Listening', '听读解 / Listening-Reading'],
    levels: ['基础', '进阶', '模拟题']
  },
  School: {
    skills: ['课堂作业', '发表', '阅读', '写作'],
    levels: ['基础', '进阶', '复习']
  },
  阅读课: {
    skills: ['词汇 / Vocabulary', '阅读 / Reading', '课堂作业'],
    levels: ['Chapter 3', 'Chapter 3.7', '复习']
  }
};

export const filterConfig = {
  exams: Object.keys(examFilterConfig),
  statuses: ['all', 'unmastered', 'uncertain', 'mastered']
};

export const statusMeta = {
  unmastered: ['未掌握', 'pink'],
  uncertain: ['模糊', 'yellow'],
  mastered: ['已掌握', 'green'],
  all: ['全部状态', '']
};

export function getStatusLabel(status) {
  return statusMeta[status]?.[0] || status || '未填写';
}

export function getStatusColor(status) {
  return statusMeta[status]?.[1] || '';
}

export function getExamConfig(exam) {
  return examFilterConfig[exam] || examFilterConfig.JLPT;
}

export function matchesSearch(item, query, fields = []) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return true;
  return fields.some(field => String(item?.[field] || '').toLowerCase().includes(normalized));
}

export function firstItemId(items) {
  return Array.isArray(items) && items.length ? items[0].id : null;
}
