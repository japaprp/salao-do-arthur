-- Row Level Security policies for the multi-tenant Barbearia do Artur schema.
-- Usage:
-- 1. apply the base schema first
-- 2. run this file as a privileged role
-- 3. in the backend transaction/session, call:
--    SELECT set_config('app.current_tenant_id', '<tenant-uuid>', true);

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
$$;

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE professionals FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE resources FORCE ROW LEVEL SECURITY;
ALTER TABLE services FORCE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE appointment_services FORCE ROW LEVEL SECURITY;
ALTER TABLE resource_bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE commissions FORCE ROW LEVEL SECURITY;
ALTER TABLE loyalty_wallets FORCE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE campaigns FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY professionals_tenant_policy ON professionals
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY clients_tenant_policy ON clients
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY users_tenant_policy ON users
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY resources_tenant_policy ON resources
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY services_tenant_policy ON services
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY appointments_tenant_policy ON appointments
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY transactions_tenant_policy ON transactions
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY commissions_tenant_policy ON commissions
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY loyalty_wallets_tenant_policy ON loyalty_wallets
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY campaigns_tenant_policy ON campaigns
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY notifications_tenant_policy ON notifications
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY audit_logs_tenant_policy ON audit_logs
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY appointment_services_tenant_policy ON appointment_services
  USING (
    EXISTS (
      SELECT 1
      FROM appointments
      WHERE appointments.id = appointment_services.appointment_id
        AND appointments.tenant_id = app.current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM appointments
      WHERE appointments.id = appointment_services.appointment_id
        AND appointments.tenant_id = app.current_tenant_id()
    )
  );

CREATE POLICY resource_bookings_tenant_policy ON resource_bookings
  USING (
    EXISTS (
      SELECT 1
      FROM appointments
      WHERE appointments.id = resource_bookings.appointment_id
        AND appointments.tenant_id = app.current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM appointments
      WHERE appointments.id = resource_bookings.appointment_id
        AND appointments.tenant_id = app.current_tenant_id()
    )
  );

CREATE POLICY loyalty_transactions_tenant_policy ON loyalty_transactions
  USING (
    EXISTS (
      SELECT 1
      FROM loyalty_wallets
      WHERE loyalty_wallets.id = loyalty_transactions.wallet_id
        AND loyalty_wallets.tenant_id = app.current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM loyalty_wallets
      WHERE loyalty_wallets.id = loyalty_transactions.wallet_id
        AND loyalty_wallets.tenant_id = app.current_tenant_id()
    )
  );
