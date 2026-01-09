/**
 * Pruebas unitarias para el módulo mapper
 * Verifica la traducción correcta de campos del inglés al español
 */

const {
  mapPersonajeToEspanol,
  mapPersonajesToEspanol,
  translateFieldName,
  translateValue,
  extractIdFromUrl,
  PERSONAJE_FIELD_MAP,
  VALUE_TRANSLATIONS
} = require('../src/utils/mapper');

describe('Mapper - Traducción de campos', () => {
  describe('translateFieldName', () => {
    test('debe traducir campos conocidos del inglés al español', () => {
      expect(translateFieldName('name')).toBe('nombre');
      expect(translateFieldName('height')).toBe('altura');
      expect(translateFieldName('mass')).toBe('masa');
      expect(translateFieldName('hair_color')).toBe('color_de_cabello');
      expect(translateFieldName('skin_color')).toBe('color_de_piel');
      expect(translateFieldName('eye_color')).toBe('color_de_ojos');
      expect(translateFieldName('birth_year')).toBe('año_de_nacimiento');
      expect(translateFieldName('gender')).toBe('genero');
    });

    test('debe retornar el campo original si no existe traducción', () => {
      expect(translateFieldName('unknown_field')).toBe('unknown_field');
      expect(translateFieldName('custom_property')).toBe('custom_property');
    });

    test('debe manejar valores undefined o null', () => {
      expect(translateFieldName(undefined)).toBeUndefined();
      expect(translateFieldName(null)).toBeNull();
    });
  });

  describe('translateValue', () => {
    test('debe traducir valores específicos conocidos', () => {
      expect(translateValue('male')).toBe('masculino');
      expect(translateValue('female')).toBe('femenino');
      expect(translateValue('Male')).toBe('masculino'); // Case insensitive
      expect(translateValue('FEMALE')).toBe('femenino');
      expect(translateValue('unknown')).toBe('desconocido');
    });

    test('debe retornar el valor original si no existe traducción', () => {
      expect(translateValue('some random value')).toBe('some random value');
      expect(translateValue('Luke Skywalker')).toBe('Luke Skywalker');
    });

    test('debe manejar valores no string sin modificar', () => {
      expect(translateValue(123)).toBe(123);
      expect(translateValue(null)).toBeNull();
      expect(translateValue(undefined)).toBeUndefined();
      expect(translateValue(true)).toBe(true);
      expect(translateValue(['array'])).toEqual(['array']);
    });
  });

  describe('mapPersonajeToEspanol', () => {
    test('debe mapear correctamente un personaje completo de SWAPI', () => {
      const personajeEnIngles = {
        name: 'Luke Skywalker',
        height: '172',
        mass: '77',
        hair_color: 'blond',
        skin_color: 'fair',
        eye_color: 'blue',
        birth_year: '19BBY',
        gender: 'male',
        homeworld: 'https://swapi.py4e.com/api/planets/1/',
        films: [
          'https://swapi.py4e.com/api/films/1/',
          'https://swapi.py4e.com/api/films/2/'
        ],
        species: [],
        vehicles: ['https://swapi.py4e.com/api/vehicles/14/'],
        starships: ['https://swapi.py4e.com/api/starships/12/'],
        created: '2014-12-09T13:50:51.644000Z',
        edited: '2014-12-20T21:17:56.891000Z',
        url: 'https://swapi.py4e.com/api/people/1/'
      };

      const resultado = mapPersonajeToEspanol(personajeEnIngles);

      // Verificar que todos los campos fueron traducidos
      expect(resultado.nombre).toBe('Luke Skywalker');
      expect(resultado.altura).toBe('172');
      expect(resultado.masa).toBe('77');
      expect(resultado.año_de_nacimiento).toBe('19BBY');
      expect(resultado.genero).toBe('masculino');
      expect(resultado.planeta_natal).toBe('https://swapi.py4e.com/api/planets/1/');

      // Verificar arrays
      expect(resultado.peliculas).toHaveLength(2);
      expect(resultado.especies).toHaveLength(0);
      expect(resultado.vehiculos).toHaveLength(1);
      expect(resultado.naves_espaciales).toHaveLength(1);

      // Verificar que no existen campos en inglés
      expect(resultado.name).toBeUndefined();
      expect(resultado.height).toBeUndefined();
      expect(resultado.gender).toBeUndefined();
    });

    test('debe manejar personajes con campos mínimos', () => {
      const personajeMinimo = {
        name: 'Yoda',
        height: '66'
      };

      const resultado = mapPersonajeToEspanol(personajeMinimo);

      expect(resultado.nombre).toBe('Yoda');
      expect(resultado.altura).toBe('66');
      expect(Object.keys(resultado)).toHaveLength(2);
    });

    test('debe retornar null si el input es inválido', () => {
      expect(mapPersonajeToEspanol(null)).toBeNull();
      expect(mapPersonajeToEspanol(undefined)).toBeNull();
      expect(mapPersonajeToEspanol('string')).toBeNull();
      expect(mapPersonajeToEspanol(123)).toBeNull();
    });

    test('debe manejar arrays vacíos correctamente', () => {
      const personaje = {
        name: 'Test Character',
        films: [],
        species: [],
        vehicles: [],
        starships: []
      };

      const resultado = mapPersonajeToEspanol(personaje);

      expect(resultado.peliculas).toEqual([]);
      expect(resultado.especies).toEqual([]);
      expect(resultado.vehiculos).toEqual([]);
      expect(resultado.naves_espaciales).toEqual([]);
    });
  });

  describe('mapPersonajesToEspanol', () => {
    test('debe mapear múltiples personajes correctamente', () => {
      const personajes = [
        { name: 'Luke Skywalker', gender: 'male' },
        { name: 'Leia Organa', gender: 'female' },
        { name: 'Yoda', height: '66' }
      ];

      const resultado = mapPersonajesToEspanol(personajes);

      expect(resultado).toHaveLength(3);
      expect(resultado[0].nombre).toBe('Luke Skywalker');
      expect(resultado[0].genero).toBe('masculino');
      expect(resultado[1].nombre).toBe('Leia Organa');
      expect(resultado[1].genero).toBe('femenino');
      expect(resultado[2].nombre).toBe('Yoda');
      expect(resultado[2].altura).toBe('66');
    });

    test('debe filtrar personajes inválidos', () => {
      const personajes = [
        { name: 'Luke Skywalker' },
        null,
        { name: 'Leia Organa' },
        undefined,
        'invalid'
      ];

      const resultado = mapPersonajesToEspanol(personajes);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].nombre).toBe('Luke Skywalker');
      expect(resultado[1].nombre).toBe('Leia Organa');
    });

    test('debe retornar array vacío si el input no es un array', () => {
      expect(mapPersonajesToEspanol(null)).toEqual([]);
      expect(mapPersonajesToEspanol(undefined)).toEqual([]);
      expect(mapPersonajesToEspanol('string')).toEqual([]);
      expect(mapPersonajesToEspanol({})).toEqual([]);
    });

    test('debe retornar array vacío si el input es un array vacío', () => {
      expect(mapPersonajesToEspanol([])).toEqual([]);
    });
  });

  describe('extractIdFromUrl', () => {
    test('debe extraer ID correctamente de URLs válidas de SWAPI', () => {
      expect(extractIdFromUrl('https://swapi.py4e.com/api/people/1/')).toBe('1');
      expect(extractIdFromUrl('https://swapi.py4e.com/api/people/10/')).toBe('10');
      expect(extractIdFromUrl('https://swapi.py4e.com/api/people/999/')).toBe('999');
      expect(extractIdFromUrl('https://swapi.py4e.com/api/films/5/')).toBe('5');
    });

    test('debe manejar URLs sin barra final', () => {
      expect(extractIdFromUrl('https://swapi.py4e.com/api/people/1')).toBe('1');
      expect(extractIdFromUrl('https://swapi.py4e.com/api/films/42')).toBe('42');
    });

    test('debe retornar null para URLs inválidas', () => {
      expect(extractIdFromUrl('https://swapi.py4e.com/api/people/')).toBeNull();
      expect(extractIdFromUrl('https://example.com')).toBeNull();
      expect(extractIdFromUrl('not-a-url')).toBeNull();
    });

    test('debe retornar null para valores inválidos', () => {
      expect(extractIdFromUrl(null)).toBeNull();
      expect(extractIdFromUrl(undefined)).toBeNull();
      expect(extractIdFromUrl('')).toBeNull();
      expect(extractIdFromUrl(123)).toBeNull();
    });
  });

  describe('PERSONAJE_FIELD_MAP', () => {
    test('debe contener todos los campos esperados', () => {
      const camposEsperados = [
        'name', 'height', 'mass', 'hair_color', 'skin_color',
        'eye_color', 'birth_year', 'gender', 'homeworld',
        'films', 'species', 'vehicles', 'starships',
        'created', 'edited', 'url'
      ];

      camposEsperados.forEach(campo => {
        expect(PERSONAJE_FIELD_MAP).toHaveProperty(campo);
        expect(typeof PERSONAJE_FIELD_MAP[campo]).toBe('string');
      });
    });

    test('debe tener al menos 16 campos mapeados', () => {
      expect(Object.keys(PERSONAJE_FIELD_MAP).length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('VALUE_TRANSLATIONS', () => {
    test('debe contener traducciones de género', () => {
      expect(VALUE_TRANSLATIONS).toHaveProperty('male', 'masculino');
      expect(VALUE_TRANSLATIONS).toHaveProperty('female', 'femenino');
    });

    test('debe contener valores esperados', () => {
      expect(VALUE_TRANSLATIONS.unknown).toBe('desconocido');
      expect(VALUE_TRANSLATIONS.none).toBe('ninguno');
      expect(VALUE_TRANSLATIONS['n/a']).toBe('n/a');
    });
  });
});
