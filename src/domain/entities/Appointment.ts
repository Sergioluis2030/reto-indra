/**
 * Entidad de dominio: Appointment
 * Representa una cita médica agendada.
 * Inmutable después de creación (excepto status).
 */
export type AppointmentStatus = 'pending' | 'completed' | 'failed';

export type CountryISO = 'PE' | 'CL';

export interface AppointmentProps {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: CountryISO;
  status: AppointmentStatus;
  centerId?: number;
  specialtyId?: number;
  medicId?: number;
  date?: string;
  createdAt: string;
  updatedAt: string;
}

export class Appointment {
  private readonly props: AppointmentProps;

  private constructor(props: AppointmentProps) {
    this.props = { ...props };
  }

  static create(params: {
    appointmentId: string;
    insuredId: string;
    scheduleId: number;
    countryISO: CountryISO;
    centerId?: number;
    specialtyId?: number;
    medicId?: number;
    date?: string;
  }): Appointment {
    const now = new Date().toISOString();
    return new Appointment({
      ...params,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AppointmentProps): Appointment {
    return new Appointment(props);
  }

  get appointmentId(): string {
    return this.props.appointmentId;
  }

  get insuredId(): string {
    return this.props.insuredId;
  }

  get scheduleId(): number {
    return this.props.scheduleId;
  }

  get countryISO(): CountryISO {
    return this.props.countryISO;
  }

  get status(): AppointmentStatus {
    return this.props.status;
  }

  get centerId(): number | undefined {
    return this.props.centerId;
  }

  get specialtyId(): number | undefined {
    return this.props.specialtyId;
  }

  get medicId(): number | undefined {
    return this.props.medicId;
  }

  get date(): string | undefined {
    return this.props.date;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }

  /**
   * Marca la cita como completada (solo desde pending).
   * Aplica regla de negocio del dominio.
   */
  markAsCompleted(): Appointment {
    if (this.props.status !== 'pending') {
      throw new Error(`Cannot complete appointment in status: ${this.props.status}`);
    }
    return new Appointment({
      ...this.props,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
  }

  toPlainObject(): AppointmentProps {
    return { ...this.props };
  }
}
