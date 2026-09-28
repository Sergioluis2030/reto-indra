import { Appointment } from '../entities/Appointment';

/**
 * Puerto (Port) - Interfaz del repositorio de citas.
 * Define el contrato que deben implementar los adaptadores de infraestructura.
 * Principio de Inversión de Dependencias (SOLID - D).
 */
export interface IAppointmentRepository {
  /**
   * Guarda una nueva cita con estado pending.
   */
  save(appointment: Appointment): Promise<void>;

  /**
   * Busca todas las citas de un asegurado.
   */
  findByInsuredId(insuredId: string): Promise<Appointment[]>;

  /**
   * Busca una cita específica por insuredId + appointmentId.
   */
  findById(insuredId: string, appointmentId: string): Promise<Appointment | null>;

  /**
   * Actualiza el estado de una cita existente.
   */
  updateStatus(insuredId: string, appointmentId: string, status: 'completed' | 'failed'): Promise<void>;
}
