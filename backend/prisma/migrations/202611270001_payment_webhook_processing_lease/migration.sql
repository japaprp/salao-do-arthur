-- Add a lease so concurrent webhook deliveries cannot process the same event.
ALTER TABLE `PaymentWebhookEvent`
  ADD COLUMN `processingAt` DATETIME(3) NULL;
