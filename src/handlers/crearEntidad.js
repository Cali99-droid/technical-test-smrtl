/**
 * Handler para crear un nuevo personaje en DynamoDB
 * Endpoint: POST /personajes
 */

const { v4: uuidv4 } = require('uuid');
const { guardarPersonaje } = require('../services/dynamoDBService');

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
 * Valida que el cuerpo de la petición no esté vacío
 * @param {string} body - Cuerpo de la petición
 * @returns {Object|null} Objeto parseado o null si es inválido
 */
const validarCuerpoRequest = (body) => {
  if (!body) {
    return { valido: false, error: 'El cuerpo de la petición está vacío' };
  }

  try {
    const datos = JSON.parse(body);

    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      return { valido: false, error: 'El cuerpo debe ser un objeto JSON válido' };
    }

    return { valido: true, datos };
  } catch (error) {
    return { valido: false, error: 'El cuerpo de la petición no es un JSON válido' };
  }
};

/**
 * Valida los campos obligatorios del personaje
 * @param {Object} personaje - Datos del personaje
 * @returns {Object} Resultado de la validación
 */
const validarCamposObligatorios = (personaje) => {
  const camposObligatorios = ['nombre'];
  const camposFaltantes = [];

  for (const campo of camposObligatorios) {
    if (!personaje[campo] || typeof personaje[campo] !== 'string' || personaje[campo].trim() === '') {
      camposFaltantes.push(campo);
    }
  }

  if (camposFaltantes.length > 0) {
    return {
      valido: false,
      error: 'Faltan campos obligatorios o están vacíos',
      camposFaltantes
    };
  }

  return { valido: true };
};

/**
 * Valida los tipos de datos de los campos opcionales
 * @param {Object} personaje - Datos del personaje
 * @returns {Object} Resultado de la validación
 */
const validarTiposDeDatos = (personaje) => {
  const erroresValidacion = [];

  // Campos que deben ser strings si están presentes
  const camposString = [
    'nombre', 'altura', 'masa', 'color_de_cabello',
    'color_de_piel', 'color_de_ojos', 'año_de_nacimiento',
    'genero', 'planeta_natal'
  ];

  for (const campo of camposString) {
    if (personaje[campo] !== undefined && typeof personaje[campo] !== 'string') {
      erroresValidacion.push(`El campo "${campo}" debe ser una cadena de texto`);
    }
  }

  // Campos que deben ser arrays si están presentes
  const camposArray = ['peliculas', 'especies', 'vehiculos', 'naves_espaciales'];

  for (const campo of camposArray) {
    if (personaje[campo] !== undefined && !Array.isArray(personaje[campo])) {
      erroresValidacion.push(`El campo "${campo}" debe ser un array`);
    }
  }

  // Validación de altura (debe ser numérica si está presente)
  if (personaje.altura && isNaN(personaje.altura)) {
    erroresValidacion.push('El campo "altura" debe contener un valor numérico');
  }

  // Validación de masa (debe ser numérica si está presente)
  if (personaje.masa && isNaN(personaje.masa)) {
    erroresValidacion.push('El campo "masa" debe contener un valor numérico');
  }

  // Validación de género (valores permitidos)
  if (personaje.genero) {
    const generosValidos = ['masculino', 'femenino', 'hermafrodita', 'n/a', 'desconocido'];
    if (!generosValidos.includes(personaje.genero.toLowerCase())) {
      erroresValidacion.push(
        `El campo "genero" debe ser uno de: ${generosValidos.join(', ')}`
      );
    }
  }

  if (erroresValidacion.length > 0) {
    return {
      valido: false,
      errores: erroresValidacion
    };
  }

  return { valido: true };
};

/**
 * Sanitiza y normaliza los datos del personaje
 * @param {Object} personaje - Datos del personaje
 * @returns {Object} Personaje sanitizado
 */
const sanitizarPersonaje = (personaje) => {
  const personajeSanitizado = { ...personaje };

  // Trimear todos los campos string
  for (const [key, value] of Object.entries(personajeSanitizado)) {
    if (typeof value === 'string') {
      personajeSanitizado[key] = value.trim();
    }
  }

  // Normalizar género a minúsculas
  if (personajeSanitizado.genero) {
    personajeSanitizado.genero = personajeSanitizado.genero.toLowerCase();
  }

  // Asegurar que arrays vacíos sean arrays
  const camposArray = ['peliculas', 'especies', 'vehiculos', 'naves_espaciales'];
  for (const campo of camposArray) {
    if (!personajeSanitizado[campo]) {
      personajeSanitizado[campo] = [];
    }
  }

  return personajeSanitizado;
};

/**
 * Handler principal para crear un personaje
 * @param {Object} event - Evento de API Gateway
 * @param {Object} context - Contexto de Lambda
 * @returns {Promise<Object>} Respuesta HTTP
 */
const handler = async (event, context) => {
  try {
    console.log('[POST Crear Personaje] Iniciando petición', {
      requestId: context.requestId
    });

    // VALIDACIÓN 1: Validar que el cuerpo no esté vacío
    const validacionCuerpo = validarCuerpoRequest(event.body);
    if (!validacionCuerpo.valido) {
      console.error('[POST Crear Personaje] Cuerpo inválido:', validacionCuerpo.error);
      return buildResponse(400, {
        error: 'Bad Request',
        mensaje: validacionCuerpo.error
      });
    }

    const datosPersonaje = validacionCuerpo.datos;

    // VALIDACIÓN 2: Validar campos obligatorios
    const validacionObligatorios = validarCamposObligatorios(datosPersonaje);
    if (!validacionObligatorios.valido) {
      console.error('[POST Crear Personaje] Campos obligatorios faltantes:', validacionObligatorios.camposFaltantes);
      return buildResponse(400, {
        error: 'Bad Request',
        mensaje: validacionObligatorios.error,
        camposFaltantes: validacionObligatorios.camposFaltantes,
        ejemplo: {
          nombre: 'Obi-Wan Kenobi',
          altura: '182',
          masa: '77',
          color_de_cabello: 'castaño',
          color_de_ojos: 'azul',
          genero: 'masculino'
        }
      });
    }

    // VALIDACIÓN 3: Validar tipos de datos
    const validacionTipos = validarTiposDeDatos(datosPersonaje);
    if (!validacionTipos.valido) {
      console.error('[POST Crear Personaje] Errores de validación de tipos:', validacionTipos.errores);
      return buildResponse(400, {
        error: 'Bad Request',
        mensaje: 'Errores de validación en los datos proporcionados',
        errores: validacionTipos.errores
      });
    }

    // SANITIZACIÓN: Limpiar y normalizar datos
    const personajeSanitizado = sanitizarPersonaje(datosPersonaje);

    // Generar ID único usando UUID v4
    const idUnico = uuidv4();
    personajeSanitizado.id = idUnico;

    // Agregar timestamps
    const timestamp = new Date().toISOString();
    personajeSanitizado.creado = timestamp;
    personajeSanitizado.actualizado = timestamp;

    console.log('[POST Crear Personaje] Guardando personaje:', personajeSanitizado.nombre);

    // Guardar en DynamoDB
    const personajeGuardado = await guardarPersonaje(personajeSanitizado);

    console.log('[POST Crear Personaje] Personaje guardado exitosamente con ID:', idUnico);

    // Retornar respuesta exitosa
    return buildResponse(201, {
      exito: true,
      mensaje: 'Personaje creado exitosamente',
      datos: personajeGuardado
    });

  } catch (error) {
    console.error('[POST Crear Personaje] Error:', error);

    // Manejar error de ID duplicado
    if (error.message && error.message.includes('Ya existe')) {
      return buildResponse(409, {
        error: 'Conflict',
        mensaje: error.message
      });
    }

    // Error general
    return buildResponse(500, {
      error: 'Internal Server Error',
      mensaje: 'Ocurrió un error al crear el personaje',
      detalles: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

module.exports = {
  handler,
  validarCamposObligatorios,
  validarTiposDeDatos,
  sanitizarPersonaje
};
