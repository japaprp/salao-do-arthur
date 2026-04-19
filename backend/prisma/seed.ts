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

  await prisma.salonSettings.upsert({
    where: { tenantId: tenant.id },
    update: {
      salonName: 'Salão da Lu Demo',
      description: 'Experiência premium em beleza, agenda inteligente e operação moderna.',
      phone: '+55 11 99000-0000',
      whatsapp: '+55 11 99000-0000',
      email: 'contato@salaodaluu.app',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      locale: 'pt-BR',
      appointmentLeadTimeMinutes: 60,
      cancellationWindowHours: 24,
      reminderLeadHours: { first: 24, second: 3 },
      allowWaitlist: true,
      enableCheckout: true,
      enableLoyalty: true,
      enableReferrals: true,
      enableProductCatalog: true,
      primaryColor: '#C79A9A',
      secondaryColor: '#F6ECE8',
      accentColor: '#7A4E4E',
      instagram: '@salaodaludemo',
      privacyPolicyUrl: 'https://salaodaluu.app/privacy',
    },
    create: {
      tenantId: tenant.id,
      salonName: 'Salão da Lu Demo',
      description: 'Experiência premium em beleza, agenda inteligente e operação moderna.',
      phone: '+55 11 99000-0000',
      whatsapp: '+55 11 99000-0000',
      email: 'contato@salaodaluu.app',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      locale: 'pt-BR',
      appointmentLeadTimeMinutes: 60,
      cancellationWindowHours: 24,
      reminderLeadHours: { first: 24, second: 3 },
      allowWaitlist: true,
      enableCheckout: true,
      enableLoyalty: true,
      enableReferrals: true,
      enableProductCatalog: true,
      primaryColor: '#C79A9A',
      secondaryColor: '#F6ECE8',
      accentColor: '#7A4E4E',
      instagram: '@salaodaludemo',
      privacyPolicyUrl: 'https://salaodaluu.app/privacy',
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

  await prisma.adminProfile.upsert({
    where: { userId: managerUser.id },
    update: {
      tenantId: tenant.id,
      position: 'Gestora do salão',
      canApproveFinancials: true,
      deletedAt: null,
    },
    create: {
      userId: managerUser.id,
      tenantId: tenant.id,
      position: 'Gestora do salão',
      canApproveFinancials: true,
    },
  });

  const professionalA = await prisma.professional.upsert({
    where: { userId: professionalUserA.id },
    update: {
      tenantId: tenant.id,
      specialty: 'Coloração e transformação',
      bio: 'Especialista em mechas, correção de cor e recuperação da fibra.',
      commissionPercent: 45,
      active: true,
      deletedAt: null,
    },
    create: {
      userId: professionalUserA.id,
      tenantId: tenant.id,
      specialty: 'Coloração e transformação',
      bio: 'Especialista em mechas, correção de cor e recuperação da fibra.',
      commissionPercent: 45,
      active: true,
    },
  });

  const professionalB = await prisma.professional.upsert({
    where: { userId: professionalUserB.id },
    update: {
      tenantId: tenant.id,
      specialty: 'Corte e finalização',
      bio: 'Cortes femininos, finalização e experiência premium em styling.',
      commissionPercent: 40,
      active: true,
      deletedAt: null,
    },
    create: {
      userId: professionalUserB.id,
      tenantId: tenant.id,
      specialty: 'Corte e finalização',
      bio: 'Cortes femininos, finalização e experiência premium em styling.',
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
        beverage: 'cappuccino',
        fragrance: 'floral suave',
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
        beverage: 'cappuccino',
        fragrance: 'floral suave',
      },
    },
  });

  const categoryColor = await upsertServiceCategory({
    tenantId: tenant.id,
    name: 'Coloração',
    description: 'Serviços de cor, tonalização e transformação.',
    color: '#C79A9A',
    icon: 'palette',
    sortOrder: 1,
  });

  const categoryCut = await upsertServiceCategory({
    tenantId: tenant.id,
    name: 'Corte e Finalização',
    description: 'Corte, lavagem, escova e acabamento.',
    color: '#B07D7D',
    icon: 'content-cut',
    sortOrder: 2,
  });

  const corteGlow = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryCut.id,
    name: 'Corte Glow',
    description: 'Corte, lavagem e finalização premium.',
    durationMinutes: 60,
    price: 120,
  });

  const coloracaoPremium = await upsertService({
    tenantId: tenant.id,
    categoryId: categoryColor.id,
    name: 'Coloração Premium',
    description: 'Coloração com tratamento, proteção de fibra e escova.',
    durationMinutes: 90,
    price: 260,
  });

  await upsertProfessionalService(tenant.id, professionalA.id, coloracaoPremium.id, {
    customDurationMinutes: 90,
    sortOrder: 1,
  });
  await upsertProfessionalService(tenant.id, professionalA.id, corteGlow.id, {
    sortOrder: 2,
  });
  await upsertProfessionalService(tenant.id, professionalB.id, corteGlow.id, {
    customPrice: 115,
    sortOrder: 1,
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
    name: 'Home Care',
    description: 'Linha de manutenção premium para pós-atendimento.',
    sortOrder: 1,
  });

  const hairRepairMask = await upsertProduct({
    tenantId: tenant.id,
    categoryId: retailCategory.id,
    name: 'Máscara Repair Glow',
    sku: 'HOME-CARE-001',
    description: 'Máscara reconstrutora para manutenção de cor e brilho.',
    shortDescription: 'Reconstrução e brilho intenso.',
    price: 89.9,
    compareAtPrice: 99.9,
    costPrice: 42.5,
    featured: true,
    metadata: {
      size: '250ml',
      category: 'home-care',
    },
  });

  const finishingOil = await upsertProduct({
    tenantId: tenant.id,
    categoryId: retailCategory.id,
    name: 'Óleo Finalizador Satin',
    sku: 'HOME-CARE-002',
    description: 'Óleo leve para proteção térmica e brilho.',
    shortDescription: 'Proteção térmica e acabamento.',
    price: 54.9,
    costPrice: 24.9,
    metadata: {
      size: '60ml',
      category: 'finish',
    },
  });

  await prisma.inventory.upsert({
    where: { productId: hairRepairMask.id },
    update: {
      tenantId: tenant.id,
      availableQty: 18,
      reorderPoint: 5,
      safetyStock: 3,
    },
    create: {
      tenantId: tenant.id,
      productId: hairRepairMask.id,
      availableQty: 18,
      reorderPoint: 5,
      safetyStock: 3,
    },
  });

  await prisma.inventory.upsert({
    where: { productId: finishingOil.id },
    update: {
      tenantId: tenant.id,
      availableQty: 12,
      reorderPoint: 4,
      safetyStock: 2,
    },
    create: {
      tenantId: tenant.id,
      productId: finishingOil.id,
      availableQty: 12,
      reorderPoint: 4,
      safetyStock: 2,
    },
  });

  const promotion = await upsertPromotion({
    tenantId: tenant.id,
    name: 'Semana Glow',
    type: PromotionType.SERVICE,
    scope: PromotionScope.SERVICE,
    description: 'Desconto especial em coloração premium para ativar retorno.',
    priority: 10,
    startsAt: startOfToday(),
    endsAt: endOfDaysFromNow(20),
    criteria: {
      serviceSlug: slugify('Coloração Premium'),
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
    code: 'GLOW15',
    description: '15% off na Coloração Premium',
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
    title: 'Semana Glow',
    subtitle: 'Coloração premium com benefício exclusivo',
    description: 'Ative o cupom GLOW15 e converta retorno com agenda inteligente.',
    placement: BannerPlacement.HOME,
    ctaLabel: 'Agendar agora',
    ctaUrl: 'https://salaodaluu.app/promocoes/semana-glow',
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
        reason: '[seed] Agendamento concluído no pacote premium',
      },
      {
        tenantId: tenant.id,
        walletId: loyaltyWallet.id,
        points: -40,
        type: 'REDEEMED',
        reason: '[seed] Resgate em ampola personalizada',
      },
      {
        tenantId: tenant.id,
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
        professionalId: professionalB.id,
        serviceId: corteGlow.id,
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: tomorrowTwoPm,
        durationMinutes: 60,
        price: 115,
        discount: 0,
        totalAmount: 115,
        notes: '[seed] Corte ocupando início da tarde',
      },
    ],
  });

  console.log('Seed concluído com sucesso.');
  console.log(`Tenant: ${tenant.subdomain}`);
  console.log(`Cliente: ${clientUser.email} / Cliente123!`);
  console.log(`Gestora: ${managerUser.email} / Gestora123!`);
  console.log(`Profissionais: ${professionalUserA.email}, ${professionalUserB.email}`);
  console.log('Cupom demo: GLOW15');
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
