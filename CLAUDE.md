# Reto Técnico: Full Stack AWS - Star Wars API

## Descripción del Proyecto

Desarrollar una API con el Framework Serverless en Node.js que actúe como un adaptador para la Star Wars API (SWAPI) y permita la persistencia de datos en AWS DynamoDB.

## Requerimientos Técnicos Obligatorios

- Framework: Serverless Framework.
- Lenguaje: Node.js.
- Base de Datos: Amazon DynamoDB.
- Mapeo de Modelos: Traducir todos los atributos del inglés al español (ej. name -> nombre, height -> altura).
- Integración SWAPI: Implementar al menos un endpoint GET que consuma la API externa y devuelva los datos traducidos.
- Persistencia: Implementar un endpoint POST que guarde un modelo personalizado en DynamoDB.
- El despliegue debe ser funcional mediante el comando 'sls deploy'.

## Estructura de Archivos Deseada

- /src/handlers: Controladores de las funciones Lambda.
- /src/services: Lógica de negocio e integraciones externas.
- /src/utils: Funciones de mapeo y transformación de datos.
- /tests: Pruebas unitarias.

## Reglas de Oro

- Mantener el código limpio (Clean Code).
- Documentar cada función y endpoint.
- Asegurar que el tipado de datos sea consistente.
