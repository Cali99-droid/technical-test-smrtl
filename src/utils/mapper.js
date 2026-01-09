/**
 * Utilidades para mapear y traducir datos de SWAPI del inglés al español
 */

/**
 * Mapa de traducción de campos de personaje (inglés -> español)
 */
const PERSONAJE_FIELD_MAP = {
  name: "nombre",
  height: "altura",
  mass: "masa",
  hair_color: "color_de_cabello",
  skin_color: "color_de_piel",
  eye_color: "color_de_ojos",
  birth_year: "año_de_nacimiento",
  gender: "genero",
  homeworld: "planeta_natal",
  films: "peliculas",
  species: "especies",
  vehicles: "vehiculos",
  starships: "naves_espaciales",
  created: "creado",
  edited: "editado",
  url: "url",
};

/**
 * Mapa de traducción de valores específicos
 */
const VALUE_TRANSLATIONS = {
  // Género
  male: "masculino",
  female: "femenino",
  "n/a": "n/a",
  none: "ninguno",
  hermaphrodite: "hermafrodita",

  // Otros valores comunes
  blue: "azul",
  blond: "rubio (testt)",
  unknown: "desconocido",
};

/**
 * Traduce un campo individual del inglés al español
 * @param {string} fieldName - Nombre del campo en inglés
 * @returns {string} Nombre del campo en español
 */
const translateFieldName = (fieldName) => {
  return PERSONAJE_FIELD_MAP[fieldName] || fieldName;
};

/**
 * Traduce un valor si existe una traducción específica
 * @param {any} value - Valor a traducir
 * @returns {any} Valor traducido o el original si no hay traducción
 */
const translateValue = (value) => {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    return VALUE_TRANSLATIONS[lowerValue] || value;
  }
  return value;
};

/**
 * Mapea un objeto de personaje de SWAPI traduciendo todos sus campos al español
 * @param {Object} personajeEnIngles - Objeto personaje en inglés desde SWAPI
 * @returns {Object} Objeto personaje con campos traducidos al español
 */
const mapPersonajeToEspanol = (personajeEnIngles) => {
  if (!personajeEnIngles || typeof personajeEnIngles !== "object") {
    return null;
  }

  const personajeEnEspanol = {};

  // Iterar sobre cada campo del objeto original
  for (const [campoIngles, valor] of Object.entries(personajeEnIngles)) {
    const campoEspanol = translateFieldName(campoIngles);

    // Si el valor es un array, traducir cada elemento
    if (Array.isArray(valor)) {
      personajeEnEspanol[campoEspanol] = valor.map(translateValue);
    } else {
      personajeEnEspanol[campoEspanol] = translateValue(valor);
    }
  }

  return personajeEnEspanol;
};

/**
 * Mapea múltiples personajes
 * @param {Array} personajes - Array de personajes en inglés
 * @returns {Array} Array de personajes traducidos al español
 */
const mapPersonajesToEspanol = (personajes) => {
  if (!Array.isArray(personajes)) {
    return [];
  }

  return personajes.map(mapPersonajeToEspanol).filter(Boolean);
};

/**
 * Extrae el ID de una URL de SWAPI
 * @param {string} url - URL de SWAPI (ej: https://swapi.py4e.com/api/people/1/)
 * @returns {string|null} ID extraído o null si no se encuentra
 */
const extractIdFromUrl = (url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const matches = url.match(/\/(\d+)\/?$/);
  return matches ? matches[1] : null;
};

module.exports = {
  mapPersonajeToEspanol,
  mapPersonajesToEspanol,
  translateFieldName,
  translateValue,
  extractIdFromUrl,
  PERSONAJE_FIELD_MAP,
  VALUE_TRANSLATIONS,
};
