/**
 * Handler para obtener un personaje desde DynamoDB
 * Endpoint: GET /personajes/{id}
 */

const { obtenerPersonajePorId } = require('../services/dynamoDBService');

/**
 * Construye una respuesta HTTP estándar
 * @param {number} statusCode - Código de estado HTTP
 * @param {Object} body - Cuerpo de la respuesta
 * @returns {Object} Respuesta formateada para API Gateway
 */
const buildResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body)
  };
};

/**
 * Handler principal para obtener un personaje de DynamoDB por ID
 * @param {Object} event - Evento de API Gateway
 * @param {Object} context - Contexto de Lambda
 * @returns {Promise<Object>} Respuesta HTTP
 */
const handler = async (event, context) => {
  try {
    console.log('[GET Personaje DynamoDB] Iniciando petición', {
      requestId: context.requestId,
      pathParameters: event.pathParameters
    });

    // Extraer el ID del personaje desde los path parameters
    const { id } = event.pathParameters || {};

    // Validar que el ID esté presente
    if (!id) {
      console.error('[GET Personaje DynamoDB] ID no proporcionado');
      return buildResponse(400, {
        error: 'Bad Request',
        mensaje: 'El ID del personaje es requerido',
        detalles: 'Debe proporcionar un ID válido en la ruta: /personajes/{id}'
      });
    }

    // Validar que el ID no esté vacío
    if (typeof id !== 'string' || id.trim() === '') {
      console.error('[GET Personaje DynamoDB] ID inválido:', id);
      return buildResponse(400, {
        error: 'Bad Request',
        mensaje: 'El ID del personaje debe ser una cadena válida',
        idRecibido: id
      });
    }

    console.log(`[GET Personaje DynamoDB] Buscando personaje con ID: ${id}`);

    // Obtener el personaje desde DynamoDB
    const personaje = await obtenerPersonajePorId(id);

    // Validar que se encontró el personaje
    if (!personaje) {
      console.error('[GET Personaje DynamoDB] Personaje no encontrado:', id);
      return buildResponse(404, {
        error: 'Not Found',
        mensaje: `No se encontró el personaje con ID ${id}`,
        idBuscado: id,
        sugerencia: 'Verifique que el ID sea correcto o cree un nuevo personaje usando POST /personajes'
      });
    }

    console.log('[GET Personaje DynamoDB] Personaje obtenido exitosamente:', personaje.nombre || 'Sin nombre');

    // Retornar el personaje encontrado
    return buildResponse(200, {
      exito: true,
      mensaje: 'Personaje obtenido exitosamente',
      datos: personaje
    });

  } catch (error) {
    console.error('[GET Personaje DynamoDB] Error:', error);

    // Manejar error de acceso a DynamoDB
    if (error.message && error.message.includes('DynamoDB')) {
      return buildResponse(503, {
        error: 'Service Unavailable',
        mensaje: 'No se pudo acceder a la base de datos',
        detalles: 'Error al consultar DynamoDB'
      });
    }

    // Manejar error de variable de entorno no configurada
    if (error.message && error.message.includes('variable de entorno')) {
      return buildResponse(500, {
        error: 'Internal Server Error',
        mensaje: 'Error de configuración del servidor',
        detalles: process.env.NODE_ENV === 'development' ? error.message : 'Configuración incompleta'
      });
    }

    // Manejar errores generales
    return buildResponse(500, {
      error: 'Internal Server Error',
      mensaje: 'Ocurrió un error al procesar la solicitud',
      detalles: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

module.exports = {
  handler
};
