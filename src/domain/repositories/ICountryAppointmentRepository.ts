import { Appointment } from '../entities/Appointment';

/**
 * Puerto para persistencia en la base de datos del país (RDS MySQL).
 * Cada país tiene su propia implementación (Strategy Pattern).
 */
export interface ICountryAppointmentRepository {
  /**
   * Registra la cita en la base de datos MySQL del país correspondiente.
   */
  save(appointment: Appointment): Promise<void>;
}
