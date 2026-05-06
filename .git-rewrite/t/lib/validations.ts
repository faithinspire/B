import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['customer', 'braider']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const braiderProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  travel_radius_miles: z.number().min(1).max(100),
  is_mobile: z.boolean(),
  salon_address: z.string().optional(),
  cancellation_policy: z.string().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  category: z.enum(['box_braids', 'knotless', 'cornrows', 'locs', 'twists', 'kids', 'other']),
  duration_minutes: z.number().min(15).max(480),
  price: z.number().min(0.01),
});

export const bookingSchema = z.object({
  service_id: z.string().uuid(),
  appointment_date: z.string().datetime(),
  location_address: z.string().optional(),
  notes: z.string().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const disputeSchema = z.object({
  reason: z.enum(['service_not_delivered', 'quality_issue', 'safety_concern', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  evidence_urls: z.array(z.string().url()).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BraiderProfileInput = z.infer<typeof braiderProfileSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type DisputeInput = z.infer<typeof disputeSchema>;
