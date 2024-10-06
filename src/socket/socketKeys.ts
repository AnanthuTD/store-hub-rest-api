const socketKeys = {
  deliveryPartnerNameSpace: '/deliveryPartner',
  vendorNameSpace: '/vendor',
  storeNameSpace: '/vendor/store',

  getPartnerRoomKey(partnerId: string) {
    return `delivery:partner:room:${partnerId}`;
  },

  getVendorRoomKey(partnerId: string) {
    return `delivery:vendor:room:${partnerId}`;
  },

  getStoreRoomKey(storeId: string) {
    return `store:room:${storeId}`;
  },

  getOrderAcceptanceEvent() {
    return 'order:accepted';
  },

  getLocationUpdateEvent() {
    return 'location:update';
  },

  orderAlertEvent: 'order:alert',

  orderAlertRemovedEvent: 'order:alert:removed',

  orderDetailsEvent: 'accepted:order:details',

  storeNewOrderEvent: 'store:order:alert',
};

export default socketKeys;
