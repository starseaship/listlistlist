export function normalizeQuestion(raw = {}) {
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
    target_terms: Array.isArray(raw.target_terms) ? raw.target_terms : [],
    context_text: raw.context_text || '',
    last_reviewed_at: raw.last_reviewed_at ? new Date(raw.last_reviewed_at).toLocaleDateString() : '未复习',
    question_options: Array.isArray(raw.question_options) ? raw.question_options : Array.isArray(raw.options) ? raw.options : [],
    vocabulary_items: Array.isArray(raw.vocabulary_items) ? raw.vocabulary_items : []
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
