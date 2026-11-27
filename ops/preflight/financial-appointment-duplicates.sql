-- Read-only preflight for migration 202611270003_financial_appointment_uniques.
-- Any returned row means the corresponding unique index may fail to apply.
SELECT
  tenantId,
  appointmentId,
  type,
  category,
  COUNT(*) AS duplicateCount
FROM `Transaction`
WHERE appointmentId IS NOT NULL
GROUP BY tenantId, appointmentId, type, category
HAVING COUNT(*) > 1;

SELECT
  tenantId,
  appointmentId,
  professionalId,
  COUNT(*) AS duplicateCount
FROM `Commission`
WHERE appointmentId IS NOT NULL
GROUP BY tenantId, appointmentId, professionalId
HAVING COUNT(*) > 1;
