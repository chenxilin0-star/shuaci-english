const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data){ return { success:true, data }; }
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'local-user';
  const user = {
    openid,
    nickName: event.nickName || '',
    avatarUrl: event.avatarUrl || '',
    lastLoginAt: new Date()
  };
  try {
    const exists = await db.collection('users').where({ openid }).limit(1).get();
    if (exists.data.length) {
      await db.collection('users').doc(exists.data[0]._id).update({
        data:{ nickName:user.nickName, avatarUrl:user.avatarUrl, lastLoginAt:user.lastLoginAt }
      });
    } else {
      await db.collection('users').add({ data:user });
    }
    return ok(user);
  } catch(e) { return ok(user); }
};
