export const findProductInCart = (
  cart,
  productId: string,
  variantId: string
) => {
  return cart.products.findIndex(
    (p) =>
      p.productId.toString() === productId &&
      p.variantId.toString() === variantId
  );
};
