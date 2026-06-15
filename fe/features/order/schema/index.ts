import { z } from 'zod';

export const createOrderSchema = z
  .object({
    renterFullName: z.string().min(1, 'Vui long nhap ten nguoi thue'),
    renterPhoneNumber: z.string().optional(),
    renterAddress: z.string().optional(),
    rentalStartDate: z.string().min(1, 'Vui long chon ngay thue'),
    rentalEndDate: z.string().min(1, 'Vui long chon ngay tra'),
    items: z
      .array(
        z.object({
          productId: z.number().min(1, 'Vui long chon san pham'),
          quantity: z.number().min(1, 'So luong phai lon hon 0'),
        }),
      )
      .min(1, 'Vui long chon it nhat 1 san pham'),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.rentalStartDate || !data.rentalEndDate) {
      return;
    }

    if (data.rentalEndDate < data.rentalStartDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['rentalEndDate'],
        message: 'Ngay tra phai bang hoac sau ngay thue',
      });
    }
  });

export const returnOrderSchema = z
  .object({
    itemPenalties: z.array(
      z.object({
        productId: z.number().min(1, 'San pham khong hop le'),
        damagedQuantity: z.number().min(0, 'So luong hu hong khong duoc am'),
      }),
    ),
    extraPenaltyAmount: z.number().min(0, 'Phu phi khong duoc am'),
    extraPenaltyReason: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.extraPenaltyAmount > 0 && !data.extraPenaltyReason?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['extraPenaltyReason'],
        message: 'Vui long nhap ly do khi co phu phi khac',
      });
    }
  });

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type ReturnOrderFormData = z.infer<typeof returnOrderSchema>;
