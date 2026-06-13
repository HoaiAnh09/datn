'use client';

import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: reportApi.getDashboard,
  });
}
