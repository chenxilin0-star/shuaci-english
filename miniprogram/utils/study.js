function nextReviewDate(familiarity = 0) { const days = familiarity > 80 ? 7 : familiarity > 50 ? 3 : 1; return Date.now() + days * 86400000; }
function normalizeAnswer(s) { return String(s || '').trim().toLowerCase().replace(/[\s-]/g, ''); }
function checkSpelling(input, answer) { return normalizeAnswer(input) === normalizeAnswer(answer); }
module.exports = { nextReviewDate, checkSpelling };
