# 🚀 Star Wars API Serverless (AWS)

> **Reto Técnico – Backend / Serverless**

API desarrollada con el **Framework Serverless** en Node.js que actúa como adaptador para la **Star Wars API (SWAPI)**. La solución traduce las respuestas del inglés al español y permite la persistencia de datos personalizados en **Amazon DynamoDB**, cumpliendo con los requisitos funcionales y técnicos del reto propuesto.

---

## 📌 Estado del Proyecto

**Despliegue exitoso y operativo** en AWS.

- **Región:** `us-east-2`
- **Base URL:** `https://eamnuj9jxi.execute-api.us-east-2.amazonaws.com/dev`
- **Infraestructura:**

  - 4 funciones AWS Lambda
  - 1 tabla DynamoDB
  - API Gateway (HTTP)
  - IAM Roles con permisos mínimos necesarios

---

## 🎯 Objetivo del Reto

Construir una API serverless que:

- Consuma la **Star Wars API (SWAPI)**.
- Traduza automáticamente los atributos de las respuestas al español.
- Permita crear y consultar personajes almacenados localmente.
- Utilice **Infraestructura como Código**.
- Incluya pruebas unitarias y documentación técnica.

---

## 🛠️ Endpoints Implementados

| Método   | Endpoint                 | Fuente   | Descripción                                                      |
| :------- | :----------------------- | :------- | :--------------------------------------------------------------- |
| **GET**  | `/personajes/swapi/{id}` | SWAPI    | Obtiene un personaje externo y traduce sus atributos al español. |
| **POST** | `/personajes`            | DynamoDB | Crea y almacena un nuevo personaje en la base de datos local.    |
| **GET**  | `/personajes`            | DynamoDB | Lista todos los personajes almacenados localmente.               |
| **GET**  | `/personajes/{id}`       | DynamoDB | Obtiene un personaje específico por su ID único.                 |

> **Nota:** Las operaciones **PUT** y **DELETE** no fueron implementadas al no ser requeridas explícitamente por el reto, pero la arquitectura las soporta sin cambios estructurales, las funciones par actualizar y eliminar estan disponibles.

---

## ⚠️ Consideración sobre SWAPI

El endpoint **GET** `/personajes/swapi/{id}` puede retornar un error **403 Forbidden** desde SWAPI, lo cual es un comportamiento externo a esta solución:

```json
{
  "error": "Internal Server Error",
  "mensaje": "Ocurrió un error al procesar la solicitud",
  "detalles": "Error de SWAPI: 403 - Forbidden"
}
```

La API maneja este escenario retornando un mensaje controlado y consistente.

---

## 📖 Documentación de la API

La documentación técnica fue definida bajo el estándar **OpenAPI 3.0**.

- **Archivo:** `openapi.yml` (raíz del proyecto)
- **Visualización:** Copiar el contenido en [Swagger Editor](https://editor.swagger.io/) para probar los endpoints y revisar los esquemas traducidos.

---

## 📋 Requisitos del Reto — Cumplimiento

- ✅ **Traducción automática de atributos** (ej.: `name` → `nombre`, `eye_color` → `color_de_ojos`).
- ✅ **Serverless Framework** con definición completa en `serverless.yml`.
- ✅ **Persistencia NoSQL** con DynamoDB (AWS SDK v3).
- ✅ **Pruebas unitarias** con Jest.
- ✅ **Documentación técnica** (README + OpenAPI).

---

## ⚙️ Ejecución Local

### 1. Instalación

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Configurar las credenciales necesarias para ejecución local.

---

## 🧪 Pruebas

### Serverless Offline

```bash
npm run offline
```

Servidor disponible en `http://localhost:3000`.

### Pruebas Unitarias

```bash
npm test
```

Cobertura:

```bash
npm run test:coverage
```

---

## 🚀 Despliegue

### Validación previa

```bash
npm run validate
```

### Ambientes

```bash
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod
```

---

## 🗂️ Estructura del Proyecto

```text
├── src/
│   ├── handlers/       # Funciones Lambda
│   ├── services/       # Lógica de negocio
│   └── utils/          # Mappers y utilidades
├── tests/              # Pruebas unitarias
├── openapi.yml         # Documentación OpenAPI
├── serverless.yml      # Infraestructura como código
└── package.json
```

---

## ☁️ Recursos AWS

- AWS Lambda
- Amazon DynamoDB
- Amazon API Gateway
- AWS IAM

---

## 🤖 Uso de IA en el Desarrollo

Este proyecto fue desarrollado con apoyo de **Claude Code (Anthropic)** como asistente de ingeniería.

- Se utilizó un archivo de contexto (`CLAUDE.md`) para asegurar coherencia en reglas de negocio, mapeo de atributos y arquitectura cloud.
