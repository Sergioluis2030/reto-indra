import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export interface CompleteAppointmentInput {
  insuredId: string;
  appointmentId: string;
}

/**
 * Caso de uso: Actualizar el estado de la cita a "completed".
 * Invocado cuando llega el mensaje de confirmación desde EventBridge → SQS.
 */
export class CompleteAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(input: CompleteAppointmentInput): Promise<void> {
    const appointment = await this.appointmentRepository.findById(
      input.insuredId,
      input.appointmentId
    );

    if (!appointment) {
      throw new Error(
        `Appointment not found: insuredId=${input.insuredId}, appointmentId=${input.appointmentId}`
      );
    }

    // Regla de dominio: solo se puede completar desde pending
    appointment.markAsCompleted();

    await this.appointmentRepository.updateStatus(
      input.insuredId,
      input.appointmentId,
      'completed'
    );
  }
}
