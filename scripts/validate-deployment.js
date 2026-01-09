#!/usr/bin/env node

/**
 * Script de validación pre-despliegue
 * Verifica que todos los archivos y configuraciones estén correctos antes de desplegar
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

let hasErrors = false;
let hasWarnings = false;

// Verificar que el archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Leer archivo JSON
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return null;
  }
}

// Validaciones
log('\n🔍 Iniciando validación de configuración para despliegue...\n', 'blue');

// 1. Verificar serverless.yml
info('1. Verificando serverless.yml...');
if (fileExists('serverless.yml')) {
  success('serverless.yml encontrado');
} else {
  error('serverless.yml no encontrado');
  hasErrors = true;
}

// 2. Verificar package.json
info('\n2. Verificando package.json...');
const packageJson = readJSON('package.json');
if (packageJson) {
  success('package.json válido');

  // Verificar dependencias críticas
  const requiredDeps = ['aws-sdk', 'axios', 'uuid'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      success(`  - ${dep} instalado`);
    } else {
      error(`  - ${dep} NO encontrado en dependencies`);
      hasErrors = true;
    }
  });
} else {
  error('package.json inválido o no encontrado');
  hasErrors = true;
}

// 3. Verificar handlers
info('\n3. Verificando handlers de Lambda...');
const handlers = [
  { name: 'getPersonaje', path: 'src/handlers/getPersonaje.js' },
  { name: 'crearEntidad', path: 'src/handlers/crearEntidad.js' },
  { name: 'obtenerPersonaje', path: 'src/handlers/obtenerPersonaje.js' },
  { name: 'listarPersonajes', path: 'src/handlers/listarPersonajes.js' },
];

handlers.forEach(handler => {
  if (fileExists(handler.path)) {
    success(`  - ${handler.name}: ${handler.path}`);
  } else {
    error(`  - ${handler.name}: ${handler.path} NO encontrado`);
    hasErrors = true;
  }
});

// 4. Verificar servicios
info('\n4. Verificando servicios...');
const services = [
  'src/services/swapiService.js',
  'src/services/dynamoDBService.js',
];

services.forEach(service => {
  if (fileExists(service)) {
    success(`  - ${service}`);
  } else {
    error(`  - ${service} NO encontrado`);
    hasErrors = true;
  }
});

// 5. Verificar utils
info('\n5. Verificando utilidades...');
if (fileExists('src/utils/mapper.js')) {
  success('  - mapper.js');
} else {
  error('  - mapper.js NO encontrado');
  hasErrors = true;
}

// 6. Verificar variables de entorno
info('\n6. Verificando variables de entorno...');
if (fileExists('.env')) {
  success('.env encontrado');

  // Verificar que tenga las variables críticas
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'AWS_REGION',
    'PERSONAJES_TABLE',
    'STAGE',
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      success(`  - ${varName} configurado`);
    } else {
      warning(`  - ${varName} NO encontrado en .env`);
      hasWarnings = true;
    }
  });
} else {
  warning('.env no encontrado (se usarán valores por defecto)');
  hasWarnings = true;
}

// 7. Verificar node_modules
info('\n7. Verificando dependencias instaladas...');
if (fileExists('node_modules')) {
  success('node_modules encontrado');
} else {
  error('node_modules NO encontrado - ejecuta: npm install');
  hasErrors = true;
}

// 8. Verificar estructura de directorios
info('\n8. Verificando estructura de directorios...');
const requiredDirs = [
  'src',
  'src/handlers',
  'src/services',
  'src/utils',
  'tests',
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
    success(`  - ${dir}/`);
  } else {
    error(`  - ${dir}/ NO encontrado`);
    hasErrors = true;
  }
});

// 9. Verificar que no haya errores de sintaxis básicos
info('\n9. Verificando sintaxis de archivos...');
const jsFiles = [
  ...handlers.map(h => h.path),
  ...services,
  'src/utils/mapper.js',
];

jsFiles.forEach(file => {
  if (fileExists(file)) {
    try {
      require(path.resolve(file));
      success(`  - ${file} sintaxis OK`);
    } catch (err) {
      error(`  - ${file} tiene errores de sintaxis: ${err.message}`);
      hasErrors = true;
    }
  }
});

// 10. Verificar AWS CLI (opcional)
info('\n10. Verificando AWS CLI (opcional)...');
const { execSync } = require('child_process');
try {
  execSync('aws --version', { stdio: 'ignore' });
  success('AWS CLI instalado');
} catch (err) {
  warning('AWS CLI no encontrado - instala para configurar credenciales');
  hasWarnings = true;
}

// Resumen
log('\n' + '='.repeat(60), 'blue');
if (hasErrors) {
  error('\n❌ VALIDACIÓN FALLIDA - Corrige los errores antes de desplegar\n');
  process.exit(1);
} else if (hasWarnings) {
  warning('\n⚠️  VALIDACIÓN EXITOSA CON ADVERTENCIAS\n');
  info('Puedes desplegar, pero verifica las advertencias.\n');
  process.exit(0);
} else {
  success('\n✅ VALIDACIÓN EXITOSA - Listo para desplegar!\n');
  info('Ejecuta: sls deploy\n');
  process.exit(0);
}
