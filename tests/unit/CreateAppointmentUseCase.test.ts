import { CreateAppointmentUseCase } from '../../src/application/use-cases/CreateAppointmentUseCase';
import { Appointment } from '../../src/domain/entities/Appointment';
import { IAppointmentRepository } from '../../src/domain/repositories/IAppointmentRepository';
import { IMessagePublisher } from '../../src/domain/repositories/IMessagePublisher';
import { CreateAppointmentDto } from '../../src/application/dtos/CreateAppointmentDto';

describe('CreateAppointmentUseCase', () => {
  let mockRepo: jest.Mocked<IAppointmentRepository>;
  let mockPublisher: jest.Mocked<IMessagePublisher>;
  let useCase: CreateAppointmentUseCase;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByInsuredId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockPublisher = {
      publishAppointmentCreated: jest.fn().mockResolvedValue(undefined),
      publishAppointmentCompleted: jest.fn(),
    };

    useCase = new CreateAppointmentUseCase(mockRepo, mockPublisher);
  });

  it('should create an appointment with status pending and publish to SNS', async () => {
    const dto: CreateAppointmentDto = {
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'PE',
      centerId: 4,
      specialtyId: 3,
      medicId: 4,
      date: '2024-09-30T12:30:00Z',
    };

    const result = await useCase.execute(dto);

    expect(result.insuredId).toBe('00123');
    expect(result.scheduleId).toBe(100);
    expect(result.countryISO).toBe('PE');
    expect(result.status).toBe('pending');
    expect(result.message).toBe('El agendamiento está en proceso');
    expect(result.appointmentId).toBeDefined();

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockPublisher.publishAppointmentCreated).toHaveBeenCalledTimes(1);

    const savedAppointment = mockRepo.save.mock.calls[0][0] as Appointment;
    expect(savedAppointment.status).toBe('pending');
    expect(savedAppointment.countryISO).toBe('PE');
  });

  it('should work for Chile (CL)', async () => {
    const dto: CreateAppointmentDto = {
      insuredId: '00999',
      scheduleId: 200,
      countryISO: 'CL',
    };

    const result = await useCase.execute(dto);

    expect(result.countryISO).toBe('CL');
    expect(result.status).toBe('pending');
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockPublisher.publishAppointmentCreated).toHaveBeenCalled();
  });
});
