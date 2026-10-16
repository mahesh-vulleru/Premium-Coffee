import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          issues,
        });
      }
      return res.status(400).json({ success: false, error: 'Malformed request body' });
    }
  };
}

export const ShippingAddressSchema = z.object({
  street: z.string().min(2, 'Street address is required'),
  apartment: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State / Province is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().default('USA'),
});

export const RegisterCustomerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  shippingAddress: ShippingAddressSchema,
});

export const RegisterWholesaleSchema = z.object({
  contactName: z.string().min(2, 'Contact person name is required'),
  businessName: z.string().min(2, 'Legal business name is required'),
  businessType: z.enum([
    'cafe',
    'restaurant',
    'office',
    'retailer',
    'hotel',
    'other',
  ]),
  taxId: z.string().min(3, 'Tax ID / EIN is required'),
  monthlyVolumeKg: z.string().min(1, 'Projected monthly volume is required'),
  email: z.string().email('Valid corporate email is required'),
  phone: z.string().min(7, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  deliveryAddress: ShippingAddressSchema,
});

export const RegisterAdminSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid work email is required'),
  password: z.string().min(8, 'Admin password must be at least 8 characters'),
  invitationToken: z.string().min(5, 'Mandatory invitation token is required'),
  department: z.string().optional().default('Operations'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

