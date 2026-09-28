import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  SQSEvent,
  SQSHandler,
  Handler,
} from 'aws-lambda';
import { CreateAppointmentSchema } from '../../application/dtos/CreateAppointmentDto';
import { CreateAppointmentUseCase } from '../../application/use-cases/CreateAppointmentUseCase';
import { GetAppointmentsByInsuredUseCase } from '../../application/use-cases/GetAppointmentsByInsuredUseCase';
import { CompleteAppointmentUseCase } from '../../application/use-cases/CompleteAppointmentUseCase';
import { DynamoAppointmentRepository } from '../../infrastructure/adapters/dynamodb/DynamoAppointmentRepository';
import { SnsMessagePublisher } from '../../infrastructure/adapters/sns/SnsMessagePublisher';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { ValidationError, AppError } from '../../shared/errors/AppError';

/**
 * Factory simple de dependencias (puede evolucionar a un contenedor IoC).
 */
function buildDependencies() {
  const appointmentRepo = new DynamoAppointmentRepository();
  const messagePublisher = new SnsMessagePublisher();

  return {
    createAppointment: new CreateAppointmentUseCase(appointmentRepo, messagePublisher),
    getAppointments: new GetAppointmentsByInsuredUseCase(appointmentRepo),
    completeAppointment: new CompleteAppointmentUseCase(appointmentRepo),
  };
}

/**
 * Handler principal del lambda "appointment".
 * Soporta:
 *  - HTTP POST /appointments  → crear cita
 *  - HTTP GET  /appointments/{insuredId} → listar citas
 *  - SQS (cola de confirmación) → actualizar estado a completed
 */
export const handler: Handler = async (
  event: APIGatewayProxyEvent | SQSEvent
): Promise<APIGatewayProxyResult | void> => {
  // Detectar si es evento SQS (confirmación)
  if ('Records' in event && Array.isArray(event.Records) && event.Records[0]?.eventSource === 'aws:sqs') {
    return handleConfirmationSqs(event as SQSEvent);
  }

  // Evento HTTP (API Gateway)
  return handleHttp(event as APIGatewayProxyEvent);
};

async function handleHttp(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const deps = buildDependencies();
  const method = event.httpMethod?.toUpperCase();
  const path = event.path || event.resource || '';

  try {
    // POST /appointments
    if (method === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const parseResult = CreateAppointmentSchema.safeParse(body);

      if (!parseResult.success) {
        const messages = parseResult.error.errors.map((e) => e.message).join('; ');
        throw new ValidationError(messages);
      }

      const result = await deps.createAppointment.execute(parseResult.data);
      return successResponse(result, 201);
    }

    // GET /appointments/{insuredId}
    if (method === 'GET') {
      const insuredId =
        event.pathParameters?.insuredId ||
        event.pathParameters?.proxy ||
        '';

      if (!insuredId) {
        throw new ValidationError('insuredId is required in the path');
      }

      const appointments = await deps.getAppointments.execute(insuredId);
      return successResponse({
        insuredId,
        count: appointments.length,
        appointments,
      });
    }

    return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  } catch (error: unknown) {
    console.error('HTTP handler error:', error);

    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    if (error instanceof Error) {
      return errorResponse(error.message, 500, 'INTERNAL_ERROR');
    }

    return errorResponse('Unexpected error', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Procesa mensajes de la cola de confirmación (EventBridge → SQS).
 * Actualiza el estado de la cita a "completed" en DynamoDB.
 */
async function handleConfirmationSqs(event: SQSEvent): Promise<void> {
  const deps = buildDependencies();

  for (const record of event.Records) {
    try {
      // El mensaje de EventBridge llega envuelto
      let body: any = JSON.parse(record.body);

      // Si viene desde EventBridge, el detalle está en "detail"
      if (body.detail) {
        body = typeof body.detail === 'string' ? JSON.parse(body.detail) : body.detail;
      }

      const { insuredId, appointmentId } = body;

      if (!insuredId || !appointmentId) {
        console.warn('Invalid confirmation message, missing keys:', body);
        continue;
      }

      await deps.completeAppointment.execute({ insuredId, appointmentId });
      console.log(`Appointment ${appointmentId} marked as completed for insured ${insuredId}`);
    } catch (err) {
      console.error('Error processing confirmation record:', err);
      // No re-lanzamos para no bloquear el batch (en producción se puede usar partial batch failure)
    }
  }
}
