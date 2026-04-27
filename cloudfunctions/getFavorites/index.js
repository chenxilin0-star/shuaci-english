const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'local-user';
  try {
    const res = await db.collection('favorites').where({ openid, itemType:event.itemType || 'word', isFavorite:true }).orderBy('createdAt','desc').limit(event.limit || 100).get();
    return ok(res.data);
  } catch(e) { return ok([]); }
};
