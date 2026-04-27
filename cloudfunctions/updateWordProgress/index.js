const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'local-user';
  const data = { ...event, openid, updatedAt: new Date() };
  try {
    const old = await db.collection('user_progress').where({ openid }).orderBy('updatedAt','desc').limit(1).get();
    if (old.data.length) {
      await db.collection('user_progress').doc(old.data[0]._id).update({ data });
    } else {
      await db.collection('user_progress').add({ data });
    }
    return ok(data);
  }
  catch(e) { return ok(data); }
};
