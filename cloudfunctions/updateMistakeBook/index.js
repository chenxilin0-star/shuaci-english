const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
function ok(data) { return { success: true, data }; }

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || event.openid || 'local-user';
  const itemId = event.itemId;
  if (!itemId) return ok({ error: 'missing itemId' });

  try {
    const old = await db.collection('mistake_books')
      .where({ openid, itemId, itemType: event.itemType || 'word' })
      .orderBy('lastWrongAt', 'desc')
      .limit(1)
      .get();

    if (old.data.length) {
      const doc = old.data[0];
      const updateData = {
        isReviewed: event.isReviewed !== undefined ? event.isReviewed : doc.isReviewed,
        reviewCount: (doc.reviewCount || 0) + (event.reviewCountIncrement || 0),
        reviewedAt: new Date()
      };
      await db.collection('mistake_books').doc(doc._id).update({ data: updateData });
      return ok({ ...doc, ...updateData });
    }
    return ok({ error: 'not found' });
  } catch (e) {
    return ok({ error: e.message });
  }
};
