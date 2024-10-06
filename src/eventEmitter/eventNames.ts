const eventEmitterEventNames = {
  getOrderAcceptanceEventName: (orderId, partnerId) =>
    `order.accepted.${partnerId}.${orderId}`,
};

export default eventEmitterEventNames;
