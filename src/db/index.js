import Dexie from 'dexie';

export const db = new Dexie('YoSaccoDB');

db.version(1).stores({
  saccos:       '++id, name, program, district, parish, status, createdAt',
  members:      '++id, saccoId, name, nin, phone, status, joinedAt',
  savings:      '++id, memberId, saccoId, amount, type, date, notes',
  shares:       '++id, memberId, saccoId, quantity, amount, date',
  loans:        '++id, memberId, saccoId, amount, interestRate, purpose, status, appliedAt, approvedAt, dueDate',
  repayments:   '++id, loanId, memberId, saccoId, amount, date, notes',
  transactions: '++id, saccoId, type, amount, description, userId, createdAt',
  users:        '++id, saccoId, name, role, pin, createdAt',
  alerts:       '++id, saccoId, type, message, resolved, createdAt',
});

// ─── Helpers ───────────────────────────────────────────────────────────────

export async function getSaccoStats(saccoId) {
  const [members, savings, loans, repayments, shares] = await Promise.all([
    db.members.where({ saccoId, status: 'active' }).count(),
    db.savings.where({ saccoId }).toArray(),
    db.loans.where({ saccoId }).toArray(),
    db.repayments.where({ saccoId }).toArray(),
    db.shares.where({ saccoId }).toArray(),
  ]);

  const totalSavings   = savings.reduce((s, r) => s + r.amount, 0);
  const totalShares    = shares.reduce((s, r) => s + r.amount, 0);
  const activeLoans    = loans.filter(l => l.status === 'active' || l.status === 'approved');
  const totalLent      = activeLoans.reduce((s, l) => s + l.amount, 0);
  const totalRepaid    = repayments.reduce((s, r) => s + r.amount, 0);
  const totalPool      = totalSavings + totalShares;
  const available      = totalPool - totalLent + totalRepaid;

  return { members, totalSavings, totalShares, totalPool, totalLent, totalRepaid, available, activeLoans: activeLoans.length };
}

export async function getMemberBalance(memberId) {
  const [savings, shares, loans, repayments] = await Promise.all([
    db.savings.where({ memberId }).toArray(),
    db.shares.where({ memberId }).toArray(),
    db.loans.where({ memberId }).toArray(),
    db.repayments.where({ memberId }).toArray(),
  ]);
  const totalSavings = savings.reduce((s, r) => s + r.amount, 0);
  const totalShares  = shares.reduce((s, r) => s + r.amount, 0);
  const activeLoans  = loans.filter(l => ['active','approved','pending'].includes(l.status));
  const totalOwed    = activeLoans.reduce((s, l) => s + l.amount, 0);
  const totalRepaid  = repayments.reduce((s, r) => s + r.amount, 0);
  return { totalSavings, totalShares, totalOwed, totalRepaid, activeLoans };
}

export function formatUGX(amount) {
  if (!amount && amount !== 0) return 'UGX 0';
  return 'UGX ' + Math.round(amount).toLocaleString('en-UG');
}

export function programLabel(p) {
  return { emyooga: 'Emyooga', pdm: 'PDM', owc: 'OWC' }[p] || p;
}

export function programColor(p) {
  return { emyooga: '#7C3AED', pdm: '#16A34A', owc: '#D97706' }[p] || '#6B7280';
}

export function programBg(p) {
  return { emyooga: '#F5F3FF', pdm: '#F0FDF4', owc: '#FFFBEB' }[p] || '#F9FAFB';
}

export function loanStatusColor(s) {
  return { pending:'#F59E0B', approved:'#3B82F6', active:'#16A34A', completed:'#6B7280', rejected:'#DC2626', overdue:'#DC2626' }[s] || '#6B7280';
}

// Seed demo SACCO if DB empty
export async function seedDemoData() {
  const count = await db.saccos.count();
  if (count > 0) return;

  const saccoId = await db.saccos.add({
    name: 'Nakawa Traders Emyooga SACCO',
    program: 'emyooga',
    district: 'Kampala',
    parish: 'Nakawa',
    constituency: 'Nakawa',
    enterprise: 'Market Vendors',
    status: 'active',
    chairperson: 'Grace Namukasa',
    treasurer: 'James Okello',
    secretary: 'Faith Apio',
    phone: '0772123456',
    registrationNo: 'EMY/KLA/2021/0045',
    latitude: 0.3163,
    longitude: 32.6079,
    createdAt: new Date('2021-06-15').toISOString(),
  });

  const memberData = [
    { name: 'Grace Namukasa', nin: 'CM87001200XYA', phone: '0772100001', role: 'chairperson' },
    { name: 'James Okello',   nin: 'CM87002300YZB', phone: '0772100002', role: 'treasurer' },
    { name: 'Faith Apio',     nin: 'CM87003400ZAC', phone: '0772100003', role: 'secretary' },
    { name: 'Robert Ssekandi',nin: 'CM87004500ABD', phone: '0772100004', role: 'member' },
    { name: 'Scovia Namutebi',nin: 'CM87005600BCE', phone: '0772100005', role: 'member' },
    { name: 'Patrick Ochieng',nin: 'CM87006700CDF', phone: '0772100006', role: 'member' },
  ];

  const memberIds = [];
  for (const m of memberData) {
    const id = await db.members.add({ ...m, saccoId, status: 'active', joinedAt: new Date('2021-07-01').toISOString() });
    memberIds.push(id);
  }

  // Seed savings
  for (let i = 0; i < memberIds.length; i++) {
    await db.savings.add({ memberId: memberIds[i], saccoId, amount: 150000 + i * 25000, type: 'deposit', date: '2024-01-15', notes: 'Monthly savings Jan' });
    await db.savings.add({ memberId: memberIds[i], saccoId, amount: 150000 + i * 25000, type: 'deposit', date: '2024-02-15', notes: 'Monthly savings Feb' });
    await db.shares.add({ memberId: memberIds[i], saccoId, quantity: 2, amount: 200000, date: '2021-07-01' });
  }

  // Seed a loan
  const loanId = await db.loans.add({
    memberId: memberIds[3], saccoId, amount: 500000, interestRate: 10,
    purpose: 'Stock for market stall', status: 'active',
    appliedAt: '2024-01-20', approvedAt: '2024-01-22',
    dueDate: '2024-07-22', cropCycle: null,
  });
  await db.repayments.add({ loanId, memberId: memberIds[3], saccoId, amount: 100000, date: '2024-02-22', notes: 'First instalment' });

  // Seed alerts
  await db.alerts.add({ saccoId, type: 'warning', message: 'Robert Ssekandi has missed 1 repayment instalment', resolved: false, createdAt: new Date().toISOString() });
  await db.alerts.add({ saccoId, type: 'info', message: 'Monthly savings deadline in 3 days — 6 members pending', resolved: false, createdAt: new Date().toISOString() });

  console.log('Demo data seeded');
}
