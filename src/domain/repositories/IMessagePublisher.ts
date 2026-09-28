import { Appointment } from '../entities/Appointment';

/**
 * Puerto para publicación de mensajes (SNS / EventBridge).
 */
export interface IMessagePublisher {
  /**
   * Publica el agendamiento hacia el tópico SNS (con atributo countryISO para filtro).
   */
  publishAppointmentCreated(appointment: Appointment): Promise<void>;

  /**
   * Publica el evento de confirmación (AppointmentCompleted) hacia EventBridge.
   */
  publishAppointmentCompleted(appointment: Appointment): Promise<void>;
}
