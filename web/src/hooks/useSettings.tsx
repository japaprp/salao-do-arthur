import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { SalonSettings } from '@/types';

export type SalonSettingsPayload = Partial<
  Pick<
    SalonSettings,
    | 'salonName'
    | 'legalName'
    | 'description'
    | 'phone'
    | 'whatsapp'
    | 'email'
    | 'timezone'
    | 'currency'
    | 'locale'
    | 'appointmentLeadTimeMinutes'
    | 'cancellationWindowHours'
    | 'allowWaitlist'
    | 'enableCheckout'
    | 'enableLoyalty'
    | 'enableReferrals'
    | 'enableProductCatalog'
    | 'instagram'
    | 'facebook'
    | 'tiktok'
    | 'privacyPolicyUrl'
  >
>;

export const useSalonSettings = () =>
  useQuery<SalonSettings>({
    queryKey: ['salon-settings'],
    queryFn: async () => normalizeSalonSettings(await api.get('/settings/salon')),
  });

export const useUpdateSalonSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SalonSettingsPayload) =>
      normalizeSalonSettings(await api.put('/settings/salon', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon-settings'] });
    },
  });
};

function normalizeSalonSettings(raw: unknown): SalonSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  return {
    id: String(value.id ?? ''),
    tenantId: String(value.tenantId ?? ''),
    salonName: String(value.salonName ?? 'Barbearia do Artur'),
    legalName: value.legalName == null ? null : String(value.legalName),
    description: value.description == null ? null : String(value.description),
    phone: value.phone == null ? null : String(value.phone),
    whatsapp: value.whatsapp == null ? null : String(value.whatsapp),
    email: value.email == null ? null : String(value.email),
    timezone: String(value.timezone ?? 'America/Sao_Paulo'),
    currency: String(value.currency ?? 'BRL'),
    locale: String(value.locale ?? 'pt-BR'),
    appointmentLeadTimeMinutes: toNumber(value.appointmentLeadTimeMinutes, 60),
    cancellationWindowHours: toNumber(value.cancellationWindowHours, 24),
    allowWaitlist: Boolean(value.allowWaitlist ?? true),
    enableCheckout: Boolean(value.enableCheckout ?? true),
    enableLoyalty: Boolean(value.enableLoyalty ?? true),
    enableReferrals: Boolean(value.enableReferrals ?? true),
    enableProductCatalog: Boolean(value.enableProductCatalog ?? true),
    primaryColor: value.primaryColor == null ? null : String(value.primaryColor),
    secondaryColor: value.secondaryColor == null ? null : String(value.secondaryColor),
    accentColor: value.accentColor == null ? null : String(value.accentColor),
    instagram: value.instagram == null ? null : String(value.instagram),
    facebook: value.facebook == null ? null : String(value.facebook),
    tiktok: value.tiktok == null ? null : String(value.tiktok),
    privacyPolicyUrl: value.privacyPolicyUrl == null ? null : String(value.privacyPolicyUrl),
    createdAt: String(value.createdAt ?? ''),
    updatedAt: String(value.updatedAt ?? ''),
  };
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === 'number' ? value : Number(value ?? fallback);
}
