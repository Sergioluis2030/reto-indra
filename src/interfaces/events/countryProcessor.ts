import { SQSEvent, SQSHandler } from 'aws-lambda';
import { Appointment, CountryISO } from '../../domain/entities/Appointment';
import { ProcessCountryAppointmentUseCase } from '../../application/use-cases/ProcessCountryAppointmentUseCase';
import { MysqlCountryAppointmentRepository } from '../../infrastructure/adapters/rds/MysqlCountryAppointmentRepository';
import { SnsMessagePublisher } from '../../infrastructure/adapters/sns/SnsMessagePublisher';

/**
 * Handler compartido para appointment_pe y appointment_cl.
 * Lee del SQS correspondiente, guarda en RDS y emite evento de confirmación.
 *
 * La variable de entorno COUNTRY_ISO diferencia el contexto (útil para logs).
 */
export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const countryISO = (process.env.COUNTRY_ISO || 'PE') as CountryISO;
  console.log(`[${countryISO}] Processing ${event.Records.length} messages`);

  const countryRepo = new MysqlCountryAppointmentRepository();
  const messagePublisher = new SnsMessagePublisher();
  const useCase = new ProcessCountryAppointmentUseCase(countryRepo, messagePublisher);

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);

      // Reconstituir la entidad de dominio
      const appointment = Appointment.reconstitute({
        appointmentId: body.appointmentId,
        insuredId: body.insuredId,
        scheduleId: body.scheduleId,
        countryISO: body.countryISO || countryISO,
        status: body.status || 'pending',
        centerId: body.centerId,
        specialtyId: body.specialtyId,
        medicId: body.medicId,
        date: body.date,
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: body.updatedAt || new Date().toISOString(),
      });

      await useCase.execute(appointment);
      console.log(`[${countryISO}] Successfully processed appointment ${appointment.appointmentId}`);
    } catch (error) {
      console.error(`[${countryISO}] Error processing record:`, error);
      // En producción se recomienda implementar partial batch response
      throw error; // para que el mensaje vuelva a la cola / DLQ
    }
  }
};
