export type SupplierStatus = "unverified" | "confirmed" | "verified";

export interface City {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
}

export interface SupplierConditions {
  delivery: boolean;
  pickup: boolean;
  minOrder?: number;
  worksWithLegalEntities: boolean;
  worksWithIndividualEntrepreneurs: boolean;
  deferredPayment: boolean;
  paymentMethods: string[];
}

export interface SupplierContacts {
  phone?: string;
  website?: string;
  telegram?: string;
}

export interface Supplier {
  slug: string;
  name: string;
  city: string;
  regions: string[];
  categories: string[];
  shortDescription: string;
  about: string;
  rating: number;
  reviewCount: number;
  status: SupplierStatus;
  conditions: SupplierConditions;
  contacts: SupplierContacts;
  foundedYear?: number;
  keywords: string[];
  updatedAt: string;
}

export interface Offer {
  id: string;
  supplierSlug: string;
  title: string;
  description: string;
  city?: string;
  category?: string;
  expiresAt?: string;
}

export interface SupplierFilters {
  city?: string;
  category?: string;
  delivery?: boolean;
  pickup?: boolean;
  confirmedOnly?: boolean;
  query?: string;
  sort?: "recommended" | "rating" | "new" | "updated";
}

export interface SearchResult {
  companies: Supplier[];
  categories: Category[];
  cities: City[];
}
