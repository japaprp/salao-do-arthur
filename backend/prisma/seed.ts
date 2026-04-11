import { AppointmentStatus, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'salao-da-lu' },
    update: {
      name: 'Salão da Lu Demo',
      locale: 'pt-BR',
    },
    create: {
      name: 'Salão da Lu Demo',
      subdomain: 'salao-da-lu',
      locale: 'pt-BR',
    },
  });

  const managerUser = await upsertUser({
    email: 'gestora.demo@salaodaluu.app',
    name: 'Lu Gestora',
    password: 'Gestora123!',
    role: UserRole.MANAGER,
    tenantId: tenant.id,
    phone: '5511990000001',
  });

  const professionalUserA = await upsertUser({
    email: 'camila.profissional@salaodaluu.app',
    name: 'Camila Costa',
    password: 'Profissional123!',
    role: UserRole.PROFESSIONAL,
    tenantId: tenant.id,
    phone: '5511990000002',
  });

  const professionalUserB = await upsertUser({
    email: 'renata.profissional@salaodaluu.app',
    name: 'Renata Alves',
    password: 'Profissional123!',
    role: UserRole.PROFESSIONAL,
    tenantId: tenant.id,
    phone: '5511990000003',
  });

  const clientUser = await upsertUser({
    email: 'cliente.demo@salaodaluu.app',
    name: 'Maria Oliveira',
    password: 'Cliente123!',
    role: UserRole.CLIENT,
    tenantId: tenant.id,
    phone: '5511990000004',
  });

  const professionalA = await prisma.professional.upsert({
    where: { userId: professionalUserA.id },
    update: {
      tenantId: tenant.id,
      specialty: 'Coloração e transformação',
      commissionPercent: 45,
      active: true,
    },
    create: {
      userId: professionalUserA.id,
      tenantId: tenant.id,
      specialty: 'Coloração e transformação',
      commissionPercent: 45,
      active: true,
    },
  });

  const professionalB = await prisma.professional.upsert({
    where: { userId: professionalUserB.id },
    update: {
      tenantId: tenant.id,
      specialty: 'Corte e finalização',
      commissionPercent: 40,
      active: true,
    },
    create: {
      userId: professionalUserB.id,
      tenantId: tenant.id,
      specialty: 'Corte e finalização',
      commissionPercent: 40,
      active: true,
    },
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {
      tenantId: tenant.id,
      loyaltyPoints: 180,
      lifetimeValue: 980,
      favoriteProfessionalId: professionalA.id,
      preferences: {
        beverage: 'cappuccino',
        fragrance: 'floral suave',
      },
    },
    create: {
      userId: clientUser.id,
      tenantId: tenant.id,
      loyaltyPoints: 180,
      lifetimeValue: 980,
      favoriteProfessionalId: professionalA.id,
      preferences: {
        beverage: 'cappuccino',
        fragrance: 'floral suave',
      },
    },
  });

  const loyaltyWallet = await prisma.loyaltyWallet.upsert({
    where: { clientId: client.id },
    update: {
      tenantId: tenant.id,
      pointsBalance: 240,
    },
    create: {
      tenantId: tenant.id,
      clientId: client.id,
      pointsBalance: 240,
    },
  });

  const corteGlow = await upsertService({
    tenantId: tenant.id,
    name: 'Corte Glow',
    description: 'Corte, lavagem e finalização premium.',
    durationMinutes: 60,
    price: 120,
  });

  const coloracaoPremium = await upsertService({
    tenantId: tenant.id,
    name: 'Coloração Premium',
    description: 'Coloração com tratamento e escova.',
    durationMinutes: 90,
    price: 260,
  });

  await prisma.loyaltyTransaction.deleteMany({
    where: {
      walletId: loyaltyWallet.id,
      reason: {
        startsWith: '[seed]',
      },
    },
  });

  await prisma.loyaltyTransaction.createMany({
    data: [
      {
        walletId: loyaltyWallet.id,
        points: 120,
        type: 'EARNED',
        reason: '[seed] Agendamento concluído no pacote premium',
      },
      {
        walletId: loyaltyWallet.id,
        points: -40,
        type: 'REDEEMED',
        reason: '[seed] Resgate em ampola personalizada',
      },
      {
        walletId: loyaltyWallet.id,
        points: 60,
        type: 'EARNED',
        reason: '[seed] Compra de home care',
      },
    ],
  });

  await prisma.appointment.deleteMany({
    where: {
      tenantId: tenant.id,
      notes: {
        startsWith: '[seed]',
      },
    },
  });

  const tomorrowTenAm = nextBusinessDayAt(10, 0);
  const tomorrowTwoPm = nextBusinessDayAt(14, 0);

  await prisma.appointment.createMany({
    data: [
      {
        tenantId: tenant.id,
        clientId: client.id,
        professionalId: professionalA.id,
        serviceId: coloracaoPremium.id,
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: tomorrowTenAm,
        durationMinutes: 90,
        price: 260,
        discount: 0,
        totalAmount: 260,
        notes: '[seed] Coloração ocupando a manhã',
      },
      {
        tenantId: tenant.id,
        clientId: client.id,
        professionalId: professionalA.id,
        serviceId: corteGlow.id,
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: tomorrowTwoPm,
        durationMinutes: 60,
        price: 120,
        discount: 0,
        totalAmount: 120,
        notes: '[seed] Corte ocupando início da tarde',
      },
    ],
  });

  console.log('Seed concluído com sucesso.');
  console.log(`Tenant: ${tenant.subdomain}`);
  console.log(`Cliente: ${clientUser.email} / Cliente123!`);
  console.log(`Gestora: ${managerUser.email} / Gestora123!`);
  console.log(`Profissionais: ${professionalUserA.email}, ${professionalUserB.email}`);
}

type UpsertUserInput = {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  tenantId: string;
  phone?: string;
};

async function upsertUser(input: UpsertUserInput) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    create: {
      email: input.email,
      name: input.name,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      tenantId: input.tenantId,
    },
  });
}

type UpsertServiceInput = {
  tenantId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
};

async function upsertService(input: UpsertServiceInput) {
  const existing = await prisma.service.findFirst({
    where: {
      tenantId: input.tenantId,
      name: input.name,
    },
  });

  if (existing) {
    return prisma.service.update({
      where: { id: existing.id },
      data: {
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: input.price,
        active: true,
      },
    });
  }

  return prisma.service.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      price: input.price,
      active: true,
    },
  });
}

function nextBusinessDayAt(hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);

  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

main()
  .catch(async error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
