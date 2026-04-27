const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
function ok(data){ return { success:true, data }; }
function normalize(s){ return String(s || '').trim().toLowerCase().replace(/[\s-]/g, ''); }


exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'mock-openid';
  try { const res = await db.collection('mistake_books').where({ openid, itemType:event.itemType || 'word' }).orderBy('lastWrongAt','desc').limit(event.limit || 100).get(); return ok(res.data); } catch(e) { return ok([]); }
};
