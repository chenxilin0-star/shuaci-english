const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const data = { openid:wxContext.OPENID || event.openid || 'local-user', date:new Date().toISOString().slice(0,10), checked:true, createdAt:new Date() };
  try {
    const old = await db.collection('checkins').where({ openid:data.openid, date:data.date }).limit(1).get();
    if (!old.data.length) await db.collection('checkins').add({ data });
    return ok(data);
  } catch(e) { return ok(data); }
};
