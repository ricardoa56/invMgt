import type { OrderLineItem } from "./OrderLineItem";

export interface OrdersOnly {
  orderId: number;
  customerId: number;
  customerName: string;
  orderDate: string;
  status: number;
  createdBy: number;
  remarks: string;
  totalAmount: number;
  orderItems: OrderLineItem[];
}