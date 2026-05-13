export const mockQuestions = [
  {
    id: 'q1',
    exam_category: 'JLPT',
    level: 'N3',
    section: '文法',
    question_type: '语法 / 文法',
    status: 'unmastered',
    source_name: 'N3 模拟题',
    chapter: '逆接表达',
    question_text: '雨が降っている（　）、試合は行われます。',
    my_answer_text: 'けれども',
    ai_explanation: '这里表示“尽管正在下雨，比赛仍然进行”，需要选择带有逆接含义的表达。「にもかかわらず」表示“尽管……仍然……”，后面可以接与前项相反或不受前项影响的结果。',
    error_reason_tags: ['逆接表現', '接续判断'],
    last_reviewed_at: '2 天前',
    question_options: [
      { label: 'A', option_text: 'ので', is_correct: false },
      { label: 'B', option_text: 'けれども', is_correct: false, is_my_answer: true },
      { label: 'C', option_text: 'にもかかわらず', is_correct: true },
      { label: 'D', option_text: 'ため', is_correct: false }
    ],
    vocabulary_items: [
      { word: 'にもかかわらず', reading: 'にもかかわらず', meaning_zh: '尽管……仍然……', meaning_en: 'even though; despite that' },
      { word: '行われる', reading: 'おこなわれる', meaning_zh: '被举行，被实施', meaning_en: 'to be held or carried out' }
    ]
  },
  {
    id: 'q2',
    exam_category: 'TOEIC',
    level: '700',
    section: 'Part 5',
    question_type: '固定搭配',
    status: 'uncertain',
    source_name: 'TOEIC Part 5',
    chapter: 'Preposition',
    question_text: 'She is interested ___ learning Japanese.',
    my_answer_text: 'to',
    ai_explanation: 'interested 的常见搭配是 be interested in doing something，所以这里选择 in。',
    error_reason_tags: ['介词搭配', '固定搭配'],
    last_reviewed_at: '5 天前',
    question_options: [
      { label: 'A', option_text: 'to', is_correct: false, is_my_answer: true },
      { label: 'B', option_text: 'in', is_correct: true },
      { label: 'C', option_text: 'for', is_correct: false },
      { label: 'D', option_text: 'about', is_correct: false }
    ],
    vocabulary_items: [
      { word: 'interested', reading: '/ˈɪntrəstɪd/', meaning_zh: '感兴趣的', meaning_en: 'wanting to know or learn about something' }
    ]
  },
  {
    id: 'q3',
    exam_category: 'TOEIC',
    level: '700',
    section: 'Part 5',
    question_type: '词汇辨析',
    status: 'unmastered',
    source_name: 'TOEIC Part 5',
    chapter: 'Conjunction / Preposition',
    question_text: '_____ the heavy rain, the outdoor ceremony continued as planned.',
    my_answer_text: 'Although',
    ai_explanation: '空格后是名词短语 the heavy rain，所以需要 despite。although 后面要接完整句子。',
    error_reason_tags: ['词义辨析', '语法结构'],
    last_reviewed_at: '未复习',
    question_options: [
      { label: 'A', option_text: 'Despite', is_correct: true },
      { label: 'B', option_text: 'Although', is_correct: false, is_my_answer: true },
      { label: 'C', option_text: 'Because', is_correct: false },
      { label: 'D', option_text: 'During', is_correct: false }
    ],
    vocabulary_items: [
      { word: 'despite', reading: '/dɪˈspaɪt/', meaning_zh: '尽管，虽然', meaning_en: 'without being stopped by something' }
    ]
  }
];

export const mockVocabulary = [
  {
    id: 'v1', exam_category: 'TOEIC', status: 'unmastered', word: 'despite', reading: '/dɪˈspaɪt/', meaning_zh: '尽管，虽然（后接名词或名词短语）', meaning_en: 'without being stopped by something', part_of_speech: 'preposition', example_sentence: 'Despite the heavy rain, the outdoor ceremony continued as planned.', note: '容易和 although 混淆。despite 后接名词，although 后接句子。', speak_lang: 'en-US', linked_question_ids: ['q3']
  },
  {
    id: 'v2', exam_category: 'TOEIC', status: 'unmastered', word: 'interested', reading: '/ˈɪntrəstɪd/', meaning_zh: '感兴趣的', meaning_en: 'wanting to know or learn about something', part_of_speech: 'adjective', example_sentence: 'She is interested in learning Japanese.', note: '常见搭配：be interested in doing something。', speak_lang: 'en-US', linked_question_ids: ['q2']
  },
  {
    id: 'v3', exam_category: 'JLPT', status: 'uncertain', word: '段階', reading: 'だんかい', meaning_zh: '阶段，步骤', meaning_en: 'a step or stage in a process', part_of_speech: 'noun', example_sentence: 'この計画はまだ準備の段階です。', note: '常和 準備の段階 / 最終段階 这类说法一起出现。', speak_lang: 'ja-JP', linked_question_ids: []
  },
  {
    id: 'v4', exam_category: 'JLPT', status: 'mastered', word: 'にもかかわらず', reading: 'にもかかわらず', meaning_zh: '尽管……仍然……', meaning_en: 'even though; despite that', part_of_speech: 'grammar', example_sentence: '雨が降っているにもかかわらず、試合は行われます。', note: 'N3 常见逆接表达，后项通常与前项预期相反。', speak_lang: 'ja-JP', linked_question_ids: ['q1']
  }
];

export const filterConfig = {
  JLPT: {
    skills: ['语法 / 文法', '词汇 / 語彙', '阅读 / 読解', '听力 / 聴解', '汉字 / 读音', '表达 / 敬语'],
    levels: ['N5', 'N4', 'N3', 'N2', 'N1']
  },
  TOEIC: {
    skills: ['语法', '词汇', '固定搭配', '阅读', '听力', '商务表达'],
    levels: ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5', 'Part 6', 'Part 7', '500', '600', '700', '800']
  }
};
