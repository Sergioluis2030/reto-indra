import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentResponseDto } from '../dtos/CreateAppointmentDto';

/**
 * Caso de uso: Listar citas de un asegurado.
 */
export class GetAppointmentsByInsuredUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(insuredId: string): Promise<AppointmentResponseDto[]> {
    if (!/^\d{5}$/.test(insuredId)) {
      throw new Error('insuredId must be exactly 5 digits');
    }

    const appointments = await this.appointmentRepository.findByInsuredId(insuredId);

    return appointments.map((a) => a.toPlainObject());
  }
}
