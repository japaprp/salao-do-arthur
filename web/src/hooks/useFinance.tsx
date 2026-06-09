import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { FinanceOverview } from '@/types';

export type FinancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const useFinanceOverview = (period: FinancePeriod) =>
  useQuery<FinanceOverview>({
    queryKey: ['finance', 'overview', period],
    queryFn: async () => api.get<FinanceOverview>(`/finance/overview?period=${period}`),
  });

export const useCreateFinanceTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      type: 'INCOME' | 'EXPENSE';
      category: string;
      amount: number;
      description?: string;
    }) => api.post('/finance/transactions', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'overview'] });
    },
  });
};
