const request = require('supertest');
const app = require('../../app'); // Importamos la app directamente

describe('Pruebas de la API de Relevamiento', () => {
    
    it('El endpoint raíz debe devolver estado 200', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('API de Relevamiento Territorial funcionando');
    });

    it('El GET de relevamientos debe devolver un array', async () => {
        const res = await request(app).get('/api/relevamientos');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

});