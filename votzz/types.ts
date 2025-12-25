
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', // Síndico
  USER = 'USER' // Condômino/Membro
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  unit?: string; // Apartamento/Cota
  fraction: number; // Fração Ideal (ex: 0.0155 para 1.55%)
  role: UserRole;
  phone: string;
}

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
  CLOSED = 'CLOSED'
}

export interface VoteOption {
  id: string;
  label: string;
}

export interface Vote {
  id: string;
  assemblyId: string;
  userId: string;
  unit: string;
  fraction: number; // Snapshot of fraction at moment of vote
  optionId: string;
  timestamp: string;
  hash: string; // SHA-256 equivalent for audit
  ipAddress: string;
  signature?: string; // Digital signature placeholder
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface ConvocationLog {
  channel: 'EMAIL' | 'WHATSAPP' | 'APP';
  sentAt: string;
  recipientCount: number;
  confirmedReadCount: number;
}

export interface AssemblyMinutes {
  generatedAt: string;
  content: string; // The text of the minutes
  signedByManager: boolean;
  signatureHash: string;
}

export interface Assembly {
  id: string;
  title: string;
  description: string;
  type: string; // AGO, AGE, etc.
  status: AssemblyStatus;
  startDate: string;
  endDate: string;
  quorumType: 'SIMPLE' | 'ABSOLUTE' | 'QUALIFIED_2_3' | 'UNANIMITY';
  voteType: VoteType;
  votePrivacy: VotePrivacy; 
  options: VoteOption[]; 
  documents: string[]; 
  votes: Vote[];
  chat: ChatMessage[];
  createdBy: string;
  convocation: ConvocationLog; // Legal requirement
  minutes?: AssemblyMinutes; // The final document
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  timestamp: string;
  hash: string; // Chained hash
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

// Governance Digital Types

export interface Poll {
  id: string;
  title: string;
  description: string;
  targetAudience: 'ALL' | 'COUNCIL'; // Todos ou Só Conselho
  status: 'OPEN' | 'CLOSED';
  options: VoteOption[];
  votes: { userId: string; optionId: string }[];
  endDate: string;
  createdBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  targetType: 'ALL' | 'BLOCK' | 'UNIT' | 'GROUP'; // Segmentation
  targetValue?: string; // e.g., "Block A", "Unit 101", "Council"
  requiresConfirmation: boolean;
  readBy: string[]; // User IDs
}

export interface GovernanceActivity {
  id: string;
  type: 'VOTE' | 'POLL' | 'DOC' | 'COMMUNICATION' | 'BOOKING';
  description: string;
  date: string;
  user: string;
}

// Module: Common Areas & Scheduling

export type AreaType = 'PARTY_ROOM' | 'BBQ' | 'GYM' | 'POOL' | 'COURT' | 'MEETING' | 'OTHER';

export interface CommonArea {
  id: string;
  name: string;
  type: AreaType;
  capacity: number;
  description: string;
  rules: string;
  imageUrl: string;
  price: number; // 0 for free
  requiresApproval: boolean;
  minTimeBlock: number; // in hours
  maxTimeBlock: number; // in hours
  cleaningInterval: number; // in hours
  openTime: string; // "08:00"
  closeTime: string; // "23:00"
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  areaId: string;
  userId: string;
  unit: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  totalPrice: number;
  createdAt: string;
  approvedBy?: string; // Manager ID
}
