/**
 * Configuración de Variables de Entorno
 *
 * Este módulo carga y valida las variables de entorno necesarias
 * para el funcionamiento de la aplicación.
 */

// Cargar variables de entorno desde archivo .env (solo en desarrollo local)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}

/**
 * Obtiene una variable de entorno con valor por defecto opcional
 * @param {string} key - Nombre de la variable de entorno
 * @param {string} defaultValue - Valor por defecto si no existe
 * @returns {string} Valor de la variable de entorno
 */
const getEnvVar = (key, defaultValue = '') => {
  return process.env[key] || defaultValue;
};

/**
 * Obtiene una variable de entorno requerida
 * @param {string} key - Nombre de la variable de entorno
 * @throws {Error} Si la variable no está definida
 * @returns {string} Valor de la variable de entorno
 */
const getRequiredEnvVar = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable de entorno requerida no encontrada: ${key}`);
  }
  return value;
};

/**
 * Configuración de la aplicación
 */
const config = {
  // AWS Configuration
  aws: {
    region: getEnvVar('AWS_REGION', 'us-east-2'),
    personajesTable: getEnvVar('PERSONAJES_TABLE', 'starwars-api-personajes-dev'),
    dynamoDbEndpoint: getEnvVar('DYNAMODB_ENDPOINT', null), // Para DynamoDB Local
  },

  // Application Configuration
  app: {
    stage: getEnvVar('STAGE', 'dev'),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
  },

  // SWAPI Configuration
  swapi: {
    baseUrl: getEnvVar('SWAPI_BASE_URL', 'https://swapi.py4e.com/api'),
    timeout: parseInt(getEnvVar('SWAPI_TIMEOUT', '10000'), 10),
  },

  // Feature Flags (opcional para futuras funcionalidades)
  features: {
    enableCache: getEnvVar('ENABLE_CACHE', 'false') === 'true',
    enableMetrics: getEnvVar('ENABLE_METRICS', 'false') === 'true',
  },

  // Helper functions
  isDevelopment: () => config.app.nodeEnv === 'development',
  isProduction: () => config.app.nodeEnv === 'production',
  isTest: () => config.app.nodeEnv === 'test',
};

/**
 * Valida que todas las variables de entorno críticas estén configuradas
 * @throws {Error} Si falta alguna variable crítica
 */
const validateConfig = () => {
  const requiredVars = [
    'PERSONAJES_TABLE',
    'AWS_REGION',
  ];

  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName] && !config.aws[varName.toLowerCase().replace('_', '')]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[Config Warning] Variables de entorno faltantes: ${missing.join(', ')}\n` +
      'Usando valores por defecto. Esto puede causar problemas en producción.'
    );
  }
};

// Validar configuración al cargar el módulo (solo en desarrollo)
if (!config.isTest()) {
  validateConfig();
}

// Logging de configuración en modo debug
if (config.app.logLevel === 'debug') {
  console.log('[Config] Configuración cargada:', JSON.stringify(config, null, 2));
}

module.exports = config;
