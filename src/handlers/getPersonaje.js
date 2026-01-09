/**
 * Handler para obtener personaje desde SWAPI
 * Endpoint: GET /personajes/swapi/{id}
 */

const { getPersonajeById } = require('../services/swapiService');

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
 * Handler principal para obtener un personaje de SWAPI
 * @param {Object} event - Evento de API Gateway
 * @param {Object} context - Contexto de Lambda
 * @returns {Promise<Object>} Respuesta HTTP
 */
const handler = async (event, context) => {
  try {
    console.log('[GET Personaje SWAPI] Iniciando petición', {
      requestId: context.requestId,
      pathParameters: event.pathParameters
    });

    // Extraer el ID del personaje desde los path parameters
    const { id } = event.pathParameters || {};

    // Validar que el ID esté presente
    if (!id) {
      console.error('[GET Personaje SWAPI] ID no proporcionado');
      return buildResponse(400, {
        error: 'Bad Request',
        mensaje: 'El ID del personaje es requerido',
        detalles: 'Debe proporcionar un ID válido en la ruta: /personajes/swapi/{id}'
      });
    }

    // Validar que el ID sea un número válido
    if (isNaN(id) || parseInt(id) <= 0) {
      console.error('[GET Personaje SWAPI] ID inválido:', id);
      return buildResponse(400, {
        error: 'Bad Request',
        mensaje: 'El ID del personaje debe ser un número positivo',
        idRecibido: id
      });
    }

    console.log(`[GET Personaje SWAPI] Obteniendo personaje con ID: ${id}`);

    // Llamar al servicio de SWAPI para obtener el personaje
    const personaje = await getPersonajeById(id);

    // Validar que se obtuvo el personaje
    if (!personaje) {
      console.error('[GET Personaje SWAPI] Personaje no encontrado:', id);
      return buildResponse(404, {
        error: 'Not Found',
        mensaje: `No se encontró el personaje con ID ${id} en SWAPI`,
        idBuscado: id
      });
    }

    console.log('[GET Personaje SWAPI] Personaje obtenido exitosamente:', personaje.nombre);

    // Retornar el personaje traducido
    return buildResponse(200, {
      exito: true,
      mensaje: 'Personaje obtenido exitosamente desde SWAPI',
      datos: personaje
    });

  } catch (error) {
    console.error('[GET Personaje SWAPI] Error:', error);

    // Manejar errores específicos de personaje no encontrado
    if (error.message && error.message.includes('no encontrado')) {
      return buildResponse(404, {
        error: 'Not Found',
        mensaje: error.message,
        idBuscado: event.pathParameters?.id
      });
    }

    // Manejar errores de conexión con SWAPI
    if (error.message && error.message.includes('conectar')) {
      return buildResponse(503, {
        error: 'Service Unavailable',
        mensaje: 'No se pudo conectar con el servicio de Star Wars',
        detalles: error.message
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
