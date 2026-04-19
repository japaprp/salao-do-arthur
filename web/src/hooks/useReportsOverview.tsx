import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { normalizeReportsOverview } from '@/lib/api/normalizers';
import { ReportsOverview } from '@/types';

export const useReportsOverview = () =>
  useQuery<ReportsOverview>({
    queryKey: ['reports', 'overview'],
    queryFn: async () => normalizeReportsOverview(await api.get('/reports/overview')),
  });
