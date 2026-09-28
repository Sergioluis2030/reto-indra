import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { Appointment } from '../../../domain/entities/Appointment';
import { IMessagePublisher } from '../../../domain/repositories/IMessagePublisher';

/**
 * Adaptador que publica mensajes a SNS y EventBridge.
 * Implementa el puerto IMessagePublisher.
 */
export class SnsMessagePublisher implements IMessagePublisher {
  private readonly snsClient: SNSClient;
  private readonly eventBridgeClient: EventBridgeClient;
  private readonly topicArn: string;
  private readonly eventBusName: string;

  constructor() {
    this.snsClient = new SNSClient({});
    this.eventBridgeClient = new EventBridgeClient({});
    this.topicArn = process.env.APPOINTMENT_TOPIC_ARN || '';
    this.eventBusName = process.env.EVENT_BUS_NAME || 'rimac-appointment-bus-dev';
  }

  async publishAppointmentCreated(appointment: Appointment): Promise<void> {
    const message = JSON.stringify(appointment.toPlainObject());

    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: message,
        // Atributo usado por el Filter Policy de SNS para enrutar a SQS_PE o SQS_CL
        MessageAttributes: {
          countryISO: {
            DataType: 'String',
            StringValue: appointment.countryISO,
          },
        },
      })
    );
  }

  async publishAppointmentCompleted(appointment: Appointment): Promise<void> {
    const detail = {
      insuredId: appointment.insuredId,
      appointmentId: appointment.appointmentId,
      scheduleId: appointment.scheduleId,
      countryISO: appointment.countryISO,
      status: 'completed',
    };

    await this.eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.eventBusName,
            Source: 'rimac.appointment',
            DetailType: 'AppointmentCompleted',
            Detail: JSON.stringify(detail),
          },
        ],
      })
    );
  }
}
