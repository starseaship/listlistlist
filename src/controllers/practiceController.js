import { getOptionKey } from '../utils/questionOptions.js';

export function createInitialPracticeState() {
  return {
    queue: [],
    index: 0,
    optionOrder: [],
    selectedOptionKey: null,
    isCorrect: null,
    isSaving: false,
    answered: 0,
    correct: 0,
    completed: false
  };
}

export function shuffle(items = []) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export function getPracticeableQuestions(questions = []) {
  return questions.filter(question => question.id && (question.question_options || []).length >= 2);
}

export function buildPracticeSession(questions = [], preferredQuestionId = null) {
  const ids = getPracticeableQuestions(questions).map(question => question.id);

  if (!ids.length) {
    return {
      practice: createInitialPracticeState(),
      currentQuestionId: null
    };
  }

  const preferred = preferredQuestionId && ids.includes(preferredQuestionId) ? preferredQuestionId : null;
  const queue = preferred
    ? [preferred, ...shuffle(ids.filter(id => id !== preferred))]
    : shuffle(ids);

  const practice = {
    ...createInitialPracticeState(),
    queue
  };

  return preparePracticeQuestion(practice, questions, queue[0]);
}

export function preparePracticeQuestion(practice, questions = [], questionId = null) {
  const question = questions.find(item => item.id === questionId) || null;

  return {
    practice: {
      ...practice,
      optionOrder: shuffle((question?.question_options || []).map((option, index) => getOptionKey(option, index))),
      selectedOptionKey: null,
      isCorrect: null,
      isSaving: false
    },
    currentQuestionId: question?.id || null
  };
}

export function applyPracticeAnswer(practice, optionKey, isCorrect) {
  return {
    ...practice,
    selectedOptionKey: optionKey,
    isCorrect,
    isSaving: true,
    answered: practice.answered + 1,
    correct: practice.correct + (isCorrect ? 1 : 0)
  };
}

export function finishPracticeSave(practice) {
  return {
    ...practice,
    isSaving: false
  };
}

export function rollbackPracticeAnswer(practice, wasCorrect) {
  return {
    ...practice,
    selectedOptionKey: null,
    isCorrect: null,
    isSaving: false,
    answered: Math.max(0, practice.answered - 1),
    correct: Math.max(0, practice.correct - (wasCorrect ? 1 : 0))
  };
}

export function completePractice(practice) {
  return {
    ...practice,
    completed: true
  };
}

export function advancePractice(practice, questions = []) {
  if (practice.index >= practice.queue.length - 1) {
    return {
      practice: completePractice(practice),
      currentQuestionId: null
    };
  }

  const nextPractice = {
    ...practice,
    index: practice.index + 1
  };

  return preparePracticeQuestion(nextPractice, questions, nextPractice.queue[nextPractice.index]);
}
