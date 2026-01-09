/**
 * Configuración de Jest para pruebas unitarias
 *
 * Esta configuración también puede estar en package.json,
 * pero se proporciona como archivo separado para mayor claridad.
 */

// Cargar variables de entorno para pruebas
require('dotenv').config({ path: '.env.test' });

module.exports = {
  // Entorno de ejecución de Node.js
  testEnvironment: 'node',

  // Directorio donde se guardarán los reportes de cobertura
  coverageDirectory: 'coverage',

  // Patrones para archivos que deben incluirse en el reporte de cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],

  // Patrón para encontrar archivos de prueba
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Mostrar output detallado
  verbose: true,

  // Limpiar mocks automáticamente entre pruebas
  clearMocks: true,

  // Umbral de cobertura (opcional - descomenta para forzar cobertura mínima)
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80
  //   }
  // }
};
