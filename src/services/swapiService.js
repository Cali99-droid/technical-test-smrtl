/**
 * Servicio para interactuar con la API de Star Wars (SWAPI)
 * Documentación de SWAPI: https://swapi.py4e.com/documentation
 */

const axios = require("axios");
const { mapPersonajeToEspanol } = require("../utils/mapper");

// URL base de la API de SWAPI O ENV
const SWAPI_BASE_URL = "https://swapi.py4e.com/api";

/**
 * Obtiene un personaje por ID desde SWAPI y traduce los campos al español
 * @param {string|number} id - ID del personaje (1-83)
 * @returns {Promise<Object>} Personaje traducido al español
 * @throws {Error} Si el personaje no existe o hay error en la petición
 */
const getPersonajeById = async (id) => {
  try {
    // Validar que el ID sea válido
    if (!id || isNaN(id)) {
      throw new Error("El ID del personaje debe ser un número válido");
    }

    const url = `${SWAPI_BASE_URL}/people/${id}/`;

    console.log(
      `[SWAPI Service] Obteniendo personaje con ID: ${id} desde ${url}`
    );

    // Realizar petición HTTP GET a SWAPI
    const response = await axios.get(url, {
      timeout: 10000, // Timeout de 10 segundos
      headers: {
        Accept: "application/json",
      },
    });

    // Verificar que la respuesta sea exitosa
    if (response.status !== 200) {
      throw new Error(`Error al obtener personaje: HTTP ${response.status}`);
    }

    const personajeEnIngles = response.data;

    console.log(
      `[SWAPI Service] Personaje obtenido: ${personajeEnIngles.name}`
    );

    // Mapear/traducir los campos al español usando el mapper
    const personajeEnEspanol = mapPersonajeToEspanol(personajeEnIngles);

    return personajeEnEspanol;
  } catch (error) {
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      if (error.response.status === 404) {
        throw new Error(`Personaje con ID ${id} no encontrado en SWAPI`);
      }
      throw new Error(
        `Error de SWAPI: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      // La petición fue enviada pero no se recibió respuesta
      throw new Error(
        "No se pudo conectar con SWAPI. Verifica tu conexión a internet"
      );
    } else {
      // Algo sucedió al configurar la petición
      throw new Error(`Error al procesar la petición: ${error.message}`);
    }
  }
};

/**
 * Obtiene múltiples personajes por página desde SWAPI
 * @param {number} page - Número de página (por defecto 1)
 * @returns {Promise<Object>} Objeto con personajes traducidos y metadatos de paginación
 */
const getPersonajesPaginated = async (page = 1) => {
  try {
    const url = `${SWAPI_BASE_URL}/people/?page=${page}`;

    console.log(`[SWAPI Service] Obteniendo página ${page} de personajes`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
      },
    });

    const { count, next, previous, results } = response.data;

    // Traducir cada personaje
    const personajesTraducidos = results.map(mapPersonajeToEspanol);

    return {
      total: count,
      siguiente: next,
      anterior: previous,
      personajes: personajesTraducidos,
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Página ${page} no encontrada`);
    }
    throw new Error(`Error al obtener personajes: ${error.message}`);
  }
};

/**
 * Busca personajes por nombre en SWAPI
 * @param {string} nombre - Nombre del personaje a buscar
 * @returns {Promise<Array>} Array de personajes traducidos que coinciden con la búsqueda
 */
const searchPersonajeByName = async (nombre) => {
  try {
    if (!nombre || typeof nombre !== "string") {
      throw new Error("El nombre de búsqueda debe ser una cadena válida");
    }

    const url = `${SWAPI_BASE_URL}/people/?search=${encodeURIComponent(
      nombre
    )}`;

    console.log(`[SWAPI Service] Buscando personajes con nombre: ${nombre}`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
      },
    });

    const { results } = response.data;

    // Traducir los resultados
    const personajesEncontrados = results.map(mapPersonajeToEspanol);

    return personajesEncontrados;
  } catch (error) {
    throw new Error(`Error al buscar personaje: ${error.message}`);
  }
};

module.exports = {
  getPersonajeById,
  getPersonajesPaginated,
  searchPersonajeByName,
};
