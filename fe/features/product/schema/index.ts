import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  description: z.string().optional(),
  rentalPrice: z.number().min(0, 'Giá thuê không được âm'),
  depositAmount: z.number().min(0, 'Tiền đặt cọc không được âm'),
  damageFee: z.number().min(0, 'Phí phạt không được âm'),
  stockQuantity: z.number().min(0, 'Số lượng không được âm'),
  categoryId: z.number().nullable().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
