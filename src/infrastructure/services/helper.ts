const alertedPartnersGlobalSet = new Set<string>();

const alertedPartnersOrderSpecificMap: Record<string, Set<string>> = {};

function getAlertedPartnersOrderSpecificKey(orderId: string) {
  if (!alertedPartnersOrderSpecificMap[orderId]) {
    alertedPartnersOrderSpecificMap[orderId] = new Set<string>();
  }
  return alertedPartnersOrderSpecificMap[orderId];
}

function addToAlertedPartnersGlobal(partnerIds: string[]) {
  try {
    partnerIds.forEach((partnerId) => alertedPartnersGlobalSet.add(partnerId));
  } catch (error) {
    console.error(`Error adding to alerted partners global: ${error.message}`);
  }
}

function removeFromAlertedPartnersGlobal(partnerIds: string[]) {
  try {
    partnerIds.forEach((partnerId) =>
      alertedPartnersGlobalSet.delete(partnerId)
    );
  } catch (error) {
    console.error(
      `Error removing from alerted partners global: ${error.message}`
    );
  }
}

function addToAlertedPartnersOrderSpecific(
  orderId: string,
  partnerIds: string[]
) {
  try {
    const orderSpecificSet = getAlertedPartnersOrderSpecificKey(orderId);
    partnerIds.forEach((partnerId) => orderSpecificSet.add(partnerId));
  } catch (error) {
    console.error(
      `Error adding to order-specific alerted partners for order ${orderId}: ${error.message}`
    );
  }
}

function removeAlertedPartnersOrderSpecific(orderId: string) {
  try {
    delete alertedPartnersOrderSpecificMap[orderId]; // Removes the entire set for the order
  } catch (error) {
    console.error(
      `Error removing order-specific alerted partners for order ${orderId}: ${error.message}`
    );
  }
}

function filterOutAlertedPartnersGlobal(
  partners: { partnerId: string; distance: number }[]
) {
  console.log('alertedPartnersGlobalSet: ', alertedPartnersGlobalSet);

  const results = partners.filter(({ partnerId }) => {
    const isMember = alertedPartnersGlobalSet?.has(partnerId);
    console.log('partnerId in alertedPartnersGlobalSet: ', isMember);

    return !isMember;
  });

  console.log('results: ', results);

  return results;
}

function filterOutAlertedPartnersOrderSpecific(
  partners: { partnerId: string; distance: number }[],
  orderId: string
) {
  const results = partners.filter(({ partnerId }) => {
    const isMember = alertedPartnersOrderSpecificMap[orderId]?.has(partnerId);
    return !isMember;
  });
  return results;
}

export {
  addToAlertedPartnersGlobal,
  removeFromAlertedPartnersGlobal,
  addToAlertedPartnersOrderSpecific,
  removeAlertedPartnersOrderSpecific,
  filterOutAlertedPartnersGlobal,
  filterOutAlertedPartnersOrderSpecific,
};
