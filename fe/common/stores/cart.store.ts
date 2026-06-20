'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  id: string;
  productId: number;
  quantity: number;
  rentalStartDate: string;
  rentalEndDate: string;
}

interface CartState {
  lines: Record<string, CartLine>;
  addLine: (line: Omit<CartLine, 'id'>) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
}

function makeCartLineId(
  productId: number,
  rentalStartDate: string,
  rentalEndDate: string,
) {
  return `${productId}:${rentalStartDate}:${rentalEndDate}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: {},

      addLine: (line) =>
        set((state) => {
          const id = makeCartLineId(
            line.productId,
            line.rentalStartDate,
            line.rentalEndDate,
          );
          const existing = state.lines[id];

          return {
            lines: {
              ...state.lines,
              [id]: {
                id,
                ...line,
                quantity: existing ? existing.quantity + line.quantity : line.quantity,
              },
            },
          };
        }),

      updateQuantity: (lineId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const next = { ...state.lines };
            delete next[lineId];
            return { lines: next };
          }

          const existing = state.lines[lineId];
          if (!existing) {
            return state;
          }

          return {
            lines: {
              ...state.lines,
              [lineId]: {
                ...existing,
                quantity,
              },
            },
          };
        }),

      removeLine: (lineId) =>
        set((state) => {
          const next = { ...state.lines };
          delete next[lineId];
          return { lines: next };
        }),

      clearCart: () => set({ lines: {} }),
    }),
    {
      name: 'unico-cart',
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
