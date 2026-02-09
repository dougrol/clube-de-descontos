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

// ===========================================
// STORE MODULE TYPES
// ===========================================

export enum ProductType {
  SERVICE = 'service',    // Serviços (lavagem, manutenção) - sem quantidade, só % desconto
  PRODUCT = 'product'     // Produtos físicos (roupas, acessórios) - com quantidade
}

export enum OrderStatus {
  CREATED = 'created',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  PIX = 'pix',
  CARD = 'card'
}

export interface Product {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  priceOriginal: number;
  priceDiscount: number;
  stock: number;
  active: boolean;
  imageUrl: string;
  createdAt: string;
  productType?: ProductType; // 'service' or 'product'
  // Populated fields
  partnerName?: string;
}

export interface ProductDB {
  id: string;
  partner_id: string;
  title: string;
  description?: string;
  price_original: number;
  price_discount: number;
  stock: number;
  active: boolean;
  image_url?: string;
  created_at: string;
}

export interface Order {
  id: string;
  userId: string;
  partnerId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  // Populated fields
  items?: OrderItem[];
  payment?: Payment;
  partnerName?: string;
}

export interface OrderDB {
  id: string;
  user_id: string;
  partner_id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
  // Populated fields
  productTitle?: string;
  productImageUrl?: string;
}

export interface OrderItemDB {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string;
  status: PaymentStatus;
  method: PaymentMethod;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  checkoutUrl?: string;
  createdAt: string;
}

export interface PaymentDB {
  id: string;
  order_id: string;
  provider: string;
  provider_payment_id?: string;
  status: string;
  method?: string;
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  checkout_url?: string;
  created_at: string;
}