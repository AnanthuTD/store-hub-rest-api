export interface IWishlist {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    addedAt: Date;
  }>;
}
