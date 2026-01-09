/**
 * Handler para listar todos los personajes desde DynamoDB
 * Endpoint: GET /personajes
 */

const { listarPersonajes } = require('../services/dynamoDBService');

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
 * Handler principal para listar todos los personajes de DynamoDB
 * @param {Object} event - Evento de API Gateway
 * @param {Object} context - Contexto de Lambda
 * @returns {Promise<Object>} Respuesta HTTP
 */
const handler = async (event, context) => {
  try {
    console.log('[LIST Personajes DynamoDB] Iniciando petición', {
      requestId: context.requestId,
      queryStringParameters: event.queryStringParameters
    });

    // Extraer parámetros de query string (opcionales)
    const queryParams = event.queryStringParameters || {};
    let limite = parseInt(queryParams.limite || queryParams.limit || '50', 10);

    // Validar el límite
    if (isNaN(limite) || limite <= 0) {
      console.warn('[LIST Personajes DynamoDB] Límite inválido, usando valor por defecto');
      limite = 50;
    }

    // Establecer un máximo de 100 registros por petición
    if (limite > 100) {
      console.warn('[LIST Personajes DynamoDB] Límite excede el máximo, ajustando a 100');
      limite = 100;
    }

    console.log(`[LIST Personajes DynamoDB] Listando personajes con límite: ${limite}`);

    // Obtener personajes desde DynamoDB
    const personajes = await listarPersonajes(limite);

    console.log(`[LIST Personajes DynamoDB] Se encontraron ${personajes.length} personajes`);

    // Si no hay personajes, retornar lista vacía
    if (personajes.length === 0) {
      return buildResponse(200, {
        exito: true,
        mensaje: 'No hay personajes almacenados',
        total: 0,
        datos: []
      });
    }

    // Ordenar personajes por fecha de creación (más recientes primero)
    const personajesOrdenados = personajes.sort((a, b) => {
      if (!a.creado || !b.creado) return 0;
      return new Date(b.creado) - new Date(a.creado);
    });

    // Retornar lista de personajes
    return buildResponse(200, {
      exito: true,
      mensaje: 'Personajes obtenidos exitosamente',
      total: personajesOrdenados.length,
      limite: limite,
      datos: personajesOrdenados
    });

  } catch (error) {
    console.error('[LIST Personajes DynamoDB] Error:', error);

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
