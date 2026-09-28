import { z } from 'zod';

/**
 * DTO + validación de entrada para crear una cita.
 * Usa Zod para validación robusta (principios de validación temprana).
 */
export const CreateAppointmentSchema = z.object({
  insuredId: z
    .string()
    .regex(/^\d{5}$/, 'insuredId must be exactly 5 digits (can have leading zeros)'),
  scheduleId: z.number().int().positive('scheduleId must be a positive integer'),
  countryISO: z.enum(['PE', 'CL'], {
    errorMap: () => ({ message: 'countryISO must be either PE or CL' }),
  }),
  // Campos opcionales del espacio (según ejemplo del reto)
  centerId: z.number().int().positive().optional(),
  specialtyId: z.number().int().positive().optional(),
  medicId: z.number().int().positive().optional(),
  date: z.string().datetime({ offset: true }).optional(),
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;

export interface AppointmentResponseDto {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: string;
  status: string;
  centerId?: number;
  specialtyId?: number;
  medicId?: number;
  date?: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
}
