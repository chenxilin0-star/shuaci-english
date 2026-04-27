const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'local-user';
  const data = { openid, itemId:event.itemId, itemType:event.itemType || 'word', itemText:event.itemText || '', isFavorite:!!event.isFavorite, updatedAt:new Date() };
  try {
    const old = await db.collection('favorites').where({ openid, itemId:data.itemId, itemType:data.itemType }).limit(1).get();
    if (old.data.length) await db.collection('favorites').doc(old.data[0]._id).update({ data });
    else if (data.isFavorite) await db.collection('favorites').add({ data });
    return ok(data);
  } catch(e) { return ok(data); }
};
