/**
 * Pruebas unitarias para el handler crearEntidad
 * Endpoint: POST /personajes
 */

// Mock de los módulos antes de importar el handler
jest.mock('../src/services/dynamoDBService');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-12345')
}));

const { handler, validarCamposObligatorios, validarTiposDeDatos, sanitizarPersonaje } = require('../src/handlers/crearEntidad');
const { guardarPersonaje } = require('../src/services/dynamoDBService');

describe('Handler crearEntidad - POST /personajes', () => {
  const mockContext = {
    requestId: 'test-request-id-123',
    functionName: 'createPersonaje'
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Casos exitosos', () => {
    test('debe crear un personaje con todos los campos', async () => {
      const personajeCompleto = {
        nombre: 'Obi-Wan Kenobi',
        altura: '182',
        masa: '77',
        color_de_cabello: 'castaño',
        color_de_ojos: 'azul',
        genero: 'masculino',
        planeta_natal: 'Stewjon',
        peliculas: ['La Amenaza Fantasma'],
        especies: ['Humano']
      };

      guardarPersonaje.mockResolvedValue({
        ...personajeCompleto,
        id: 'test-uuid-12345',
        creado: '2026-01-08T12:00:00.000Z',
        actualizado: '2026-01-08T12:00:00.000Z'
      });

      const event = {
        body: JSON.stringify(personajeCompleto)
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.exito).toBe(true);
      expect(body.mensaje).toContain('exitosamente');
      expect(body.datos.id).toBe('test-uuid-12345');
      expect(body.datos.nombre).toBe('Obi-Wan Kenobi');
      expect(guardarPersonaje).toHaveBeenCalledTimes(1);
    });

    test('debe crear un personaje con campos mínimos (solo nombre)', async () => {
      const personajeMinimo = { nombre: 'Yoda' };

      guardarPersonaje.mockResolvedValue({
        ...personajeMinimo,
        id: 'test-uuid-12345',
        creado: '2026-01-08T12:00:00.000Z',
        actualizado: '2026-01-08T12:00:00.000Z',
        peliculas: [],
        especies: [],
        vehiculos: [],
        naves_espaciales: []
      });

      const event = { body: JSON.stringify(personajeMinimo) };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.datos.nombre).toBe('Yoda');
      expect(body.datos.id).toBeDefined();
    });

    test('debe agregar ID y timestamps automáticamente', async () => {
      const personaje = { nombre: 'Test Character' };

      let personajeGuardado;
      guardarPersonaje.mockImplementation((p) => {
        personajeGuardado = p;
        return Promise.resolve(p);
      });

      const event = { body: JSON.stringify(personaje) };
      await handler(event, mockContext);

      expect(personajeGuardado.id).toBe('test-uuid-12345');
      expect(personajeGuardado.creado).toBeDefined();
      expect(personajeGuardado.actualizado).toBeDefined();
    });
  });

  describe('Validación de entrada', () => {
    test('debe retornar error 400 si el body está vacío', async () => {
      const event = { body: null };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.mensaje).toContain('vacío');
      expect(guardarPersonaje).not.toHaveBeenCalled();
    });

    test('debe retornar error 400 si el body no es JSON válido', async () => {
      const event = { body: 'esto no es json' };
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.mensaje).toContain('JSON válido');
    });

    test('debe retornar error 400 si falta el campo nombre', async () => {
      const event = {
        body: JSON.stringify({
          altura: '182',
          masa: '77'
        })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.mensaje).toContain('obligatorios');
      expect(body.camposFaltantes).toContain('nombre');
      expect(body.ejemplo).toBeDefined();
    });

    test('debe retornar error 400 si el nombre está vacío', async () => {
      const event = {
        body: JSON.stringify({ nombre: '   ' })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.camposFaltantes).toContain('nombre');
    });
  });

  describe('Validación de tipos de datos', () => {
    test('debe retornar error 400 si altura no es numérica', async () => {
      const event = {
        body: JSON.stringify({
          nombre: 'Test',
          altura: 'abc'
        })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errores).toBeDefined();
      expect(body.errores.some(e => e.includes('altura'))).toBe(true);
    });

    test('debe retornar error 400 si masa no es numérica', async () => {
      const event = {
        body: JSON.stringify({
          nombre: 'Test',
          masa: 'xyz'
        })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errores.some(e => e.includes('masa'))).toBe(true);
    });

    test('debe retornar error 400 si género no es válido', async () => {
      const event = {
        body: JSON.stringify({
          nombre: 'Test',
          genero: 'invalido'
        })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errores.some(e => e.includes('genero'))).toBe(true);
    });

    test('debe aceptar géneros válidos', async () => {
      const generosValidos = ['masculino', 'femenino', 'hermafrodita', 'n/a', 'desconocido'];

      for (const genero of generosValidos) {
        guardarPersonaje.mockResolvedValue({
          id: 'test-uuid',
          nombre: 'Test',
          genero,
          creado: '2026-01-08T12:00:00.000Z',
          actualizado: '2026-01-08T12:00:00.000Z'
        });

        const event = {
          body: JSON.stringify({ nombre: 'Test', genero })
        };

        const response = await handler(event, mockContext);
        expect(response.statusCode).toBe(201);
      }
    });

    test('debe retornar error 400 si peliculas no es un array', async () => {
      const event = {
        body: JSON.stringify({
          nombre: 'Test',
          peliculas: 'string en lugar de array'
        })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.errores.some(e => e.includes('peliculas'))).toBe(true);
    });
  });

  describe('Sanitización de datos', () => {
    test('debe eliminar espacios en blanco de los strings', async () => {
      let personajeGuardado;
      guardarPersonaje.mockImplementation((p) => {
        personajeGuardado = p;
        return Promise.resolve(p);
      });

      const event = {
        body: JSON.stringify({
          nombre: '  Luke Skywalker  ',
          color_de_cabello: '  rubio  '
        })
      };

      await handler(event, mockContext);

      expect(personajeGuardado.nombre).toBe('Luke Skywalker');
      expect(personajeGuardado.color_de_cabello).toBe('rubio');
    });

    test('debe normalizar género a minúsculas', async () => {
      let personajeGuardado;
      guardarPersonaje.mockImplementation((p) => {
        personajeGuardado = p;
        return Promise.resolve(p);
      });

      const event = {
        body: JSON.stringify({
          nombre: 'Test',
          genero: 'MASCULINO'
        })
      };

      await handler(event, mockContext);

      expect(personajeGuardado.genero).toBe('masculino');
    });

    test('debe inicializar arrays vacíos si no están presentes', async () => {
      let personajeGuardado;
      guardarPersonaje.mockImplementation((p) => {
        personajeGuardado = p;
        return Promise.resolve(p);
      });

      const event = {
        body: JSON.stringify({ nombre: 'Test' })
      };

      await handler(event, mockContext);

      expect(Array.isArray(personajeGuardado.peliculas)).toBe(true);
      expect(Array.isArray(personajeGuardado.especies)).toBe(true);
      expect(Array.isArray(personajeGuardado.vehiculos)).toBe(true);
      expect(Array.isArray(personajeGuardado.naves_espaciales)).toBe(true);
    });
  });

  describe('Manejo de errores de DynamoDB', () => {
    test('debe retornar error 409 si el ID ya existe', async () => {
      guardarPersonaje.mockRejectedValue(
        new Error('Ya existe un personaje con el ID test-uuid-12345')
      );

      const event = {
        body: JSON.stringify({ nombre: 'Test' })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Conflict');
      expect(body.mensaje).toContain('Ya existe');
    });

    test('debe retornar error 500 para errores inesperados de DynamoDB', async () => {
      guardarPersonaje.mockRejectedValue(new Error('Error de conexión a DynamoDB'));

      const event = {
        body: JSON.stringify({ nombre: 'Test' })
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('Funciones auxiliares', () => {
    describe('validarCamposObligatorios', () => {
      test('debe validar que el nombre esté presente', () => {
        const resultado1 = validarCamposObligatorios({ nombre: 'Test' });
        expect(resultado1.valido).toBe(true);

        const resultado2 = validarCamposObligatorios({});
        expect(resultado2.valido).toBe(false);
        expect(resultado2.camposFaltantes).toContain('nombre');
      });

      test('debe rechazar nombres vacíos o con solo espacios', () => {
        const resultado1 = validarCamposObligatorios({ nombre: '' });
        expect(resultado1.valido).toBe(false);

        const resultado2 = validarCamposObligatorios({ nombre: '   ' });
        expect(resultado2.valido).toBe(false);
      });
    });

    describe('validarTiposDeDatos', () => {
      test('debe validar tipos string correctamente', () => {
        const resultado = validarTiposDeDatos({
          nombre: 'Test',
          altura: '182',
          masa: '77'
        });
        expect(resultado.valido).toBe(true);
      });

      test('debe rechazar arrays en campos string', () => {
        const resultado = validarTiposDeDatos({
          nombre: ['array']
        });
        expect(resultado.valido).toBe(false);
        expect(resultado.errores.length).toBeGreaterThan(0);
      });

      test('debe validar que arrays sean arrays', () => {
        const resultado = validarTiposDeDatos({
          peliculas: 'not an array'
        });
        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('peliculas'))).toBe(true);
      });
    });

    describe('sanitizarPersonaje', () => {
      test('debe eliminar espacios en blanco', () => {
        const resultado = sanitizarPersonaje({
          nombre: '  Test  ',
          altura: ' 182 '
        });
        expect(resultado.nombre).toBe('Test');
        expect(resultado.altura).toBe('182');
      });

      test('debe normalizar género', () => {
        const resultado = sanitizarPersonaje({
          genero: 'MASCULINO'
        });
        expect(resultado.genero).toBe('masculino');
      });

      test('debe inicializar arrays vacíos', () => {
        const resultado = sanitizarPersonaje({ nombre: 'Test' });
        expect(resultado.peliculas).toEqual([]);
        expect(resultado.especies).toEqual([]);
      });
    });
  });

  describe('Headers y formato de respuesta', () => {
    test('debe incluir headers CORS', async () => {
      guardarPersonaje.mockResolvedValue({
        id: 'test-uuid',
        nombre: 'Test',
        creado: '2026-01-08T12:00:00.000Z',
        actualizado: '2026-01-08T12:00:00.000Z'
      });

      const event = { body: JSON.stringify({ nombre: 'Test' }) };
      const response = await handler(event, mockContext);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');
    });

    test('debe retornar body en formato JSON válido', async () => {
      guardarPersonaje.mockResolvedValue({
        id: 'test-uuid',
        nombre: 'Test',
        creado: '2026-01-08T12:00:00.000Z',
        actualizado: '2026-01-08T12:00:00.000Z'
      });

      const event = { body: JSON.stringify({ nombre: 'Test' }) };
      const response = await handler(event, mockContext);

      expect(() => JSON.parse(response.body)).not.toThrow();
    });
  });
});
