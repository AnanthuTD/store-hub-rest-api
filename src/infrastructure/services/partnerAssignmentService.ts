import { ObjectId } from 'mongoose';
import eventEmitter from '../../eventEmitter/eventEmitter';
import redisClient from '../redis/redisClient';
import { OrderRepository } from '../repositories/orderRepository';
import logger from '../utils/logger';
import { getNearbyDeliveryPartners } from './getNearbyDeliveryPartnersService';
import {
  addToAlertedPartnersGlobal,
  addToAlertedPartnersOrderSpecific,
  filterOutAlertedPartnersGlobal,
  filterOutAlertedPartnersOrderSpecific,
  removeAlertedPartnersOrderSpecific,
  removeFromAlertedPartnersGlobal,
} from './helper';
import { RefundService } from './refund.service';
import { sendOrderDetailsAndDirectionToDeliveryPartner } from './sendOrderDetails';
import DeliveryPartnerSocketService from './socketServices/deliveryPartnerSocketService';
import eventEmitterEventNames from '../../eventEmitter/eventNames';
import { io } from '../../socket';
import { OrderDeliveryStatus } from '../database/models/OrderSchema';
import { emitDeliveryStatusUpdateToUser } from '../events/orderEvents';
import StoreSocketService from './socketServices/storeSocketService';

const MAX_RETRIES = 1;
const BASE_TIMEOUT = 5000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SendOrderAlertProps {
  orderId: string;
  storeLongitude: number;
  storeLatitude: number;
  retryCount?: number;
}

const orderRepository = new OrderRepository();

// Sends an order alert to nearby delivery partners and waits for acceptance.
export async function assignDeliveryPartnerForOrder({
  orderId,
  storeLongitude,
  storeLatitude,
  retryCount = 0,
}: SendOrderAlertProps) {
  logger.debug('assignDeliveryPartnerForOrder: ' + orderId);

  try {
    const { partners, success, message } = await getNearbyDeliveryPartners({
      latitude: storeLatitude,
      longitude: storeLongitude,
      radius: 10,
      unit: 'km',
    });

    // If no delivery partners are found, refund the user.
    if (!success || !partners) {
      console.log(`No partners found: ${message}`);
      await refundUser(orderId);
      return;
    }

    const filteredPartnersOrderSpecific = filterOutAlertedPartnersOrderSpecific(
      partners,
      orderId
    );

    logger.debug(
      `filterOutAlertedPartnersOrderSpecific: ${orderId}: `,
      filteredPartnersOrderSpecific
    );

    const filteredPartnersGlobal = filterOutAlertedPartnersGlobal(
      filteredPartnersOrderSpecific
    );

    logger.debug('filteredPartnersGlobal', filteredPartnersGlobal);

    if (filteredPartnersGlobal.length === 0) {
      retryCount += 1;
      if (retryCount > MAX_RETRIES) {
        logger.debug(
          `[${orderId}] : Max retries reached. No partner available.`
        );

        sendOrderStatusToUser(orderId, OrderDeliveryStatus.Failed);
        removeAlertedPartnersOrderSpecific(orderId);
        await refundUser(orderId);
        return;
      }

      const TIME_OUT = Math.pow(2, retryCount) * BASE_TIMEOUT;

      // Retry after sleeping for the timeout duration
      await sleep(TIME_OUT);
      await assignDeliveryPartnerForOrder({
        orderId,
        storeLongitude: storeLongitude,
        storeLatitude: storeLatitude,
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
        timeout: BASE_TIMEOUT,
        distance: partner.distance,
      })
    );

    try {
      // Wait for the first partner to accept the order.
      const acceptedPartner = await Promise.any(acceptancePromises);

      if (acceptedPartner) {
        // order accepted

        logger.debug(
          `[${orderId}] : accepted by partner ${acceptedPartner.partnerId}`
        );

        // mark partner as unavailable
        addToUnavailablePartners(acceptedPartner.partnerId);

        // initialize orderUpdateStatus to true
        let orderUpdateStatus = true;

        try {
          // update order delivery status to assigned
          await new OrderRepository().assignPartner({
            partnerId: acceptedPartner.partnerId,
            orderId,
          });
        } catch {
          // in case of error update orderUpdateStatus to false
          removeFromAlertedPartnersGlobal(selectedPartnerIds);
          orderUpdateStatus = false;
        }

        // check orderUpdateStatus
        if (orderUpdateStatus === true) {
          // if orderUpdateStatus is true then partner assigned to the order successfully.

          // Send order details and direction to delivery partner using websocket
          sendOrderDetailsAndDirectionToDeliveryPartner({
            orderId,
            storeLongitude,
            storeLatitude,
          });

          // Notify all other partners that the order has already been accepted.
          notifyOrderAcceptedByOtherPartner(
            selectedPartners,
            acceptedPartner.partnerId,
            orderId
          );

          removeAlertedPartnersOrderSpecific(orderId);
          removeFromAlertedPartnersGlobal(selectedPartnerIds);

          sendOrderStatusToUser(orderId, OrderDeliveryStatus.Assigned);

          notifyStore(orderId);

          return; // Exit once a delivery partner accepts the order.
        }
      } else {
        removeFromAlertedPartnersGlobal(selectedPartnerIds);

        // do it recursively until the getNearbyPartners returns null or an empty array
        await assignDeliveryPartnerForOrder({
          orderId,
          storeLongitude,
          storeLatitude,
          retryCount,
        });
      }
    } catch {
      // If no partner accepts within the timeout (Promise.any rejection).
      sendOrderStatusToUser(orderId, OrderDeliveryStatus.Failed);
      console.log('No delivery partner accepted the order in time.');
      await refundUser(orderId);
    }
  } catch (error) {
    sendOrderStatusToUser(orderId, OrderDeliveryStatus.Failed);
    console.error(`Error in sendOrderAlert: ${error.message}`);
  }
}

export async function sendOrderStatusToUser(
  orderId: string,
  status: OrderDeliveryStatus
) {
  try {
    // Update the order status in the repository
    await orderRepository.updateDeliveryStatus(orderId, status);

    // Log the status update for tracking
    logger.info(`Order ${orderId} status updated to ${status}`);

    emitDeliveryStatusUpdateToUser(orderId, status);

    // Emit the status change to the client via Socket.IO
    io.emit('order:status:change', status);

    logger.info(`Order status change event emitted for order ${orderId}`);
  } catch (error) {
    // Log any errors encountered during the process
    logger.error(
      `Error updating order ${orderId} status to ${status}: ${error.message}`
    );
    throw new Error(`Failed to send order status update for order ${orderId}`);
  }
}

function addToUnavailablePartners(partnerId: string) {
  redisClient.sadd('unavailable-partners', partnerId);
}

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
    new DeliveryPartnerSocketService().sendOrderAlert(
      partnerId,
      orderId,
      timeout,
      distance
    );
  } catch (error) {
    console.error(
      `Failed to notify delivery partner ${partnerId}: ${error.message}`
    );
  }
}

// Notify other partners that the order has already been accepted by someone else.
async function notifyOrderAcceptedByOtherPartner(
  partners: { partnerId: string }[],
  acceptedPartnerId: string,
  orderId: string
) {
  for (const partner of partners) {
    if (partner.partnerId !== acceptedPartnerId) {
      new DeliveryPartnerSocketService().removeOrderAlert(
        partner.partnerId,
        orderId
      );
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

function listenForAcceptance(
  orderId: string,
  partnerId: string,
  callback: () => void
) {
  const event = eventEmitterEventNames.getOrderAcceptanceEventName(
    orderId,
    partnerId
  );

  eventEmitter.once(event, () => {
    console.log(
      `Order accepted event received for ${orderId} by partner ${partnerId}`
    );
    callback();
  });
}

async function refundUser(orderId: string | ObjectId) {
  try {
    console.log(`Refunding user for order ${orderId}`);
    const refundService = new RefundService();
    await refundService.refundOrder(orderId);
    console.log(`Refund for order ${orderId} completed successfully.`);
  } catch (error) {
    console.error(
      `Failed to refund user for order ${orderId}: ${error.message}`
    );
  }
}

async function notifyStore(orderId: ObjectId | string) {
  const order = await orderRepository.findOrderById(orderId);
  if (!order) return;

  // notify the store that the order has been placed successfully
  const storeSocketService = new StoreSocketService(order?.storeId.toString());
  storeSocketService.notifyStoreOnOrder(order.toJSON());
}
