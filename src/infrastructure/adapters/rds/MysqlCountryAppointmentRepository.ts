import mysql from 'mysql2/promise';
import { Appointment } from '../../../domain/entities/Appointment';
import { ICountryAppointmentRepository } from '../../../domain/repositories/ICountryAppointmentRepository';

/**
 * Adaptador MySQL (RDS) para persistir la cita en la base de datos del país.
 * El mismo código sirve para PE y CL; la diferencia está en la conexión / schema
 * (o se puede parametrizar por país si se desea).
 *
 * Nota del reto: No es necesario crear el RDS por código. Se asume que ya existe.
 */
export class MysqlCountryAppointmentRepository implements ICountryAppointmentRepository {
  private pool: mysql.Pool | null = null;

  private getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: process.env.RDS_HOST || 'localhost',
        port: Number(process.env.RDS_PORT || 3306),
        user: process.env.RDS_USER || 'admin',
        password: process.env.RDS_PASSWORD || 'password',
        database: process.env.RDS_DATABASE || 'appointments',
        waitForConnections: true,
        connectionLimit: 5,
        // En Lambda es recomendable no mantener conexiones abiertas demasiado tiempo
        enableKeepAlive: true,
      });
    }
    return this.pool;
  }

  async save(appointment: Appointment): Promise<void> {
    const pool = this.getPool();
    const country = appointment.countryISO.toLowerCase();

    // Tabla por país (appointments_pe / appointments_cl) o una sola tabla con columna country.
    // Aquí usamos una sola tabla con countryISO para simplicidad.
    const sql = `
      INSERT INTO appointments (
        appointment_id,
        insured_id,
        schedule_id,
        country_iso,
        status,
        center_id,
        specialty_id,
        medic_id,
        appointment_date,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        updated_at = VALUES(updated_at)
    `;

    const plain = appointment.toPlainObject();

    await pool.execute(sql, [
      plain.appointmentId,
      plain.insuredId,
      plain.scheduleId,
      plain.countryISO,
      'registered', // estado en RDS (ya procesado por el país)
      plain.centerId ?? null,
      plain.specialtyId ?? null,
      plain.medicId ?? null,
      plain.date ?? null,
      plain.createdAt,
      new Date().toISOString(),
    ]);

    console.log(`[RDS-${country}] Appointment ${plain.appointmentId} saved successfully`);
  }
}
