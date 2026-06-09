UPDATE `Client` SET `loyaltyLevel` = 'DIAMOND' WHERE `loyaltyLevel` = 'VIP';
UPDATE `LoyaltyWallet` SET `currentLevel` = 'DIAMOND' WHERE `currentLevel` = 'VIP';

ALTER TABLE `Client` MODIFY `loyaltyLevel` ENUM('BRONZE', 'SILVER', 'GOLD', 'DIAMOND') NOT NULL DEFAULT 'BRONZE';
ALTER TABLE `LoyaltyWallet` MODIFY `currentLevel` ENUM('BRONZE', 'SILVER', 'GOLD', 'DIAMOND') NOT NULL DEFAULT 'BRONZE';

ALTER TABLE `LoyaltyTransaction` ADD COLUMN `externalKey` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `LoyaltyTransaction_tenantId_externalKey_key` ON `LoyaltyTransaction`(`tenantId`, `externalKey`);
