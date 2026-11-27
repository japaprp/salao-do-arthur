-- New salons must not expose checkout until Mercado Pago credentials are configured and tested.
ALTER TABLE `SalonSettings`
  ALTER COLUMN `enableCheckout` SET DEFAULT false;
