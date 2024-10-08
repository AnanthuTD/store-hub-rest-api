import { ObjectId } from 'mongoose';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { IShopRepository } from '../../domain/repositories/IShopRepository';

interface DeliveryProductStatus {
  nearProducts: Array<{
    productId: ObjectId;
    storeId: ObjectId;
  }>;
  notNearProducts: Array<{
    productId: ObjectId;
    storeId: ObjectId;
  }>;
}

export async function checkHomeDeliveryAvailability(
  userId: string | ObjectId,
  deliveryLocation: { latitude: number; longitude: number },
  maxDistance: number = 10000,
  cartRepository: ICartRepository,
  shopRepository: IShopRepository
): Promise<DeliveryProductStatus> {
  const cart = await cartRepository.findCartByUserId(userId);

  if (!cart) {
    throw new Error('Cart not found');
  }

  const storeIdsArray = Array.from(
    new Set(cart.products.map((item) => item.storeId))
  );

  console.log(storeIdsArray);

  const nearbyStores = await shopRepository.findStoresNearLocation(
    storeIdsArray,
    deliveryLocation,
    maxDistance
  );

  const nearbyStoreIds = new Set(
    nearbyStores.map((store) => store._id.toString())
  );

  console.log(nearbyStoreIds);

  const nearProducts: DeliveryProductStatus['nearProducts'] = [];
  const notNearProducts: DeliveryProductStatus['notNearProducts'] = [];

  // Loop through cart products and separate them based on store proximity
  for (const product of cart.products) {
    if (nearbyStoreIds.has(product.storeId.toString())) {
      nearProducts.push({
        productId: product.productId,
        storeId: product.storeId,
      });
    } else {
      notNearProducts.push({
        productId: product.productId,
        storeId: product.storeId,
      });
    }
  }

  console.log(nearProducts, notNearProducts);

  return {
    nearProducts,
    notNearProducts,
  };
}
