/**
 * Pruebas unitarias para el handler listarPersonajes
 * Endpoint: GET /personajes
 */

jest.mock('../src/services/dynamoDBService');

const { handler } = require('../src/handlers/listarPersonajes');
const { listarPersonajes } = require('../src/services/dynamoDBService');

describe('Handler listarPersonajes - GET /personajes', () => {
  const mockContext = {
    requestId: 'test-request-id-123',
    functionName: 'listPersonajes'
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Casos exitosos', () => {
    test('debe listar personajes correctamente', async () => {
      const personajes = [
        {
          id: 'uuid-1',
          nombre: 'Obi-Wan Kenobi',
          altura: '182',
          creado: '2026-01-08T12:00:00.000Z',
          actualizado: '2026-01-08T12:00:00.000Z'
        },
        {
          id: 'uuid-2',
          nombre: 'Ahsoka Tano',
          altura: '166',
          creado: '2026-01-08T11:00:00.000Z',
          actualizado: '2026-01-08T11:00:00.000Z'
        }
      ];

      listarPersonajes.mockResolvedValue(personajes);

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.exito).toBe(true);
      expect(body.mensaje).toContain('exitosamente');
      expect(body.total).toBe(2);
      expect(body.limite).toBe(50);
      expect(body.datos).toHaveLength(2);
      expect(listarPersonajes).toHaveBeenCalledWith(50);
    });

    test('debe ordenar personajes por fecha de creación (más recientes primero)', async () => {
      const personajes = [
        {
          id: 'uuid-1',
          nombre: 'Personaje Antiguo',
          creado: '2026-01-08T10:00:00.000Z'
        },
        {
          id: 'uuid-2',
          nombre: 'Personaje Reciente',
          creado: '2026-01-08T14:00:00.000Z'
        },
        {
          id: 'uuid-3',
          nombre: 'Personaje Medio',
          creado: '2026-01-08T12:00:00.000Z'
        }
      ];

      listarPersonajes.mockResolvedValue(personajes);

      const event = {};
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body.datos[0].nombre).toBe('Personaje Reciente');
      expect(body.datos[1].nombre).toBe('Personaje Medio');
      expect(body.datos[2].nombre).toBe('Personaje Antiguo');
    });

    test('debe retornar lista vacía si no hay personajes', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.exito).toBe(true);
      expect(body.mensaje).toContain('No hay personajes');
      expect(body.total).toBe(0);
      expect(body.datos).toEqual([]);
    });
  });

  describe('Parámetros de paginación', () => {
    test('debe usar límite por defecto de 50', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {};
      await handler(event, mockContext);

      expect(listarPersonajes).toHaveBeenCalledWith(50);
    });

    test('debe respetar límite personalizado del query string', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {
        queryStringParameters: { limite: '20' }
      };

      await handler(event, mockContext);

      expect(listarPersonajes).toHaveBeenCalledWith(20);
    });

    test('debe aceptar parámetro "limit" además de "limite"', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {
        queryStringParameters: { limit: '30' }
      };

      await handler(event, mockContext);

      expect(listarPersonajes).toHaveBeenCalledWith(30);
    });

    test('debe ajustar límite máximo a 100', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {
        queryStringParameters: { limite: '200' }
      };

      await handler(event, mockContext);

      expect(listarPersonajes).toHaveBeenCalledWith(100);
    });

    test('debe usar valor por defecto si el límite es inválido', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event1 = { queryStringParameters: { limite: 'abc' } };
      await handler(event1, mockContext);
      expect(listarPersonajes).toHaveBeenCalledWith(50);

      const event2 = { queryStringParameters: { limite: '-5' } };
      await handler(event2, mockContext);
      expect(listarPersonajes).toHaveBeenCalledWith(50);

      const event3 = { queryStringParameters: { limite: '0' } };
      await handler(event3, mockContext);
      expect(listarPersonajes).toHaveBeenCalledWith(50);
    });
  });

  describe('Manejo de errores de DynamoDB', () => {
    test('debe retornar error 503 para errores de DynamoDB', async () => {
      listarPersonajes.mockRejectedValue(
        new Error('Error al consultar DynamoDB')
      );

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Service Unavailable');
      expect(body.mensaje).toContain('base de datos');
    });

    test('debe retornar error 500 para error de variable de entorno', async () => {
      listarPersonajes.mockRejectedValue(
        new Error('La variable de entorno PERSONAJES_TABLE no está configurada')
      );

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
      expect(body.mensaje).toContain('configuración');
    });

    test('debe retornar error 500 para errores inesperados', async () => {
      listarPersonajes.mockRejectedValue(
        new Error('Error inesperado')
      );

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('Manejo de personajes sin fecha de creación', () => {
    test('debe manejar personajes sin campo "creado"', async () => {
      const personajes = [
        {
          id: 'uuid-1',
          nombre: 'Con fecha',
          creado: '2026-01-08T12:00:00.000Z'
        },
        {
          id: 'uuid-2',
          nombre: 'Sin fecha'
          // Sin campo "creado"
        }
      ];

      listarPersonajes.mockResolvedValue(personajes);

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.datos).toHaveLength(2);
    });
  });

  describe('Headers CORS', () => {
    test('debe incluir headers CORS en respuestas exitosas', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Credentials']).toBe(true);
      expect(response.headers['Content-Type']).toBe('application/json');
    });

    test('debe incluir headers CORS en respuestas de error', async () => {
      listarPersonajes.mockRejectedValue(new Error('Test error'));

      const event = {};
      const response = await handler(event, mockContext);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Formato de respuesta', () => {
    test('debe retornar body en formato JSON válido', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {};
      const response = await handler(event, mockContext);

      expect(() => JSON.parse(response.body)).not.toThrow();
    });

    test('debe incluir estructura estándar en respuesta con personajes', async () => {
      listarPersonajes.mockResolvedValue([
        { id: 'uuid-1', nombre: 'Test' }
      ]);

      const event = {};
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('exito');
      expect(body).toHaveProperty('mensaje');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('limite');
      expect(body).toHaveProperty('datos');
      expect(Array.isArray(body.datos)).toBe(true);
    });

    test('debe incluir estructura estándar en respuesta vacía', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = {};
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('exito');
      expect(body).toHaveProperty('mensaje');
      expect(body).toHaveProperty('total', 0);
      expect(body).toHaveProperty('datos', []);
    });

    test('debe incluir total correcto de personajes', async () => {
      const personajes = Array.from({ length: 15 }, (_, i) => ({
        id: `uuid-${i}`,
        nombre: `Personaje ${i}`,
        creado: new Date().toISOString()
      }));

      listarPersonajes.mockResolvedValue(personajes);

      const event = {};
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body.total).toBe(15);
      expect(body.datos).toHaveLength(15);
    });
  });

  describe('Manejo de queryStringParameters', () => {
    test('debe manejar queryStringParameters null o undefined', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event1 = { queryStringParameters: null };
      await handler(event1, mockContext);
      expect(listarPersonajes).toHaveBeenCalledWith(50);

      jest.clearAllMocks();

      const event2 = { queryStringParameters: undefined };
      await handler(event2, mockContext);
      expect(listarPersonajes).toHaveBeenCalledWith(50);
    });

    test('debe manejar queryStringParameters vacío', async () => {
      listarPersonajes.mockResolvedValue([]);

      const event = { queryStringParameters: {} };
      await handler(event, mockContext);

      expect(listarPersonajes).toHaveBeenCalledWith(50);
    });
  });
});
