CREATE UNIQUE INDEX `Payment_provider_providerReference_key`
  ON `Payment`(`provider`, `providerReference`);

CREATE TABLE `PaymentWebhookEvent` (
  `id` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `resourceId` VARCHAR(191) NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NULL,
  `payload` JSON NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `PaymentWebhookEvent_provider_eventId_key`(`provider`, `eventId`),
  INDEX `PaymentWebhookEvent_provider_resourceId_idx`(`provider`, `resourceId`),
  INDEX `PaymentWebhookEvent_processedAt_createdAt_idx`(`processedAt`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
