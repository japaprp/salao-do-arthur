-- Prevent duplicate appointment-linked revenue and commission rows.
-- If existing data contains duplicates, this migration intentionally fails rather than deleting financial history.
ALTER TABLE `Transaction`
  ADD UNIQUE INDEX `Transaction_tenantId_appointmentId_type_category_key`(`tenantId`, `appointmentId`, `type`, `category`);

ALTER TABLE `Commission`
  ADD UNIQUE INDEX `Commission_tenantId_appointmentId_professionalId_key`(`tenantId`, `appointmentId`, `professionalId`);
