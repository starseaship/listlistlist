export const DISPLAY_LABELS = ['A', 'B', 'C', 'D'];

export function getOptionDisplayLabel(option = {}, index = 0) {
  const rawLabel = String(option.label || option.original_label || '').trim().toUpperCase();
  if (DISPLAY_LABELS.includes(rawLabel)) return rawLabel;

  const numericIndex = Number(rawLabel) - 1;
  if (Number.isInteger(numericIndex) && DISPLAY_LABELS[numericIndex]) return DISPLAY_LABELS[numericIndex];

  return DISPLAY_LABELS[index] || rawLabel || String.fromCharCode(65 + index);
}

export function getOptionKey(option = {}, index = 0) {
  return String(option.id || option.original_label || option.label || index);
}

export function getOptionValue(question, label) {
  const option = (question?.question_options || []).find((item, index) => getOptionDisplayLabel(item, index) === label);
  return option?.option_text || '';
}

export function getCorrectOption(question) {
  return (question?.question_options || []).find(option => option.is_correct) || null;
}

export function getCorrectLabel(question) {
  const options = question?.question_options || [];
  const index = options.findIndex(option => option.is_correct);
  return index >= 0 ? getOptionDisplayLabel(options[index], index) : DISPLAY_LABELS[0];
}

export function getMyLabel(question) {
  const options = question?.question_options || [];
  const index = options.findIndex(option => option.is_my_answer);
  return index >= 0 ? getOptionDisplayLabel(options[index], index) : '';
}

export function getOrderedOptions(question, optionOrder = []) {
  const options = question?.question_options || [];
  const keys = optionOrder.length ? optionOrder : options.map(getOptionKey);

  return keys
    .map(key => {
      const index = options.findIndex((option, optionIndex) => getOptionKey(option, optionIndex) === key);
      return index >= 0 ? { key, option: options[index], index } : null;
    })
    .filter(Boolean);
}
