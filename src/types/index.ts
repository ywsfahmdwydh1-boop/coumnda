export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  balance: number;
  status: UserStatus;
  createdAt: string;
  uid?: string;
  provider?: 'google' | 'facebook' | 'local' | 'otp';
  providerUid?: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
  salt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  active: boolean;
  isAvailable?: boolean; // When false, indicates item is out-of-stock / غير متوفر ومينفعش يطلب
  profitMarginPercent?: number; // e.g. 30% for social, 7% for gaming
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  pricePer1000: number; // Price in EGP (with exact 30% margin or 7% for games)
  originalProviderCost?: number; // Base cost from provider
  minQuantity: number;
  maxQuantity: number;
  providerServiceId: string;
  speed: string;
  type: 'default' | 'custom_comments' | 'package';
  active: boolean;
  isAvailable?: boolean; // When false, item is visible in catalog but labeled 'غير متوفر ومينفعش يطلب' with disabled order
  isOffer?: boolean;
  originalPriceBeforeDiscount?: number;
  discountPercent?: number;
  isAccountSale?: boolean;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'partial' | 'canceled' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  username: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  link: string;
  quantity: number;
  charge: number;
  startCount: number;
  remains: number;
  status: OrderStatus;
  providerOrderId: string | null;
  providerStatus: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'deposit' | 'order_charge' | 'order_refund' | 'admin_adjustment';

export interface Transaction {
  id: string;
  transactionNumber: string;
  userId: string;
  username: string;
  type: TransactionType;
  amount: number; // positive for deposit/refund, negative for order_charge
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string; // Order ID or Deposit ID
  description: string;
  createdAt: string;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';

export interface DepositRequest {
  id: string;
  depositNumber: string;
  userId: string;
  username: string;
  userEmail: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  senderAccountOrNumber: string;
  transactionProof: string;
  referenceCode: string;
  status: DepositStatus;
  adminNotes: string | null;
  processedBy: string | null;
  createdAt: string;
  processedAt: string | null;
  isRefund?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  category: 'wallet' | 'crypto' | 'bank' | 'card';
  instructions: string;
  accountNumberOrDetails: string;
  currency: string;
  minDeposit: number;
  maxDeposit: number;
  feePercentage: number;
  isActive: boolean;
  icon: string;
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'answered' | 'customer_reply' | 'closed';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  username: string;
  userEmail: string;
  subject: string;
  category: 'order' | 'payment' | 'service' | 'general';
  priority: TicketPriority;
  status: TicketStatus;
  relatedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface ProviderSettings {
  apiUrl: string;
  apiKey: string;
  isTestMode: boolean; // if true, simulates real responses cleanly
  autoForwardOrders: boolean;
  mockLatencyMs: number;
  balance: number;
  currency: string;
  lastTestedAt: string | null;
  lastTestStatus: 'success' | 'failed' | null;
  lastTestMessage: string | null;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalUserBalances: number;
  pendingDepositsCount: number;
  pendingDepositsAmount: number;
  openTicketsCount: number;
}

export type NotificationType =
  | 'registration'
  | 'deposit_approved'
  | 'deposit_rejected'
  | 'order_confirmed'
  | 'order_status'
  | 'announcement'
  | 'balance_adjusted'
  | 'admin_order_alert'
  | 'admin_alert'
  | 'customer_phone_sms'
  | 'verification'
  | 'password_reset'
  | 'account_security';

export interface AppNotification {
  id: string;
  userId: string | 'all';
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface EmailNotification {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  status: 'sent' | 'delivered';
  eventType: NotificationType;
  sentAt: string;
}



export interface SmsNotification {
  id: string;
  recipientPhoneOrEmail: string;
  recipientName: string;
  recipientRole: 'admin' | 'user';
  message: string;
  status: 'sent' | 'delivered';
  channel: 'SMS' | 'WhatsApp';
  referenceOrderId?: string;
  sentAt: string;
}
