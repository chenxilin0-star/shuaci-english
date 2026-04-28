const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
function todayKey(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const data = { openid:wxContext.OPENID || event.openid || 'local-user', date:todayKey(), checked:true, createdAt:new Date() };
  try {
    const old = await db.collection('checkins').where({ openid:data.openid, date:data.date }).limit(1).get();
    if (!old.data.length) await db.collection('checkins').add({ data });
    return ok(data);
  } catch(e) { return ok(data); }
};
