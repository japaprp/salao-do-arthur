import { useQuery } from '@tanstack/react-query';
import apiClient, { api } from '@/lib/api/client';
import { normalizeReportsOverview } from '@/lib/api/normalizers';
import { ReportsOverview } from '@/types';

export const useReportsOverview = () =>
  useQuery<ReportsOverview>({
    queryKey: ['reports', 'overview'],
    queryFn: async () => normalizeReportsOverview(await api.get('/reports/overview')),
  });

export async function downloadReportsExport(format: 'pdf' | 'excel') {
  const response = await apiClient.get<Blob>(`/reports/export?format=${format}`, {
    responseType: 'blob',
  });
  const extension = format === 'pdf' ? 'pdf' : 'xls';
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `relatorio-barbearia-do-artur.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
