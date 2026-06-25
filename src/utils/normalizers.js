function splitTermString(value) {
  return String(value || '')
    .replaceAll('、', ',')
    .replaceAll('，', ',')
    .replaceAll('\n', ',')
    .replaceAll('\t', ',')
    .replaceAll('　', ',')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function collectTargetTerms(value) {
  if (!value) return [];

  if (typeof value === 'string') {
    return splitTermString(value);
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectTargetTerms);
  }

  if (typeof value === 'object') {
    return [value.term, value.target, value.word, value.text, value.surface, value.reading]
      .flatMap(collectTargetTerms);
  }

  return [];
}

function uniqueTerms(terms = []) {
  const seen = new Set();
  return terms.filter(term => {
    const key = String(term || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeTargetTerms(raw = {}, vocabularyItems = []) {
  return uniqueTerms([
    raw.target_terms,
    vocabularyItems
  ].flatMap(collectTargetTerms));
}

function normalizeOption(option = {}, index = 0, myAnswerText = '') {
  const optionText = option.option_text || option.text || '';
  const label = option.label || option.original_label || String.fromCharCode(65 + index);

  return {
    ...option,
    label,
    original_label: option.original_label || label,
    option_text: optionText,
    is_correct: Boolean(option.is_correct),
    is_my_answer: Boolean(option.is_my_answer) || Boolean(myAnswerText && optionText === myAnswerText)
  };
}

function normalizeLinkedQuestionIds(raw = {}) {
  if (Array.isArray(raw.linked_question_ids)) return raw.linked_question_ids;
  if (Array.isArray(raw.question_vocabulary_links)) {
    return raw.question_vocabulary_links
      .map(item => item.question_id)
      .filter(Boolean);
  }
  return [];
}

export function normalizeQuestion(raw = {}) {
  const vocabularyItems = Array.isArray(raw.vocabulary_items) ? raw.vocabulary_items : [];
  const rawOptions = Array.isArray(raw.question_options) ? raw.question_options : Array.isArray(raw.options) ? raw.options : [];
  const myAnswerText = raw.my_answer_text || '';

  return {
    id: raw.id,
    exam_category: raw.exam_category || '未分类',
    level: raw.level || '',
    section: raw.section || '',
    question_type: raw.question_type || '',
    status: raw.status || 'unmastered',
    source_name: raw.source_name || '',
    chapter: raw.chapter || '',
    question_text: raw.question_text || '',
    my_answer_text: myAnswerText,
    ai_explanation: raw.ai_explanation || '',
    error_reason_tags: Array.isArray(raw.error_reason_tags) ? raw.error_reason_tags : [],
    target_terms: normalizeTargetTerms(raw, vocabularyItems),
    context_text: raw.context_text || '',
    source_method: raw.source_method || 'manual',
    last_reviewed_at: raw.last_reviewed_at ? new Date(raw.last_reviewed_at).toLocaleDateString() : '未复习',
    question_options: rawOptions.map((option, index) => normalizeOption(option, index, myAnswerText)),
    vocabulary_items: vocabularyItems
  };
}

export function normalizeVocabulary(raw = {}) {
  return {
    id: raw.id,
    exam_category: raw.exam_category || 'JLPT',
    status: raw.status || 'unmastered',
    word: raw.word || '',
    reading: raw.reading || '',
    meaning_zh: raw.meaning_zh || '',
    meaning_en: raw.meaning_en || '',
    part_of_speech: raw.part_of_speech || '',
    example_sentence: raw.ai_example_sentence || raw.example_sentence || '',
    note: raw.note || '',
    speak_lang: raw.speak_lang || (raw.exam_category === 'JLPT' ? 'ja-JP' : 'en-US'),
    linked_question_ids: normalizeLinkedQuestionIds(raw)
  };
}
