export const OrderStatus = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  PICKED_UP: 'picked_up',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUSES = Object.values(OrderStatus);

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: ['picked_up', 'cancelled'],
  picked_up: ['returned'],
  returned: [],
  cancelled: [],
};

export interface RentalItemInput {
  gearItemId: string;
  quantity: number;
}

export interface ComputedOrderItem {
  gearItemId: string;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
}