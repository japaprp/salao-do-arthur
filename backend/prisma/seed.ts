import {
  AppointmentStatus,
  BannerPlacement,
  CouponDiscountType,
  PromotionScope,
  PromotionType,
  PrismaClient,
  UserRole,
  WeekDay,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'barbearia-do-artur' },
    update: {
      name: 'Barbearia do Artur Demo',
      locale: 'pt-BR',
    },
    create: {
      name: 'Barbearia do Artur Demo',
      subdomain: 'barbearia-do-artur',
      locale: 'pt-BR',
    },
  });

  await prisma.salonSettings.upsert({
    where: { tenantId: tenant.id },
    update: {
      salonName: 'Barbearia do Artur Demo',
      description: 'Barbearia prática para corte, barba, navalhado, risco, sobrancelha, luzes, tranças e pacotes recorrentes.',
      phone: '+55 11 99000-0000',
      whatsapp: '+55 11 99000-0000',
      email: 'contato@barbeariadoartur.app',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      locale: 'pt-BR',
      appointmentLeadTimeMinutes: 60,
      cancellationWindowHours: 1,
      reminderLeadHours: { first: 24, second: 3 },
      allowWaitlist: true,
      enableCheckout: true,
      enableLoyalty: true,
      enableReferrals: true,
      enableProductCatalog: true,
      primaryColor: '#111827',
      secondaryColor: '#F3F4F6',
      accentColor: '#C9A227',
      instagram: '@barbeariadoartur',
      privacyPolicyUrl: 'https://barbeariadoartur.app/privacy',
    },
    create: {
      tenantId: tenant.id,
      salonName: 'Barbearia do Artur Demo',
      description: 'Barbearia prática para corte, barba, navalhado, risco, sobrancelha, luzes, tranças e pacotes recorrentes.',
      phone: '+55 11 99000-0000',
      whatsapp: '+55 11 99000-0000',
      email: 'contato@barbeariadoartur.app',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      locale: 'pt-BR',
      appointmentLeadTimeMinutes: 60,
      cancellationWindowHours: 1,
      reminderLeadHours: { first: 24, second: 3 },
      allowWaitlist: true,
      enableCheckout: true,
      enableLoyalty: true,
      enableReferrals: true,
      enableProductCatalog: true,
      primaryColor: '#111827',
      secondaryColor: '#F3F4F6',
      accentColor: '#C9A227',
      instagram: '@barbeariadoartur',
      privacyPolicyUrl: 'https://barbeariadoartur.app/privacy',
    },
  });

  const managerUser = await upsertUser({
    email: 'artur@barbeariadoartur.app',
    name: 'Artur',
    password: 'Gestora123!',
    role: UserRole.MANAGER,
    tenantId: tenant.id,
    phone: '5511990000001',
  });

  const professionalUserA = await upsertUser({
    email: 'artur.profissional@barbeariadoartur.app',
    name: 'Artur Barbeiro',
    password: 'Profissional123!',
    role: UserRole.PROFESSIONAL,
    tenantId: tenant.id,
    phone: '5511990000002',
  });

  const professionalUserB = await upsertUser({
    email: 'renan.profissional@barbeariadoartur.app',
    name: 'Renan Auxiliar',
    password: 'Profissional123!',
    role: UserRole.PROFESSIONAL,
    tenantId: tenant.id,
    phone: '5511990000003',
  });

  const clientUser = await upsertUser({
    email: 'cliente.demo@barbeariadoartur.app',
    name: 'Maria Oliveira',
    password: 'Cliente123!',
    role: UserRole.CLIENT,
    tenantId: tenant.id,
    phone: '5511990000004',
  });

  await prisma.adminProfile.upsert({
    where: { userId: managerUser.id },
    update: {
      tenantId: tenant.id,
      position: 'Dono e gestor da barbearia',
      canApproveFinancials: true,
      deletedAt: null,
    },
    create: {
      userId: managerUser.id,
      tenantId: tenant.id,
      position: 'Dono e gestor da barbearia',
      canApproveFinancials: true,
    },
  });

  const professionalA = await prisma.professional.upsert({
    where: { userId: professionalUserA.id },
    update: {
      tenantId: tenant.id,
      specialty: 'Corte, barba, navalhado e acabamento',
      bio: 'Artur cuida da agenda principal, confirma horários, ajusta encaixes e atende cortes avulsos ou pacotes.',
      commissionPercent: 45,
      active: true,
      deletedAt: null,
    },
    create: {
      userId: professionalUserA.id,
      tenantId: tenant.id,
      specialty: 'Corte, barba, navalhado e acabamento',
      bio: 'Artur cuida da agenda principal, confirma horários, ajusta encaixes e atende cortes avulsos ou pacotes.',
      commissionPercent: 45,
      active: true,
    },
  });

  const professionalB = await prisma.professional.upsert({
    where: { userId: professionalUserB.id },
    update: {
      tenantId: tenant.id,
      specialty: 'Tranças, luzes e apoio de agenda',
      bio: 'Apoio para serviços demorados, organização de encaixes e finalização.',
      commissionPercent: 40,
      active: true,
      deletedAt: null,
    },
    create: {
      userId: professionalUserB.id,
      tenantId: tenant.id,
      specialty: 'Tranças, luzes e apoio de agenda',
      bio: 'Apoio para serviços demorados, organização de encaixes e finalização.',
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
      loyaltyLevel: 'SILVER',
      marketingOptIn: true,
      favoriteProfessionalId: professionalA.id,
      preferences: {
        preference: 'corte baixo com degradê',
        wantsEarlierSlot: true,
      },
      deletedAt: null,
    },
    create: {
      userId: clientUser.id,
      tenantId: tenant.id,
      loyaltyPoints: 180,
      lifetimeValue: 980,
      loyaltyLevel: 'SILVER',
      marketingOptIn: true,
      favoriteProfessionalId: professionalA.id,
      preferences: {
        preference: 'corte baixo com degradê',
        wantsEarlierSlot: true,
      },
    },
  });

  const categoryColor = await upsertServiceCategory({
    tenantId: tenant.id,
    name: 'Luzes e Tranças',
    description: 'Serviços especiais para visual completo e manutenção.',
    color: '#C9A227',
    icon: 'palette',
    sortOrder: 1,
  });

  const categoryCut = await upsertServiceCategory({
    tenantId: tenant.id,
    name: 'Corte, Barba e Acabamento',
    description: 'Corte avulso, barba navalhada, risco, sobrancelha e combos.',
    color: '#111827',
    icon: 'content-cut',
    sortOrder: 2,
  });

  const corteAvulso = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryCut.id,
    name: 'Corte avulso',
    description: 'Corte masculino com acabamento alinhado para o dia a dia.',
    durationMinutes: 40,
    price: 45,
  });

  const barbaNavalhada = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryCut.id,
    name: 'Barba navalhada',
    description: 'Modelagem da barba com toalha quente, navalha e finalização.',
    durationMinutes: 30,
    price: 35,
  });

  const comboCabeloBarba = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryCut.id,
    name: 'Pacote cabelo + barba',
    description: 'Combo prático com corte, barba navalhada e acabamento.',
    durationMinutes: 70,
    price: 75,
  });

  const comboCompleto = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryCut.id,
    name: 'Pacote completo premium',
    description: 'Corte, barba navalhada, risco e sobrancelha em uma reserva.',
    durationMinutes: 85,
    price: 95,
  });

  const riscoSobrancelha = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryCut.id,
    name: 'Risco e sobrancelha',
    description: 'Acabamento rápido para elevar o visual sem ocupar muito tempo.',
    durationMinutes: 20,
    price: 20,
  });

  const luzes = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryColor.id,
    name: 'Luzes masculinas',
    description: 'Luzes com avaliação rápida, proteção dos fios e acabamento.',
    durationMinutes: 120,
    price: 160,
  });

  const trancas = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryColor.id,
    name: 'Tranças masculinas',
    description: 'Tranças com divisão limpa, acabamento e orientação de cuidado.',
    durationMinutes: 150,
    price: 180,
  });

  const pacoteMensal = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryCut.id,
    name: 'Pacote mensal 4 cortes',
    description: 'Pacote recorrente para cliente fixo manter visual sempre em dia.',
    durationMinutes: 40,
    price: 160,
  });

  await upsertProfessionalService(tenant.id, professionalA.id, corteAvulso.id, {
    sortOrder: 1,
  });
  await upsertProfessionalService(tenant.id, professionalA.id, barbaNavalhada.id, {
    sortOrder: 2,
  });
  await upsertProfessionalService(tenant.id, professionalA.id, comboCabeloBarba.id, {
    sortOrder: 3,
  });
  await upsertProfessionalService(tenant.id, professionalA.id, comboCompleto.id, {
    sortOrder: 4,
  });
  await upsertProfessionalService(tenant.id, professionalA.id, riscoSobrancelha.id, {
    sortOrder: 5,
  });
  await upsertProfessionalService(tenant.id, professionalA.id, pacoteMensal.id, {
    sortOrder: 6,
  });
  await upsertProfessionalService(tenant.id, professionalB.id, luzes.id, {
    sortOrder: 1,
  });
  await upsertProfessionalService(tenant.id, professionalB.id, trancas.id, {
    sortOrder: 2,
  });

  await upsertWorkingHour(tenant.id, professionalA.id, WeekDay.MONDAY, '09:00', '18:00');
  await upsertWorkingHour(tenant.id, professionalA.id, WeekDay.TUESDAY, '09:00', '18:00');
  await upsertWorkingHour(tenant.id, professionalA.id, WeekDay.WEDNESDAY, '09:00', '18:00');
  await upsertWorkingHour(tenant.id, professionalA.id, WeekDay.THURSDAY, '09:00', '18:00');
  await upsertWorkingHour(tenant.id, professionalA.id, WeekDay.FRIDAY, '09:00', '18:00');
  await upsertWorkingHour(tenant.id, professionalA.id, WeekDay.SATURDAY, '09:00', '14:00');

  await upsertWorkingHour(tenant.id, professionalB.id, WeekDay.MONDAY, '10:00', '19:00');
  await upsertWorkingHour(tenant.id, professionalB.id, WeekDay.TUESDAY, '10:00', '19:00');
  await upsertWorkingHour(tenant.id, professionalB.id, WeekDay.WEDNESDAY, '10:00', '19:00');
  await upsertWorkingHour(tenant.id, professionalB.id, WeekDay.THURSDAY, '10:00', '19:00');
  await upsertWorkingHour(tenant.id, professionalB.id, WeekDay.FRIDAY, '10:00', '19:00');
  await upsertWorkingHour(tenant.id, professionalB.id, WeekDay.SATURDAY, '09:00', '15:00');

  const retailCategory = await upsertProductCategory({
    tenantId: tenant.id,
    name: 'Lojinha do Artur',
    description: 'Produtos para cabelo e barba vendidos junto do atendimento.',
    sortOrder: 1,
  });

  const pomadaMatte = await upsertProduct({
    tenantId: tenant.id,
    categoryId: retailCategory.id,
    name: 'Pomada Matte Artur',
    sku: 'BARBA-001',
    description: 'Pomada de efeito seco para finalizar degradê, topete e penteado natural.',
    shortDescription: 'Fixação leve e acabamento seco.',
    price: 39.9,
    compareAtPrice: 44.9,
    costPrice: 18.5,
    featured: true,
    metadata: {
      size: '80g',
      category: 'finalizacao',
    },
  });

  const balmBarba = await upsertProduct({
    tenantId: tenant.id,
    categoryId: retailCategory.id,
    name: 'Balm para barba',
    sku: 'BARBA-002',
    description: 'Balm para hidratar, alinhar e perfumar a barba depois do navalhado.',
    shortDescription: 'Hidratação e controle da barba.',
    price: 34.9,
    costPrice: 15.9,
    metadata: {
      size: '100ml',
      category: 'barba',
    },
  });

  await prisma.inventory.upsert({
    where: { productId: pomadaMatte.id },
    update: {
      tenantId: tenant.id,
      availableQty: 18,
      reorderPoint: 5,
      safetyStock: 3,
    },
    create: {
      tenantId: tenant.id,
      productId: pomadaMatte.id,
      availableQty: 18,
      reorderPoint: 5,
      safetyStock: 3,
    },
  });

  await prisma.inventory.upsert({
    where: { productId: balmBarba.id },
    update: {
      tenantId: tenant.id,
      availableQty: 12,
      reorderPoint: 4,
      safetyStock: 2,
    },
    create: {
      tenantId: tenant.id,
      productId: balmBarba.id,
      availableQty: 12,
      reorderPoint: 4,
      safetyStock: 2,
    },
  });

  const promotion = await upsertPromotion({
    tenantId: tenant.id,
    name: 'Semana do Degradê',
    type: PromotionType.SERVICE,
    scope: PromotionScope.SERVICE,
    description: 'Desconto especial no pacote cabelo + barba para preencher horários vagos.',
    priority: 10,
    startsAt: startOfToday(),
    endsAt: endOfDaysFromNow(20),
    criteria: {
      serviceSlug: slugify('Pacote cabelo + barba'),
      minAppointmentsLast90Days: 0,
    },
    benefit: {
      type: 'percentage',
      value: 15,
    },
  });

  await upsertCoupon({
    tenantId: tenant.id,
    promotionId: promotion.id,
    code: 'ARTUR15',
    description: '15% off no pacote cabelo + barba',
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 15,
    usageLimit: 100,
    usagePerCustomer: 1,
    startsAt: startOfToday(),
    endsAt: endOfDaysFromNow(20),
    metadata: {
      channel: 'launch-campaign',
    },
  });

  await upsertBanner({
    tenantId: tenant.id,
    promotionId: promotion.id,
    title: 'Semana do Degradê',
    subtitle: 'Pacote cabelo + barba com benefício exclusivo',
    description: 'Ative o cupom ARTUR15 e use a agenda para ocupar horários vagos.',
    placement: BannerPlacement.HOME,
    ctaLabel: 'Agendar agora',
    ctaUrl: 'https://barbeariadoartur.app/promocoes/semana-do-degrade',
    priority: 10,
    startsAt: startOfToday(),
    endsAt: endOfDaysFromNow(20),
  });

  const loyaltyWallet = await prisma.loyaltyWallet.upsert({
    where: { clientId: client.id },
    update: {
      tenantId: tenant.id,
      pointsBalance: 240,
      currentLevel: 'SILVER',
    },
    create: {
      tenantId: tenant.id,
      clientId: client.id,
      pointsBalance: 240,
      currentLevel: 'SILVER',
    },
  });

  await prisma.loyaltyTransaction.deleteMany({
    where: {
      tenantId: tenant.id,
      walletId: loyaltyWallet.id,
      reason: {
        startsWith: '[seed]',
      },
    },
  });

  await prisma.loyaltyTransaction.createMany({
    data: [
      {
        tenantId: tenant.id,
        walletId: loyaltyWallet.id,
        points: 120,
        type: 'EARNED',
        reason: '[seed] Agendamento concluído no pacote cabelo + barba',
      },
      {
        tenantId: tenant.id,
        walletId: loyaltyWallet.id,
        points: -40,
        type: 'REDEEMED',
        reason: '[seed] Resgate em pomada da lojinha',
      },
      {
        tenantId: tenant.id,
        walletId: loyaltyWallet.id,
        points: 60,
        type: 'EARNED',
        reason: '[seed] Compra na lojinha do Artur',
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
        serviceId: comboCabeloBarba.id,
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: tomorrowTenAm,
        durationMinutes: 70,
        price: 75,
        discount: 0,
        totalAmount: 75,
        notes: '[seed] Cliente quer ir antes se abrir horário vago. Confirmar por WhatsApp.',
      },
      {
        tenantId: tenant.id,
        clientId: client.id,
        professionalId: professionalB.id,
        serviceId: trancas.id,
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: tomorrowTwoPm,
        durationMinutes: 150,
        price: 180,
        discount: 0,
        totalAmount: 180,
        notes: '[seed] Tranças ocupando início da tarde. Avisar se precisar reagendar.',
      },
    ],
  });

  console.log('Seed concluído com sucesso.');
  console.log(`Tenant: ${tenant.subdomain}`);
  console.log(`Cliente: ${clientUser.email} / Cliente123!`);
  console.log(`Artur gestor: ${managerUser.email} / Gestora123!`);
  console.log(`Profissionais: ${professionalUserA.email}, ${professionalUserB.email}`);
  console.log('Cupom demo: ARTUR15');
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
  const existing = await prisma.user.findFirst({
    where: {
      tenantId: input.tenantId,
      email: input.email,
    },
  });

  const passwordHash = await bcrypt.hash(input.password, 12);

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: input.role,
        deletedAt: null,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role,
      tenantId: input.tenantId,
    },
  });
}

type UpsertServiceCategoryInput = {
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
};

async function upsertServiceCategory(input: UpsertServiceCategoryInput) {
  const slug = slugify(input.name);
  const existing = await prisma.serviceCategory.findFirst({
    where: {
      tenantId: input.tenantId,
      slug,
    },
  });

  if (existing) {
    return prisma.serviceCategory.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        sortOrder: input.sortOrder ?? 0,
        active: true,
        deletedAt: null,
      },
    });
  }

  return prisma.serviceCategory.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      slug,
      description: input.description,
      color: input.color,
      icon: input.icon,
      sortOrder: input.sortOrder ?? 0,
      active: true,
    },
  });
}

type UpsertServiceInput = {
  tenantId: string;
  categoryId?: string;
  name: string;
  description?: string;
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
        categoryId: input.categoryId,
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: input.price,
        active: true,
        deletedAt: null,
      },
    });
  }

  return prisma.service.create({
    data: {
      tenantId: input.tenantId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      price: input.price,
      active: true,
    },
  });
}

async function upsertProfessionalService(
  tenantId: string,
  professionalId: string,
  serviceId: string,
  overrides?: {
    customPrice?: number;
    customDurationMinutes?: number;
    sortOrder?: number;
  },
) {
  const existing = await prisma.professionalService.findFirst({
    where: {
      professionalId,
      serviceId,
    },
  });

  if (existing) {
    return prisma.professionalService.update({
      where: { id: existing.id },
      data: {
        tenantId,
        customPrice: overrides?.customPrice,
        customDurationMinutes: overrides?.customDurationMinutes,
        sortOrder: overrides?.sortOrder ?? 0,
        active: true,
      },
    });
  }

  return prisma.professionalService.create({
    data: {
      tenantId,
      professionalId,
      serviceId,
      customPrice: overrides?.customPrice,
      customDurationMinutes: overrides?.customDurationMinutes,
      sortOrder: overrides?.sortOrder ?? 0,
      active: true,
    },
  });
}

async function upsertWorkingHour(
  tenantId: string,
  professionalId: string,
  dayOfWeek: WeekDay,
  startTime: string,
  endTime: string,
) {
  const existing = await prisma.workingHour.findFirst({
    where: {
      tenantId,
      professionalId,
      dayOfWeek,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    return prisma.workingHour.update({
      where: { id: existing.id },
      data: {
        startTime,
        endTime,
        slotIntervalMinutes: 30,
        active: true,
      },
    });
  }

  return prisma.workingHour.create({
    data: {
      tenantId,
      professionalId,
      dayOfWeek,
      startTime,
      endTime,
      slotIntervalMinutes: 30,
      active: true,
    },
  });
}

type UpsertProductCategoryInput = {
  tenantId: string;
  name: string;
  description?: string;
  sortOrder?: number;
};

async function upsertProductCategory(input: UpsertProductCategoryInput) {
  const slug = slugify(input.name);
  const existing = await prisma.productCategory.findFirst({
    where: {
      tenantId: input.tenantId,
      slug,
    },
  });

  if (existing) {
    return prisma.productCategory.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder ?? 0,
        active: true,
        deletedAt: null,
      },
    });
  }

  return prisma.productCategory.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      slug,
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
      active: true,
    },
  });
}

type UpsertProductInput = {
  tenantId: string;
  categoryId?: string;
  name: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  featured?: boolean;
  metadata?: Record<string, unknown>;
};

async function upsertProduct(input: UpsertProductInput) {
  const slug = slugify(input.name);
  const existing = await prisma.product.findFirst({
    where: {
      tenantId: input.tenantId,
      slug,
    },
  });

  if (existing) {
    return prisma.product.update({
      where: { id: existing.id },
      data: {
        categoryId: input.categoryId,
        name: input.name,
        sku: input.sku,
        description: input.description,
        shortDescription: input.shortDescription,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        costPrice: input.costPrice,
        featured: input.featured ?? false,
        active: true,
        shippable: true,
        trackInventory: true,
        metadata: input.metadata,
        deletedAt: null,
      },
    });
  }

  return prisma.product.create({
    data: {
      tenantId: input.tenantId,
      categoryId: input.categoryId,
      name: input.name,
      slug,
      sku: input.sku,
      description: input.description,
      shortDescription: input.shortDescription,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      costPrice: input.costPrice,
      featured: input.featured ?? false,
      active: true,
      shippable: true,
      trackInventory: true,
      metadata: input.metadata,
    },
  });
}

type UpsertPromotionInput = {
  tenantId: string;
  name: string;
  type: PromotionType;
  scope: PromotionScope;
  description?: string;
  priority?: number;
  startsAt?: Date;
  endsAt?: Date;
  criteria?: Record<string, unknown>;
  benefit?: Record<string, unknown>;
};

async function upsertPromotion(input: UpsertPromotionInput) {
  const slug = slugify(input.name);
  const existing = await prisma.promotion.findFirst({
    where: {
      tenantId: input.tenantId,
      slug,
    },
  });

  if (existing) {
    return prisma.promotion.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        scope: input.scope,
        active: true,
        autoApply: false,
        priority: input.priority ?? 0,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        criteria: input.criteria,
        benefit: input.benefit,
        deletedAt: null,
      },
    });
  }

  return prisma.promotion.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      slug,
      description: input.description,
      type: input.type,
      scope: input.scope,
      active: true,
      autoApply: false,
      priority: input.priority ?? 0,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      criteria: input.criteria,
      benefit: input.benefit,
    },
  });
}

type UpsertCouponInput = {
  tenantId: string;
  promotionId?: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usagePerCustomer?: number;
  startsAt?: Date;
  endsAt?: Date;
  metadata?: Record<string, unknown>;
};

async function upsertCoupon(input: UpsertCouponInput) {
  const code = input.code.trim().toUpperCase();
  const existing = await prisma.coupon.findFirst({
    where: {
      tenantId: input.tenantId,
      code,
    },
  });

  if (existing) {
    return prisma.coupon.update({
      where: { id: existing.id },
      data: {
        promotionId: input.promotionId,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmount: input.minOrderAmount,
        maxDiscountAmount: input.maxDiscountAmount,
        usageLimit: input.usageLimit,
        usagePerCustomer: input.usagePerCustomer,
        active: true,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        metadata: input.metadata,
        deletedAt: null,
      },
    });
  }

  return prisma.coupon.create({
    data: {
      tenantId: input.tenantId,
      promotionId: input.promotionId,
      code,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscountAmount: input.maxDiscountAmount,
      usageLimit: input.usageLimit,
      usagePerCustomer: input.usagePerCustomer,
      active: true,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      metadata: input.metadata,
    },
  });
}

type UpsertBannerInput = {
  tenantId: string;
  promotionId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  placement: BannerPlacement;
  ctaLabel?: string;
  ctaUrl?: string;
  priority?: number;
  startsAt?: Date;
  endsAt?: Date;
};

async function upsertBanner(input: UpsertBannerInput) {
  const existing = await prisma.banner.findFirst({
    where: {
      tenantId: input.tenantId,
      title: input.title,
      placement: input.placement,
    },
  });

  if (existing) {
    return prisma.banner.update({
      where: { id: existing.id },
      data: {
        promotionId: input.promotionId,
        subtitle: input.subtitle,
        description: input.description,
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
        priority: input.priority ?? 0,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        active: true,
        deletedAt: null,
      },
    });
  }

  return prisma.banner.create({
    data: {
      tenantId: input.tenantId,
      promotionId: input.promotionId,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      placement: input.placement,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      priority: input.priority ?? 0,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      active: true,
    },
  });
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDaysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);
  return date;
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
