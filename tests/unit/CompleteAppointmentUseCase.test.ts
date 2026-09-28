import { CompleteAppointmentUseCase } from '../../src/application/use-cases/CompleteAppointmentUseCase';
import { Appointment } from '../../src/domain/entities/Appointment';
import { IAppointmentRepository } from '../../src/domain/repositories/IAppointmentRepository';

describe('CompleteAppointmentUseCase', () => {
  let mockRepo: jest.Mocked<IAppointmentRepository>;
  let useCase: CompleteAppointmentUseCase;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByInsuredId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new CompleteAppointmentUseCase(mockRepo);
  });

  it('should mark appointment as completed', async () => {
    const appointment = Appointment.create({
      appointmentId: 'uuid-1',
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'PE',
    });

    mockRepo.findById.mockResolvedValue(appointment);

    await useCase.execute({ insuredId: '00123', appointmentId: 'uuid-1' });

    expect(mockRepo.findById).toHaveBeenCalledWith('00123', 'uuid-1');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith('00123', 'uuid-1', 'completed');
  });

  it('should throw when appointment does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ insuredId: '00123', appointmentId: 'non-existent' })
    ).rejects.toThrow(/Appointment not found/);
  });
});
