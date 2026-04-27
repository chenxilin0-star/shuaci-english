const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  try {
    const id = event.wordId || event.id || event.text;
    const byId = await db.collection('words').where({ id }).limit(1).get();
    if (byId.data.length) return ok(byId.data[0]);
    const byText = await db.collection('words').where({ text:id }).limit(1).get();
    return ok(byText.data[0] || null);
  } catch(e) { return ok(null); }
};
