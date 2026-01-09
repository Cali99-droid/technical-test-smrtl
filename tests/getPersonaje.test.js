/**
 * Pruebas unitarias para el handler getPersonaje (SWAPI)
 * Endpoint: GET /personajes/swapi/{id}
 */

// Mock de los módulos antes de importar el handler
jest.mock('../src/services/swapiService');

const { handler } = require('../src/handlers/getPersonaje');
const { getPersonajeById } = require('../src/services/swapiService');

describe('Handler getPersonaje - GET /personajes/swapi/{id}', () => {
  // Contexto simulado de Lambda
  const mockContext = {
    requestId: 'test-request-id-123',
    functionName: 'getPersonajeSWAPI',
    awsRequestId: 'aws-request-id-123'
  };

  // Limpiar mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Casos exitosos', () => {
    test('debe retornar un personaje traducido exitosamente', async () => {
      // Preparar mock
      const personajeTraducido = {
        nombre: 'Luke Skywalker',
        altura: '172',
        masa: '77',
        genero: 'masculino',
        color_de_ojos: 'azul'
      };

      getPersonajeById.mockResolvedValue(personajeTraducido);

      // Crear evento simulado
      const event = {
        pathParameters: { id: '1' }
      };

      // Ejecutar handler
      const response = await handler(event, mockContext);

      // Verificar respuesta
      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(response.body);
      expect(body.exito).toBe(true);
      expect(body.mensaje).toContain('exitosamente');
      expect(body.datos).toEqual(personajeTraducido);
      expect(body.datos.nombre).toBe('Luke Skywalker');

      // Verificar que se llamó al servicio con el ID correcto
      expect(getPersonajeById).toHaveBeenCalledWith('1');
      expect(getPersonajeById).toHaveBeenCalledTimes(1);
    });

    test('debe manejar IDs numéricos válidos', async () => {
      const personaje = { nombre: 'Darth Vader', altura: '202' };
      getPersonajeById.mockResolvedValue(personaje);

      const event = { pathParameters: { id: '4' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.datos.nombre).toBe('Darth Vader');
      expect(getPersonajeById).toHaveBeenCalledWith('4');
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
      expect(getPersonajeById).not.toHaveBeenCalled();
    });

    test('debe retornar error 400 si pathParameters es null', async () => {
      const event = { pathParameters: null };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(getPersonajeById).not.toHaveBeenCalled();
    });

    test('debe retornar error 400 si el ID no es un número válido', async () => {
      const event = { pathParameters: { id: 'abc' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.mensaje).toContain('número positivo');
      expect(body.idRecibido).toBe('abc');
      expect(getPersonajeById).not.toHaveBeenCalled();
    });

    test('debe retornar error 400 si el ID es cero o negativo', async () => {
      const event1 = { pathParameters: { id: '0' } };
      const response1 = await handler(event1, mockContext);

      expect(response1.statusCode).toBe(400);
      expect(getPersonajeById).not.toHaveBeenCalled();

      const event2 = { pathParameters: { id: '-5' } };
      const response2 = await handler(event2, mockContext);

      expect(response2.statusCode).toBe(400);
    });
  });

  describe('Manejo de errores del servicio', () => {
    test('debe retornar error 404 si el personaje no existe', async () => {
      getPersonajeById.mockResolvedValue(null);

      const event = { pathParameters: { id: '9999' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.mensaje).toContain('No se encontró');
      expect(body.idBuscado).toBe('9999');
    });

    test('debe retornar error 404 cuando el servicio lanza error de personaje no encontrado', async () => {
      getPersonajeById.mockRejectedValue(
        new Error('Personaje con ID 99 no encontrado en SWAPI')
      );

      const event = { pathParameters: { id: '99' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.mensaje).toContain('no encontrado');
    });

    test('debe retornar error 503 cuando hay problemas de conexión con SWAPI', async () => {
      getPersonajeById.mockRejectedValue(
        new Error('No se pudo conectar con SWAPI. Verifica tu conexión a internet')
      );

      const event = { pathParameters: { id: '1' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Service Unavailable');
      expect(body.mensaje).toContain('conectar');
    });

    test('debe retornar error 500 para errores inesperados', async () => {
      getPersonajeById.mockRejectedValue(new Error('Error inesperado del servidor'));

      const event = { pathParameters: { id: '1' } };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
      expect(body.mensaje).toContain('error al procesar');
    });
  });

  describe('Headers CORS', () => {
    test('debe incluir headers CORS en todas las respuestas', async () => {
      getPersonajeById.mockResolvedValue({ nombre: 'Test' });

      const event = { pathParameters: { id: '1' } };
      const response = await handler(event, mockContext);

      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Credentials', true);
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
    });

    test('debe incluir headers CORS incluso en errores', async () => {
      const event = { pathParameters: {} };
      const response = await handler(event, mockContext);

      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('Formato de respuesta', () => {
    test('debe retornar body en formato JSON válido', async () => {
      getPersonajeById.mockResolvedValue({ nombre: 'Yoda' });

      const event = { pathParameters: { id: '20' } };
      const response = await handler(event, mockContext);

      expect(() => JSON.parse(response.body)).not.toThrow();
      const body = JSON.parse(response.body);
      expect(typeof body).toBe('object');
    });

    test('debe incluir estructura estándar en respuesta exitosa', async () => {
      getPersonajeById.mockResolvedValue({ nombre: 'Test' });

      const event = { pathParameters: { id: '1' } };
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('exito');
      expect(body).toHaveProperty('mensaje');
      expect(body).toHaveProperty('datos');
    });

    test('debe incluir estructura estándar en respuesta de error', async () => {
      const event = { pathParameters: {} };
      const response = await handler(event, mockContext);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('mensaje');
    });
  });
});
