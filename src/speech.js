export function speakWord(text, lang = 'en-US') {
  if (!('speechSynthesis' in window)) {
    alert('当前浏览器不支持发音功能。');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
