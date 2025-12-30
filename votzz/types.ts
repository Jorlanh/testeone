// src/types.ts

export type UserRole = 'ADMIN' | 'SINDICO' | 'ADM_CONDO' | 'MORADOR' | 'AFILIADO' | 'MANAGER';

// Login Request
export interface LoginRequest {
  login: string; // Pode ser email ou CPF
  password: string;
}

// Interface principal do Usuário (Usada no Contexto e Components)
export interface User {
  id: string;
  nome: string;      
  name: string;      // Compatibilidade
  email: string;
  cpf?: string;      
  
  // Dados de Unidade
  unidade?: string;  
  unit?: string;     
  bloco?: string;    
  block?: string;    // Compatibilidade
  
  whatsapp: string;
  phone?: string;    
  role: UserRole;
  tenantId?: string | null;
  fraction?: number;
}

// Resposta do Login (TEM QUE BATER COM O DTO DO JAVA)
export interface LoginResponse {
  token: string;
  type?: string;     
  id: string;        
  nome: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  
  // [NOVO] Campos essenciais para o Layout exibir "Bl. X - Ap. Y"
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
  AGENDADA = 'AGENDADA'
}

// --- Interfaces de Negócio ---
export interface Assembly {
  id: string;
  title: string;
  titulo?: string;
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