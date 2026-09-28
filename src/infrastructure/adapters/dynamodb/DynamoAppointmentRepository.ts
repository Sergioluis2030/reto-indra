import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Appointment, AppointmentStatus } from '../../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../../domain/repositories/IAppointmentRepository';

/**
 * Adaptador DynamoDB que implementa el puerto IAppointmentRepository.
 * Hexagonal: Infrastructure → Domain (dependencia hacia adentro).
 */
export class DynamoAppointmentRepository implements IAppointmentRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName?: string) {
    const dynamoClient = new DynamoDBClient({});
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName || process.env.APPOINTMENTS_TABLE || 'rimac-appointments-dev';
  }

  async save(appointment: Appointment): Promise<void> {
    const item = appointment.toPlainObject();

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        // Evitar sobrescribir si ya existe (opcional)
        ConditionExpression: 'attribute_not_exists(appointmentId)',
      })
    );
  }

  async findByInsuredId(insuredId: string): Promise<Appointment[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'insuredId = :insuredId',
        ExpressionAttributeValues: {
          ':insuredId': insuredId,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) =>
      Appointment.reconstitute({
        appointmentId: item.appointmentId,
        insuredId: item.insuredId,
        scheduleId: item.scheduleId,
        countryISO: item.countryISO,
        status: item.status as AppointmentStatus,
        centerId: item.centerId,
        specialtyId: item.specialtyId,
        medicId: item.medicId,
        date: item.date,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })
    );
  }

  async findById(insuredId: string, appointmentId: string): Promise<Appointment | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          insuredId,
          appointmentId,
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    const item = result.Item;
    return Appointment.reconstitute({
      appointmentId: item.appointmentId,
      insuredId: item.insuredId,
      scheduleId: item.scheduleId,
      countryISO: item.countryISO,
      status: item.status as AppointmentStatus,
      centerId: item.centerId,
      specialtyId: item.specialtyId,
      medicId: item.medicId,
      date: item.date,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }

  async updateStatus(
    insuredId: string,
    appointmentId: string,
    status: 'completed' | 'failed'
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          insuredId,
          appointmentId,
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );
  }
}
