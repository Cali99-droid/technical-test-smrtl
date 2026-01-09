/**
 * Pruebas unitarias para el handler obtenerPersonaje (DynamoDB)
 * Endpoint: GET /personajes/{id}
 */

jest.mock('../src/services/dynamoDBService');

const { handler } = require('../src/handlers/obtenerPersonaje');
const { obtenerPersonajePorId } = require('../src/services/dynamoDBService');

describe('Handler obtenerPersonaje - GET /personajes/{id}', () => {
  const mockContext = {
    requestId: 'test-request-id-123',
    functionName: 'getPersonaje'
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Casos exitosos', () => {
    test('debe obtener un personaje por ID exitosamente', async () => {
      const personaje = {
        id: 'test-uuid-123',
        nombre: 'Obi-Wan Kenobi',
        altura: '182',
        genero: 'masculino',
        creado: '2026-01-08T12:00:00.000Z',
        actualizado: '2026-01-08T12:00:00.000Z'
      };

      obtenerPersonajePorId.mockResolvedValue(personaje);

      const event = {
        pathParameters: { id: 'test-uuid-123' }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.exito).toBe(true);
      expect(body.mensaje).toContain('exitosamente');
      expect(body.datos).toEqual(personaje);
      expect(obtenerPersonajePorId).toHaveBeenCalledWith('test-uuid-123');
      expect(obtenerPersonajePorId).toHaveBeenCalledTimes(1);
    });

    test('debe manejar diferentes formatos de UUID', async () => {
      const uuids = [
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '12345678-1234-1234-1234-123456789012',
        'simple-id'
      ];

      for (const uuid of uuids) {
        obtenerPersonajePorId.mockResolvedValue({
          id: uuid,
          nombre: 'Test'
        });

        const event = { pathParameters: { id: uuid } };
        const response = await handler(event, mockContext);

        expect(response.statusCode).toBe(200);
        expect(obtenerPersonajePorId).toHaveBeenCalledWith(uuid);
      }
    });
  });

  describe('Validación de parámetros', () => {
    test('debe retornar error 400 si no se proporciona el ID', async () => {
      const event = { pathParameters: {} };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.mensaje).toContain('ID del personaje es requerido');
      expect(obtenerPersonajePorId).not.toHaveBeenCalled();
    });

    test('debe retornar error 400 si pathParameters es null', async () => {
      const event = { pathParameters: null };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    test('debe retornar error 400 si el ID está vacío', async () => {
      const event = { pathParameters: { id: '' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.mensaje).toContain('cadena válida');
    });

    test('debe retornar error 400 si el ID solo tiene espacios', async () => {
      const event = { pathParameters: { id: '   ' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });
  });

  describe('Manejo de personaje no encontrado', () => {
    test('debe retornar error 404 si el personaje no existe', async () => {
      obtenerPersonajePorId.mockResolvedValue(null);

      const event = {
        pathParameters: { id: 'id-inexistente' }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.mensaje).toContain('No se encontró');
      expect(body.idBuscado).toBe('id-inexistente');
      expect(body.sugerencia).toBeDefined();
    });
  });

  describe('Manejo de errores de DynamoDB', () => {
    test('debe retornar error 503 para errores de DynamoDB', async () => {
      obtenerPersonajePorId.mockRejectedValue(
        new Error('Error al consultar DynamoDB')
      );

      const event = {
        pathParameters: { id: 'test-id' }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Service Unavailable');
      expect(body.mensaje).toContain('base de datos');
    });

    test('debe retornar error 500 para error de variable de entorno', async () => {
      obtenerPersonajePorId.mockRejectedValue(
        new Error('La variable de entorno PERSONAJES_TABLE no está configurada')
      );

      const event = {
        pathParameters: { id: 'test-id' }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
      expect(body.mensaje).toContain('configuración');
    });

    test('debe retornar error 500 para errores inesperados', async () => {
      obtenerPersonajePorId.mockRejectedValue(
        new Error('Error inesperado')
      );

      const event = {
        pathParameters: { id: 'test-id' }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('Headers CORS', () => {
    test('debe incluir headers CORS en respuestas exitosas', async () => {
      obtenerPersonajePorId.mockResolvedValue({
        id: 'test-id',
        nombre: 'Test'
      });

      const event = { pathParameters: { id: 'test-id' } };
      const response = await handler(event, mockContext);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
      expect(response.headers['Content-Type']).toBe('application/json');
    });

    test('debe incluir headers CORS en respuestas de error', async () => {
      const event = { pathParameters: {} };
      const response = await handler(event, mockContext);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Formato de respuesta', () => {
    test('debe retornar body en formato JSON válido', async () => {
      obtenerPersonajePorId.mockResolvedValue({
        id: 'test-id',
        nombre: 'Test'
      });

      const event = { pathParameters: { id: 'test-id' } };
      const response = await handler(event, mockContext);

      expect(() => JSON.parse(response.body)).not.toThrow();
    });

    test('debe incluir estructura estándar en respuesta exitosa', async () => {
      obtenerPersonajePorId.mockResolvedValue({
        id: 'test-id',
        nombre: 'Test'
      });

      const event = { pathParameters: { id: 'test-id' } };
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('exito');
      expect(body).toHaveProperty('mensaje');
      expect(body).toHaveProperty('datos');
    });

    test('debe incluir estructura estándar en respuestas de error', async () => {
      const event = { pathParameters: {} };
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('mensaje');
    });
  });
});
