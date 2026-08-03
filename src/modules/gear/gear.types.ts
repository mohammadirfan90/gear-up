import { Prisma } from '@prisma/client';

export type GearRecord = Prisma.GearItemGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    provider: { select: { id: true; name: true } };
  };
}>;

export type GearDetailRecord = Prisma.GearItemGetPayload<{
  include: {
    category: true;
    provider: { select: { id: true; name: true; email: true } };
    reviews: { select: { rating: true } };
  };
}>;

export interface GearFilter {
  categoryId?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  isAvailable?: boolean;
  providerId?: string;
  search?: string;
}
