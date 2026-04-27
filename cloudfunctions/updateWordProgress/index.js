const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const data = { ...event, openid: wxContext.OPENID || event.openid || 'local-user', updatedAt: new Date() };
  try { await db.collection('user_progress').add({ data }); return ok(data); }
  catch(e) { return ok(data); }
};
