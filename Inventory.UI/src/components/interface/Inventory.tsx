export interface Inventory {
  id: number;
  productName: string;
  productId: number;
  quantityOnHand: number;
  quantityCommitted: number;
  createdBy: number;
  sellingPrice: number;
}