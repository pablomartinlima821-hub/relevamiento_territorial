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

    it('El login debe validar los datos antes de consultar usuarios', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body.mensaje).toBe('Ingresa tu correo electrónico y contraseña.');
    });

    it('El registro debe exigir una contraseña segura', async () => {
        const res = await request(app).post('/api/auth/registrar').send({
            nombre: 'Usuario',
            email: 'usuario@example.com',
            password: 'corta'
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.mensaje).toMatch(/al menos 8 caracteres/);
    });

});