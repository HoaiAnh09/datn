import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  phoneNumber: z.string().min(1, 'Vui lòng nhập số điện thoại'),
  address: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
