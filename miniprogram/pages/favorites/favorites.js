const store=require('../../utils/store'); Page({data:{items:[]}, onShow(){this.setData({items:store.listFavorites()});}});
