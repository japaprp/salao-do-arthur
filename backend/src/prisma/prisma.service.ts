import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export type TenantPrismaClient = Prisma.TransactionClient;

const TENANT_SCOPED_MODELS = new Set([
  'User', 'Role', 'Permission', 'AdminProfile', 'SalonSettings', 'Professional',
  'Client', 'ServiceCategory', 'Service', 'ServiceAddon', 'ProfessionalService',
  'WorkingHour', 'TimeOff', 'Appointment', 'AppointmentService',
  'AppointmentStatusHistory', 'Waitlist', 'Resource', 'Transaction',
  'Promotion', 'Coupon', 'Banner', 'ProductCategory', 'Product', 'ProductImage',
  'Inventory', 'StockMovement', 'ProductFavorite', 'Cart', 'CartItem', 'Order',
  'OrderItem', 'Payment', 'Refund', 'NotificationTemplate', 'Notification',
  'DeviceToken', 'GalleryCategory', 'GalleryItem', 'Review', 'LoyaltyWallet',
  'LoyaltyTransaction', 'Referral', 'Campaign', 'CommissionRule', 'Commission',
  'Goal', 'GoalProgress', 'AuditLog', 'ActivityLog', 'FileAsset', 'Address',
  'SupportMessage',
]);

const TENANT_WHERE_OPERATIONS = new Set([
  'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow',
  'findMany', 'count', 'aggregate', 'groupBy', 'update', 'updateMany',
  'updateManyAndReturn', 'delete', 'deleteMany', 'upsert',
]);

const TENANT_CREATE_OPERATIONS = new Set([
  'create', 'createMany', 'createManyAndReturn',
]);

const TENANT_UPDATE_OPERATIONS = new Set([
  'update', 'updateMany', 'updateManyAndReturn', 'upsert',
]);

// JSON columns are application payloads, not Prisma relation inputs.
// Never inject tenantId into arbitrary user-controlled JSON objects.
const TENANT_JSON_FIELDS = new Set([
  'after', 'attachments', 'before', 'benefit', 'criteria', 'discount',
  'metadata', 'payload', 'preferences', 'reminderLeadHours', 'triggers', 'variables',
]);

function scopeTenantData(data: unknown, tenantId: string): unknown {
  if (Array.isArray(data)) {
    return data.map(item => scopeTenantData(item, tenantId));
  }
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Preserve Date, Prisma.Decimal, Buffer and other value objects.
  // Only plain records represent nested Prisma input/relation objects.
  const prototype: unknown = Object.getPrototypeOf(data);
  if (prototype !== Object.prototype && prototype !== null) {
    return data;
  }

  const record = data as Record<string, unknown>;
  if (record.tenantId !== undefined && record.tenantId !== tenantId) {
    throw new Error('Tenant context mismatch in write operation.');
  }

  const scopedRecord: Record<string, unknown> = { ...record, tenantId };
  for (const [field, value] of Object.entries(record)) {
    if (TENANT_JSON_FIELDS.has(field) || !value || typeof value !== 'object') {
      continue;
    }
    scopedRecord[field] = scopeTenantData(value, tenantId);
  }
  return scopedRecord;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await withTimeout(
      this.$connect(),
      Number(process.env.PRISMA_CONNECT_TIMEOUT_MS ?? 15000),
      'Timeout ao conectar no banco via Prisma.',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withTenant<T>(
    tenantId: string,
    operation: (client: TenantPrismaClient) => Promise<T>,
  ): Promise<T> {
    if (!tenantId?.trim()) {
      throw new Error('Tenant context is required for this transaction.');
    }

    const tenantScopedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation: queryOperation, args, query }) {
            if (!model || !TENANT_SCOPED_MODELS.has(model)) {
              return query(args);
            }

            const scopedArgs = { ...args } as Record<string, unknown>;

            if (TENANT_WHERE_OPERATIONS.has(queryOperation)) {
              const where = (scopedArgs.where ?? {}) as Record<string, unknown>;
              if (where.tenantId !== undefined && where.tenantId !== tenantId) {
                throw new Error('Tenant context mismatch in query operation.');
              }
              scopedArgs.where = { ...where, tenantId };
            }

            if (TENANT_CREATE_OPERATIONS.has(queryOperation)) {
              scopedArgs.data = scopeTenantData(scopedArgs.data, tenantId);
            } else if (TENANT_UPDATE_OPERATIONS.has(queryOperation)) {
              if (scopedArgs.data !== undefined) {
                scopedArgs.data = scopeTenantData(scopedArgs.data, tenantId);
              }
              if (queryOperation === 'upsert') {
                if (scopedArgs.create !== undefined) {
                  scopedArgs.create = scopeTenantData(scopedArgs.create, tenantId);
                }
                if (scopedArgs.update !== undefined) {
                  scopedArgs.update = scopeTenantData(scopedArgs.update, tenantId);
                }
              }
            }

            return query(scopedArgs as typeof args);
          },
        },
      },
    });

    // Raw SQL bypasses Prisma query extensions and must include tenantId explicitly.
    return tenantScopedClient.$transaction(async transaction =>
      operation(transaction as TenantPrismaClient),
    );
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}
