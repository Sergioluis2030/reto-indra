import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Helpers para respuestas HTTP consistentes.
 */
export function successResponse(body: unknown, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}

export function errorResponse(
  message: string,
  statusCode = 400,
  code = 'ERROR'
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      error: {
        code,
        message,
      },
    }),
  };
}
