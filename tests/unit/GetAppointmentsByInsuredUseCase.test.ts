import { GetAppointmentsByInsuredUseCase } from '../../src/application/use-cases/GetAppointmentsByInsuredUseCase';
import { Appointment } from '../../src/domain/entities/Appointment';
import { IAppointmentRepository } from '../../src/domain/repositories/IAppointmentRepository';

describe('GetAppointmentsByInsuredUseCase', () => {
  let mockRepo: jest.Mocked<IAppointmentRepository>;
  let useCase: GetAppointmentsByInsuredUseCase;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByInsuredId: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new GetAppointmentsByInsuredUseCase(mockRepo);
  });

  it('should return list of appointments for a valid insuredId', async () => {
    const mockAppointments = [
      Appointment.create({
        appointmentId: 'uuid-1',
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE',
      }),
      Appointment.create({
        appointmentId: 'uuid-2',
        insuredId: '00123',
        scheduleId: 101,
        countryISO: 'CL',
      }),
    ];

    mockRepo.findByInsuredId.mockResolvedValue(mockAppointments);

    const result = await useCase.execute('00123');

    expect(result).toHaveLength(2);
    expect(result[0].insuredId).toBe('00123');
    expect(mockRepo.findByInsuredId).toHaveBeenCalledWith('00123');
  });

  it('should throw error for invalid insuredId format', async () => {
    await expect(useCase.execute('123')).rejects.toThrow('insuredId must be exactly 5 digits');
    await expect(useCase.execute('abcde')).rejects.toThrow('insuredId must be exactly 5 digits');
  });

  it('should return empty array when no appointments found', async () => {
    mockRepo.findByInsuredId.mockResolvedValue([]);
    const result = await useCase.execute('00000');
    expect(result).toEqual([]);
  });
});
