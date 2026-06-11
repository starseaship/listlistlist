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
    return [value.term, value.word, value.text, value.surface, value.reading]
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

export function normalizeQuestion(raw = {}) {
  const vocabularyItems = Array.isArray(raw.vocabulary_items) ? raw.vocabulary_items : [];

  return {
    id: raw.id,
    exam_category: raw.exam_category || '未分类',
    level: raw.level || raw.section || '',
    section: raw.section || raw.level || '',
    question_type: raw.question_type || raw.section || '',
    status: raw.status || 'unmastered',
    source_name: raw.source_name || '',
    chapter: raw.chapter || '',
    question_text: raw.question_text || '',
    my_answer_text: raw.my_answer_text || '',
    ai_explanation: raw.ai_explanation || '',
    error_reason_tags: Array.isArray(raw.error_reason_tags) ? raw.error_reason_tags : [],
    target_terms: normalizeTargetTerms(raw, vocabularyItems),
    context_text: raw.context_text || '',
    last_reviewed_at: raw.last_reviewed_at ? new Date(raw.last_reviewed_at).toLocaleDateString() : '未复习',
    question_options: Array.isArray(raw.question_options) ? raw.question_options : Array.isArray(raw.options) ? raw.options : [],
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
    linked_question_ids: Array.isArray(raw.linked_question_ids) ? raw.linked_question_ids : []
  };
}
