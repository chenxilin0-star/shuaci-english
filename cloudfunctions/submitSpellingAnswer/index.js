const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
function ok(data){ return { success:true, data }; }
function normalize(s){ return String(s || '').trim().toLowerCase().replace(/[\s-]/g, ''); }


exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'mock-openid';
  const word = event.word || {};
  const wordId = word.id || event.wordId;
  const isCorrect = normalize(event.answer) === normalize(word.text || event.correctAnswer);
  const record = {
    openid, wordId, bankId: word.bankId || event.bankId || '', wordText: word.text || event.correctAnswer,
    status: isCorrect ? 'review' : 'learning', wrongCount: isCorrect ? 0 : 1, correctCount: isCorrect ? 1 : 0,
    isInMistakeBook: !isCorrect, lastStudyAt: new Date(), updatedAt: new Date()
  };
  try { await db.collection('user_word_records').add({ data: record }); } catch(e) {}
  if (!isCorrect) {
    try { await db.collection('mistake_books').add({ data: { openid, itemType:'word', itemId:wordId, itemText:record.wordText, wrongAnswer:event.answer, correctAnswer:record.wordText, wrongCount:1, lastWrongAt:new Date(), isReviewed:false, reviewCount:0, createdAt:new Date() } }); } catch(e) {}
  }
  try { await db.collection('learning_sessions').add({ data: { openid, sessionType:'spelling', items:[{ itemId:wordId, itemText:record.wordText, userAnswer:event.answer, correctAnswer:record.wordText, isCorrect }], totalItems:1, correctCount:isCorrect?1:0, wrongCount:isCorrect?0:1, accuracy:isCorrect?1:0, completedAt:new Date(), createdAt:new Date() } }); } catch(e) {}
  return ok({ isCorrect, record });
};
