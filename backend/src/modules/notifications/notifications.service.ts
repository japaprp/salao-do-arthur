import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { App, applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

type PushNotificationInput = {
  tenantId: string;
  userId: string;
  title: string;
  body: string;
  payload?: Record<string, string>;
};

type AppointmentReminderInput = {
  tenantId: string;
  userId: string;
  appointmentId: string;
  scheduledAt: Date;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: App | null = null;
  private processingScheduledNotifications = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async registerDeviceToken(user: AuthenticatedUser, dto: RegisterDeviceTokenDto) {
    return this.prisma.withTenant(user.tenantId, transaction =>
      transaction.deviceToken.upsert({
        where: { token: dto.token },
        create: {
          tenantId: user.tenantId,
          userId: user.userId,
          token: dto.token,
          platform: dto.platform,
          active: true,
          lastSeenAt: new Date(),
        },
        update: {
          tenantId: user.tenantId,
          userId: user.userId,
          platform: dto.platform,
          active: true,
          lastSeenAt: new Date(),
          deletedAt: null,
        },
      }),
    );
  }

  async notifyUser(input: PushNotificationInput): Promise<void> {
    const { notification, tokens } = await this.prisma.withTenant(input.tenantId, transaction =>
      Promise.all([
        transaction.notification.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            channel: NotificationChannel.PUSH,
            status: NotificationStatus.QUEUED,
            title: input.title,
            body: input.body,
            payload: input.payload,
          },
        }),
        transaction.deviceToken.findMany({
          where: {
            tenantId: input.tenantId,
            userId: input.userId,
            active: true,
            deletedAt: null,
          },
          select: { token: true },
        }),
      ]).then(([notification, tokens]) => ({ notification, tokens })),
    );

    if (tokens.length === 0) {
      return;
    }

    await this.dispatchPushNotification({
      notificationId: notification.id,
      tenantId: input.tenantId,
      userId: input.userId,
      title: input.title,
      body: input.body,
      payload: input.payload,
      tokens: tokens.map(({ token }) => token),
    });
  }

  async scheduleAppointmentReminders(input: AppointmentReminderInput): Promise<void> {
    await this.cancelAppointmentReminders(input);

    const now = new Date();
    const reminders = [
      {
        reminderType: '24h',
        scheduledAt: new Date(input.scheduledAt.getTime() - 24 * 60 * 60 * 1000),
        title: 'Lembrete de agendamento',
        body: 'Seu horário na Barbearia do Artur é amanhã.',
      },
      {
        reminderType: '1h',
        scheduledAt: new Date(input.scheduledAt.getTime() - 60 * 60 * 1000),
        title: 'Seu horário está chegando',
        body: 'Seu atendimento na Barbearia do Artur começa em aproximadamente 1 hora.',
      },
    ].filter(reminder => reminder.scheduledAt > now);

    if (reminders.length === 0) {
      return;
    }

    await this.prisma.withTenant(input.tenantId, transaction =>
      transaction.notification.createMany({
        data: reminders.map(reminder => ({
          tenantId: input.tenantId,
          userId: input.userId,
          channel: NotificationChannel.PUSH,
          status: NotificationStatus.SCHEDULED,
          title: reminder.title,
          body: reminder.body,
          scheduledAt: reminder.scheduledAt,
          payload: {
            type: 'appointment_reminder',
            appointmentId: input.appointmentId,
            reminderType: reminder.reminderType,
          },
        })),
      }),
    );
  }

  async cancelAppointmentReminders(input: AppointmentReminderInput): Promise<void> {
    const pending = await this.prisma.notification.findMany({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        channel: NotificationChannel.PUSH,
        status: NotificationStatus.SCHEDULED,
        deletedAt: null,
      },
      select: { id: true, payload: true },
    });

    const ids = pending
      .filter(notification => {
        const payload = notification.payload;
        return (
          payload != null &&
          typeof payload === 'object' &&
          !Array.isArray(payload) &&
          payload['type'] === 'appointment_reminder' &&
          payload['appointmentId'] === input.appointmentId
        );
      })
      .map(notification => notification.id);

    if (ids.length === 0) {
      return;
    }

    await this.prisma.notification.updateMany({
      where: { id: { in: ids }, tenantId: input.tenantId },
      data: { deletedAt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueScheduledPushNotifications(): Promise<void> {
    if (this.processingScheduledNotifications) {
      return;
    }

    this.processingScheduledNotifications = true;

    try {
      const dueNotifications = await this.prisma.notification.findMany({
        where: {
          channel: NotificationChannel.PUSH,
          status: NotificationStatus.SCHEDULED,
          scheduledAt: { lte: new Date() },
          deletedAt: null,
        },
        take: 50,
        orderBy: { scheduledAt: 'asc' },
      });

      for (const notification of dueNotifications) {
        const tokens = await this.prisma.deviceToken.findMany({
          where: {
            tenantId: notification.tenantId,
            userId: notification.userId,
            active: true,
            deletedAt: null,
          },
          select: { token: true },
        });

        await this.dispatchPushNotification({
          notificationId: notification.id,
          tenantId: notification.tenantId,
          userId: notification.userId,
          title: notification.title,
          body: notification.body ?? undefined,
          payload: this.normalizePayload(notification.payload),
          tokens: tokens.map(({ token }) => token),
        });
      }
    } finally {
      this.processingScheduledNotifications = false;
    }
  }

  private async dispatchPushNotification(input: {
    notificationId: string;
    tenantId: string;
    userId: string;
    title: string;
    body?: string;
    payload?: Record<string, string>;
    tokens: string[];
  }): Promise<void> {
    if (input.tokens.length === 0) {
      await this.prisma.notification.update({
        where: { id: input.notificationId },
        data: { status: NotificationStatus.QUEUED },
      });
      return;
    }

    const firebaseApp = this.getFirebaseApp();
    if (!firebaseApp) {
      this.logger.warn('Firebase credentials not configured; notification queued only.');
      await this.prisma.notification.update({
        where: { id: input.notificationId },
        data: { status: NotificationStatus.QUEUED },
      });
      return;
    }

    try {
      const response = await getMessaging(firebaseApp).sendEachForMulticast({
        tokens: input.tokens,
        notification: {
          title: input.title,
          body: input.body,
        },
        data: input.payload,
        android: {
          priority: 'high',
        },
      });

      const invalidTokens = response.responses
        .map((sendResponse, index) =>
          sendResponse.success ? null : this.getInvalidToken(input.tokens[index], sendResponse.error?.code),
        )
        .filter((token): token is string => token != null);

      if (invalidTokens.length > 0) {
        await this.prisma.deviceToken.updateMany({
          where: { tenantId: input.tenantId, userId: input.userId, token: { in: invalidTokens } },
          data: { active: false, deletedAt: new Date() },
        });
      }

      await this.prisma.notification.update({
        where: { id: input.notificationId },
        data: {
          status:
            response.successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: response.successCount > 0 ? new Date() : undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `FCM dispatch failed for notification ${input.notificationId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      await this.prisma.notification.update({
        where: { id: input.notificationId },
        data: { status: NotificationStatus.FAILED },
      });
    }
  }

  private getFirebaseApp(): App | null {
    if (this.firebaseApp) {
      return this.firebaseApp;
    }

    if (getApps().length > 0) {
      this.firebaseApp = getApps()[0];
      return this.firebaseApp;
    }

    const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson && !this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS')) {
      return null;
    }

    try {
      this.firebaseApp = initializeApp({
        credential: serviceAccountJson
          ? cert(this.parseServiceAccount(serviceAccountJson))
          : applicationDefault(),
      });
      return this.firebaseApp;
    } catch (error) {
      this.logger.error(
        `Firebase initialization failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }

  private parseServiceAccount(value: string): Record<string, string> {
    const raw = value.trim().startsWith('{')
      ? value
      : Buffer.from(value, 'base64').toString('utf8');

    const parsed = JSON.parse(raw) as Record<string, string>;
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  }

  private normalizePayload(payload: unknown): Record<string, string> | undefined {
    if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
      return undefined;
    }

    return Object.entries(payload).reduce<Record<string, string>>((result, [key, value]) => {
      if (value != null) {
        result[key] = String(value);
      }
      return result;
    }, {});
  }

  private getInvalidToken(token: string, errorCode?: string): string | null {
    if (
      errorCode === 'messaging/invalid-registration-token' ||
      errorCode === 'messaging/registration-token-not-registered'
    ) {
      return token;
    }

    return null;
  }
}
