import { z } from 'zod';

export const customerSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  phoneNumber: z.string().min(1, 'Số điện thoại không được để trống'),
  address: z.string().optional(),
  note: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
