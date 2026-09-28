import { Appointment } from '../../domain/entities/Appointment';
import { ICountryAppointmentRepository } from '../../domain/repositories/ICountryAppointmentRepository';
import { IMessagePublisher } from '../../domain/repositories/IMessagePublisher';

/**
 * Caso de uso: Procesar la cita en el país correspondiente.
 * 1. Guarda en RDS MySQL del país
 * 2. Emite evento AppointmentCompleted vía EventBridge
 *
 * Se usa el mismo use case para PE y CL (la diferencia está en el adaptador de RDS).
 * Strategy Pattern a nivel de repositorio.
 */
export class ProcessCountryAppointmentUseCase {
  constructor(
    private readonly countryRepository: ICountryAppointmentRepository,
    private readonly messagePublisher: IMessagePublisher
  ) {}

  async execute(appointment: Appointment): Promise<void> {
    // 1. Registrar en la base de datos MySQL del país
    await this.countryRepository.save(appointment);

    // 2. Emitir confirmación hacia EventBridge → SQS de confirmación
    await this.messagePublisher.publishAppointmentCompleted(appointment);
  }
}
