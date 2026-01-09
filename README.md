# 🚀 Star Wars API Serverless (AWS)

API desarrollada con el **Framework Serverless** en Node.js que actúa como adaptador para la **Star Wars API (SWAPI)**. El sistema traduce las respuestas del inglés al español y permite la persistencia de datos personalizados en **Amazon DynamoDB**

## 📌 Estado del Proyecto: **Despliegue Exitoso** ✅

El proyecto se encuentra desplegado y operativo en la región `us-east-2`.

- **Base URL:** `https://eamnuj9jxi.execute-api.us-east-2.amazonaws.com/dev`
- **Infraestructura:** 4 Lambdas, 1 Tabla DynamoDB, API Gateway e IAM Roles configurados.

---

## 🛠️ Endpoints Disponibles

| Método   | Endpoint                 | Origen   | Descripción                                                     |
| :------- | :----------------------- | :------- | :-------------------------------------------------------------- |
| **GET**  | `/personajes/swapi/{id}` | SWAPI    | Obtiene un personaje de la API externa y traduce sus atributos. |
| **POST** | `/personajes`            | DynamoDB | Crea y almacena un nuevo personaje en la base de datos propia.  |
| **GET**  | `/personajes`            | DynamoDB | Lista todos los personajes almacenados localmente.              |
| **GET**  | `/personajes/{id}`       | DynamoDB | Obtiene un personaje específico por su ID único desde la BD.    |

---

## ⚠️ Nota sobre SWAPI Endpoint

El endpoint GET `/personajes/swapi/{id}` está retornando un error 403 Forbidden de SWAPI:

```json
{
  "error": "Internal Server Error",
  "mensaje": "Ocurrió un error al procesar la solicitud",
  "detalles": "Error de SWAPI: 403 - Forbidden"
}
```

## 📖 Documentación de la API (OpenAPI/Swagger)

Se incluye documentación técnica bajo el estándar **OpenAPI 3.0**:

- **Archivo:** `openapi.yml` (en la raíz del proyecto).
- **Visualización:** Copia el contenido en [Swagger Editor](https://editor.swagger.io/) para interactuar con los endpoints y revisar los esquemas traducidos.

---

## 📋 Requisitos del Reto Técnico

- **Traducción Automática:** Mapeo integral de atributos de inglés a español (ej: `name` → `nombre`, `eye_color` → `color_de_ojos`).
- **Infraestructura como Código:** Configuración reproducible mediante `serverless.yml`.
- **Persistencia NoSQL:** Integración con DynamoDB mediante el SDK v3 de AWS.
- **Calidad de Software:** Suite de pruebas unitarias con Jest y documentación de uso.

---

## ⚙️ Instalación y Ejecución Local

### 1. Clonar e Instalar dependencias

````bash
npm install
## Instalación

### 1. Instalar dependencias

```bash
npm install
````

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus configuraciones
```

## Pruebas Locales

### Serverless Offline

Ejecutar el servidor local:

```bash
npx serverless offline start
```

O usar el script npm:

```bash
npm run offline
```

El servidor se ejecutará en `http://localhost:3000`

## Pruebas Unitarias

El proyecto incluye pruebas unitarias completas usando Jest.

### Ejecutar todas las pruebas

```bash
npm test
```

### Generar reporte de cobertura

```bash
npm run test:coverage
```

---

## Documentación de API

La documentación completa de la API está disponible en formato OpenAPI 3.0:

```bash
openapi.yml
```

Puedes visualizar la documentación usando herramientas como:

- [Swagger Editor](https://editor.swagger.io/)
- [Stoplight Studio](https://stoplight.io/)
- Importar en Postman

---

## Despliegue a AWS

### Pre-requisitos

1. **Configurar AWS CLI**

```bash
aws configure
```

Proporciona:

- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-2`
- Output format: `json`

2. **Validar configuración antes de desplegar**

```bash
npm run validate
```

Este comando verifica que:

- Todos los handlers existen
- Las dependencias están instaladas
- Variables de entorno configuradas
- Estructura de directorios correcta

### Desplegar

#### Desarrollo (dev)

```bash
npm run deploy
# o
npm run deploy:dev
```

#### Staging

```bash
npm run deploy:staging
```

#### Producción

```bash
npm run deploy:prod
```

## Scripts Disponibles

### Testing

- `npm test`: Ejecuta las pruebas unitarias
- `npm run test:watch`: Ejecuta pruebas en modo watch (útil en desarrollo)
- `npm run test:coverage`: Genera reporte de cobertura de código

### Desarrollo Local

- `npm run offline`: Ejecuta servidor local con serverless-offline

### Despliegue

- `npm run validate`: Valida configuración antes de desplegar
- `npm run deploy`: Despliega a AWS (dev por defecto)
- `npm run deploy:dev`: Despliega al ambiente dev
- `npm run deploy:staging`: Despliega al ambiente staging
- `npm run deploy:prod`: Despliega al ambiente producción
- `npm run info`: Muestra información del despliegue
- `npm run remove`: Elimina el stack de AWS

### Logs

- `npm run logs {functionName}`: Ver logs de una función Lambda

## Estructura del Proyecto

```
├── src/
│   ├── handlers/       # Funciones Lambda
│   ├── services/       # Lógica de negocio
│   └── utils/          # Utilidades y mappers
├── tests/              # Pruebas unitarias
├── serverless.yml      # Configuración de Serverless
└── package.json
```

## Recursos AWS Creados

- **Lambda Functions**: Funciones serverless para los endpoints
- **DynamoDB Table**: `starwars-api-personajes-{stage}`
- **API Gateway**: Endpoints HTTP
- **IAM Roles**: Permisos para Lambda acceder a DynamoDB

## 🤖 Uso de Inteligencia Artificial

Este proyecto fue desarrollado utilizando **Claude Code** (Anthropic) como asistente de ingeniería.

- **Estrategia:** Se utilizó un archivo de contexto `CLAUDE.md` para guiar a la IA en las reglas de negocio, el mapeo de atributos y la arquitectura de AWS.
