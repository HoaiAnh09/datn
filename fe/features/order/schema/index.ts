import { z } from 'zod';

export const createOrderSchema = z.object({
  customerId: z.number().min(1, 'Vui lòng chọn khách hàng'),
  rentalStartDate: z.string().min(1, 'Vui lòng chọn ngày thuê'),
  rentalEndDate: z.string().min(1, 'Vui lòng chọn ngày trả'),
  items: z
    .array(
      z.object({
        productId: z.number().min(1, 'Vui lòng chọn sản phẩm'),
        quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
      })
    )
    .min(1, 'Vui lòng chọn ít nhất 1 sản phẩm'),
  note: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.rentalStartDate || !data.rentalEndDate) {
    return;
  }

  if (data.rentalEndDate < data.rentalStartDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['rentalEndDate'],
      message: 'Ngày trả phải bằng hoặc sau ngày thuê',
    });
  }
});

export const returnOrderSchema = z.object({
  itemPenalties: z.array(
    z.object({
      productId: z.number().min(1, 'Sản phẩm không hợp lệ'),
      damagedQuantity: z.number().min(0, 'Số lượng hư hỏng không được âm'),
    })
  ),
  extraPenaltyAmount: z.number().min(0, 'Phụ phí không được âm'),
  extraPenaltyReason: z.string().optional(),
  note: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.extraPenaltyAmount > 0 && !data.extraPenaltyReason?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['extraPenaltyReason'],
      message: 'Nhập lý do khi có phụ phí khác',
    });
  }
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type ReturnOrderFormData = z.infer<typeof returnOrderSchema>;
