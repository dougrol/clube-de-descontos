export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  PARTNER = 'PARTNER'
}

export interface PartnerRegistrationData {
  cnpj: string;
  companyName: string;
  tradingName: string; // Fantasia
  responsibleName: string;
  phone: string;
  email: string;
  password: string;
  category: PartnerCategory;
  description: string;
}

export enum PartnerCategory {
  AUTOMOTIVE = 'Automotivo',
  FOOD = 'Gastronomia',
  LIFESTYLE = 'Lifestyle',
  SERVICES = 'Serviços',
  HEALTH = 'Saúde',
  SHOPPING = 'Compras',
  ENTERTAINMENT = 'Lazer',
  FINANCIAL = 'Financeiro'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: 'Basic' | 'Premium' | 'Gold';
  status: 'Active' | 'Inactive';
  avatar?: string;
  memberSince: string;
  memberId: string;
  validUntil: string;
  partnerId?: string;
}

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  description: string;
  benefit: string; // e.g., "20% OFF"
  fullRules: string;
  logoUrl: string;
  coverUrl: string;
  city: string;
  isOnline?: boolean;
  website?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Coupon {
  id: string;
  partnerId: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
}

export interface PartnerDB {
  id: string;
  name: string;
  category: string;
  description: string;
  benefit?: string;
  full_rules?: string;
  logo_url?: string;
  cover_url?: string;
  city?: string;
  address?: string;
  is_online?: boolean;
  website?: string;
  lat?: number;
  lng?: number;
  status?: string;
}