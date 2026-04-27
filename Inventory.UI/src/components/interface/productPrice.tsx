export interface ProductPrice {
  id: number;
  productId: number;
  productName: string;
  sellingPrice: number;
  capitalPrice: number;
  isActive: boolean;
  createdBy: number;
}