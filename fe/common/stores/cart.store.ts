'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  productId: number;
  quantity: number;
}

interface CartState {
  lines: Record<number, CartLine>;
  startDate: string;
  endDate: string;
  addLine: (line: CartLine) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeLine: (productId: number) => void;
  setDates: (startDate: string, endDate: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: {},
      startDate: '',
      endDate: '',

      addLine: (line) =>
        set((state) => ({
          lines: {
            ...state.lines,
            [line.productId]: line,
          },
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const next = { ...state.lines };
            delete next[productId];
            return { lines: next };
          }
          const existing = state.lines[productId];
          if (!existing) return state;
          return {
            lines: {
              ...state.lines,
              [productId]: { ...existing, quantity },
            },
          };
        }),

      removeLine: (productId) =>
        set((state) => {
          const next = { ...state.lines };
          delete next[productId];
          return { lines: next };
        }),

      setDates: (startDate, endDate) => set({ startDate, endDate }),

      clearCart: () => set({ lines: {}, startDate: '', endDate: '' }),
    }),
    {
      name: 'unico-cart',
      partialize: (state) => ({
        lines: state.lines,
        startDate: state.startDate,
        endDate: state.endDate,
      }),
    },
  ),
);
