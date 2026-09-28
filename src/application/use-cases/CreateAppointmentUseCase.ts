import { v4 as uuidv4 } from 'uuid';
import { Appointment, CountryISO } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IMessagePublisher } from '../../domain/repositories/IMessagePublisher';
import { CreateAppointmentDto, AppointmentResponseDto } from '../dtos/CreateAppointmentDto';

/**
 * Caso de uso: Crear una cita médica.
 * Orquesta el flujo de negocio:
 * 1. Validar + crear entidad de dominio
 * 2. Persistir en DynamoDB con status "pending"
 * 3. Publicar a SNS (filtrado por país)
 *
 * Principio de Responsabilidad Única (SOLID - S).
 * Depende solo de abstracciones (ports) → Inversión de Dependencias.
 */
export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly messagePublisher: IMessagePublisher
  ) {}

  async execute(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const appointment = Appointment.create({
      appointmentId: uuidv4(),
      insuredId: dto.insuredId,
      scheduleId: dto.scheduleId,
      countryISO: dto.countryISO as CountryISO,
      centerId: dto.centerId,
      specialtyId: dto.specialtyId,
      medicId: dto.medicId,
      date: dto.date,
    });

    // 1. Guardar en DynamoDB con estado pending
    await this.appointmentRepository.save(appointment);

    // 2. Publicar a SNS (el filtro de countryISO enruta al SQS correcto)
    await this.messagePublisher.publishAppointmentCreated(appointment);

    return {
      ...appointment.toPlainObject(),
      message: 'El agendamiento está en proceso',
    };
  }
}
