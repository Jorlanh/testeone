// src/types.ts - ATUALIZADO
export type UserRole = 'ADMIN' | 'SINDICO' | 'ADM_CONDO' | 'MORADOR' | 'AFILIADO' | 'MANAGER';

// Login Request
export interface LoginRequest {
  login: string; // Pode ser email ou CPF
  password: string;
}

// Interface principal do Usuário
export interface User {
  id: string;
  nome: string;      
  name: string;      
  email: string;
  cpf?: string;      
  unidade?: string;  
  unit?: string;     
  bloco?: string;    
  block?: string;    
  whatsapp: string;
  phone?: string;    
  role: UserRole;
  tenantId?: string | null;
  fraction?: number;
  is2faEnabled?: boolean;
}

// Resposta do Login
export interface LoginResponse {
  token: string;
  type?: string;     
  id: string;        
  nome: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  bloco?: string;
  unidade?: string;
  cpf?: string;
}

// Auth Context
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

// --- Enumerações de Negócio ---
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
  AGENDADA = 'AGENDADA',
  SCHEDULED = 'SCHEDULED'
}

// --- Interfaces de Negócio ---
export interface Assembly {
  id: string;
  title: string;
  titulo?: string;
  description: string;
  status: AssemblyStatus;
  startDate: string;
  dataInicio?: string;
  endDate: string;
  dataFim?: string;
  voteType?: VoteType;
  votePrivacy?: VotePrivacy;
  options?: { id: string; label: string }[];
  votes?: any[];
  pollVotes?: any[];
  pollOptions?: any[];
  linkVideoConferencia?: string;
  youtubeLiveUrl?: string; 
  attachments?: string[]; 
}

export interface AdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  onlineUsers: number;
  mrr: number;
  latencyMs?: number; // Para o monitoramento de lag
}

export interface GovernanceActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  date: string;
  author: string;
  excerpt?: string;
  image?: string;
  category?: string;
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