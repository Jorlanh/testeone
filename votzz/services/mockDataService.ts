
import { Assembly, AssemblyStatus, AuditLog, User, UserRole, Vote, VoteType, VotePrivacy, ChatMessage, BlogPost, Poll, Announcement, GovernanceActivity, CommonArea, Booking, BookingStatus } from '../types';

// Mock Initial State
const USERS: User[] = [
  { id: '1', name: 'Administrador Síndico', email: 'admin@condo.com', cpf: '123.456.789-00', role: UserRole.MANAGER, phone: '11999999999', unit: 'ADM', fraction: 0 },
  { id: '2', name: 'João Morador (Cobertura)', email: 'joao@condo.com', cpf: '234.567.890-11', role: UserRole.USER, phone: '11988888888', unit: '101-A', fraction: 0.0250 }, // 2.5%
  { id: '3', name: 'Maria Conselheira', email: 'maria@condo.com', cpf: '345.678.901-22', role: UserRole.USER, phone: '11977777777', unit: '202-B', fraction: 0.0150 }, // 1.5%
];

const ASSEMBLIES: Assembly[] = [
  {
    id: 'a1',
    title: 'Aprovação de Reforma da Fachada',
    description: 'Votação para aprovar o orçamento da empresa PaintPlus para pintura e reparo da fachada leste.',
    type: 'AGE',
    status: AssemblyStatus.OPEN,
    startDate: new Date(Date.now() - 86400000).toISOString(), 
    endDate: new Date(Date.now() + 86400000).toISOString(), 
    quorumType: 'SIMPLE',
    voteType: VoteType.YES_NO_ABSTAIN,
    votePrivacy: VotePrivacy.OPEN, 
    options: [
      { id: 'opt1', label: 'Sim' },
      { id: 'opt2', label: 'Não' },
      { id: 'opt3', label: 'Abstenção' }
    ],
    documents: ['orcamento_paintplus.pdf', 'parecer_tecnico.pdf'],
    votes: [],
    chat: [
      { id: 'c1', userId: '2', userName: 'João Morador', content: 'O valor está dentro do mercado?', timestamp: new Date(Date.now() - 40000).toISOString() },
      { id: 'c2', userId: '1', userName: 'Administrador Síndico', content: 'Sim, João. Cotamos com 3 empresas.', timestamp: new Date(Date.now() - 20000).toISOString() }
    ],
    createdBy: '1',
    convocation: {
        channel: 'EMAIL',
        sentAt: new Date(Date.now() - 172800000).toISOString(),
        recipientCount: 45,
        confirmedReadCount: 38
    }
  }
];

const AUDIT_LOGS: AuditLog[] = [
  { id: 'l1', action: 'LOGIN', details: 'User 1 logged in via 2FA', userId: '1', timestamp: new Date().toISOString(), hash: 'sha256-init-hash' }
];

const POLLS: Poll[] = [
  {
    id: 'p1',
    title: 'Compra de novas espreguiçadeiras',
    description: 'Aprovação de compra de 4 espreguiçadeiras para a piscina (Valor: R$ 1.200,00).',
    targetAudience: 'COUNCIL',
    status: 'OPEN',
    endDate: new Date(Date.now() + 172800000).toISOString(),
    options: [{ id: '1', label: 'Aprovar' }, { id: '2', label: 'Rejeitar' }],
    votes: [],
    createdBy: '1'
  },
];

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc1',
    title: 'Manutenção do Elevador Social',
    content: 'Informamos que o elevador social passará por manutenção preventiva nesta quarta-feira, das 14h às 16h.',
    date: new Date(Date.now() - 86400000).toISOString(),
    priority: 'HIGH',
    targetType: 'ALL',
    requiresConfirmation: true,
    readBy: ['2']
  },
];

const COMMON_AREAS: CommonArea[] = [
  {
    id: 'area1',
    name: 'Salão de Festas Master',
    type: 'PARTY_ROOM',
    capacity: 80,
    description: 'Espaço climatizado com cozinha completa, mesas, cadeiras e sistema de som.',
    rules: 'Proibido som alto após as 22h. Entregar limpo ou contratar taxa de limpeza.',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
    price: 150.00,
    requiresApproval: true,
    minTimeBlock: 4,
    maxTimeBlock: 8,
    cleaningInterval: 2,
    openTime: '09:00',
    closeTime: '23:59'
  },
  {
    id: 'area2',
    name: 'Churrasqueira da Piscina',
    type: 'BBQ',
    capacity: 20,
    description: 'Área externa coberta com churrasqueira, pia e frigobar. Acesso à piscina não exclusivo.',
    rules: 'Vidros proibidos na área da piscina.',
    imageUrl: 'https://images.unsplash.com/photo-1555243896-c709bfa0b564?auto=format&fit=crop&q=80&w=800',
    price: 50.00,
    requiresApproval: false,
    minTimeBlock: 2,
    maxTimeBlock: 6,
    cleaningInterval: 1,
    openTime: '10:00',
    closeTime: '22:00'
  },
  {
    id: 'area3',
    name: 'Quadra Poliesportiva',
    type: 'COURT',
    capacity: 12,
    description: 'Quadra oficial para futsal, vôlei e basquete.',
    rules: 'Uso de calçado adequado obrigatório.',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe436cd7?auto=format&fit=crop&q=80&w=800',
    price: 0,
    requiresApproval: false,
    minTimeBlock: 1,
    maxTimeBlock: 2,
    cleaningInterval: 0,
    openTime: '08:00',
    closeTime: '22:00'
  }
];

const BOOKINGS: Booking[] = [
  {
    id: 'bk1',
    areaId: 'area1',
    userId: '2',
    unit: '101-A',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    startTime: '14:00',
    endTime: '20:00',
    status: 'APPROVED',
    totalPrice: 150.00,
    createdAt: new Date().toISOString()
  }
];

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'como-aumentar-quorum-assembleias',
    title: '5 Estratégias para aumentar o quórum em assembleias de condomínio',
    excerpt: 'Descubra como a tecnologia e a comunicação assertiva podem transformar a participação dos moradores nas decisões importantes.',
    content: `...`, 
    author: 'Ana Souza',
    date: '2023-10-15T10:00:00Z',
    category: 'Gestão',
    imageUrl: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=1000',
    tags: ['Assembleia', 'Tecnologia', 'Síndico']
  }
];

// Helper to simulate hash generation
const generateHash = (input: string) => {
  let hash = 0, i, chr;
  if (input.length === 0) return hash.toString();
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

export const MockService = {
  login: async (email: string) => {
    return USERS.find(u => u.email === email) || USERS[1]; 
  },

  getAssemblies: async () => {
    return [...ASSEMBLIES];
  },

  getAssemblyById: async (id: string) => {
    return ASSEMBLIES.find(a => a.id === id);
  },

  createAssembly: async (assembly: Partial<Assembly>) => {
    const newAssembly: Assembly = {
      ...assembly as Assembly,
      id: Math.random().toString(36).substr(2, 9),
      votes: [],
      chat: [],
      status: AssemblyStatus.OPEN,
      convocation: {
          channel: 'APP',
          sentAt: new Date().toISOString(),
          recipientCount: USERS.length - 1,
          confirmedReadCount: 0
      }
    };
    ASSEMBLIES.push(newAssembly);
    
    // Log creation
    AUDIT_LOGS.push({
        id: Math.random().toString(36),
        action: 'ASSEMBLY_CREATED',
        details: `Created assembly ${newAssembly.id} type ${newAssembly.type}`,
        userId: assembly.createdBy || 'system',
        timestamp: new Date().toISOString(),
        hash: generateHash(`creation-${newAssembly.id}`)
    });
    
    return newAssembly;
  },

  castVote: async (assemblyId: string, userId: string, optionId: string, userIp: string = '192.168.1.1') => {
    const assembly = ASSEMBLIES.find(a => a.id === assemblyId);
    if (!assembly) throw new Error("Assembleia não encontrada");
    if (assembly.status === AssemblyStatus.CLOSED) throw new Error("Votação encerrada.");

    const user = USERS.find(u => u.id === userId);
    if (!user) throw new Error("Usuário inválido.");

    // Check double vote
    if (assembly.votes.some(v => v.userId === userId)) {
      throw new Error("Usuário já votou nesta assembleia.");
    }

    const vote: Vote = {
      id: Math.random().toString(36).substr(2, 9),
      assemblyId,
      userId,
      unit: user.unit || 'Unknown',
      fraction: user.fraction,
      optionId,
      timestamp: new Date().toISOString(),
      ipAddress: userIp,
      hash: generateHash(`${assemblyId}-${userId}-${optionId}-${Date.now()}`)
    };

    assembly.votes.push(vote);

    AUDIT_LOGS.push({
      id: Math.random().toString(36),
      action: 'VOTE_CAST',
      details: `Vote cast in assembly ${assemblyId} by user ${userId} with fraction ${user.fraction}`,
      userId,
      timestamp: new Date().toISOString(),
      hash: vote.hash
    });

    return vote;
  },

  // Close Assembly and Generate Legal Minutes (Ata)
  closeAssembly: async (assemblyId: string, managerId: string) => {
      const assembly = ASSEMBLIES.find(a => a.id === assemblyId);
      if (!assembly) throw new Error("Assembleia não encontrada");
      
      assembly.status = AssemblyStatus.CLOSED;

      // Calculate Results
      const results = assembly.options.map(opt => {
          const votes = assembly.votes.filter(v => v.optionId === opt.id);
          const count = votes.length;
          const fractionTotal = votes.reduce((acc, v) => acc + v.fraction, 0);
          return { label: opt.label, count, fractionTotal };
      });
      
      // Determine winner
      const winner = results.sort((a,b) => b.count - a.count)[0];

      // Generate Minutes Text (Legal Format)
      const minutesText = `
ATA DA ASSEMBLEIA GERAL ${assembly.type} DO CONDOMÍNIO (ID: ${assembly.id})

Aos ${new Date().toLocaleDateString()} dias, encerrou-se a votação eletrônica referente à convocação enviada em ${new Date(assembly.convocation.sentAt).toLocaleDateString()}.

A assembleia foi realizada na modalidade VIRTUAL, em conformidade com o Art. 1.354-A do Código Civil Brasileiro.

1. DA CONVOCAÇÃO
Foi comprovado o envio de notificação a ${assembly.convocation.recipientCount} unidades.

2. DO QUÓRUM
Estiveram presentes (votantes) ${assembly.votes.length} unidades, representando uma fração ideal total de ${assembly.votes.reduce((acc,v) => acc + v.fraction, 0).toFixed(4)}.

3. DA ORDEM DO DIA: "${assembly.title}"
${assembly.description}

4. DA VOTAÇÃO
O sistema registrou votos criptografados e auditáveis, com o seguinte resultado:
${results.map(r => `- ${r.label}: ${r.count} votos (${(r.fractionTotal * 100).toFixed(2)}% da fração ideal)`).join('\n')}

5. DA DELIBERAÇÃO
Com base nos votos válidos, foi APROVADA a opção: ${winner.label}.

A presente ata é gerada automaticamente pelo sistema Votzz, com hash de integridade SHA-256.

Assinado digitalmente pelo Presidente da Mesa / Síndico.
      `;

      assembly.minutes = {
          generatedAt: new Date().toISOString(),
          content: minutesText.trim(),
          signedByManager: true,
          signatureHash: generateHash(minutesText)
      };

      AUDIT_LOGS.push({
        id: Math.random().toString(36),
        action: 'ASSEMBLY_CLOSED',
        details: `Assembly ${assemblyId} closed. Minutes generated.`,
        userId: managerId,
        timestamp: new Date().toISOString(),
        hash: assembly.minutes.signatureHash
      });

      return assembly;
  },

  postChatMessage: async (assemblyId: string, userId: string, userName: string, content: string) => {
    const assembly = ASSEMBLIES.find(a => a.id === assemblyId);
    if (!assembly) return;
    assembly.chat.push({
      id: Math.random().toString(36),
      userId,
      userName,
      content,
      timestamp: new Date().toISOString()
    });
  },

  getAuditLogs: async () => {
    return [...AUDIT_LOGS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getBlogPosts: async () => {
    return [...BLOG_POSTS];
  },

  getBlogPostBySlug: async (slug: string) => {
    return BLOG_POSTS.find(p => p.slug === slug);
  },

  getPolls: async () => {
    return [...POLLS];
  },

  createPoll: async (poll: Partial<Poll>) => {
    const newPoll: Poll = {
       ...poll as Poll,
       id: Math.random().toString(36).substr(2, 9),
       votes: [],
       status: 'OPEN'
    };
    POLLS.push(newPoll);
    return newPoll;
  },

  votePoll: async (pollId: string, userId: string, optionId: string) => {
    const poll = POLLS.find(p => p.id === pollId);
    if (!poll) throw new Error("Enquete não encontrada");
    if (poll.votes.some(v => v.userId === userId)) throw new Error("Já votou nesta enquete");
    poll.votes.push({ userId, optionId });
    return true;
  },

  getAnnouncements: async () => {
    return [...ANNOUNCEMENTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  markAnnouncementRead: async (announcementId: string, userId: string) => {
    const ann = ANNOUNCEMENTS.find(a => a.id === announcementId);
    if (ann && !ann.readBy.includes(userId)) {
      ann.readBy.push(userId);
    }
  },

  createAnnouncement: async (ann: Partial<Announcement>) => {
     const newAnn: Announcement = {
         ...ann as Announcement,
         id: Math.random().toString(36).substr(2, 9),
         readBy: [],
         date: new Date().toISOString(),
         requiresConfirmation: ann.requiresConfirmation || false
     };
     ANNOUNCEMENTS.unshift(newAnn);
     return newAnn;
  },

  getGovernanceActivity: async () => {
    const activities: GovernanceActivity[] = [
       ...ASSEMBLIES.map(a => ({ id: a.id, type: 'VOTE' as const, description: `Assembleia Criada: ${a.title}`, date: a.startDate, user: 'Sistema' })),
       ...POLLS.map(p => ({ id: p.id, type: 'POLL' as const, description: `Enquete: ${p.title}`, date: p.endDate, user: 'Síndico' })),
       ...ANNOUNCEMENTS.map(a => ({ id: a.id, type: 'COMMUNICATION' as const, description: `Comunicado: ${a.title}`, date: a.date, user: 'Administração' })),
       ...BOOKINGS.map(b => ({ id: b.id, type: 'BOOKING' as const, description: `Reserva: ${COMMON_AREAS.find(c => c.id === b.areaId)?.name}`, date: b.createdAt, user: b.unit }))
    ];
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // FACILITIES / COMMON AREAS METHODS

  getCommonAreas: async () => {
    return [...COMMON_AREAS];
  },

  getBookings: async (areaId?: string) => {
    if (areaId) {
      return BOOKINGS.filter(b => b.areaId === areaId);
    }
    return [...BOOKINGS];
  },

  createBooking: async (booking: Partial<Booking>) => {
    // 1. Check Conflicts
    const conflict = BOOKINGS.find(b => 
      b.areaId === booking.areaId && 
      b.date === booking.date &&
      b.status !== 'CANCELLED' && 
      b.status !== 'REJECTED' &&
      (
        (booking.startTime! >= b.startTime && booking.startTime! < b.endTime) ||
        (booking.endTime! > b.startTime && booking.endTime! <= b.endTime) ||
        (booking.startTime! <= b.startTime && booking.endTime! >= b.endTime)
      )
    );

    if (conflict) {
      throw new Error("Horário indisponível. Conflito com outra reserva.");
    }

    const area = COMMON_AREAS.find(a => a.id === booking.areaId);
    if (!area) throw new Error("Área não encontrada");

    const newBooking: Booking = {
      ...booking as Booking,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: area.requiresApproval ? 'PENDING' : 'APPROVED', // Auto-approval logic
      totalPrice: area.price
    };

    BOOKINGS.push(newBooking);

    // Audit Log
    AUDIT_LOGS.push({
      id: Math.random().toString(36),
      action: 'BOOKING_CREATED',
      details: `Reserva para ${area.name} em ${newBooking.date}`,
      userId: newBooking.userId,
      timestamp: new Date().toISOString(),
      hash: generateHash(newBooking.id)
    });

    return newBooking;
  },

  updateBookingStatus: async (bookingId: string, status: BookingStatus, managerId: string) => {
    const booking = BOOKINGS.find(b => b.id === bookingId);
    if (!booking) throw new Error("Reserva não encontrada");

    booking.status = status;
    if (status === 'APPROVED') {
      booking.approvedBy = managerId;
    }

    AUDIT_LOGS.push({
      id: Math.random().toString(36),
      action: `BOOKING_${status}`,
      details: `Reserva ${bookingId} atualizada para ${status}`,
      userId: managerId,
      timestamp: new Date().toISOString(),
      hash: generateHash(booking.id + status)
    });

    return booking;
  }
};
