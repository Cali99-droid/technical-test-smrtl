/**
 * Servicio para interactuar con DynamoDB
 * Maneja operaciones CRUD para la tabla de Personajes
 */

const AWS = require('aws-sdk');

// Configurar DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION || 'us-east-2'
});

const TABLA_PERSONAJES = process.env.PERSONAJES_TABLE;

/**
 * Guarda un personaje en DynamoDB
 * @param {Object} personaje - Datos del personaje a guardar
 * @returns {Promise<Object>} Personaje guardado
 * @throws {Error} Si hay error al guardar
 */
const guardarPersonaje = async (personaje) => {
  try {
    if (!TABLA_PERSONAJES) {
      throw new Error('La variable de entorno PERSONAJES_TABLE no está configurada');
    }

    console.log(`[DynamoDB Service] Guardando personaje en tabla: ${TABLA_PERSONAJES}`);
    console.log(`[DynamoDB Service] Datos del personaje:`, JSON.stringify(personaje, null, 2));

    const params = {
      TableName: TABLA_PERSONAJES,
      Item: personaje,
      // Opcional: Evitar sobrescribir si el ID ya existe
      ConditionExpression: 'attribute_not_exists(id)'
    };

    await dynamoDB.put(params).promise();

    console.log(`[DynamoDB Service] Personaje guardado exitosamente con ID: ${personaje.id}`);

    return personaje;

  } catch (error) {
    console.error('[DynamoDB Service] Error al guardar personaje:', error);

    if (error.code === 'ConditionalCheckFailedException') {
      throw new Error(`Ya existe un personaje con el ID ${personaje.id}`);
    }

    throw new Error(`Error al guardar en DynamoDB: ${error.message}`);
  }
};

/**
 * Obtiene un personaje por ID desde DynamoDB
 * @param {string} id - ID del personaje
 * @returns {Promise<Object|null>} Personaje encontrado o null
 * @throws {Error} Si hay error al consultar
 */
const obtenerPersonajePorId = async (id) => {
  try {
    if (!TABLA_PERSONAJES) {
      throw new Error('La variable de entorno PERSONAJES_TABLE no está configurada');
    }

    console.log(`[DynamoDB Service] Buscando personaje con ID: ${id}`);

    const params = {
      TableName: TABLA_PERSONAJES,
      Key: { id }
    };

    const resultado = await dynamoDB.get(params).promise();

    if (!resultado.Item) {
      console.log(`[DynamoDB Service] Personaje con ID ${id} no encontrado`);
      return null;
    }

    console.log(`[DynamoDB Service] Personaje encontrado: ${resultado.Item.nombre || 'Sin nombre'}`);
    return resultado.Item;

  } catch (error) {
    console.error('[DynamoDB Service] Error al obtener personaje:', error);
    throw new Error(`Error al consultar DynamoDB: ${error.message}`);
  }
};

/**
 * Lista todos los personajes de DynamoDB
 * @param {number} limite - Límite de resultados (opcional)
 * @returns {Promise<Array>} Lista de personajes
 * @throws {Error} Si hay error al consultar
 */
const listarPersonajes = async (limite = 50) => {
  try {
    if (!TABLA_PERSONAJES) {
      throw new Error('La variable de entorno PERSONAJES_TABLE no está configurada');
    }

    console.log(`[DynamoDB Service] Listando personajes (límite: ${limite})`);

    const params = {
      TableName: TABLA_PERSONAJES,
      Limit: limite
    };

    const resultado = await dynamoDB.scan(params).promise();

    console.log(`[DynamoDB Service] Se encontraron ${resultado.Items.length} personajes`);

    return resultado.Items || [];

  } catch (error) {
    console.error('[DynamoDB Service] Error al listar personajes:', error);
    throw new Error(`Error al consultar DynamoDB: ${error.message}`);
  }
};

/**
 * Actualiza un personaje en DynamoDB
 * @param {string} id - ID del personaje
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Promise<Object>} Personaje actualizado
 * @throws {Error} Si hay error al actualizar
 */
const actualizarPersonaje = async (id, datosActualizados) => {
  try {
    if (!TABLA_PERSONAJES) {
      throw new Error('La variable de entorno PERSONAJES_TABLE no está configurada');
    }

    console.log(`[DynamoDB Service] Actualizando personaje con ID: ${id}`);

    // Construir expresión de actualización dinámica
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(datosActualizados).forEach((key, index) => {
      if (key !== 'id') { // No actualizar el ID
        const attributeName = `#attr${index}`;
        const attributeValue = `:val${index}`;

        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = datosActualizados[key];
      }
    });

    const params = {
      TableName: TABLA_PERSONAJES,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const resultado = await dynamoDB.update(params).promise();

    console.log(`[DynamoDB Service] Personaje actualizado exitosamente`);

    return resultado.Attributes;

  } catch (error) {
    console.error('[DynamoDB Service] Error al actualizar personaje:', error);
    throw new Error(`Error al actualizar en DynamoDB: ${error.message}`);
  }
};

/**
 * Elimina un personaje de DynamoDB
 * @param {string} id - ID del personaje
 * @returns {Promise<boolean>} true si se eliminó exitosamente
 * @throws {Error} Si hay error al eliminar
 */
const eliminarPersonaje = async (id) => {
  try {
    if (!TABLA_PERSONAJES) {
      throw new Error('La variable de entorno PERSONAJES_TABLE no está configurada');
    }

    console.log(`[DynamoDB Service] Eliminando personaje con ID: ${id}`);

    const params = {
      TableName: TABLA_PERSONAJES,
      Key: { id }
    };

    await dynamoDB.delete(params).promise();

    console.log(`[DynamoDB Service] Personaje eliminado exitosamente`);

    return true;

  } catch (error) {
    console.error('[DynamoDB Service] Error al eliminar personaje:', error);
    throw new Error(`Error al eliminar de DynamoDB: ${error.message}`);
  }
};

module.exports = {
  guardarPersonaje,
  obtenerPersonajePorId,
  listarPersonajes,
  actualizarPersonaje,
  eliminarPersonaje
};
