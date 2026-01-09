# Análisis de serverless.yml - Preparación para Despliegue

## ✅ Configuración Actual - Estado: LISTO PARA DESPLEGAR

### 1. Tabla DynamoDB ✅
**Ubicación**: `resources.Resources.PersonajesTable` (líneas 85-100)

**Configuración actual:**
```yaml
PersonajesTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: starwars-api-personajes-{stage}
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: id
        AttributeType: S
    KeySchema:
      - AttributeName: id
        KeyType: HASH
```

**Evaluación:**
- ✅ Tipo correcto: `AWS::DynamoDB::Table`
- ✅ Nombre dinámico basado en stage
- ✅ `BillingMode: PAY_PER_REQUEST` (sin necesidad de configurar capacidad)
- ✅ Partition key `id` de tipo String (correcto para UUIDs)
- ✅ Tags configurados para Environment y Service
- ✅ Output configurado para referenciar la tabla

**Resultado:** La tabla se creará correctamente en el despliegue.

---

### 2. Permisos IAM ✅
**Ubicación**: `provider.iamRoleStatements` (líneas 18-28)

**Permisos configurados:**
```yaml
iamRoleStatements:
  - Effect: Allow
    Action:
      - dynamodb:PutItem      # Para POST /personajes
      - dynamodb:GetItem      # Para GET /personajes/{id}
      - dynamodb:Query        # Para consultas avanzadas
      - dynamodb:Scan         # Para GET /personajes (list)
      - dynamodb:UpdateItem   # Para futuras actualizaciones
      - dynamodb:DeleteItem   # Para futuras eliminaciones
    Resource:
      - arn:aws:dynamodb:${region}:*:table/${tableName}
```

**Evaluación:**
- ✅ Permisos suficientes para todas las operaciones CRUD
- ✅ Resource ARN correctamente formateado
- ✅ Usa variables dinámicas para región y tabla
- ✅ Todos los handlers podrán acceder a DynamoDB

**Resultado:** No habrá errores de permisos al ejecutar las funciones.

---

### 3. Variables de Entorno ✅
**Ubicación**: `provider.environment` (líneas 10-15)

**Variables configuradas:**
- ✅ `PERSONAJES_TABLE`: Apunta a la tabla creada
- ✅ `REGION`: Región de AWS
- ✅ `NODE_ENV`: Ambiente de Node.js
- ✅ `SWAPI_BASE_URL`: URL de SWAPI
- ✅ `SWAPI_TIMEOUT`: Timeout para peticiones

**Resultado:** Todas las Lambdas tendrán acceso a las variables necesarias.

---

### 4. Funciones Lambda ✅
**Funciones definidas:**

1. **getPersonajeSWAPI** → `src/handlers/getPersonaje.handler` ✅
2. **createPersonaje** → `src/handlers/crearEntidad.handler` ✅
3. **listPersonajes** → `src/handlers/listarPersonajes.handler` ✅
4. **getPersonaje** → `src/handlers/obtenerPersonaje.handler` ✅

**Evaluación:**
- ✅ Todos los handlers existen en el filesystem
- ✅ Todos tienen eventos HTTP configurados
- ✅ CORS habilitado en todos los endpoints
- ✅ Paths correctamente definidos

---

### 5. API Gateway ✅
**Configuración:**
- ✅ Eventos HTTP configurados en cada función
- ✅ CORS habilitado (`cors: true`)
- ✅ Métodos HTTP correctos (GET, POST)
- ✅ Paths con parámetros bien definidos (`{id}`)

**Endpoints que se crearán:**
- `GET /personajes/swapi/{id}`
- `POST /personajes`
- `GET /personajes`
- `GET /personajes/{id}`

---

## 🔧 Mejoras Opcionales (No bloqueantes)

Estas mejoras son opcionales pero recomendadas para producción:

### 1. Configuración de Logs en CloudWatch
```yaml
provider:
  logs:
    restApi: true
  tracing:
    lambda: true
    apiGateway: true
```

### 2. Timeouts y Memoria
```yaml
provider:
  timeout: 30  # 30 segundos por defecto
  memorySize: 256  # 256 MB por defecto
```

### 3. API Gateway CORS Avanzado
```yaml
provider:
  httpApi:
    cors:
      allowedOrigins:
        - '*'
      allowedHeaders:
        - Content-Type
        - Authorization
      allowedMethods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
```

### 4. Tags Globales
```yaml
provider:
  tags:
    Project: StarWarsAPI
    ManagedBy: Serverless
```

### 5. DependsOn para Lambdas
```yaml
functions:
  createPersonaje:
    handler: src/handlers/crearEntidad.handler
    dependsOn:
      - PersonajesTable  # Espera a que la tabla exista
```

---

## 📋 Checklist de Pre-Despliegue

### Configuración AWS
- [ ] Credenciales AWS configuradas (`aws configure`)
- [ ] Región correcta en `.env` (us-east-2)
- [ ] Permisos IAM del usuario que despliega:
  - ✅ CloudFormation (crear stacks)
  - ✅ Lambda (crear/actualizar funciones)
  - ✅ DynamoDB (crear tablas)
  - ✅ API Gateway (crear APIs)
  - ✅ IAM (crear roles)
  - ✅ S3 (para artefactos de despliegue)

### Código
- [x] Handlers existen en las rutas especificadas
- [x] Dependencias en package.json
- [x] Variables de entorno configuradas
- [x] Tests pasando (`npm test`)

### Serverless Framework
- [ ] Serverless CLI instalado (`npm install -g serverless`)
- [ ] Plugins instalados (`npm install`)

---

## 🚀 Comandos de Despliegue

### 1. Despliegue a Dev (por defecto)
```bash
npm install
sls deploy
```

### 2. Despliegue a Staging
```bash
sls deploy --stage staging
```

### 3. Despliegue a Producción
```bash
sls deploy --stage prod
```

### 4. Despliegue con región específica
```bash
sls deploy --region us-east-1
```

### 5. Ver información del stack
```bash
sls info
```

### 6. Ver logs de una función
```bash
sls logs -f getPersonajeSWAPI -t
```

---

## 🐛 Posibles Errores y Soluciones

### Error: "Rate exceeded"
**Causa:** Límite de API de AWS excedido
**Solución:** Esperar unos minutos y volver a intentar

### Error: "Cannot create table, already exists"
**Causa:** La tabla ya existe de un despliegue anterior
**Solución:**
```bash
sls remove  # Eliminar stack completo
sls deploy  # Volver a desplegar
```

### Error: "Invalid permissions on Lambda execution role"
**Causa:** El rol IAM no se creó correctamente
**Solución:** Verificar que `iamRoleStatements` esté en el `provider` (líneas 18-28)

### Error: "Could not find handler"
**Causa:** El path al handler es incorrecto
**Solución:** Verificar que los archivos existan:
```bash
ls src/handlers/getPersonaje.js
ls src/handlers/crearEntidad.js
ls src/handlers/obtenerPersonaje.js
ls src/handlers/listarPersonajes.js
```

### Error: "Invalid YAML"
**Causa:** Error de sintaxis en serverless.yml
**Solución:** Validar YAML online o con:
```bash
sls print
```

---

## ✅ Conclusión

**Estado actual:** ✅ **LISTO PARA DESPLEGAR**

El archivo `serverless.yml` está correctamente configurado y no debería generar errores en el despliegue.

**Configuración correcta:**
- ✅ Tabla DynamoDB con BillingMode PAY_PER_REQUEST
- ✅ Permisos IAM completos para operaciones CRUD
- ✅ Variables de entorno configuradas
- ✅ 4 funciones Lambda con handlers válidos
- ✅ API Gateway con CORS habilitado
- ✅ Outputs para referenciar recursos

**Para desplegar:**
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar AWS CLI (si no está configurado)
aws configure

# 3. Desplegar
sls deploy

# 4. Probar endpoints
curl https://{api-id}.execute-api.us-east-2.amazonaws.com/dev/personajes/swapi/1
```

**Tiempo estimado de despliegue:** 2-5 minutos

**Recursos que se crearán:**
- 1 CloudFormation Stack
- 1 Tabla DynamoDB
- 4 Funciones Lambda
- 1 API Gateway REST API
- 1 Rol IAM
- 1 Bucket S3 (para artefactos)
