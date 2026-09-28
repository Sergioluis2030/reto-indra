import { Appointment } from '../../src/domain/entities/Appointment';

describe('Appointment Entity', () => {
  it('should create an appointment with status pending', () => {
    const appointment = Appointment.create({
      appointmentId: 'test-uuid',
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'PE',
      centerId: 4,
    });

    expect(appointment.status).toBe('pending');
    expect(appointment.insuredId).toBe('00123');
    expect(appointment.scheduleId).toBe(100);
    expect(appointment.countryISO).toBe('PE');
    expect(appointment.centerId).toBe(4);
    expect(appointment.createdAt).toBeDefined();
  });

  it('should mark as completed from pending', () => {
    const appointment = Appointment.create({
      appointmentId: 'test-uuid',
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'CL',
    });

    const completed = appointment.markAsCompleted();

    expect(completed.status).toBe('completed');
    expect(completed.updatedAt).not.toBe(appointment.updatedAt);
  });

  it('should throw when trying to complete a non-pending appointment', () => {
    const appointment = Appointment.create({
      appointmentId: 'test-uuid',
      insuredId: '00123',
      scheduleId: 100,
      countryISO: 'PE',
    });

    const completed = appointment.markAsCompleted();

    expect(() => completed.markAsCompleted()).toThrow(/Cannot complete appointment/);
  });
});
