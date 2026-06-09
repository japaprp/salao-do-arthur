CREATE TABLE `ProductFavorite` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,

  UNIQUE INDEX `ProductFavorite_tenantId_clientId_productId_key`(`tenantId`, `clientId`, `productId`),
  INDEX `ProductFavorite_tenantId_clientId_deletedAt_idx`(`tenantId`, `clientId`, `deletedAt`),
  INDEX `ProductFavorite_tenantId_productId_idx`(`tenantId`, `productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProductFavorite`
  ADD CONSTRAINT `ProductFavorite_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProductFavorite`
  ADD CONSTRAINT `ProductFavorite_clientId_fkey`
  FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProductFavorite`
  ADD CONSTRAINT `ProductFavorite_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
