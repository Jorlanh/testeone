// src/types.ts

export type UserRole = 'ADMIN' | 'SINDICO' | 'ADM_CONDO' | 'MORADOR' | 'AFILIADO' | 'MANAGER';

export interface User {
  id: string;
  nome: string;      // Backend Java
  name: string;      // Compatibilidade Frontend antigo
  email: string;
  cpf: string;
  unidade?: string;  // Backend Java
  unit?: string;     // Compatibilidade Frontend antigo
  whatsapp: string;
  phone?: string;    // Compatibilidade
  role: UserRole;
  tenantId?: string | null;
  fraction?: number;
}

export interface LoginResponse {
  token: string;
  nome: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

// --- NEGÓCIO E GOVERNANÇA ---
export enum VoteType {
  YES_NO_ABSTAIN = 'YES_NO_ABSTAIN',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CUSTOM = 'CUSTOM'
}

export enum VotePrivacy {
  OPEN = 'OPEN',
  SECRET = 'SECRET'
}

export enum AssemblyStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  AGENDADA = 'AGENDADA'
}

export interface Assembly {
  id: string;
  title: string;
  titulo?: string; // Backend
  description: string;
  status: AssemblyStatus;
  startDate: string;
  endDate: string;
  voteType?: VoteType;
  votePrivacy?: VotePrivacy;
  options?: { id: string; label: string }[];
  votes?: any[];
  pollVotes?: any[];
  pollOptions?: any[];
  linkVideoConferencia?: string;
}

export interface CommonArea {
  id: string;
  name: string;
  capacity: number;
  price: number;
  imageUrl: string;
  openTime: string;
  closeTime: string;
  description: string;
  rules?: string;
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  areaId: string;
  userId: string;
  unit: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  createdAt?: string;
}

export interface AdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  mrr: number;
}

export interface AffiliateDashboardDTO {
  saldoDisponivel: number;
  saldoFuturo: number;
  linkIndicacao: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  details: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
  targetAudience: 'ALL' | 'COUNCIL';
  votes: { userId: string; optionId: string }[];
  options: { id: string; label: string }[];
  endDate: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  targetType: 'ALL' | 'BLOCK' | 'UNIT' | 'GROUP';
  targetValue?: string;
  readBy: string[];
  requiresConfirmation: boolean;
}

export interface GovernanceActivity {
  id: string;
  type: 'VOTE' | 'POLL' | 'DOC' | 'COMMUNICATION' | 'BOOKING';
  description: string;
  date: string;
  user: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  imageUrl: string;
  tags: string[];
}