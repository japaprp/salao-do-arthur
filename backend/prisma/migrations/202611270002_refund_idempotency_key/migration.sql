-- Persist the request key so retries and concurrent duplicate submissions are safe.
ALTER TABLE `Refund`
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `Refund_idempotencyKey_key`(`idempotencyKey`);
