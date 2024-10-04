import { io } from '../../socket';
import eventEmitter from '../../socket/eventEmitter';
import redisClient from '../redis/redisClient';
import { getNearbyDeliveryPartners } from './getNearbyDeliveryPartnersService';
import {
  addToAlertedPartnersGlobal,
  addToAlertedPartnersOrderSpecific,
  filterOutAlertedPartnersGlobal,
  filterOutAlertedPartnersOrderSpecific,
  removeAlertedPartnersOrderSpecific,
  removeFromAlertedPartnersGlobal,
} from './helper';

/* const ALERTED_PARTNERS_GLOBAL_KEY = 'alerted:partners:global';
const getAlertedPartnersOrderSpecificKey = (orderId) =>
  `alerted:partners:order:${orderId}`; */

const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SendOrderAlertProps {
  orderId: string;
  longitude: number;
  latitude: number;
  retryCount?: number;
}

// Sends an order alert to nearby delivery partners and waits for acceptance.
export async function assignDeliveryPartnerForOrder({
  orderId = '66f6f2f973ee00f755f395e4',
  longitude = 76.3579401,
  latitude = 10.0037578,
  retryCount = 0,
}: SendOrderAlertProps) {
  console.log('orderId: ' + orderId);

  try {
    const { partners, success, message } = await getNearbyDeliveryPartners({
      latitude,
      longitude,
      radius: 5,
      unit: 'km',
    });
    const timeout = 30000; // 30 seconds

    // If no delivery partners are found, refund the user.
    if (!success || !partners || partners.length === 0) {
      console.log(`No partners found: ${message}`);
      await refundUser(orderId);
      return;
    }

    const filteredPartnersOrderSpecific = filterOutAlertedPartnersOrderSpecific(
      partners,
      orderId
    );

    console.log(
      `Filtered Partners order: ${orderId}: `,
      filteredPartnersOrderSpecific
    );

    const filteredPartnersGlobal = filterOutAlertedPartnersGlobal(
      filteredPartnersOrderSpecific
    );

    console.log('filteredPartnersGlobal', filteredPartnersGlobal);

    if (filteredPartnersGlobal.length === 0) {
      retryCount += 1;
      if (retryCount > MAX_RETRIES) {
        console.log('Max retries reached. No partner available.');
        removeAlertedPartnersOrderSpecific(orderId);
        await refundUser(orderId);
        return;
      }

      // Retry after sleeping for the timeout duration
      await sleep(timeout);
      await assignDeliveryPartnerForOrder({
        orderId,
        longitude,
        latitude,
        retryCount,
      });
      return;
    }

    const selectedPartners = filteredPartnersGlobal.slice(0, 1);

    const selectedPartnerIds = selectedPartners.map(
      ({ partnerId }) => partnerId
    );

    addToAlertedPartnersGlobal(selectedPartnerIds);
    addToAlertedPartnersOrderSpecific(orderId, selectedPartnerIds);

    // Notify all partners in parallel and wait for the first acceptance.
    const acceptancePromises = selectedPartners.map((partner) =>
      notifyAndWaitForAcceptance({
        partnerId: partner.partnerId,
        orderId,
        timeout,
        distance: partner.distance,
      })
    );

    try {
      // Wait for the first partner to accept the order.
      const acceptedPartner = await Promise.any(acceptancePromises);

      if (acceptedPartner) {
        console.log(
          `Order ${orderId} accepted by partner ${acceptedPartner.partnerId}`
        );

        addToUnavailablePartners(acceptedPartner.partnerId);

        // Notify all other partners that the order has already been accepted.
        notifyOrderAcceptedByOtherPartner(
          selectedPartners,
          acceptedPartner.partnerId,
          orderId
        );

        removeAlertedPartnersOrderSpecific(orderId);
        removeFromAlertedPartnersGlobal(selectedPartnerIds);

        return; // Exit once a delivery partner accepts the order.
      } else {
        await removeFromAlertedPartnersGlobal(selectedPartnerIds);

        // do it recursively until the getNearbyPartners returns null or an empty array
        await assignDeliveryPartnerForOrder({
          orderId,
          longitude,
          latitude,
          retryCount,
        });
      }
    } catch {
      // If no partner accepts within the timeout (Promise.any rejection).
      console.log('No delivery partner accepted the order in time.');
      await refundUser(orderId);
    }
  } catch (error) {
    console.error(`Error in sendOrderAlert: ${error.message}`);
  }
}

/* async function addToAlertedPartnersGlobal(partnerIds: string[]) {
  try {
    await redisClient.sadd(ALERTED_PARTNERS_GLOBAL_KEY, ...partnerIds);
  } catch (error) {
    console.error(`Error adding to alerted partners global: ${error.message}`);
  }
}

async function removeFromAlertedPartnersGlobal(partnerIds: string[]) {
  try {
    await redisClient.srem(ALERTED_PARTNERS_GLOBAL_KEY, ...partnerIds);
  } catch (error) {
    console.error(
      `Error removing from alerted partners global: ${error.message}`
    );
  }
}

async function addToAlertedPartnersOrderSpecific(
  orderId: string,
  partnerIds: string[]
) {
  try {
    await redisClient.sadd(
      getAlertedPartnersOrderSpecificKey(orderId),
      ...partnerIds
    );
  } catch (error) {
    console.error(
      `Error adding to order-specific alerted partners for order ${orderId}: ${error.message}`
    );
  }
}

async function removeAlertedPartnersOrderSpecific(orderId: string) {
  try {
    const key = getAlertedPartnersOrderSpecificKey(orderId);
    await redisClient.del(key);
  } catch (error) {
    console.error(
      `Error removing order-specific alerted partners for order ${orderId}: ${error.message}`
    );
  }
} */

function addToUnavailablePartners(partnerId: string) {
  redisClient.sadd('unavailable-partners', partnerId);
}

/* async function filterOutAlertedPartnersGlobal(
  partners: { partnerId: string; distance: number }[]
) {
  const results = await Promise.all(
    partners.map(async ({ partnerId }) => {
      const isMember = await redisClient.sismember(
        ALERTED_PARTNERS_GLOBAL_KEY,
        partnerId
      );
      return !isMember;
    })
  );
  return partners.filter((_, index) => results[index]);
}

async function filterOutAlertedPartnersOrderSpecific(
  partners: { partnerId: string; distance: number }[],
  orderId: string
) {
  const results = await Promise.all(
    partners.map(async ({ partnerId }) => {
      const isMember = await redisClient.sismember(
        getAlertedPartnersOrderSpecificKey(orderId),
        partnerId
      );
      return !isMember;
    })
  );
  return partners.filter((_, index) => results[index]);
} */

// Combines notification and waiting for acceptance in one function.
async function notifyAndWaitForAcceptance({
  partnerId,
  orderId,
  timeout,
  distance,
}) {
  try {
    await notifyDeliveryPartner({ partnerId, orderId, timeout, distance });

    // Wait for acceptance or timeout.
    const accepted = await waitForAcceptance(orderId, partnerId, timeout);

    return accepted ? { partnerId } : null;
  } catch (error) {
    console.error(`Error in notifyAndWaitForAcceptance: ${error.message}`);
    return null;
  }
}

// Helper function to notify delivery partner about a new order.
async function notifyDeliveryPartner({
  partnerId,
  orderId,
  timeout,
  distance,
}) {
  console.log('Notifying delivery partners ................');

  try {
    io.of('/deliveryPartner').to(`partner_${partnerId}`).emit('order-alert', {
      orderId,
      timeout,
      distance,
    });
  } catch (error) {
    console.error(
      `Failed to notify delivery partner ${partnerId}: ${error.message}`
    );
  }
}

// Notify other partners that the order has already been accepted by someone else.
async function notifyOrderAcceptedByOtherPartner(
  partners,
  acceptedPartnerId,
  orderId
) {
  for (const partner of partners) {
    if (partner.partnerId !== acceptedPartnerId) {
      console.log('sending other partners');

      io.of('/deliveryPartner')
        .to(`partner_${partner.partnerId}`)
        .emit('order-accepted', {
          orderId,
          message: 'Order has been accepted by another delivery partner.',
        });
    }
  }
}

async function waitForAcceptance(orderId, partnerId, timeout) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);

    listenForAcceptance(orderId, partnerId, () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

function listenForAcceptance(orderId, partnerId, callback) {
  const event = `accepted:${orderId}:${partnerId}`;

  eventEmitter.once(event, () => {
    console.log(
      `Order accepted event received for ${orderId} by partner ${partnerId}`
    );
    callback();
  });
}

async function refundUser(orderId) {
  try {
    console.log(`Refunding user for order ${orderId}`);
    // await someRefundService(orderId);
  } catch (error) {
    console.error(
      `Failed to refund user for order ${orderId}: ${error.message}`
    );
  }
}
